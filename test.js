'use strict'

require('colors')

require('node-ui5')
  .then(({ sap }) => {
    sap.ui.require([
      'sap/ui/model/odata/v2/ODataModel',
      'node-ui5/promisify'
    ], async function (ODataModel) {
      console.log('Creating ODataModel...')
      const model = new ODataModel({
        serviceUrl: 'http://localhost:8080/odata/TODO_SRV'
      })
      console.log('Reading $metadata')
      await model.metadataLoaded()
      console.log('Reading TODO items')
      const { results } = await model.readAsync('/TodoItemSet')
      console.log(`Found ${results.length} todo items`)
      results.slice(0, 10).forEach(item => {
        console.log(item.Guid.gray + ' ' + item.Title.white)
      })
      if (results.length > 10) {
        console.log('...'.gray)
      }
    })
  })
