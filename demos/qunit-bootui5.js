'use strict'
require('colors')
const path = require('path')
console.log('Loading UI5...'.gray)
require('node-ui5/factory')({
  exposeAsGlobals: true,
  fastButIncompleteSimulation: true,
  // verbose: true,
  resourceroots: {
    'sap.ui.demo.todo': path.join(__dirname, '../webapp')
  },
  synchronousBoot: true // QUnit does not support async code to be tested
})
  .then(() => {
    console.log('UI5 ready.'.gray)
  }, reason => {
    console.error(reason.toString())
  })
