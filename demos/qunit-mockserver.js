'use strict'

const path = require('path')

const testrunner = require('node-qunit')
testrunner.setup({
    log: {
        summary: true,
        testing: true
    }
})

testrunner.run({
    code: path.join(__dirname, "/qunit-bootui5.js"),
    tests: path.join(__dirname, "../webapp/test/unit/test/MockServer.js")
}, function(err, report) {
    if (err) {
      console.error(err)
    } else {
      console.dir(report)
    }
})
