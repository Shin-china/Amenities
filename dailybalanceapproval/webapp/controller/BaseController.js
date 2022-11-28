sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
], function (Controller, History, UIComponent, formatter, Filter, Sorter) {
	"use strict";
	var mValueHelp = new Map([
		["Company",{
			helpModel:"CompanyVH",
			headerTexts:["KAISHA_CD","KAISHA_NM"],
			items:["Key1","Value1"]
		}],
		["Shop",{
			helpModel:"ShopVH",
            
			headerTexts:["TENPO_CD","TENPO_NM","KAISHA_CD"],
			items:["Key1","Value1","Key2"]
		}],
		["Account",{
			helpModel:"AccountVH",
			headerTexts:["Account","AccountDesc","KAISHA_CD"],
			items:["Key1","Value1","Key2"]
		}],
		["Tax",{
			helpModel:"TaxVH",
			headerTexts:["Tax","TaxDesc"],
			items:["Key1","Value1"]
		}],
        ["Profit",{
			helpModel:"ProfitVH",
			headerTexts:["prctr","ltext","datbi"],
			items:["Key1","Value1", "Key3"]
		}],
        ["Cost",{
			helpModel:"CostVH",
			headerTexts:["kostl","ltext","datbi"],
			items:["Key1","Value1", "Key3"]
		}],
        ["FI0006",{
			helpModel:"FI0006",
			headerTexts:["Account","AccountDesc"],
			items:["Value2","Value3"]
		}]
	]);
	return Controller.extend("FICO.dailybalanceapproval.controller.BaseController", {

		formatter: formatter,

		onInit: function () {
			
		},

		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		onNavBack: function () {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("RouteMain", {}, true /*no history*/);
			}
		},

		onValueHelp: function (oEvent, propertyKey) {
			var oView = this.getView();
			this.oInput = oEvent.getSource();
			var oBindingModel = oEvent.getSource().getBindingContext("local");
			var sRowPath;
			var sProperty = oEvent.getSource().getBindingInfo("value").binding.getPath();
			if (oBindingModel) {
				sRowPath = oBindingModel.getPath() + "/" + sProperty;
			} else {
				sRowPath = sProperty;
			}

			//加载fragment 返回一个promise
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = this.loadFragment({
					id: oView.getId(),
					name: "FICO.dailybalanceabr.view.fragment.ValueHelpDialog",
					controller: this
				}).then(function (oValueHelpDialog) {
					//将dialgo添加到view的addDependent聚合中
					//这样就能使用view绑定的model controller？
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				}.bind(this));
			}

			//打开Dialog
			this._pValueHelpDialog.then(function (oValueHelpDialog) {
				//设置dialog的显示内容
				//dialog中使用TableSelectDialog控件

				//获取用来设置table内容的参数
				var valueHelpParameters = mValueHelp.get(propertyKey);
				if (!valueHelpParameters) {
					return;
				}

				//解除confirm事件的绑定，因为会多次点击，如果不解除绑定则会绑定多次，会多次进入事件，且除第一次之外，其他没有传入参数
				oValueHelpDialog.detachConfirm(this._handleValueHelpClose);
				//绑定Dialog列表的confirm事件
				//绑定时传入所在行的绑定路径 用以确定选择了哪行 sRowPath
				oValueHelpDialog.attachConfirm(
					{
						path: sRowPath,
						object: this,
						valueHelpParameters: valueHelpParameters
					},
					this._handleValueHelpClose
				);

				//解除search事件的绑定
				oValueHelpDialog.detachSearch(this._handleValueHelpSearch);
				//绑定Dialog列表的search事件 同时传入filter需要的key值
				oValueHelpDialog.attachSearch({ valueHelpParameters: valueHelpParameters }, this._handleValueHelpSearch);

				//设置表头的数组
				var aHeaderTexts = valueHelpParameters.headerTexts;
				//设置标题
				oValueHelpDialog.setTitle(this._ResourceBundle.getText(aHeaderTexts[0]));
				//设置dialog宽度
				var iContentWidth = (aHeaderTexts.length - 1) * 15 + 10;
				oValueHelpDialog.setContentWidth(iContentWidth + "rem");
				//设置列字段的数组
				var aItems = valueHelpParameters.items;
				//数据的绑定路径
				var sBindingPath = "local>/" + valueHelpParameters.helpModel;
				//搜索帮助用来排序的字段(默认显示的第一个字段)
				var sSortKey = valueHelpParameters.items[0];

				//创建columns
				var aColumns = [];
				aHeaderTexts.forEach(function (headerText, index) {
					if (this.byId("Column" + index)) {
						this.byId("Column" + index).destroy(true);
					}
					var iWidth = index === 0 ? 10 : 15;
					aColumns.push(new sap.m.Column({
						id: this.getView().createId("Column" + index),
						width: iWidth + "rem",
						header: new sap.m.Label({
							text: this._ResourceBundle.getText(headerText)
						})
					}));
				}.bind(this));
				//将column添加到dialog中
				oValueHelpDialog.destroyColumns();
				aColumns.forEach(function (oColumn, index) {
					oValueHelpDialog.addColumn(oColumn);
				}.bind(this));
				//创建items
				var aCells = [];
				aItems.forEach(function (cell) {
					var cellPath = "{local>" + cell + "}";
					aCells.push(
						new sap.m.Text({
							text: cellPath
						})
					);
				});
				var oItems = new sap.m.ColumnListItem({ cells: aCells });
				var oSorter = new Sorter({
					path: sSortKey,
					descending: false
				});
				//filter
				var aFilter = [];
				aFilter.push(new Filter("Key2", "Contains", "1000"));
				var oFilter = new Filter({
					filters: aFilter,
					and: false
				});
				//将item添加到dialog中
				oValueHelpDialog.bindAggregation("items", {
					path: sBindingPath,
					template: oItems,
					sorter: oSorter,
					filters: oFilter
				});

				oValueHelpDialog.open();
			}.bind(this));
		},

		// Search controls in the search help pop-up
		_handleValueHelpSearch: function (oEvent, obj) {
			// obj: 设置valueHelpDialog的参数，这里是获取搜索帮助filter时需要的property
			var sValue = oEvent.getParameter("value");
			var aFilter = [];
			obj.valueHelpParameters.items.forEach(function (value) {
				aFilter.push(new Filter(value, "Contains", sValue));
			})
			var oFilter = new Filter({
				filters: aFilter,
				and: false
			});
			oEvent.getSource().getBinding("items").filter(oFilter);
		},

		// 搜索帮助dialog点击某一行时，关闭窗口并将值写入到对应的model属性中
		_handleValueHelpClose: function (oEvent, obj) {
			// obj.object: controller的this
			var oSelectedItem = oEvent.getParameter("selectedItem");
			//选中行时关闭dialog
			//将获取到的搜索帮助的值写入对应行的localmodel
			if (oSelectedItem) {
				var that = obj.object;
				var sRowPath = obj.path;//数据所在行的绑定路径
				var sValueHelpPath = oSelectedItem.getBindingContextPath();
				var sValueHelpTextPath = oSelectedItem.getBindingContextPath();
				var sProperty = obj.valueHelpParameters.valuePath;
				sValueHelpPath = sValueHelpPath + "/" + obj.valueHelpParameters.items[0];
				sValueHelpTextPath = sValueHelpTextPath + "/" + obj.valueHelpParameters.items[1];
				// that._LocalData.setProperty(sRowPath + "/" + sProperty, that._LocalData.getProperty(sValueHelpPath));
				that._LocalData.setProperty(sRowPath, that._LocalData.getProperty(sValueHelpPath));
				// //除了搜索帮助字段本身，还可以填充一些其他关联的字段，比如描述
				// if (obj.isHead) {
				//     // 获取几个抬头字段的描述
				//     that._LocalData.setProperty(sRowPath + "/" + sProperty + "name", that._LocalData.getProperty(sValueHelpTextPath));
				// } else {
				//     //针对行项目报表的Material字段
				//     if (sProperty === "Material") {
				//         that._LocalData.setProperty(sRowPath + "/" + "Productoldid", that._LocalData.getProperty(oSelectedItem.getBindingContextPath() + "/Bismt"));
				//         that._LocalData.setProperty(sRowPath + "/" + "Color", that._LocalData.getProperty(oSelectedItem.getBindingContextPath() + "/Normt"));
				//     }
				// }
				that.oInput.setValueState("None");
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		setBusy: function (busy) {
			this._LocalData.setProperty("/busy", busy, false);
		},

		clone: function (obj) {
			var o;
			if (obj.constructor == Object) {
				o = new obj.constructor();
			} else {
				o = new obj.constructor(obj.valueOf());
			}
			for (var key in obj) {
				if (o[key] != obj[key]) {
					if (typeof (obj[key]) == 'object') {
						o[key] = this.clone(obj[key]);
					} else {
						o[key] = obj[key];
					}
				}
			}
			return o;
		},

		accNumber: function () {
			Number.prototype.add = function (arg) {
				return formatter.accAdd(this, arg);
			};
			String.prototype.add = function (arg) {
				return formatter.accAdd(this, arg);
			};
			Number.prototype.sub = function (arg) {
				return formatter.accSub(this, arg);
			};
			String.prototype.sub = function (arg) {
				return formatter.accSub(this, arg);
			};
			Number.prototype.mul = function (arg) {
				return formatter.accMul(this, arg);
			};
			String.prototype.mul = function (arg) {
				return formatter.accMul(this, arg);
			};
			Number.prototype.div = function (arg) {
				return formatter.accDiv(this, arg);
			};
			String.prototype.div = function (arg) {
				return formatter.accDiv(this, arg);
			};
		},

		overwriteToFixed: function () {
			Number.prototype.toFixed = function (digits) {
				var times = Math.pow(10, digits);
				var result
				if (this < 0) {
					result = this * times - 0.5;
				} else {
					result = this * times + 0.5;
				}
				result = parseInt(result, 10) / times;
				result = result.toString();
				// 补足小数位
				if (digits > 0) {
					var decimalPos = result.indexOf(".");
					if (decimalPos < 0) {
						decimalPos = result.length;
						result += ".";
					}
					while (result.length <= decimalPos + digits) {
						result += "0";
					}
				}
				return result;
			};
		}

	});

});