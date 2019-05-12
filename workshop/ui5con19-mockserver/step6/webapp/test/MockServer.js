sap.ui.define([
	"sap/ui/core/util/MockServer",
	"sap/ui/demo/todo/const",
	"./newItem"

], function(MockServer, CONST, getNewItem) {
	"use strict";

	var STOP_PROCRASTINATING_GUID = "0MOCKSVR-TODO-MKII-MOCK-00000000",
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

			// Generate random items
			var aTodoItemSet = _oMockServer.getEntitySetData(CONST.OData.entityNames.todoItemSet),
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
					aTodoItemSet.push(getNewItem(sItemTitle, dtItemDueDate, dtNowMinusOneHour));
				} else {
					aTodoItemSet.push(getNewItem(sItemTitle, dtItemDueDate));
				}
			}
			_oMockServer.setEntitySetData(CONST.OData.entityNames.todoItemSet, aTodoItemSet);

			var aRequests = _oMockServer.getRequests();

			// Creation of a todo list item
			aRequests.push({
				method: "POST",
				path: CONST.OData.entityNames.todoItemSet,
				response: function(oXhr) {
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
