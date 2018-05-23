sap.ui.define([], function () {
	"use strict";

	return {

		OData: {

			entityNames: {
				todoItemSet: "TodoItemSet"
			},

			entityProperties: {

				todoItem: {
					guid: "Guid",
					title: "Title",
					dueDate: "DueDate",
					completed: "Completed",
					completionDate: "CompletionDate"
				}

			}

		}

	};

});
