const assert = require('assert')

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0 // Ignore certificate errors

describe('Demonstration of node-ui5', function () {
  this.timeout(5000) // node-ui5 is quite slow to boot

  let oModel

  before(function (done) {
    require('node-ui5/factory')({
      fastButIncomplete: true,
      exposeAsGlobals: true
    }).then(() => {
      sap.ui.require([
        'sap/ui/model/odata/v2/ODataModel',
        'node-ui5/promisify'
      ], async function (ODataModel) {
        oModel = new ODataModel({
          serviceUrl: 'http://localhost:8080/odata/TODO_SRV'
        })
        await oModel.metadataLoaded()
        done()
      })
    })
  })

  it('is loaded', () => { assert(oModel) })

  describe('Validating $metadata', () => {
    describe('TodoItem entity', () => {
      describe('Title property', () => {
        it('is required', () => { assert(oModel.getProperty('/#TodoItem/Title/@nullable') === 'false') })
        it('is has a maximum length of 200', () => { assert(oModel.getProperty('/#TodoItem/Title/@maxLength') === '200') })
        it('is has a label', () => { assert(oModel.getProperty('/#TodoItem/Title/@sap:label') === 'Title') })
      })
    })
  })

  describe('Check app configuration', () => {
    before(() => oModel.readAsync("/AppConfigurationSet('ItemEditing')"))

    it('is true', () => { assert(oModel.getProperty("/AppConfigurationSet('ItemEditing')/Enable")) })
  })

  describe('Get known Todo items', () => {
    before(() => oModel.readAsync('/TodoItemSet'))

    it('contains "Start this app"', () => { assert(oModel.getObject("/TodoItemSet(guid'0MOCKSVR-TODO-MKII-MOCK-000000000001')")) })
    it('contains "Learn OpenUI5"', () => { assert(oModel.getObject("/TodoItemSet(guid'0MOCKSVR-TODO-MKII-MOCK-000000000002')")) })
    it('contains "Stop procrastinating"', () => { assert(oModel.getObject("/TodoItemSet(guid'0MOCKSVR-TODO-MKII-MOCK-000000000000')")) })
  })

  describe('Get two entity sets in one batch', () => {
    let aAppConfigurations
    let aTodoItems

    before(() => Promise.all([
      oModel.readAsync('/AppConfigurationSet').then(oData => { aAppConfigurations = oData.results }),
      oModel.readAsync('/TodoItemSet').then(oData => { aTodoItems = oData.results })
    ]))

    it('exposes app configuration', () => { assert(aAppConfigurations.length) })
    it('exposes todo items', () => { assert(aTodoItems.length) })
  })

})
