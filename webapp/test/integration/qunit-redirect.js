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

    let QUnit;
  
    Object.defineProperty(window, 'QUnit', {
      get: function () {
        return QUnit
      },
  
      set: function (value) {
        QUnit = value

        const { test } = QUnit
        QUnit.test = (label) => test(label, (assert) => assert.ok(true, label))

        let timeoutId
        QUnit.moduleDone(function () {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          timeoutId = setTimeout(notify, 10)
        })

        function notify () {
          const modules = QUnit.config.modules.map(({ moduleId }) => moduleId)
          const opa = !!window?.sap?.ui?.test?.Opa5
          console.log('addTestPages\n' + JSON.stringify({ type: 'qunit', opa, modules, page: location.toString() }))
        }
      }
    })
  
    window.addEventListener('load', function () {
      if (typeof suite === 'function') {
        suite()
        alert('addTestPages\n' + JSON.stringify({ type: 'suite', pages }))
      } else if (!QUnit) {
        alert('addTestPages\n' + JSON.stringify({ type: 'none ' }))
      }
    })
  }())
  