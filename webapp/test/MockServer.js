sap.ui.define([
	"sap/ui/core/util/MockServer",
	"sap/ui/demo/todo/const"

], function(MockServer, CONST) {
	"use strict";

	var STOP_PROCRASTINATING_GUID = "0MOCKSVR-TODO-MKII-MOCK-00000000",
		_lastTodoItemId = 0,
		_oMockServer;

	function _getJSONDateReplacer(dValue) {
		return "/Date(" + dValue.getTime() + ")/";
	}

	function _getNewItemGuid() {
		var sNewId = (++_lastTodoItemId).toString();
		return "0MOCKSVR-TODO-MKII-DYNK-00000000".substr(0, 32 - sNewId.length) + sNewId;
	}

	function _setIfNotSet(oTodoItemSet, sPropertyName, vDefaultValue) {
		if (!oTodoItemSet.hasOwnProperty(sPropertyName)) {
			oTodoItemSet[sPropertyName] = vDefaultValue;
		}
	}

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

			} else if (oParameters.get("randomize") === "true") {
				// Generate random items
				var aTodoItemSet = _oMockServer.getEntitySetData(CONST.OData.entityNames.todoItemSet),
					sDateMax = "/Date(" + new Date(2099, 11, 31).getTime() + ")/",
					sDateNow = "/Date(" + (new Date().getTime() - 60000) + ")/";
				for (var idx = 0; idx < 100; ++idx) {
					var oNewTodoItemSet = {},
						sGuid = _getNewItemGuid();
					oNewTodoItemSet[CONST.OData.entityProperties.todoItem.guid] = sGuid;
					oNewTodoItemSet[CONST.OData.entityProperties.todoItem.title] = "Random stuff " + idx;
					oNewTodoItemSet.__metadata = {
						id: "/odata/TODO_SRV/TodoItemSet(guid'" + sGuid + "')",
						uri: "/odata/TODO_SRV/TodoItemSet(guid'" + sGuid + "')",
						type: "TODO_SRV.TodoItem"
					}
					if (idx % 2) {
						oNewTodoItemSet[CONST.OData.entityProperties.todoItem.completionDate] = sDateNow;
						oNewTodoItemSet[CONST.OData.entityProperties.todoItem.completed] = true;
					}
					if (idx % 5 === 0) {
						oNewTodoItemSet[CONST.OData.entityProperties.todoItem.dueDate] = sDateNow;
					}
					aTodoItemSet.push(oNewTodoItemSet);
				}
				aTodoItemSet.forEach(function(oTodoItemSet) {
					_setIfNotSet(oTodoItemSet, CONST.OData.entityProperties.todoItem.completionDate, null);
					_setIfNotSet(oTodoItemSet, CONST.OData.entityProperties.todoItem.completed, false);
					_setIfNotSet(oTodoItemSet, CONST.OData.entityProperties.todoItem.dueDate, sDateMax);
				});
				_oMockServer.setEntitySetData(CONST.OData.entityNames.todoItemSet, aTodoItemSet);
			}

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
						oBody[CONST.OData.entityProperties.todoItem.completionDate] = _getJSONDateReplacer(new Date());
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
						aClearedTodoItemSet = aInitialTodoItemSet.filter(function(oTodoItem) {
							return !oTodoItem[CONST.OData.entityProperties.todoItem.completed];
						}),
						oReturnType = {},
						oResult = {};
					_oMockServer.setEntitySetData(CONST.OData.entityNames.todoItemSet, aClearedTodoItemSet);
					oReturnType[CONST.OData.functionImports.clearCompleted.returnType.count] = aInitialTodoItemSet.length - aClearedTodoItemSet.length;
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
