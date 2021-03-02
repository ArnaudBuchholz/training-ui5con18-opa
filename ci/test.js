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
const isWindows = (/^win/).test(process.platform)
const winChrome = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
const linuxChrome = 'google-chrome-stable'

const job = {
  port: 0, // let REserve allocate one
  ui5: 'https://openui5.hana.ondemand.com/1.87.0',
  command: isWindows ? winChrome : linuxChrome,
  options: '${url} --no-sandbox --disable-gpu --remote-debugging-port=9222 --headless',
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
    const [, name, value] = parsed
    if (Object.prototype.hasOwnProperty.call(job, name)) {
      const valueParser = valueParsers[typeof job[name]] || valueParsers.default
      job[name] = valueParser(value)
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

function endpoint (implementation) {
  return async function (request, response) {
    response.writeHead(200)
    response.end()
    const id = request.headers.referer.match(/__id__=(\d+)/)[1]
    const data = JSON.parse(await body(request))
    try {
      await implementation.call(this, id, data)
    } catch (e) {
      console.error(`Exception when processing ${request.url} with id ${id}`)
      console.error(data)
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
        job.testPageUrls = data
        stop(id)
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
        job.testPagesById[id].tests.push(data)
      })
    }, {
      // Endpoint to receive QUnit end
      match: '/_/QUnit/done',
      custom: endpoint((id, data) => {
        const page = job.testPagesById[id]
        page.report = data
        page.wait.then(() => stop(id))
      })
    }, {
      // Endpoint to receive coverage
      match: '/_/nyc/coverage',
      custom: endpoint((id, data) => {
        const page = job.testPagesById[id]
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
      .on('ready', ({ url, port }) => {
        job.port = port
        extractTestPages()
      })
  })

job.browsers = {}

function start (relativeUrl) {
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
  const process = spawn(job.command, job.options.split(' ')
    .map(param => param
      .replace('${url}', url)
      .replace('${id}', id)
    ), { detached: true })
  let done
  const promise = new Promise(resolve => {
    done = resolve
  })
  job.browsers[id] = { process, done }
  promise.id = id
  return promise
}

function stop (id) {
  const { process, done } = job.browsers[id]
  delete job.browsers[id]
  process.kill('SIGKILL')
  done()
}

async function extractTestPages () {
  await start('test/testsuite.qunit.html')
  console.log(job.testPageUrls)
  job.testPagesStarted = 0
  job.testPagesCompleted = 0
  job.testPagesById = {}
  job.testPagesByUrl = {}
  for (let i = 0; i < job.parallel; ++i) {
    runTestPage()
  }
}

async function runTestPage () {
  const { length } = job.testPageUrls
  if (job.testPagesCompleted === length) {
    return generateReport()
  }
  if (job.testPagesStarted === length) {
    return
  }

  const index = job.testPagesStarted++
  const testPageUrl = job.testPageUrls[index]
  const promise = start(testPageUrl)
  const page = {
    id: promise.id,
    url: testPageUrl,
    tests: [],
    wait: Promise.resolve()
  }
  job.testPagesById[page.id] = page
  job.testPagesByUrl[page.url] = page

  await promise
  ++job.testPagesCompleted
  runTestPage()
}

async function generateReport () {
  console.log('done.')

  // Simple report
  let failed = 0
  const coverageFiles = []
  for (const page of job.testPageUrls) {
    console.log(page)
    const results = job.testPagesByUrl[page]
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