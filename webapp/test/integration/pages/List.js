sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/pages/Common",
	"sap/ui/test/matchers/AggregationLengthEquals",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/actions/Press"

], function (Opa5, Common, AggregationLengthEquals, Properties, Press) {
	"use strict";

	var S_LIST_ID = "todoList";

	function _pressObjectListItemPart (sSubPartId) {
		var oPress = new Press();
		//search within the ObjectListItem for the constrol ending with sSubPartId
		oPress.controlAdapters["sap.m.ObjectListItem"] = sSubPartId;
		return oPress;
	}

	function pressItemCheckbox () {
		return _pressObjectListItemPart("selectMulti");
	}

	function pressItemEdit () {
		return _pressObjectListItemPart("imgDet");
	}

	Opa5.createPageObjects({
		onTheListOfItems: {

			baseClass: Common,

			actions: {

				iClickTheItemToSetItToCompleted: function(sTitle) {
					return this.waitFor({
						controlType: "sap.m.ObjectListItem",
						matchers: [new Properties({
							title: sTitle,
							selected: false
						})],
						actions: [pressItemCheckbox()],
						errorMessage: "Item cannot be set to completed"
					});
				},

				iClickTheItemToSetItToNotCompleted: function(sTitle) {
					return this.waitFor({
						controlType: "sap.m.ObjectListItem",
						matchers: [new Properties({
							title: sTitle,
							selected: true
						})],
						actions: [pressItemCheckbox()],
						errorMessage: "Item cannot be set to completed"
					});
				},

				iClickTheItemEditButton: function(sTitle) {
					return this.waitFor({
						controlType: "sap.m.ObjectListItem",
						matchers: [new Properties({
							title: sTitle
						})],
						actions: [pressItemEdit()],
						errorMessage: "Item cannot be edited"
					});
				}

			},

			assertions: {

				iShouldSeeTheItemTitled: function(sTitle) {
					return this.waitFor({
						controlType: "sap.m.ObjectListItem",
						matchers: [new Properties({
							title: sTitle
						})],
						success: function() {
							Opa5.assert.ok(true, "The list has the expected item titled '" + sTitle + "'");
						},
						errorMessage: "The list does not have the expected item titled '" + sTitle
					});
				},

				iShouldNotSeeAnyItemTitled: function(sTitle) {
					return this.waitFor({
						controlType: "sap.m.ObjectListItem",
						check: function (aItems) {
							return aItems.every(function (oItem) {
								return oItem.getTitle() !== sTitle;
							});
						},
						success: function() {
							Opa5.assert.ok(true, "The list has no item titled '" + sTitle + "'");
						},
						errorMessage: "The list still has not have expected item titled '" + sTitle
					});
				}

			}
		}
	});

});
