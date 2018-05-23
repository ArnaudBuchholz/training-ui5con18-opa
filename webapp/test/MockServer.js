sap.ui.define([
	"sap/ui/core/util/MockServer",
	"sap/ui/demo/todo/const"

], function (MockServer, CONST) {
	"use strict";

	var _lastTodoItemId = 0;

	function _getNewItemGuid() {
		var sNewId = (++_lastTodoItemId).toString();
		return 	"0MOCKSVR-TODO-MKII-DYNK-00000000".substr(0, 32 - sNewId.length) + sNewId;
	}

	return {

		init: function() {
			var oUriParameters = jQuery.sap.getUriParameters(),
				sJsonFilesUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/model"),
				sManifestUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/manifest", ".json"),
				oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
				oMainDataSource = oManifest["sap.app"].dataSources.mainService,
				// ensure there is a trailing slash
				sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/",
				sMetadataUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/model/metadata", ".xml"),
				oMockServer;

			// init the inner mockserver
			oMockServer = new MockServer({
				rootUri: sMockServerUrl
			});

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oUriParameters.get("serverDelay") || 1000)
			});

			// load local mock data
			oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sJsonFilesUrl,
			});

			if (oUriParameters.get("sap-ui-debug") === "true") {
				// Trace requests
				Object.keys(MockServer.HTTPMETHOD).forEach(function(sMethodName) {
					var sMethod = MockServer.HTTPMETHOD[sMethodName];
					oMockServer.attachBefore(sMethod, function(oEvent) {
						var oXhr = oEvent.getParameters().oXhr;
						console.log("MockServer::before", sMethod, oXhr.url, oXhr);
					});
					oMockServer.attachAfter(sMethod, function(oEvent) {
						var oXhr = oEvent.getParameters().oXhr;
						console.log("MockServer::after", sMethod, oXhr.url, oXhr);
					});
				});
			}

			// Generate random items
			var aTodoItemSet = oMockServer.getEntitySetData(CONST.OData.entityNames.todoItemSet),
				sDateMax = "/Date(" + new Date(2099,11,31).getTime() + ")/",
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
			// Fill missing properties
			function _setIfNotSet (oTodoItemSet, sPropertyName, vDefaultValue) {
				if (!oTodoItemSet.hasOwnProperty(sPropertyName)) {
					oTodoItemSet[sPropertyName] = vDefaultValue;
				}
			}
			aTodoItemSet.forEach(function (oTodoItemSet) {
				_setIfNotSet(oTodoItemSet, CONST.OData.entityProperties.todoItem.completionDate, null);
				_setIfNotSet(oTodoItemSet, CONST.OData.entityProperties.todoItem.completed, false);
				_setIfNotSet(oTodoItemSet, CONST.OData.entityProperties.todoItem.dueDate, sDateMax);
			});

			oMockServer.setEntitySetData(CONST.OData.entityNames.todoItemSet, aTodoItemSet);

			var aRequests = oMockServer.getRequests();

			aRequests.push({
				method: CONST.OData.functionImports.clearCompleted.method,
				path: CONST.OData.functionImports.clearCompleted.name,
				response: function (oXhr) {
					var aTodoItemSet = oMockServer.getEntitySetData(CONST.OData.entityNames.todoItemSet);
					oMockServer.setEntitySetData(CONST.OData.entityNames.todoItemSet, aTodoItemSet.filter(function (oTodoItem) {
						return !oTodoItem[CONST.OData.entityProperties.todoItem.completed];
					}));
					oXhr.respond(200);
					return true;
				}
			});

			oMockServer.setRequests(aRequests);

			oMockServer.start();
		},

		/**
		 * @public returns the mockserver of the app, should be used in integration tests
		 * @returns {sap.ui.core.util.MockServer} the mockserver instance
		 */
		getMockServer: function() {
			return oMockServer;
		}
	};

});
