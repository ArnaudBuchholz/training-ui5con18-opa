'use strict'

const gpf = require('gpf-js')
const inquirer = require('inquirer')
const path = require('path')
const UI5BaseUrl = 'https://openui5.hana.ondemand.com/'

gpf.http.get(`${UI5BaseUrl}neo-app.json`)
  .then(response => JSON.parse(response.responseText))
  .then(neoApp => neoApp.routes)
  .then(versions =>
    inquirer.prompt([{
      name: 'version',
      type: 'list',
      message: 'Select UI5 version',
      choices: versions.map(version => version.description)
    }])
    .then(answer => versions.filter(version => version.description === answer.version)[0])
  )
  .then(version => {
    require('node-ui5/factory')({
      verbose: true,
      bootstrapLocation: `${UI5BaseUrl}${version.path}/resources/sap-ui-core.js`,
      fastButIncompleteSimulation: true,
      resourceroots: {
        'sap.ui.demo.todo': path.join(__dirname, 'webapp')
      }
    }).then(({ sap, window }) => {
      sap.ui.require([
        'sap/ui/demo/todo/test/MockServer'
      ], function (MockServer) {
        MockServer.init({
          get: name => name === 'randomize' ? '100' : undefined
        })
        require('node-ui5/serve')({
          port: 8080,
          window,
          mappings: [{
            // http/https proxy
            match: /^\/proxy\/(https?)\/(.*)/,
            url: '$1://$2',
            'unsecure-cookies': true
          }, {
            // ui5 resource access
            match: /\/resources\/(.*)/,
            url: `${UI5BaseUrl}${version.path}/resources/$1`
          }, {
            // ui5 test-resource access
            match: /\/test-resources\/(.*)/,
            url: `${UI5BaseUrl}${version.path}/test-resources/$1`
          }, {
            // mock server mapping
            match: /^(\/odata\/.*)/,
            mock: '$1'
          }, {
            // Access to demos folder
            match: /^\/demos\/(.*)/,
            file: path.join(__dirname, 'demos', '$1')
          }, {
            // Default default access to webapp/index.html
            match: /^\/$/,
            file: path.join(__dirname, 'webapp/index.html')
          }, {
            // Default mapping to file access in webapp
            match: /(.*)/,
            file: path.join(__dirname, 'webapp', '$1')
          }]
        })
      })
    })
  })
