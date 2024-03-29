sap.ui.define([
	"sap/ui/core/util/MockServer",
	"sap/ui/demo/todo/const",
	"./newItem"

], function(MockServer, CONST, getNewItem) {
	"use strict";

	var STOP_PROCRASTINATING_GUID = "0MOCKSVR-TODO-MKII-MOCK-000000000000",
		_oMockServer;

	return {

		init: function(oParameters) {
			var sJsonFilesUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/model"),
				sManifestUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/manifest", ".json"),
				oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
				oMainDataSource = oManifest["sap.app"].dataSources.mainService,
				// ensure there is a trailing slash
				sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/",
				sMetadataUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/model/metadata", ".xml");

			// init the inner mockserver
			_oMockServer = new MockServer({
				rootUri: sMockServerUrl
			});

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oParameters.get("serverDelay") || 0)
			});

			// load local mock data
			_oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sJsonFilesUrl
			});

			if (oParameters.get("sap-ui-debug") === "true") {
				// Trace requests
				Object.keys(MockServer.HTTPMETHOD).forEach(function(sMethodName) {
					var sMethod = MockServer.HTTPMETHOD[sMethodName];
					_oMockServer.attachBefore(sMethod, function(oEvent) {
						var oXhr = oEvent.getParameters().oXhr;
						console.log("MockServer::before", sMethod, oXhr.url, oXhr);
					});
					_oMockServer.attachAfter(sMethod, function(oEvent) {
						var oXhr = oEvent.getParameters().oXhr;
						console.log("MockServer::after", sMethod, oXhr.url, oXhr);
					});
				});
			}

			if (oParameters.get("read-only") === "true") {
				// Set all AppConfiguration options to false
				var aAppConfigurationSet = _oMockServer.getEntitySetData(CONST.OData.entityNames.appConfigurationSet);
				aAppConfigurationSet.forEach(function(oAppConfigurationSet) {
					oAppConfigurationSet[CONST.OData.entityProperties.appConfiguration.enable] = false;
				});
				_oMockServer.setEntitySetData(CONST.OData.entityNames.appConfigurationSet, aAppConfigurationSet);
			}

			if (oParameters.get("empty") === "true") {
				_oMockServer.setEntitySetData(CONST.OData.entityNames.todoItemSet, []);

			} else if (oParameters.get("randomize")) {
				// Generate random items
				var aTodoItemRandomSet = _oMockServer.getEntitySetData(CONST.OData.entityNames.todoItemSet),
					dtMax = new Date(2099, 11, 31),
					dtNow = new Date(),
					dtNowMinusOneHour = new Date(dtNow - 60000);
				for (var idx = 0; idx < 100; ++idx) {
					var sItemTitle = "Random stuff " + idx;
					var dtItemDueDate;
					if (idx % 5 === 0) {
						dtItemDueDate = dtNowMinusOneHour;
					} else {
						dtItemDueDate = dtMax;
					}
					if (idx % 2) {
						aTodoItemRandomSet.push(getNewItem(sItemTitle, dtItemDueDate, dtNowMinusOneHour));
					} else {
						aTodoItemRandomSet.push(getNewItem(sItemTitle, dtItemDueDate));
					}
				}
				_oMockServer.setEntitySetData(CONST.OData.entityNames.todoItemSet, aTodoItemRandomSet);
			}
			// Adjust dates to work whenever the tests are run
			var DAY_IN_MS = 24 * 60 * 60 * 1000;
			var aTodoItemSet = _oMockServer.getEntitySetData(CONST.OData.entityNames.todoItemSet);
			aTodoItemSet.forEach(function (oTodoItemSet) {
				var $due = oTodoItemSet.$due
				if ($due) {
					oTodoItemSet[CONST.OData.entityProperties.todoItem.dueDate] = "/Date(" + (Date.now() + $due * DAY_IN_MS) + ")/";
				}
				var $completed = oTodoItemSet.$completed
				if ($completed) {
					oTodoItemSet[CONST.OData.entityProperties.todoItem.completionDate] = "/Date(" + (Date.now() + $completed * DAY_IN_MS) + ")/";
				}
			});
			_oMockServer.setEntitySetData(CONST.OData.entityNames.todoItemSet, aTodoItemSet);

			var aRequests = _oMockServer.getRequests();

			// Creation of a todo list item
			aRequests.push({
				method: "POST",
				path: CONST.OData.entityNames.todoItemSet,
				response: function(oXhr) {
					if (oParameters.get("error") === "new") {
						oXhr.respond(400, {
							"Content-Type": "text/plain;charset=utf-8"
						}, "Creation failed");
						return true; // Skip default processing
					}
					// Initialize some fields
					var oBody = JSON.parse(oXhr.requestBody);
					oBody[CONST.OData.entityProperties.todoItem.completed] = false;
					oBody[CONST.OData.entityProperties.todoItem.completionDate] = null;
					oXhr.requestBody = JSON.stringify(oBody);
					return false; // Keep default processing
				}
			});

			// Update of a todo list item
			aRequests.push({
				method: "MERGE",
				path: CONST.OData.entityNames.todoItemSet + "\\(guid'([^']+)'\\)",
				response: function(oXhr, sTodoItemGuid) {
					// Inject or remove completion date/time
					var oBody = JSON.parse(oXhr.requestBody);
					if (sTodoItemGuid === STOP_PROCRASTINATING_GUID) {
						oXhr.respond(400, {
							"Content-Type": "text/plain;charset=utf-8"
						}, "I'll start tomorrow !");
						return true; // Skip default processing
					}
					if (oBody[CONST.OData.entityProperties.todoItem.completed]) {
						oBody[CONST.OData.entityProperties.todoItem.completionDate] = "/Date(" + new Date().getTime() + ")/";
					} else {
						oBody[CONST.OData.entityProperties.todoItem.completionDate] = null;
					}
					oXhr.requestBody = JSON.stringify(oBody);
					return false; // Keep default processing
				}
			});

			// Getting a todo list item with filter
			aRequests.push({
				method: "GET",
				path: CONST.OData.entityNames.todoItemSet + "\\?.*\\$filter=.*",
				response: function(oXhr) {
					if (oParameters.get("error") === "filter") {
						oXhr.respond(400, {
							"Content-Type": "text/plain;charset=utf-8"
						}, "Get failed");
						return true; // Skip default processing
					}
					return false; // Keep default processing
				}
			});

			// Clear Completed
			aRequests.push({
				method: CONST.OData.functionImports.clearCompleted.method,
				path: CONST.OData.functionImports.clearCompleted.name,
				response: function(oXhr) {
					var aInitialTodoItemSet = _oMockServer.getEntitySetData(CONST.OData.entityNames.todoItemSet),
						aNotCompletedTodoItemSet = aInitialTodoItemSet.filter(function(oTodoItem) {
							return !oTodoItem[CONST.OData.entityProperties.todoItem.completed];
						}),
						oReturnType = {},
						oResult = {};
					_oMockServer.setEntitySetData(CONST.OData.entityNames.todoItemSet, aNotCompletedTodoItemSet);
					oReturnType[CONST.OData.functionImports.clearCompleted.returnType.count] = aInitialTodoItemSet.length - aNotCompletedTodoItemSet.length;
					oResult[CONST.OData.functionImports.clearCompleted.name] = oReturnType;
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify({
						d: oResult
					}));
					return true; // Skip default processing
				}
			});

			_oMockServer.setRequests(aRequests);

			_oMockServer.start();
		},

		shutdown: function() {
			_oMockServer.stop();
			_oMockServer = null;
		},

		getMockServer: function() {
			return _oMockServer;
		}

	};

});
