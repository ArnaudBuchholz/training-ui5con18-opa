sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/demo/todo/const",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/SegmentedButtonItem",
	"sap/ui/core/format/DateFormat",
	"sap/m/MessageBox"

], function(Controller, CONST, JSONModel, Filter, FilterOperator, MessageToast, SegmentedButtonItem, DateFormat, MessageBox) {
	"use strict";

	var TODOITEM = CONST.OData.entityProperties.todoItem,
		_aFilters = [{
			key: "all",
			get: function() {
				return [];
			}
		}, {
			key: "active",
			get: function() {
				return [new Filter(TODOITEM.completed, FilterOperator.EQ, false)];
			}
		}, {
			key: "late",
			get: function() {
				return [new Filter(TODOITEM.dueDate, FilterOperator.LE, new Date()),
						new Filter(TODOITEM.completed, FilterOperator.EQ, false)];
			}
		}, {
			key: "completed",
			get: function() {
				return [new Filter(TODOITEM.completed, FilterOperator.EQ, true)];
			}
		}],
		_mFilters = {}, // Map of above filters indexed by key
		_oDateFormatter = DateFormat.getDateTimeInstance();

	return Controller.extend("sap.ui.demo.todo.controller.App", {

		aSearchFilters: [],
		aTabFilters: [],

		onInit: function() {
			var mCounts = {},
				oSegmentedButton = this.getView().byId("filters");
			_aFilters.forEach(function(oFilter) {
				var sKey = oFilter.key;
				mCounts[sKey] = 0;
				_mFilters[sKey] = oFilter;
				oSegmentedButton.addItem(new SegmentedButtonItem({
					id: "filterButton-" + sKey,
					text: "{ parts: [ 'i18n>filterButton." + sKey + "', 'counts>/" + sKey + "' ], formatter: 'jQuery.sap.formatMessage' }",
					key: sKey
				}));
			});
			this.getView().setModel(new JSONModel(mCounts), "counts");
			var oI18nResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			this._i18n = oI18nResourceBundle.getText.bind(oI18nResourceBundle);
			this.getView().getModel().read("/" + CONST.OData.entityNames.appConfigurationSet);
			this._refresh();
		},

		_refresh: function() {
			this._applyListFilters();
			this._refreshCounts();
		},

		_refreshCounts: function() {
			var oCountsModel = this.getView().getModel("counts"),
				oODataModel = this.getView().getModel();
			_aFilters.forEach(function(oFilter) {
				oODataModel.read("/" + CONST.OData.entityNames.todoItemSet, {
					filters: this.aSearchFilters.concat(oFilter.get()),
					urlParameters: {
						$skip: 0,
						$top: 1,
						$inlinecount: "allpages"
					},
					success: function(oResult) {
						oCountsModel.setProperty("/" + oFilter.key, oResult.__count || 0);
					},
					error: function () {
						oCountsModel.setProperty("/" + oFilter.key, "-");
					}
				});
			}, this);
		},

		addTodo: function() {
			var sLabel = this.getView().byId("addTodoItemInput").getValue(),
				oModel = this.getView().getModel(),
				oBody = {},
				dDueDate = new Date();
			dDueDate.setHours(23, 59, 59, 999);
			if (!sLabel) {
				return;
			}
			oBody[TODOITEM.title] = sLabel;
			oBody[TODOITEM.dueDate] = dDueDate;
			oModel.create("/" + CONST.OData.entityNames.todoItemSet, oBody, {
				success: MessageToast.show.bind(MessageToast, this._i18n("message.created")),
				error: function(response) {
					MessageBox.error(response.responseText, {
						title: this._i18n("message.error")
					});
				}.bind(this)
			});
			this._refresh();
		},

		clearCompleted: function() {
			this.getView().getModel().callFunction("/" + CONST.OData.functionImports.clearCompleted.name, {
				method: CONST.OData.functionImports.clearCompleted.method,
				success: function(oResult) {
					var iCount = oResult[CONST.OData.functionImports.clearCompleted.name][CONST.OData.functionImports.clearCompleted.returnType.count],
						sMessageKey = ["none", "one"][iCount] || "many";
					MessageToast.show(this._i18n("message.clearedCompleted." + sMessageKey, [iCount]));
				}.bind(this)
			});
			this._refresh();
		},

		onSearch: function(oEvent) {
			delete this.aSearchFilters;
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				this.aSearchFilters = [new Filter(TODOITEM.title, FilterOperator.Contains, sQuery)];
			}
			this._refresh();
		},

		onFilter: function(oEvent) {
			delete this.aTabFilters;
			var sFilterKey = oEvent.getParameter("key");
			this.aTabFilters = _mFilters[sFilterKey].get();
			this._applyListFilters();
		},

		_applyListFilters: function() {
			this.byId("todoList").getBinding("items").filter(this.aSearchFilters.concat(this.aTabFilters), "todos");
		},

		onItemPress: function(oEvent) {
			var oListItem = oEvent.getSource(),
				oDialog = this.getView().byId("todoItem");
			oDialog.setBindingContext(oListItem.getBindingContext());
			oDialog.setVisible(true);
			oDialog.open();
		},

		_update: function(sBindingPath, oBody) {
			var that = this,
				oModel = this.getView().getModel();
			return new Promise(function(resolve) {
				oModel.update(sBindingPath, oBody, {
					success: resolve,
					error: function(response) {
						MessageBox.error(response.responseText, {
							title: that._i18n("message.error")
						});
						oModel.resetChanges([sBindingPath]);
						resolve();
					}
				});
			});
		},

		_closeDialog: function () {
			var oDialog = this.getView().byId("todoItem");
			oDialog.setVisible(false);
			oDialog.setBusy(false);
			oDialog.close();
		},

		onFormOK: function(oEvent) {
			var oModel = this.getView().getModel(),
				oDialog = this.getView().byId("todoItem"),
				sBindingPath = oDialog.getBindingContext().getPath(),
				oPromise;
			if (oModel.hasPendingChanges()) {
				oDialog.setBusy(true);
				oPromise = this._update(sBindingPath, oModel.getObject(sBindingPath))
			} else {
				oPromise = Promise.resolve();
			}
			oPromise.then(this._closeDialog.bind(this))
		},

		onFormCancel: function(oEvent) {
			this._closeDialog();
		},

		onSelectionChange: function(oEvent) {
			var oListItem = oEvent.getParameter("listItems")[0], // Expect only one item to be changed at a time
				oBody = {};
			oListItem.setBusy(true);
			oBody[TODOITEM.completed] = oListItem.getSelected();
			this._update(oListItem.getBindingContext().getPath(), oBody).then(function() {
				oListItem.setBusy(false);
			});
			this._refreshCounts();
		},

		getIcon: function(oTodoItem) {
			var dCompletionDate = oTodoItem[TODOITEM.completionDate],
				dDueDate = oTodoItem[TODOITEM.dueDate],
				dRefDate;
			if (oTodoItem[TODOITEM.completed]) {
				dRefDate = dCompletionDate;
			} else {
				dRefDate = new Date();
			}
			if (dRefDate > dDueDate) {
				return "sap-icon://lateness";
			}
			return "";
		},

		getIconSafe: function(oTodoItem) {
			if (oTodoItem) {
				return this.getIcon(oTodoItem);
			}
			return "";
		},

		getIntro: function(oTodoItem) {
			var dCompletionDate = oTodoItem[TODOITEM.completionDate],
				dDueDate = oTodoItem[TODOITEM.dueDate];
			if (oTodoItem[TODOITEM.completed] && dCompletionDate) {
				return this._i18n("todoItem.intro.completedOn", [_oDateFormatter.format(dCompletionDate)]);

			} else if (new Date() > dDueDate) {
				var iNumberOfDaysLate = Math.ceil((new Date() - dDueDate) / CONST.msPerDay);
				if (1 === iNumberOfDaysLate) {
					return this._i18n("todoItem.intro.lateByYesterday");
				}
				return this._i18n("todoItem.intro.lateDays", [iNumberOfDaysLate]);
			}
			return "";
		}

	});

});
