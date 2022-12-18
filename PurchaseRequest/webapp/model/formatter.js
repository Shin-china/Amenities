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
		},

		dateTime: function (date,time) {
			/*eslint no-unused-expressions: ["error", { "allowTernary": true }]*/
			if (date) {
				var oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-dd"
				});
				date = oDateFormat.format(new Date(date));
			}
			if (time) {
				var timeFormat = DateFormat.getTimeInstance({
					pattern: "HH:mm:ss"
				});
				if (time.ms !== 0) {
					time = timeFormat.format(new Date(time.ms),true);
				} else {
					time = "";
				}
			}
			var dateTime;
			date ? (dateTime = date) : (dateTime = dateTime);
			time ? (dateTime = dateTime + "T" + time) : (dateTime = dateTime);
			return dateTime;
		},
		approvalStatus: function (value) {
			switch (value) {
				case "I":
					return "Information";
				case "P":
					return "Success";
				case "R":
					return "Error";
				default:
					return "None";
			}
		},
		approvalIcon: function (value) {
			switch (value) {
				case "I":
					return "sap-icon://information";
				case "P":
					return "sap-icon://sys-enter-2";
				case "R":
					return "sap-icon://error";
				default:
					return "";
			}
		},
		approvalText: function (value) {
			switch (value) {
				case "I":
					return "申請";
				case "P":
					return "承認済み";
				case "R":
					return "承認拒否";
				case "Q":
					return "否決";
				default:
					return "";
			}
		},

		accAdd : function(arg1, arg2) {
            if (!Number(arg1)) {
                arg1 = 0;
            }
            if (!Number(arg2)) {
                arg2 = 0;
            }
			var r1, r2, m, c,
				s1 = Number(arg1).toString(), 
				s2 = Number(arg2).toString();
			try {
				r1 = s1.split(".")[1].length;
			} catch (e) {
				r1 = 0;
			}
			try {
				r2 = s2.split(".")[1].length;
			} catch (e) {
				r2 = 0;
			}
			c = Math.abs(r1 - r2); //位数差的绝对值
			m = Math.pow(10, Math.max(r1, r2)); //较大数的幂
			if (c > 0) { //位数相差
				var cm = Math.pow(10, c);
				if (r1 > r2) {     
					arg1 = Number(s1.replace(".", "")); //转化成数字
					arg2 = Number(s2.replace(".", "")) * cm;
				} else {
					arg1 = Number(s1.replace(".", "")) * cm;
					arg2 = Number(s2.replace(".", ""));
				}
			} else { //位数相等
				arg1 = Number(s1.replace(".", ""));
				arg2 = Number(s2.replace(".", ""));
			}
			return ((arg1 + arg2) / m).toString();
		},


	};
});