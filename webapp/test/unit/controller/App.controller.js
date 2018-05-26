sap.ui.define([
	"sap/ui/base/ManagedObject",
	"sap/ui/core/mvc/Controller",
	"sap/ui/demo/todo/controller/App.controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/demo/todo/const",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function(ManagedObject, Controller, AppController, JSONModel, CONST/*, sinon, sinonQunit*/) {
	"use strict";

	QUnit.module("App.controller", {

		beforeEach: function() {
			this.oAppController = new AppController();
			this.oViewStub = new ManagedObject({});
			sinon.stub(Controller.prototype, "getView").returns(this.oViewStub);
			this.oJSONModelStub = new JSONModel({});
			this.oViewStub.setModel(this.oJSONModelStub);
			this.oAppController._i18n = sinon.spy();
		},

		afterEach: function() {
			Controller.prototype.getView.restore();
			this.oViewStub.destroy();
		}
	});

	var dToday = new Date(),
		dYesterday = new Date(dToday.getTime() - CONST.msPerDay),
		dTwoDaysAgo = new Date(dYesterday.getTime() - CONST.msPerDay),
		dTomorrow = new Date(dToday.getTime() + CONST.msPerDay);

	function buildItem (oItemDefinition) {
		var oTodoItem = {};
		Object.keys(oItemDefinition).forEach(function (sProperty) {
			oTodoItem[CONST.OData.entityProperties.todoItem[sProperty]] = oItemDefinition[sProperty];
		});
		return oTodoItem;
	}

	// Testing getIcon
	[{
		label: "DueDate is in the past",
		item: {
			dueDate: dYesterday,
			completed: false
		},
		expectedIcon: true

	}, {
		label: "DueDate is in the future",
		item: {
			dueDate: dTomorrow,
			completed: false
		},
		expectedIcon: false

	}, {
		label: "Item is completed on time",
		item: {
			dueDate: dYesterday,
			completed: true,
			completionDate: dTwoDaysAgo
		},
		expectedIcon: false

	}, {
		label: "Item is completed late",
		item: {
			dueDate: dYesterday,
			completed: true,
			completionDate: dToday
		},
		expectedIcon: true

	}].forEach(function (oTestCase) {
		QUnit.test("getIcon when" + oTestCase.label, function (assert) {
			var oTodoItem = buildItem(oTestCase.item),
				sIcon = this.oAppController.getIcon(oTodoItem);
			if (oTestCase.expectedIcon) {
				assert.notEqual(sIcon, "", "An icon is expected");
			} else {
				assert.equal(sIcon, "", "No icon is expected");
			}
		});
	});

	// Testing getIntro
	[{
		label: "Item has nothing to show",
		item: {
			dueDate: dTomorrow,
			completed: false
		},
		expectedKey: ""

	}].forEach(function (oTestCase) {
		QUnit.test("getIntro when" + oTestCase.label, function (assert) {
			var oTodoItem = buildItem(oTestCase.item),
				sIntro = this.oAppController.getIntro(oTodoItem);
			if (oTestCase.expectedKey) {
				assert.notEqual(sIntro, "", "An intro is expected");
			} else {
				assert.equal(sIntro, "", "No intro is expected");
			}
		});
	});

});
