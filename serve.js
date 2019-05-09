'use strict';

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
    require('node-ui5/serve')({
      port: 8080,
      mappings: [{
        // ui5 resource access
        match: /\/resources\/(.*)/,
        url: `${UI5BaseUrl}${version.path}/resources/$1`
      }, {
        // ui5 test-resource access
        match: /\/test-resources\/(.*)/,
        url: `${UI5BaseUrl}${version.path}/test-resources/$1`
      }, {
        // default access to index.html
        match: /^\/$/,
        file: path.join(__dirname, 'webapp/index.html')
      }, {
        // mapping to file access
        match: /(.*)/,
        file: path.join(__dirname, 'webapp', '$1')
      }]
    })
  })
