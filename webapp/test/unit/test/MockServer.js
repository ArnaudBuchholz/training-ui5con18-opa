sap.ui.define([
	"sap/ui/demo/todo/const",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"jquery.sap.global"

], function (CONST, ODataModel, Filter, FilterOperator, jQuery) {
	"use strict";

	var TODOITEM = CONST.OData.entityProperties.todoItem,
		QUNIT_CONFIG = jQuery.extend({
			host: '',
			user: '',
			password: ''
		}, window['qunit-config'] || {});

	QUnit.module("MockServer", {
		beforeEach: function (assert) {
			var done = assert.async();
			this.oModel = new ODataModel({
				serviceUrl: QUNIT_CONFIG.host + "/odata/TODO_SRV/",
				user: QUNIT_CONFIG.user,
				password: QUNIT_CONFIG.password
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

	QUnit.test("Exposes predefined items", function (assert) {
		var done = assert.async();
		this.oModel.read("/" + CONST.OData.entityNames.todoItemSet, {
			success: function (oData) {
				assert.ok(oData.results.length >= 4, "Found some items");
				// The order is not relevant but those 4 items should be There
				[{
					"Guid": "0MOCKSVR-TODO-MKII-MOCK-000000000001",
					"Title": "Start this app",
					"Completed": true
				}, {
					"Title": "Learn OpenUI5",
					"Guid": "0MOCKSVR-TODO-MKII-MOCK-000000000002",
					"Completed": false
				}, {
					"Guid": "0MOCKSVR-TODO-MKII-MOCK-000000000003",
					"Title": "Finish UICon'18 presentation",
					"Completed": false
				}, {
					"Guid": "0MOCKSVR-TODO-MKII-MOCK-000000000000",
					"Title": "Stop procrastinating",
					"Completed": false
				}].forEach(function (oExpectedItem) {
					var oMatchingItem = oData.results.filter(function (oCandidate) {
						return oCandidate[TODOITEM.guid] === oExpectedItem.Guid;
					})[0];
					assert.ok(oMatchingItem, "Found matching item for " + oExpectedItem.Guid);
					if (oMatchingItem) {
						assert.equal(oMatchingItem[TODOITEM.title], oExpectedItem.Title, "Title is correct");
						assert.strictEqual(oMatchingItem[TODOITEM.completed], oExpectedItem.Completed, "Completed is correct");
						if (oExpectedItem.Completed) {
							assert.ok(oMatchingItem[TODOITEM.completionDate].getTime() < Date.now(), "Completed is in the past");
						} else {
							assert.strictEqual(oMatchingItem[TODOITEM.completionDate], null, "CompletionDate is null");
						}
					}
				});
				done();
			},
			error: handleError(assert, done)
		});
	});

	QUnit.test("Exposes more than 100 items", function (assert) {
		var done = assert.async();
		this.oModel.read("/" + CONST.OData.entityNames.todoItemSet, {
			success: function (oData) {
				assert.ok(oData.results.length > 100, "Found more than 100 items");
				done();
			},
			error: handleError(assert, done)
		});
	});

	QUnit.test("Handles update of item", function (assert) {
		var done = assert.async();
		var mKeyFields = {};
		mKeyFields[TODOITEM.guid] = "0MOCKSVR-TODO-MKII-MOCK-000000000002";
		var sItemPath = "/" + this.oModel.createKey(CONST.OData.entityNames.todoItemSet, mKeyFields);
		// Read item and check properties
		this.oModel.read(sItemPath, {
			success: function (oTodoItem) {
				assert.equal(oTodoItem[TODOITEM.title], "Learn OpenUI5", "Found item labelled 'Learn OpenUI5'");
				assert.strictEqual(oTodoItem[TODOITEM.completed], false, "Item is not completed");
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

	QUnit.test("Handles creation of a new item", function (assert) {
		var done = assert.async(),
			dNow = new Date(),
			oBody = {};
		oBody[TODOITEM.title] = "Test item";
		oBody[TODOITEM.dueDate] = toODataDate(dNow);
		this.oModel.create("/" + CONST.OData.entityNames.todoItemSet, oBody, {
			success: function (oCreateEntry) {
				assert.notEqual(oCreateEntry[TODOITEM.guid], "", "Guid was allocated");
				assert.strictEqual(oCreateEntry[TODOITEM.completed], false, "Item is not completed");
				assert.equal(oCreateEntry[TODOITEM.dueDate].getTime(), dNow.getTime(), "Item has the proper due date");
				done();
			},
			error: handleError(assert, done)
		});
	});

	QUnit.test("Simulates an error", function (assert) {
		var done = assert.async();
		var mKeyFields = {};
		mKeyFields[TODOITEM.guid] = "0MOCKSVR-TODO-MKII-MOCK-000000000000";
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

	QUnit.test("Implements ClearCompleted function import", function (assert) {
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
