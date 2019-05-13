var aTests = [
	"sap/ui/demo/todo/test/unit/controller/App.controller"
];
if (typeof window.__karma__ === "undefined") {
	aTests.push("sap/ui/demo/todo/test/unit/test/MockServer")
}
sap.ui.define(aTests);
