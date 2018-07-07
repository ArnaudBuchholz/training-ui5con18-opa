sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/MockServer"
], function(Opa5, MockServer) {
	"use strict";

	var bInOpaPage = location.toString().indexOf("opaTests.qunit.html") !== -1 &&
		jQuery.sap.getUriParameters().get("component") !== "true";

	function _wrapParameters(oParameters) {
		return {
			get: function(name) {
				return (oParameters[name] || "").toString();
			}
		};
	}

	return Opa5.extend("sap.ui.demo.todo.test.integration.pages.Common", {

		iStartTheApp: function(oParameters) {
			if (bInOpaPage) {
				var aUrlParams = Object.keys(oParameters || {}).map(function(sParameterName) {
					return sParameterName + "=" + encodeURIComponent(oParameters[sParameterName]);
				});
				aUrlParams.push(location.search.toString().substr(1)); // Also forward OPA parameters
				this.iStartMyAppInAFrame("../../index.html?" + aUrlParams.join("&"));

			} else {
				MockServer.init(_wrapParameters(oParameters || {}));
				this.iStartMyUIComponent({
					componentConfig: {
						name: "sap.ui.demo.todo",
						async: true
					}
				});
			}
		},

		iTakeAScreenshot: function (sScreenshotID) {
			return this.waitFor({
				success: function () {
					var generated = false,
						oWindow,
						oAppRoot = document.querySelector(".sapUiComponentContainer"),
						oPromise;
					if (oAppRoot) {
						oWindow = window;
					} else {
						oWindow = sap.ui.test.Opa5.getWindow();
						oAppRoot = oWindow.document.body;
					}
					if (oWindow.html2canvas) {
						oPromise = oWindow.html2canvas(oAppRoot);
					} else {
						oPromise = Promise.reject("html2canvas not found");
					}
					oPromise.then(function (canvas) {
						var sDataUrl = canvas.toDataURL('image/png'),
							sKey = sScreenshotID + "-" + (new Date()).getTime();
						QUnit.push(
							/*result*/ true,
							/*actual*/ "",
							/*expected*/ "",
							/*message*/ sKey
						);
						var qUnitMessage = $("span.test-message:contains(" + sKey + ")");
						qUnitMessage.html("<img title=\"" + sScreenshotID + "\" style=\"max-height: 40%; max-width: 40%\" src=\"" + sDataUrl + "\">");
						generated = true;
					}, function (reason) {
						QUnit.push(
							/*result*/ false,
							/*actual*/ reason.toString(),
							/*expected*/ "",
							/*message*/ "Unable to take a screenshot"
						);
						generated = true;
					});
					return this.waitFor({
						check: function () {
							return generated;
						},
						success: function () {
						}
					})
				}
			});
		},

		iTeardownTheApp: function() {
			if (bInOpaPage) {
				this.iTeardownMyAppFrame();
			} else {
				this.iTeardownMyUIComponent();
			}
		}

	});

});
