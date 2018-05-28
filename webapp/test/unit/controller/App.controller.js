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
			this.oAppController._refresh = sinon.spy();
			["create", "read", "update", "callFunction"].forEach(function (sMethod) {
				this.oJSONModelStub[sMethod] = sinon.spy();
			}, this);
			this.mControls = {
				addTodoItemInput: {
					getValue: sinon.stub()
				}
			};
			this.oViewStub.byId = function (sId) {
				return this.mControls[sId];
			}.bind(this);
		},
		afterEach: function() {
			Controller.prototype.getView.restore();
			this.oViewStub.destroy();
		}
	});

	var dToday = new Date(),
		dYesterday = new Date(dToday.getTime() - 0.9 * CONST.msPerDay),
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
		QUnit.test("getIcon when " + oTestCase.label, function (assert) {
			// Given
			var oTodoItem = buildItem(oTestCase.item),
			// When
				sIcon = this.oAppController.getIcon(oTodoItem);
			// Then
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
	}, {
		label: "Item is completed",
		item: {
			dueDate: dToday,
			completed: true,
			completionDate: dToday
		},
		expectedKey: "todoItem.intro.completedOn"
	}, {
		label: "Item is late (since yesterday)",
		item: {
			dueDate: dYesterday,
			completed: false
		},
		expectedKey: "todoItem.intro.lateByYesterday"
	}, {
		label: "Item is late (more than yesterday)",
		item: {
			dueDate: dTwoDaysAgo,
			completed: false
		},
		expectedKey: "todoItem.intro.lateDays",
		expectedDaysCount: true


	}].forEach(function (oTestCase) {
		QUnit.test("getIntro when " + oTestCase.label, function (assert) {
			// Given
			var oTodoItem = buildItem(oTestCase.item),
			// When
				sIntro = this.oAppController.getIntro(oTodoItem);
			// Then
			if (oTestCase.expectedKey) {
				assert.notEqual(sIntro, "", "An intro is expected");
				assert.equal(this.oAppController._i18n.getCall(0).args[0], oTestCase.expectedKey, "The proper translation key was used");
				if (oTestCase.expectedDaysCount) {
					var iCount = this.oAppController._i18n.getCall(0).args[1][0];
					assert.equal(typeof iCount, "number", "A number of days was provided");
					assert.ok(iCount > 1, "More than yesterday");
				}
			} else {
				assert.equal(sIntro, "", "No intro is expected");
			}
		});
	});

	QUnit.test("Item creation - check API usage", function (assert) {
		// Given
		var sTitle = "Hello World!";
		this.mControls.addTodoItemInput.getValue.returns(sTitle);
		// When
		this.oAppController.addTodo();
		// Then
		assert.ok(this.oJSONModelStub.create.calledOnce, "Model.create is triggered");
		assert.equal(this.oJSONModelStub.create.getCall(0).args[0], "/" + CONST.OData.entityNames.todoItemSet, "Proper entity set");
		var oBody = this.oJSONModelStub.create.getCall(0).args[1],
			oDueDate = oBody[CONST.OData.entityProperties.todoItem.dueDate];
		assert.equal(oBody[CONST.OData.entityProperties.todoItem.title], sTitle, "Correct title");
		assert.ok(oDueDate instanceof Date, "Due date is a Date object");
		assert.equal(oDueDate.getFullYear(), dToday.getFullYear(), "Due date's year is today's one");
		assert.equal(oDueDate.getMonth(), dToday.getMonth(), "Due date's month is today's one");
		assert.equal(oDueDate.getDate(), dToday.getDate(), "Due date's date is today's one");
		assert.equal(oDueDate.getHours(), 23, "Due date's hour");
		assert.equal(oDueDate.getMinutes(), 59, "Due date's minutes");
		assert.equal(oDueDate.getSeconds(), 59, "Due date's seconds");
		assert.ok(this.oAppController._refresh.calledOnce, "Lists are refreshed without waiting for success");
	});

	QUnit.test("Item creation - blocked if no title", function (assert) {
		// Given
		this.mControls.addTodoItemInput.getValue.returns("");
		// When
		this.oAppController.addTodo();
		// Then
		assert.ok(!this.oJSONModelStub.create.calledOnce, "Model.create is *not* triggered");
		assert.ok(!this.oAppController._refresh.calledOnce, "Lists are *not* refreshed");
	});

	[{
		count: 0,
		expectedKey: "message.clearedCompleted.none"
	}, {
		count: 1,
		expectedKey: "message.clearedCompleted.one"
	}, {
		count: 2,
		expectedKey: "message.clearedCompleted.many"

	}].forEach(function (oTestCase) {
		QUnit.test("Clearing of completed items - when " + oTestCase.count + " items are cleared", function (assert) {
			// Given
			// When
			this.oAppController.clearCompleted();
			// Then
			assert.ok(this.oJSONModelStub.callFunction.calledOnce, "Model.callFunction is triggered");
			assert.equal(this.oJSONModelStub.callFunction.getCall(0).args[0], "/" + CONST.OData.functionImports.clearCompleted.name, "Proper function name");
			assert.ok(this.oAppController._refresh.calledOnce, "Lists are refreshed without waiting for success");
			// Simulate respone
			var mParameters = this.oJSONModelStub.callFunction.getCall(0).args[1],
				oResponse = {},
				oReturnType = {};
			oReturnType[CONST.OData.functionImports.clearCompleted.returnType.count] = oTestCase.count;
			oResponse[CONST.OData.functionImports.clearCompleted.name] = oReturnType;
			mParameters.success(oResponse);
			assert.equal(this.oAppController._i18n.getCall(0).args[0], oTestCase.expectedKey, "The proper translation key was used");
			if (oTestCase.count > 1) {
				assert.equal(this.oAppController._i18n.getCall(0).args[1][0], oTestCase.count, "The number of items was provided");
			}
		});
	});

});
