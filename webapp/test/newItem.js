sap.ui.define([
	"sap/ui/demo/todo/const"

], function(CONST) {
	"use strict";

	var _lastTodoItemId = 0;

	return function (sTitle, dtDue, dtCompletion) {
		var oItem = {},
			sGuid = "0MOCKSVR-TODO-MKII-DYNK-" + (++_lastTodoItemId).toString().padStart(12,0);
		oItem[CONST.OData.entityProperties.todoItem.guid] = sGuid;
		oItem.__metadata = {
			uri: "/odata/TODO_SRV/TodoItemSet(guid'" + sGuid + "')",
			type: "TODO_SRV.TodoItem"
		};
		oItem[CONST.OData.entityProperties.todoItem.title] = sTitle;
		oItem[CONST.OData.entityProperties.todoItem.dueDate] = "/Date(" + dtDue.getTime() + ")/";
		if (dtCompletion) {
			oItem[CONST.OData.entityProperties.todoItem.completionDate] = "/Date(" + dtCompletion.getTime() + ")/";
			oItem[CONST.OData.entityProperties.todoItem.completed] = true;
		} else {
			oItem[CONST.OData.entityProperties.todoItem.completionDate] = null;
			oItem[CONST.OData.entityProperties.todoItem.completed] = false;
		}
		return oItem;
	};

});
