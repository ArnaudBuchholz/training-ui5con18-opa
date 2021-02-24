/* Injected QUnit hooks */
(function () {
  'use strict'

  var testCount = 0

  QUnit.testDone(function (report) {
    ++testCount
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/QUnit/testDone', false)
    xhr.send(JSON.stringify(report))
  })

  QUnit.done(function (report) {
    if (!testCount) {
      return
    }
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/QUnit/done', false)
    xhr.send(JSON.stringify(report))
    // push coverage ?
    window.close()
  })
}())
