'use strict'

const { Request, Response, body, check, log, serve } = require('reserve')
const { spawn } = require('child_process')
const { randomInt } = require('crypto')
const { join } = require('path')
const rel = (...path) => join(__dirname, ...path)
const { promisify } = require('util')
const { readdir, readFile, rmdir, stat, writeFile } = require('fs')
const rmdirAsync = promisify(rmdir)
const writeFileAsync = promisify(writeFile)
const readdirAsync = promisify(readdir)
const readFileAsync = promisify(readFile)
const statAsync = promisify(stat)
const { Readable } = require('stream')

const job = {
  port: 8099,
  ui5: "https://ui5.sap.com/1.87.0",
  command: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  options: "${url} --no-sandbox --disable-gpu --remote-debugging-port=9222 --headless",
  parallel: 2,
  coverage: true,
  keepAlive: false,
  logServer: false
}

process.argv.forEach(arg => {
  const valueParsers = {
    boolean: value => value === 'true',
    number: value => parseInt(value, 10),
    default: value => value
  }

  const parsed = /-(\w+):(.*)/.exec(arg)
  if (parsed) {
    const name = parsed[1]
    if (Object.prototype.hasOwnProperty.call(job, name)) {
      const valueParser = valueParsers[typeof job[name]] || valueParsers.default
      job[name] = valueParser(parsed[2])
    }
  }
})

function nyc (...args) {
  const process = spawn('node', [rel('../node_modules/nyc/bin/nyc.js'), ...args], {
    stdio: 'inherit'
  })
  let done
  const promise = new Promise(resolve => { done = resolve })
  process.on('close', done)
  return promise
}

const getPageName = id => job._mapIdToPage[id]
const getPageResult = id => job._pageResults[getPageName(id)]

function endpoint (implementation) {
  return async function (request, response) {
    response.writeHead(200)
    response.end()
    const id = request.headers.referer.match(/__id__=(\d+)/)[1]
    const data = JSON.parse(await body(request))
    try {
      await implementation.call(this, id, data)
    } catch (e) {
      console.error(e)
    }
  }
}

Promise.resolve()
  .then(() => {
    if (job.coverage) {
      console.log('Instrumenting...')
      return rmdirAsync(rel('nyc'), { recursive: true })
        .then(() => nyc('instrument', rel('../webapp'), rel('nyc/webapp'), '--nycrc-path', rel('nyc.json')))
    }
  })
  .then(() => check({
    port: job.port,
    mappings: [{
      // Substitute qunit-redirect to extract test pages
      match: '/resources/sap/ui/qunit/qunit-redirect.js',
      file: rel('qunit-redirect.js')
    }, {
      // Endpoint to receive test pages
      match: '/_/addTestPages',
      custom: endpoint((id, data) => {
        job._testPages = data
        execute.kill(id)
      })
    }, {
      // UI5 qunit.js source
      match: '/_/qunit(-2)?.js',
      url: `${job.ui5}/resources/sap/ui/thirdparty/qunit$1.js`
    }, {
      // QUnit hooks
      match: '/_/qunit-hooks.js',
      file: rel('qunit-hooks.js')
    }, {
      // Concatenate qunit.js source with hooks
      match: /\/thirdparty\/(qunit(?:-2)?\.js)/,
      custom: async function (request, response, scriptName) {
        const ui5Request = new Request('GET', `/_/${scriptName}`)
        const ui5Response = new Response()
        const hooksRequest = new Request('GET', '/_/qunit-hooks.js')
        const hooksResponse = new Response()
        await Promise.all([
          this.configuration.dispatch(ui5Request, ui5Response),
          this.configuration.dispatch(hooksRequest, hooksResponse)
        ])
        const hooksLength = parseInt(hooksResponse.headers['content-length'], 10)
        const ui5Length = parseInt(ui5Response.headers['content-length'], 10)
        response.writeHead(ui5Response.statusCode, {
          ...ui5Response.headers,
          'content-length': ui5Length + hooksLength,
          'cache-control': 'no-store' // for debugging purpose
        })
        response.write(ui5Response.toString())
        response.end(hooksResponse.toString())
      }
    }, {
      // Endpoint to receive QUnit test result
      match: '/_/QUnit/testDone',
      custom: endpoint((id, data) => {
        getPageResult(id).tests.push(data)
      })
    }, {
      // Endpoint to receive QUnit end
      match: '/_/QUnit/done',
      custom: endpoint((id, data) => {
        const page = getPageResult(id)
        page.report = data
        page.wait.then(() => execute.kill(id))
      })
    }, {
      // Endpoint to receive coverage
      match: '/_/nyc/coverage',
      custom: endpoint((id, data) => {
        const page = getPageResult(id)
        const promise = writeFileAsync(rel('nyc', `${id}.json`), JSON.stringify(data))
        page.wait = page.wait.then(promise)
        return promise
      })
    }, {
      // UI5 resources
      match: /\/(test-)?resources\/(.*)/,
      headers: {
        location: `${job.ui5}/$1resources/$2`
      },
      status: 302
    }, {
      // Project mapping (coverage case, also replace coverage global scope on the fly)
      match: /^\/(.*\.js)$/,
      'if-match': (request, url, match) => job.coverage ? match : false,
      file: rel('nyc/webapp/$1'),
      'ignore-if-not-found': true,
      'custom-file-system': (function () {
        // Use a custom file system to inject the proper coverage global context
        const covSearch = 'var global=new Function("return this")();'
        const covReplace = 'var global=window.top;'
        return {
          stat: path => statAsync(path)
            .then(stats => {
              stats.size -= covSearch.length + covReplace.length
              return stats
            }),
          readdir: readdirAsync,
          createReadStream: async (path) => {
            const buffer = (await readFileAsync(path))
              .toString()
              .replace(covSearch, covReplace)
            return Readable.from(buffer)
          }
        }
      }())
    }, {
      // Project mapping
      match: /^\/(.*)/,
      file: rel('../webapp/$1')
    }]
  }))
  .then(configuration => {
    const server = serve(configuration)
    if (job.logServer) {
      log(server)
    }
    server
      .on('ready', ({ url }) => {
        extractPages()
      })
  })

