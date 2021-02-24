/* Injected QUnit hooks */
(function () {
  'use strict'

  var testCount = 0

  function post (url, data) {
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/' + url, false)
    xhr.send(JSON.stringify(data))
  }

  QUnit.testDone(function (report) {
    ++testCount
    post('QUnit/testDone', report)
  })

  QUnit.done(function (report) {
    if (!testCount) {
      return
    }
    post('QUnit/done', report)
    if (window.__coverage__) {
      post('nyc/coverage', window.__coverage__)
    }
    if (!location.toString().includes('__keepAlive__')) {
      window.close()
    }
  })
}())
