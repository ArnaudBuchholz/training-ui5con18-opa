const assert = require('assert')

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0 // Ignore certificate errors

describe('Demonstration of node-ui5', function () {
  this.timeout(10000) // node-ui5 is quite slow to boot

  let oModel

  before(function (done) {
    require('node-ui5/factory')({
      verbose: true,
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
    describe('MarketingPlan entity', () => {
      describe('Name property', () => {
        it('is required', () => { assert(oModel.getProperty('/#MarketingPlan/Name/@nullable') === 'false') })
        it('is has a maximum length of 125', () => { assert(oModel.getProperty('/#MarketingPlan/Name/@maxLength') === '125') })
        it('is has a label', () => { assert(oModel.getProperty('/#MarketingPlan/Name/@sap:label') === 'Name') })
      })
    })
  })

  describe('Get app configuration', () => {
    before(() => oModel.readAsync("/AppConfigurationSet('CUAN_MARKETING_PLAN')"))

    it('is not read only', () => { assert(!oModel.getProperty("/AppConfigurationSet('CUAN_MARKETING_PLAN')/IsReadOnly")) })
    it('allows program creation', () => { assert(oModel.getProperty("/AppConfigurationSet('CUAN_MARKETING_PLAN')/IsProgramCreatable")) })
    it('allows campaign creation', () => { assert(oModel.getProperty("/AppConfigurationSet('CUAN_MARKETING_PLAN')/IsCampaignCreatable")) })
    it('exposes a display currency', () => { assert(oModel.getProperty("/AppConfigurationSet('CUAN_MARKETING_PLAN')/DisplayCurrency")) })
  })

  describe('Get currencies', () => {
    before(() => oModel.readAsync('/Currencies'))

    it('contains CAD', () => { assert(oModel.getObject("/Currencies('CAD')")) })
    it('contains EUR', () => { assert(oModel.getObject("/Currencies('EUR')")) })
    it('contains USD', () => { assert(oModel.getObject("/Currencies('USD')")) })
  })

  describe('Get currencies & media types in one batch', () => {
    let aCurrencies
    let aMediaTypes

    before(() => Promise.all([
      oModel.readAsync('/Currencies').then(oData => { aCurrencies = oData.results }),
      oModel.readAsync('/MediaTypes').then(oData => { aMediaTypes = oData.results })
    ]))

    it('exposes currencies', () => { assert(aCurrencies.length) })
    it('exposes media types', () => { assert(aMediaTypes.length) })
  })

})
