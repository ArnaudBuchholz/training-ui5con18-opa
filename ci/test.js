'use strict'

const { Request, Response, body, check, log, serve } = require('reserve')
const { spawn } = require('child_process')
const { randomInt } = require('crypto')
const { join } = require('path')
const rel = (...path) => join(__dirname, ...path)
const { promisify } = require('util')
const { createReadStream, readdir, readFile, rmdir, stat, writeFile } = require('fs')
const rmdirAsync = promisify(rmdir)
const writeFileAsync = promisify(writeFile)
const readdirAsync = promisify(readdir)
const readFileAsync = promisify(readFile)
const statAsync = promisify(stat)
const { Readable } = require('stream')

const instance = {
  port: 8099,
  ui5: "https://ui5.sap.com/1.87.0",
  command: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  options: "${url} --no-sandbox --disable-gpu --remote-debugging-port=9222", // --headless",
  parallel: 2,
  coverage: true,
  keepAlive: false
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
    if (Object.prototype.hasOwnProperty.call(instance, name)) {
      const valueParser = valueParsers[typeof instance[name]] || valueParsers.default
      instance[name] = valueParser(parsed[2])
    }
  }
})

function nyc (...args) {
  const process = spawn('node', [rel('../node_modules/nyc/bin/nyc.js'), ...args], {
    detached: true,
    stdio: 'inherit'
  })
  let done
  const promise = new Promise(resolve => { done = resolve })
  process.on('close', done)
  return promise
}

function getPageName (id) {
  return instance._mapIdToPage[id]
}

function getPageResult (id) {
  return instance._pageResults[getPageName(id)]
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
      console.error(e)
    }
  }
}

Promise.resolve()
  .then(() => {
    if (instance.coverage) {
      console.log('Instrumenting...')
      return rmdirAsync(rel('nyc'), { recursive: true })
        .then(() => nyc('instrument', rel('../webapp'), rel('nyc/webapp'), '--nycrc-path', rel('nyc.json')))
    }
  })
  .then(() => check({
    port: instance.port,
    mappings: [{
      // Substitute qunit-redirect to extract test pages
      match: '/resources/sap/ui/qunit/qunit-redirect.js',
      file: rel('qunit-redirect.js')
    }, {
      // Endpoint to receive test pages
      match: '/_/addTestPages',
      custom: endpoint((id, data) => {
        instance._testPages = data
        execute.kill(id)
      })
    }, {
      // UI5 qunit.js source
      match: '/_/qunit(-2)?.js',
      url: `${instance.ui5}/resources/sap/ui/thirdparty/qunit$1.js`
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
        getPageResult(id).report = data
        execute.kill(id)
      })
    }, {
      // Endpoint to receive coverage
      match: '/_/nyc/coverage',
      custom: endpoint((id, data) => {
        return writeFileAsync(rel('nyc', `${id}.json`), JSON.stringify(data))
      })
    }, {
      // UI5 resources
      match: /\/(test-)?resources\/(.*)/,
      headers: {
        location: `${instance.ui5}/$1resources/$2`
      },
      status: 302
    }, {
      // Project mapping (coverage case, also replace coverage global scope on the fly)
      match: /^\/(.*\.js)$/,
      'if-match': (request, url, match) => instance.coverage ? match : false,
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
            }),
          readdir: readdirAsync,
          createReadStream: async (path, options) => {
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
    log(serve(configuration))
      .on('ready', ({ url }) => {
        extractPages()
      })
  })

function execute (relativeUrl) {
  if (!execute._instances) {
    execute._instances = {}
    execute.kill = id => {
      const instance = execute._instances[id]
      instance.process.kill("SIGKILL")
      instance.done()
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

  let url = `http://localhost:${instance.port}${relativeUrl}__id__=${id}`
  if (instance.keepAlive) {
    url += '&__keepAlive__'
  }
  console.log(`Opening ${url}`)
  const process = spawn(instance.command, instance.options.split(' ').map(param => param === '${url}' ? url : param), {
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
  console.log(instance._testPages)
  instance._runningPages = []
  instance._mapIdToPage = {}
  instance._pageResults = {}
  for (let i = 0; i < instance.parallel; ++i) {
    runPage()
  }
}

async function runPage () {
  if (instance._runningPages.length === instance._testPages.length) {
    if (!instance._waitingForEnd) {
      instance._waitingForEnd = true
      Promise.all(instance._runningPages).then(generateReport)
    }
    return
  }
  const index = instance._runningPages.length
  const page = instance._testPages[index]
  const promise = execute(page)
  instance._runningPages.push(promise)
  instance._mapIdToPage[promise.id] = page
  instance._pageResults[page] = {
    tests: []
  }
  promise.then(runPage)
}

async function generateReport () {
  console.log('done.')

  // Simple report
  let failed = 0
  instance._testPages.forEach(page => {
    console.log(page)
    const results = instance._pageResults[page]
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
  })

  if (keepAlive) {
    console.log('Keeping alive.')
  } else {
    process.exit(failed)
  }
}