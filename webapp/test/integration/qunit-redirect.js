(function () {
    'use strict'
  
    const MODULE = 'ui5-test-runner/qunit-redirect'
    if (window[MODULE]) {
      return // already installed
    }
    window[MODULE] = true
  
    /* global suite */
  
    const post = window['ui5-test-runner/post']
  
    const pages = []
  
    function jsUnitTestSuite () {}
  
    jsUnitTestSuite.prototype.addTestPage = function (url) {
      pages.push(url)
    }
  
    window.jsUnitTestSuite = jsUnitTestSuite
  
    window.addEventListener('load', function () {
      if (typeof suite === 'function') {
        suite()
        alert('addTestPages\n' + JSON.stringify({ type: 'suite', pages }))
      } else if (typeof QUnit === 'object') {
        QUnit.testStart(function (details) {
          const modules = QUnit.config.modules.map(({ moduleId }) => moduleId)
          const opa = !!window?.sap?.ui?.test?.Opa5
          alert('addTestPages\n' + JSON.stringify({ type: 'qunit', opa, modules, page: location.toString() }))
        })
      } else {
        alert('addTestPages\n' + JSON.stringify({ type: 'none ' }))
      }
    })
  }())
  