sap.ui.define([
	"sap/ui/demo/todo/const",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"

], function (CONST, ODataModel, Filter, FilterOperator) {
	"use strict";

	var TODOITEM = CONST.OData.entityProperties.todoItem;

	QUnit.module("MockServer", {
		beforeEach: function (assert) {
			var done = assert.async();
			this.oModel = new ODataModel({
				serviceUrl: "/odata/TODO_SRV/"
			});
			// Wait before for metadata to be loaded before running tests
			this.oModel.metadataLoaded().then(done);
		},
		afterEach: function () {}
	});

	function toODataDate(dValue) {
		return "/Date(" + dValue.getTime() + ")/";
	}

	function handleError(assert, done) {
		return function (oReason) {
			var sMessage = "";
			if (oReason.statusCode && oReason.statusText) {
				sMessage += oReason.statusText + " (" + oReason.statusCode + ") ";
			}
			if (oReason.message) {
				sMessage += oReason.message;
			} else {
				sMessage += JSON.stringify(oReason);
			}
			assert.ok(false, sMessage);
			done();
		}
	}

	QUnit.test("The server exposes some items", function (assert) {
		var done = assert.async();
		this.oModel.read("/" + CONST.OData.entityNames.todoItemSet, {
			success: function (oData) {
				assert.notEqual(oData.results.length, 0, "Found some items");
				done();
			},
			error: handleError(assert, done)
		});
	});

	QUnit.test("Get and update first item", function (assert) {
		var done = assert.async();
		var mKeyFields = {};
		mKeyFields[TODOITEM.guid] = "0MOCKSVR-TODO-MKII-MOCK-00000002";
		var sItemPath = "/" + this.oModel.createKey(CONST.OData.entityNames.todoItemSet, mKeyFields);
		// Read item and check properties
		this.oModel.read(sItemPath, {
			success: function (oTodoItem) {
				assert.equal(oTodoItem[TODOITEM.title], "Learn OpenUI5", "Found item labelled 'Learn OpenUI5'");
				assert.equal(oTodoItem[TODOITEM.completed], false, "Item is not completed");
				assert.equal(oTodoItem[TODOITEM.completionDate], null, "Item has not completion date");
				// Set it to completed
				var oBody = {};
				oBody[TODOITEM.completed] = true;
				this.oModel.update(sItemPath, oBody, {
					merge: true, // Use MERGE
					success: function () {
						// Read the item again to check how it was updated
						this.oModel.read(sItemPath, {
							success: function (oUpdatedItem) {
								assert.equal(oUpdatedItem[TODOITEM.completed], true, "Item is completed");
								assert.notEqual(oUpdatedItem[TODOITEM.completionDate], null, "Item has a completion date");
								done();
							},
							error: handleError(assert, done)
						});
					}.bind(this),
					error: handleError(assert, done)
				});
			}.bind(this),
			error: handleError(assert, done)
		})
	});

	QUnit.test("Creating a new item", function (assert) {
		var done = assert.async(),
			dNow = new Date(),
			oBody = {};
		oBody[TODOITEM.title] = "Test item";
		oBody[TODOITEM.dueDate] = toODataDate(dNow);
		this.oModel.create("/" + CONST.OData.entityNames.todoItemSet, oBody, {
			success: function (oCreateEntry) {
				assert.notEqual(oCreateEntry[TODOITEM.guid], "", "Guid was allocated");
				assert.equal(oCreateEntry[TODOITEM.completed], false, "Item is not completed");
				assert.equal(oCreateEntry[TODOITEM.dueDate].getTime(), dNow.getTime(), "Item has the proper due date");
				done();
			},
			error: handleError(assert, done)
		});
	});

	QUnit.test("Simulating an error", function (assert) {
		var done = assert.async();
		var mKeyFields = {};
		mKeyFields[TODOITEM.guid] = "0MOCKSVR-TODO-MKII-MOCK-00000000";
		var sItemPath = "/" + this.oModel.createKey(CONST.OData.entityNames.todoItemSet, mKeyFields);
		// Try to set the item to completed
		var oBody = {};
		oBody[TODOITEM.completed] = true;
		this.oModel.update(sItemPath, oBody, {
			merge: true, // Use MERGE
			success: function () {
				assert.ok(false, "There should be an error");
				done();
			},
			error: function (oReason) {
				assert.ok(true, "The update failed as expected");
				assert.equal(oReason.responseText, "I'll start tomorrow !", "The right error message is returned");
				// Read the item again to check how it was updated
				this.oModel.read(sItemPath, {
					success: function (oTodoItem) {
						assert.equal(oTodoItem[TODOITEM.completed], false, "Item is not completed");
						assert.equal(oTodoItem[TODOITEM.completionDate], null, "Item has not completion date");
						done();
					},
					error: handleError(assert, done)
				});
			}.bind(this)
		});
	});

	QUnit.test("Implement ClearCompleted function import", function (assert) {
		var done = assert.async();
		this.oModel.callFunction("/" + CONST.OData.functionImports.clearCompleted.name, {
			method: CONST.OData.functionImports.clearCompleted.method,
			success: function (oResult) {
				var iCount = oResult[CONST.OData.functionImports.clearCompleted.name][CONST.OData.functionImports.clearCompleted.returnType.count];
				assert.notEqual(iCount, 0, "Some items were removed");
				this.oModel.read("/" + CONST.OData.entityNames.todoItemSet, {
					filters: [new Filter("Completed", FilterOperator.EQ, true)],
					success: function (oData) {
						assert.equal(oData.results.length, 0, "No more completed items");
						done();
					},
					error: handleError(assert, done)
				});
			}.bind(this),
			error: handleError(assert, done)
		});
	});

});
