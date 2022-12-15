sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat",
], function (DateFormat, NumberFormat) {
	"use strict";
	return {
		objectActivit: function (value) {
			if (!value) {
				return value;
			} else if (value == "未採番") {
				return false;
			} else {
				return true;
			}
		}
        
	};
});