function execute (relativeUrl) {
  if (!execute._instances) {
    execute._instances = {}
    execute.kill = id => {
      const job = execute._instances[id]
      job.process.kill("SIGKILL")
      job.done()
      delete execute._instances[id]
    }
  }

  if (!relativeUrl.startsWith('/')) {
    relativeUrl = '/' + relativeUrl
  }
  if (relativeUrl.includes('?')) {
    relativeUrl += '&'
  } else {
    relativeUrl += '?'
  }

  const id = randomInt(0xFFFFFFFF)

  let url = `http://localhost:${job.port}${relativeUrl}__id__=${id}`
  if (job.keepAlive) {
    url += '&__keepAlive__'
  }
  console.log(url)
  const process = spawn(job.command, job.options.split(' ').map(param => param === '${url}' ? url : param), {
    detached: true
  })
  let done
  const promise = new Promise(resolve => {
    done = resolve
  })
  execute._instances[id] = { process, done }
  promise.id = id
  return promise
}

async function extractPages () {
  await execute('test/testsuite.qunit.html')
  console.log(job._testPages)
  job._runningPages = []
  job._mapIdToPage = {}
  job._pageResults = {}
  for (let i = 0; i < job.parallel; ++i) {
    runPage()
  }
}

async function runPage () {
  if (job._runningPages.length === job._testPages.length) {
    if (!job._waitingForEnd) {
      job._waitingForEnd = true
      Promise.all(job._runningPages).then(generateReport)
    }
    return
  }
  const index = job._runningPages.length
  const page = job._testPages[index]
  const promise = execute(page)
  job._runningPages.push(promise)
  job._mapIdToPage[promise.id] = page
  job._pageResults[page] = {
    tests: [],
    id: promise.id,
    wait: Promise.resolve()
  }
  promise.then(runPage)
}

async function generateReport () {
  console.log('done.')

  // Simple report
  let failed = 0
  const coverageFiles = []
  for (const page of job._testPages) {
    console.log(page)
    const results = job._pageResults[page]
    if (results) {
      console.table(results.tests.map(result => {
        return {
          name: result.name,
          passed: result.passed,
          failed: result.failed,
          total: result.total
        }
      }))
      console.log(results.report)
      failed += results.report.failed

      if (job.coverage) {
        const coverageFile = rel(`nyc/${results.id}.json`)
        const coverageStat = await statAsync(coverageFile)
        if (coverageStat) {
          coverageFiles.push(coverageFile)
        } else {
          console.log('coverage file is missing')
        }
      }
    } else {
      console.log('(skipped)')
    }
  }

  if (job.coverage && coverageFiles.length) {
    await nyc('merge', rel('nyc/'), rel('nyc/coverage.json'))
    await nyc('report', '--reporter=lcov', '--temp-dir', rel('nyc'), '--report-dir', rel('nyc/report'))
  }

  if (job.keepAlive) {
    console.log('Keeping alive.')
  } else {
    process.exit(failed)
  }
}