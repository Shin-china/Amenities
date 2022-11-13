sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat",
], function (DateFormat, NumberFormat) {
	"use strict";
	return {
		setState: function (v) {
			if (v === "S") {
				return "Success";
			}
			if (v === "E") {
				return "Error";
			}
			return "None";
		},

		setResult: function (v) {
			if (v === "S") {
				return "成功";
			}
			if (v === "E") {
				return "失敗";
			}
			return "";
		},
		
		setRate: function (v) {
			return v + "%";
		},

		// 0000/00/00
		date: function (value) {
			if (value) {
				var oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "yyyy/MM/dd"
				});
				return oDateFormat.format(new Date(value));
			}
			return value;
		},

        date_8: function (value) {
            if(value) {
				var date = new Date(value);
				if (date instanceof Date && isNaN(date.getTime())) {
					return value;
				}
                var oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "yyyyMMdd"
				});
                return oDateFormat.format(new Date(value));
            }
            return value;
        },

        formtDate_8: function (value) {
            if (value) {
				if	(Number(value) === 0) {
					return "";
				}
				var date = new Date(value);
				if (date instanceof Date && isNaN(date.getTime())) {
					return value.substr(0,4) + "/" + value.substr(4,2) + "/" + value.substr(6,2);
				} else {
					return value;
				}
            }
            return value;
        },

		// 00:00:00
		time: function (value) {
			if (value) {
				var timeFormat = DateFormat.getTimeInstance({
					pattern: "HH:mm:ss"
				});
				if (value.ms !== 0) {
					return timeFormat.format(new Date(value.ms),true);
				} 
				return null;
			}
			return value;
		},
		
		dateTime: function (date,time) {
			/*eslint no-unused-expressions: ["error", { "allowTernary": true }]*/
			if (date) {
				var oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "yyyy/MM/dd"
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
			time ? (dateTime = dateTime + " " + time) : (dateTime = dateTime);
			return dateTime;
		},

		odataDate: function (v) {
			if (v) {
				var deliveryDate = new Date(v);
				var oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-dd"
				});
				var deliveryDateString = oDateFormat.format(deliveryDate, false);
				return new Date(deliveryDateString);
			}
			return v;
		},
		
		changeValueState: function(value1,value2) {
			if (value1 === "" && value2) {
				return "Error";
			}
			return "None";
		},
		
		setTable6Visible: function (value) {
			if (value === "4") {
				return false;
			} 
			return true;
		},

		setTable6Enabled: function (value) {
			if (value === "4") {
				return false;
			}
			return true;
		},

		setTable7Visible: function (value) {
			if (value === "5") {
				return false;
			} 
			return true;
		},

		setTable7Enabled: function (value) {
			if (value === "5") {
				return false;
			}
			return true;
		},

		setTable8Visible: function (value) {
			if (value === "9") {
				return false;
			} 
			return true;
		},

		setTable8Enabled: function (value) {
			if (value === "9") {
				return false;
			}
			return true;
		},
		setTable9Visible: function (value) {
			if (value === "4") {
				return false;
			} 
			return true;
		},

		setTable9Enabled: function (value) {
			if (value === "4") {
				return false;
			}
			return true;
		},
		setTable10Visible: function (value) {
			if (value === "4") {
				return false;
			} 
			return true;
		},

		setTable10Enabled: function (value) {
			if (value === "4") {
				return false;
			}
			return true;
		},

		setTable11Visible: function (value) {
			if (value === "16") {
				return false;
			} 
			return true;
		},

		setTable11Enabled: function (value) {
			if (value === "16") {
				return false;
			}
			return true;
		},

        setTable12Enabled: function (value) {
			if (value === "1") {
				return false;
			}
			return true;
		},

		setTable13Visible: function (value) {
			if (value === "6" || value === "7") {
				return false;
			} 
			return true;
		},

		setTable13Enabled: function (value) {
			if (value === "6" || value === "7") {
				return false;
			}
			return true;
		},

		setTable13Enabled1: function (value) {
			if (value === "5") {
				return false;
			}
			return true;
		},


		toBoolean: function (value) {
			if (value) {
				return value === "" ? false : true;
			}
            return false
		},
		
		//如果字符全部为0 则显示空白
		allZeroToBlank: function (value) {
			if (value) {
				if	(Number(value) === 0) {
					return "";
				}
				return value;
			}
		},
		
		//金额千分位
		formatFloat: function (value) {
			var sAmount	= (value) ? value.toString() : "0";
			return NumberFormat.getFloatInstance().format(sAmount);
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
		
		accSub : function(arg1, arg2) {
            if (!Number(arg1)) {
                arg1 = 0;
            }
            if (!Number(arg2)) {
                arg2 = 0;
            }
			var r1, r2, m, n,
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
			m = Math.pow(10, Math.max(r1, r2)); //较大数的幂
			n = (r1 >= r2) ? r1 : r2;
			return (((arg1 * m - arg2 * m) / m).toFixed(n)).toString();
		},
		
		accMul : function(arg1, arg2) {
            if (!Number(arg1)) {
                arg1 = 0;
            }
            if (!Number(arg2)) {
                arg2 = 0;
            }
			var m = 0, s1 = Number(arg1).toString(), s2 = Number(arg2).toString();
			try {
				m += s1.split(".")[1].length;
			} catch(e) {}
			try {
				m += s2.split(".")[1].length;
			} catch(e) {}
			return (Number(s1.replace(".","")) * Number(s2.replace(".","")) / Math.pow(10,m)).toString();
		},
		
		accDiv : function (arg1, arg2) {
            if (!Number(arg1)) {
                arg1 = 0;
            }
            if (!Number(arg2)) {
                arg2 = 0;
            }
			var t1 = 0, t2 = 0, r1, r2,
				s1 = Number(arg1).toString(), 
				s2 = Number(arg2).toString();
			try {
				t1 = s1.split(".")[1].length;
			} catch(e) {}
			try {
				t2 = s2.split(".")[1].length;
			} catch(e) {}
			r1 = Number(s1.replace(".",""));
			r2 = Number(s2.replace(".",""));
			return r2 === 0 ? "0" : ((r1 / r2).mul(Math.pow(10, t2 - t1))).toString();
		},
        
	};
});