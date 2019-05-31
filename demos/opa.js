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
    iClickAddToCart: function () {
      return this.waitFor({
        controlType: 'sap.m.Button',
        matchers: [new I18NText({
          propertyName: 'text',
          key: 'addToCartShort'
        })],
        actions: new Press(),
        success: function (oObjectListItem) {
          Opa5.assert.ok(true, 'Added product to cart')
        }
      })
    },
    iClickCategoryBack: function () {
      return this.waitFor({
        id: 'container-cart---category--page-navButton',
        actions: new Press(),
        success: function (oObjectListItem) {
          Opa5.assert.ok(true, 'Clicked back on the category product list')
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

  opaTest('Adding DVD player', function (Given, When, Then) {
    When.iSearch('DVD')
    When.iClickProduct({ ProductId: 'HT-2001' })
      .and.iClickAddToCart()
      .and.iToggleCart()
    Then.theCartLengthEquals(1)
    When.iToggleCart()
      .and.iClickCategoryBack()
      .and.iSearch()
  })

  opaTest('Adding CD/DVD sleeves', function (Given, When, Then) {
    When.iSearch('sleeves')
    When.iClickProduct({ ProductId: 'HT-2025' })
      .and.iClickAddToCart()
      .and.iToggleCart()
    Then.theCartLengthEquals(2)
    When.iToggleCart()
      .and.iClickCategoryBack()
      .and.iSearch()
  })

  /*
    Open cart again
    Click proceed
    Step 2
    Cash on delivery
    Step 3
    First name: John
    Last name: Doe
    Phone Number: 5551234567
    Email: john.doe@anonymous.com
    Step 4
    Address: Street name
    City: City
    Zip Code: 1234
    Country: Country
    Step 5
    Order Summary
    Submit
    Yes

    Check Your order number: 20171941

    Return to shop
    Cart is empty
  */

  // Then.iTeardownMyAppFrame()

  QUnit.start()
})
