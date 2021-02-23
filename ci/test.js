'use strict'

const { body, check, log, serve } = require('reserve')
const { spawn } = require('child_process')
const { randomInt } = require('crypto')

const instance = {
  port: 8099,
  ui5: "https://ui5.sap.com/1.87.0",
  browser: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  browserOptions: "--no-sandbox --disable-gpu --remote-debugging-port=9222" //  --headless"
}

process.argv.forEach(arg => {
  const valueParsers = {
    boolean: value => value === true,
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

function ack(response) {
  response.writeHead(200)
  response.end()
}

check({
  port: instance.port,
  mappings: [{
    match: '/resources/sap/ui/qunit/qunit-redirect.js',
    file: './qunit-redirect.js'
  }, {
    match: '/_/addTestPages',
    custom: async (request, response) => {
const pages = await body(request)
console.log(pages)
      instance.testPages = JSON.parse(pages)
      const id = request.headers.referer.match(/__id__=(\d+)/)[1]
      browse.close(id)
      ack(response)
    }
  }, {
    match: "/(test-)resources/(.*)",
    headers: {
      Location: instance.ui5 + "/$1resources/$2"
    },
    status: 302
  }, {
    match: "^/(.*)",
    file: "../webapp/$1"
  }]
})
  .then(configuration => {
    log(serve(configuration))
      .on('ready', ({ url }) => {
        extractPages()
      })
  })

function browse (relativeUrl) {
  if (!browse._instances) {
    browse._processes = {}
    browse.close = id => {
      browse._processes[id].kill("SIGKILL")
      delete browse._processes[id]
    }
  }

  const id = randomInt(0xFFFFFFFF)
  const sep = relativeUrl.includes('?') ? '&' : '?'
  const url = `http://localhost:${instance.port}/${relativeUrl}${sep}__id__=${id}`
  console.log(`Opening ${url}`)
  const process = spawn(instance.browser, [url].concat(instance.browserOptions.split(' ')), {
    detached: true
  })
  let done
  const promise = new Promise(resolve => {
    done = resolve
  })
  process.on('close', () => {
    console.log('Closed.')
    done()
  })
  browse._processes[id] = process
  return promise
}

async function extractPages () {
  await browse('test/testsuite.qunit.html')
  console.log(instance.testPages)
  process.exit(0)
}