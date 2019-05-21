'use strict'

const testrunner = require('node-qunit')

testrunner.run({
    code: './qunit-bootui5.js',
    tests: '../webapp/test/unit/test/MockServer.js'
}, function(err, report) {
    if (err) {
      console.error(err)
    } else {
      console.dir(report)
    }
})
