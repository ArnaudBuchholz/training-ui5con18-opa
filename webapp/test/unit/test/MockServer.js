sap.ui.define([
  "sap/ui/model/odata/v2/ODataModel"
], function(ODataModel) {
	"use strict";

	QUnit.module("MockServer", {
		beforeEach: function() {
      this.oModel = new ODataModel({
        "http://localhost:8080/odata/TODO_SRV/"
      });
		},
		afterEach: function() {
		}
	});

  QUnit.test("Creating a new item", function(assert) {
    var done = assert.async();
    this.oModel.createAsync('/TodoItemSet', {
      Title: 'New item',
      DueDate: `/Date(${new Date().getTime()})/`
    })
  });


});
