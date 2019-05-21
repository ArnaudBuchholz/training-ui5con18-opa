'use strict'
require('colors')
const path = require('path')
console.log('Loading UI5...'.gray)
require('node-ui5/factory')({
  exposeAsGlobals: true, // window & sap will be global
  fastButIncompleteSimulation: true,
  // verbose: true,
  resourceroots: {
    'sap.ui.demo.todo': path.join(__dirname, '../webapp')
  },
  synchronousBoot: true // QUnit does not support async code to be tested
})
  .catch(reason => {
    console.error(reason.toString().red)
  })
window['qunit-config'] = {
  host: 'http://localhost:8080',
  user: 'USER_NAME',
  password: 'PASSWORD'
}
console.log('UI5 ready.'.gray)
