'use strict'
/* global QUnit, sap, localStorage */
QUnit.config.autostart = false
sap.ui.require([
  'sap/ui/test/Opa5',
  'sap/ui/test/opaQunit',
  'sap/ui/test/actions/Press',
  'sap/ui/test/actions/EnterText',
  'sap/ui/test/matchers/Properties',
  'sap/ui/test/matchers/AggregationLengthEquals',
  'sap/ui/test/matchers/Ancestor',
  'sap/ui/test/matchers/I18NText'

], function (Opa5, opaTest, Press, EnterText, Properties, AggregationLengthEquals, Ancestor, I18NText) {

  QUnit.module('OPA end-to-end example with UI5 Shopping Cart example')

  var MyAssertions = Opa5.extend("demos.opa.assertions", {
    theCartLengthEquals: function (iCount) {
      return this.waitFor({
        id: 'container-cart---cartView--entryList',
        matchers: [new AggregationLengthEquals({
          name: 'items',
          length: iCount
        })],
        success: function () {
          Opa5.assert.ok(true, 'The cart contains ' + iCount + ' items')
        }
      })
    },
    iShouldSeeTheCheckoutWizard: function () {
      return this.waitFor({
        id: 'container-cart---checkoutView--shoppingCartWizard',
        success: function () {
          Opa5.assert.ok(true, 'The checkout wizard is displayed')
        }
      })
    },
    iShouldSeeTheCheckoutCartItems: function (aExpectedItems) {
      return this.waitFor({
        id: 'container-cart---checkoutView--entryList',
        matchers: [function (oList) {
          return oList.getItems().every(function (oObjectListItem, iIndex) {
            var oBoundObject
            try {
              oBoundObject = oObjectListItem.getBinding('title').getContext().getObject()
            } catch (e) {
              return false
            }
            var mExpectedProductProperties = aExpectedItems[iIndex]
            return Object.keys(mExpectedProductProperties).every(function (sPropertyName) {
              return oBoundObject[sPropertyName] === mExpectedProductProperties[sPropertyName]
            })
          })
        }],
        success: function () {
          Opa5.assert.ok(true, 'The checkout cart contains ' + aExpectedItems.length + ' items')
        }
      })
    },
    iSeeOrderConfirmationMessage: function () {
      return this.waitFor({
        controlType: 'sap.m.FormattedText',
        matchers: [function (oFormattedText) {
          return oFormattedText.getHtmlText().indexOf('Your order number: ') !== -1
        }],
        success: function () {
          Opa5.assert.ok(true, 'The order is confirmed')
        }
      })
    }
  });

  var MyActions = Opa5.extend("demos.opa.actions", {
    iToggleCart: function () {
      return this.waitFor({
        controlType: 'sap.m.Button',
        matchers: [new Properties({
            icon: 'sap-icon://cart'
        })],
        actions: new Press(),
        success: function (aCartButtons) {
          var oCartButton = aCartButtons[0]
          if (oCartButton.getPressed()) {
            Opa5.assert.ok(true, "Opened the shopping cart")
          } else {
            Opa5.assert.ok(true, "Closed the shopping cart")
          }
        }
      })
    },
    iSearch: function (sSearchText) {
      return this.waitFor({
        controlType: 'sap.m.SearchField',
        actions: new EnterText({
          text: sSearchText || ''
        }),
        success: function () {
          Opa5.assert.ok(true, 'Searching for: ' + sSearchText)
        }
      })
    },
    iClickProduct: function (mExpectedProductProperties) {
      return this.waitFor({
        controlType: 'sap.m.ObjectListItem',
        matchers: [
          new Ancestor('container-cart---homeView--productList'),
          function (oObjectListItem) {
            var oBindingContext = oObjectListItem.getBindingContext();
            if (!oBindingContext) {
              return false;
            }
            var oBoundObject = oBindingContext.getObject();
            return Object.keys(mExpectedProductProperties).every(function (sPropertyName) {
              return oBoundObject[sPropertyName] === mExpectedProductProperties[sPropertyName]
            })
          }
        ],
        actions: new Press(),
        success: function (aObjectListItems) {
          var oObjectListItem = aObjectListItems[0]
          Opa5.assert.ok(true, 'Clicked product: ' + oObjectListItem.getTitle())
        }
      })
    },
    _iClickTranslatedButton: function (sKey, sMessage) {
      return this.waitFor({
        controlType: 'sap.m.Button',
        matchers: [new I18NText({
          propertyName: 'text',
          key: sKey
        })],
        actions: new Press(),
        success: function (oObjectListItem) {
          Opa5.assert.ok(true, sMessage)
        }
      })
    },
    iClickAddToCart: function () {
      return this._iClickTranslatedButton('addToCartShort', 'Added product to cart')
    },
    _iClickButtonById: function (sId, sMessage) {
      return this.waitFor({
        id: sId,
        actions: new Press(),
        success: function () {
          Opa5.assert.ok(true, sMessage)
        }
      })
    },
    iClickCategoryBack: function () {
      return this._iClickButtonById('container-cart---category--page-navButton', 'Clicked back on the category product list')
    },
    iClickCartProceed: function () {
      return this._iClickTranslatedButton('cartProceedButtonText', 'Clicked proceed')
    },
    iClickCheckoutWizardContentNext: function () {
      return this._iClickButtonById('container-cart---checkoutView--contentsStep-nextButton', 'Clicked the checkout wizard next')
    },
    iClickPayViaCashOnDelivery: function () {
      return this._iClickButtonById('container-cart---checkoutView--payViaCOD-button', 'Clicked the \'Cash on Delivery\' option')
    },
    iClickCheckoutWizardPaymentNext: function () {
      return this._iClickButtonById('container-cart---checkoutView--paymentTypeStep-nextButton', 'Clicked the checkout wizard next')
    },
    _iSetInputValue: function (sId, sValue, sMessage) {
      return this.waitFor({
        id: sId,
        actions: new EnterText({
          text: sValue
        }),
        success: function () {
          Opa5.assert.ok(true, sMessage)
        }
      })
    },
    iSetCashOnDeliveryName: function (sValue) {
      return this._iSetInputValue('container-cart---checkoutView--cashOnDeliveryName', sValue, 'Set name to \'' + sValue + '\'')
    },
    iSetCashOnDeliveryLastName: function (sValue) {
      return this._iSetInputValue('container-cart---checkoutView--cashOnDeliveryLastName', sValue, 'Set last name to \'' + sValue + '\'')
    },
    iSetCashOnDeliveryPhoneNumber: function (sValue) {
      return this._iSetInputValue('container-cart---checkoutView--cashOnDeliveryPhoneNumber', sValue, 'Set phone number to \'' + sValue + '\'')
    },
    iSetCashOnDeliveryEmail: function (sValue) {
      return this._iSetInputValue('container-cart---checkoutView--cashOnDeliveryEmail', sValue, 'Set email to \'' + sValue + '\'')
    },
    iClickCheckoutWizardCODNext: function () {
      return this._iClickButtonById('container-cart---checkoutView--cashOnDeliveryStep-nextButton', 'Clicked the checkout wizard next')
    },
    iSetInvoiceAddressAddress: function (sValue) {
      return this._iSetInputValue('container-cart---checkoutView--invoiceAddressAddress', sValue, 'Set invoice address to \'' + sValue + '\'')
    },
    iSetInvoiceAddressCity: function (sValue) {
      return this._iSetInputValue('container-cart---checkoutView--invoiceAddressCity', sValue, 'Set invoice city to \'' + sValue + '\'')
    },
    iSetInvoiceAddressZip: function (sValue) {
      return this._iSetInputValue('container-cart---checkoutView--invoiceAddressZip', sValue, 'Set invoice zip to \'' + sValue + '\'')
    },
    iSetInvoiceAddressCountry: function (sValue) {
      return this._iSetInputValue('container-cart---checkoutView--invoiceAddressCountry', sValue, 'Set invoice country to \'' + sValue + '\'')
    },
    iClickCheckoutWizardInvoiceNext: function () {
      return this._iClickButtonById('container-cart---checkoutView--invoiceStep-nextButton', 'Clicked the checkout wizard next')
    },
    iClickCheckoutWizardDeliveryNext: function () {
      return this._iClickButtonById('container-cart---checkoutView--deliveryTypeStep-nextButton', 'Clicked the checkout wizard next')
    },
    iClickCheckoutWizardSubmit: function () {
      return this._iClickButtonById('container-cart---checkoutView--submitOrder', 'Clicked the checkout wizard submit')
    },
    iClickConfirmYes: function () {
      return this.waitFor({
        controlType: 'sap.m.Button',
        searchOpenDialogs: true,
        matchers: [function (oButton) {
          return oButton.getText() === 'Yes'
        }],
        actions: new Press(),
        success: function () {
          Opa5.assert.ok(true, "Clicked Yes to confirm")
        }
      })
    }
  })

  Opa5.extendConfig({
    autoWait: true,
    assertions: new MyAssertions(),
    actions: new MyActions()
  })

  opaTest('The Shopping Cart must be initially empty', function (Given, When, Then) {
    localStorage.clear()
    Given.iStartMyAppInAFrame({
      source: '/proxy/https/openui5.hana.ondemand.com/1.66.1/test-resources/sap/m/demokit/cart/webapp/index.html',
      autoWait: true,
      width: 1024,
      height: 768
    })
    When.iToggleCart()
    Then.theCartLengthEquals(0)
    When.iToggleCart()
  })

  opaTest('Adds DVD player', function (Given, When, Then) {
    When.iSearch('DVD')
    When.iClickProduct({ ProductId: 'HT-2001' })
      .and.iClickAddToCart()
      .and.iToggleCart()
    Then.theCartLengthEquals(1)
    When.iToggleCart()
      .and.iClickCategoryBack()
      .and.iSearch()
  })

  opaTest('Adds CD/DVD sleeves', function (Given, When, Then) {
    When.iSearch('sleeves')
    When.iClickProduct({ ProductId: 'HT-2025' })
      .and.iClickAddToCart()
      .and.iToggleCart()
    Then.theCartLengthEquals(2)
    When.iToggleCart()
      .and.iClickCategoryBack()
      .and.iSearch()
  })

  opaTest('Submit the cart', function (Given, When, Then) {
    When.iToggleCart()
      .and.iClickCartProceed()
    Then.iShouldSeeTheCheckoutWizard()
      .and.iShouldSeeTheCheckoutCartItems([{
        ProductId: 'HT-2001'
      }, {
        ProductId: 'HT-2025'
      }])
  })

  opaTest('Step 2: Payment type', function (Given, When, Then) {
    When.iClickCheckoutWizardContentNext()
      .and.iClickPayViaCashOnDelivery()
  })

  opaTest('Step 3: Details for cash on delivery', function (Given, When, Then) {
    When.iClickCheckoutWizardPaymentNext()
      .and.iSetCashOnDeliveryName('John')
      .and.iSetCashOnDeliveryLastName('Doe')
      .and.iSetCashOnDeliveryPhoneNumber('5551234567')
      .and.iSetCashOnDeliveryEmail('john.doe@anonymous.com')
  })

  opaTest('Step 4: Invoice address', function (Given, When, Then) {
    When.iClickCheckoutWizardCODNext()
      .and.iSetInvoiceAddressAddress('Street name')
      .and.iSetInvoiceAddressCity('City')
      .and.iSetInvoiceAddressZip('1234')
      .and.iSetInvoiceAddressCountry('Country')
  })

  opaTest('Step 5: Delivery type', function (Given, When, Then) {
    When.iClickCheckoutWizardInvoiceNext()
    // No change
  })

  opaTest('Step 6: Order summary', function (Given, When, Then) {
    When.iClickCheckoutWizardDeliveryNext()
      .and.iClickCheckoutWizardSubmit()
      .and.iClickConfirmYes()
    Then.iSeeOrderConfirmationMessage()
      .and.iTeardownMyAppFrame()
  })

  QUnit.start()
})
