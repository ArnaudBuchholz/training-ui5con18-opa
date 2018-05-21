sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/demo/todo/const",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast"

], function(Controller, CONST, JSONModel, Filter, FilterOperator, MessageToast) {
	"use strict";

	return Controller.extend("sap.ui.demo.todo.controller.App", {

		onInit: function() {
			this.aSearchFilters = [];
			this.aTabFilters = [];
			this.getView().setModel(new JSONModel({
				listTitle: "Number of items left",
				filterAll: "All (123)",
				filterActive: "Active (52)",
				filterLate: "Late (2)",
				filterCompleted: "Late (81)"
			}), "labels");
		},

		_refresh: function () {
			this._applyListFilters();
			// call function module to update statistics
		},

		/**
		 * Adds a new todo item to the bottom of the list.
		 */
		addTodo: function() {
			var oView = this.getView(),
				sLabel = oView.byId("addTodoItemInput").getValue(),
				oModel = oView.getModel(),
				oBody = {};

			if (!sLabel) {
				return;
			}

			oBody[CONST.OData.entityProperties.todoItem.title] = sLabel;
			oModel.create("/" + CONST.OData.entityNames.todoItemSet, oBody, {
				success: function (oResultBody) {
					MessageToast.show("SUCCESS");
				}
			});
			this._refresh(); // Done in the same roundtrip
		},

		/**
		 * Removes all completed items from the todo list.
		 */
		clearCompleted: function() {
			// call function to remove completed
			this._refresh();
		},

		/**
		 * Trigger search for specific items. The removal of items is disable as long as the search is used.
		 * @param {sap.ui.base.Event} oEvent Input changed event
		 */
		onSearch: function(oEvent) {
			var oModel = this.getView().getModel();

			// First reset current filters
			this.aSearchFilters = [];

			// add filter for search
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				oModel.setProperty("/itemsRemovable", false);
				var filter = new Filter("title", FilterOperator.Contains, sQuery);
				this.aSearchFilters.push(filter);
			} else {
				oModel.setProperty("/itemsRemovable", true);
			}

			this._applyListFilters();
		},

		onFilter: function(oEvent) {

			// First reset current filters
			this.aTabFilters = [];

			// add filter for search
			var sFilterKey = oEvent.getParameter("key");

			// eslint-disable-line default-case
			switch (sFilterKey) {
				case "active":
					this.aTabFilters.push(new Filter("completed", FilterOperator.EQ, false));
					break;
				case "completed":
					this.aTabFilters.push(new Filter("completed", FilterOperator.EQ, true));
					break;
				case "all":
				default:
					// Don"t use any filter
			}

			this._applyListFilters();
		},

		_applyListFilters: function() {
			var oList = this.byId("todoList");
			var oBinding = oList.getBinding("items");

			oBinding.filter(this.aSearchFilters.concat(this.aTabFilters), "todos");
		}

	});

});
