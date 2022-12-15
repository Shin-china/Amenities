sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat"
], function(DateFormat,NumberFormat) {
	"use strict";

	function formatNum(n) {
		var num = Number(n);
		var re = /\d{1,3}(?=(\d{3})+$)/g;
		var n1 = num.toString().replace(/^(\d+)((\.\d+)?)$/, function(s, s1, s2) {
			return s1.replace(re, "$&,") + s2;
		});
		return n1;
	}

	return {
		convertDate: function(sDate) {
			if (sDate) {
				var oDateFormat = DateFormat.getDateTimeInstance({
					// pattern: "yyyy/MM/dd"
					pattern: "yyyy-MM-dd"
				});
				return oDateFormat.format(new Date(sDate));
			} else {
				return sDate;
			}
		},
		formatNumber: function(n) {
			/*			var num = Number(n);
						var re = /\d{1,3}(?=(\d{3})+$)/g;
						var n1 = num.toString().replace(/^(\d+)((\.\d+)?)$/, function (s, s1, s2) {
							return s1.replace(re, "$&,") + s2;
						});
						return n1;*/
			return formatNum(n);
		},
		getdiv: function(p1, p2) {
			if (p2 === 0 || p2 === 1) {
				var num = Number(p1);
				//return num;
				return formatNum(num);
			} else {
				var num1 = Number(p1);
				var num2 = Number(p2);
				var num3 = num1 / num2;
				num3 = num3.toFixed(2);
				//return this.formatNumber(num3);
				return formatNum(num3);
			}
		},
		concatenate: function(p1, p2) {
			if (p1 !== "") {
				return p2 + "/" + p1;
			} else {
				return p2;
			}
		},
		amountFormat: function(value) {
			var sAmount = (value) ? value.toString() : "0";
			return NumberFormat.getFloatInstance().format(sAmount);
		},
		clearCommaToNumber: function(value) {
			var s = (value + "").replace(/[,]/g, "");
			return parseFloat(s);
            //return Number(s).toFixed(n);
		},
		devcodesplit: function(sDevCode) {
			if (sDevCode) {
				var index = sDevCode.lastIndexOf("\_");
				if (index === -1) {
					sDevCode = "";
				} else {
					sDevCode = sDevCode.substring(index + 1, sDevCode.length);
				}
				return sDevCode;
			}
		}

	};
});