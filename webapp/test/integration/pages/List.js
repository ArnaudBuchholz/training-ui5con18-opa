sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/pages/Common",
	"sap/ui/test/matchers/AggregationLengthEquals",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/actions/Press"

], function (Opa5, Common, AggregationLengthEquals, Properties, Press) {
	"use strict";

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

	function iClickTheItemCheckbox (sTitle, bShouldBeSelected, sErrorMessage) {
		return this.waitFor({
			controlType: "sap.m.ObjectListItem",
			matchers: [new Properties({
				title: sTitle,
				selected: bShouldBeSelected
			})],
			actions: [pressItemCheckbox()],
			success: function () {
				Opa5.assert.ok(true, "Clicked the checkbox of item '" + sTitle + "'");
			},
			errorMessage: sErrorMessage
		});
	}

	function iShouldSeeTheItem (sTitle, bOptionalCompletedStatus) {
		var oProperties = {
				title: sTitle
			},
			sMessage;
		if (undefined !== bOptionalCompletedStatus) {
			oProperties.selected = bOptionalCompletedStatus;
			if (bOptionalCompletedStatus) {
				sMessage = "completed ";
			} else {
				sMessage = "new ";
			}
		} else {
			sMessage = ""
		}
		sMessage += "item titled '" + sTitle + "'";
		return this.waitFor({
			controlType: "sap.m.ObjectListItem",
			matchers: [new Properties(oProperties)],
			success: function() {
				Opa5.assert.ok(true, "The list has the expected " + sMessage);
			},
			errorMessage: "The list does not have the expected " + sMessage
		});
	}

	Opa5.createPageObjects({
		onTheListOfItems: {

			baseClass: Common,

			actions: {

				iSetTheItemToCompleted: function(sTitle) {
					return iClickTheItemCheckbox.call(this, sTitle, false, "Item '" + sTitle + "' cannot be completed");
				},

				iSetTheItemToNew: function(sTitle) {
					return iClickTheItemCheckbox.call(this, sTitle, true, "Item '" + sTitle + "' cannot be completed");
				},

				iEditTheItem: function(sTitle) {
					return this.waitFor({
						controlType: "sap.m.ObjectListItem",
						matchers: [new Properties({
							title: sTitle
						})],
						actions: [pressItemEdit()],
						success: function () {
							Opa5.assert.ok(true, "Clicked the edit button of item '" + sText + "'");
						},
						errorMessage: "Item cannot be edited"
					});
				}

			},

			assertions: {

				iShouldSeeTheItem: function(sTitle) {
					return iShouldSeeTheItem.call(this, sTitle);
				},

				iShouldSeeTheNewItem: function(sTitle) {
					return iShouldSeeTheItem.call(this, sTitle, false);
				},

				iShouldSeeTheCompletedItem: function(sTitle) {
					return iShouldSeeTheItem.call(this, sTitle, true);
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
