/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comshinpstore/pstore/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
