sap.ui.define([
	//"sap/ui/core/mvc/Controller"
	"MMPurchaseRequest/controller/Base",
	"MMPurchaseRequest/model/formatter",
	//	"MM/PurchaseRequest/lib/xml-js",
	"sap/ui/model/Filter",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/MenuItem",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/FilterOperator"
], function (Base, formatter, Filter, MessageBox, MessageToast, MenuItem, JSONModel, FilterOperator) {
	"use strict";

	return Base.extend("MMPurchaseRequest.controller.Main", {
		formatter: formatter,

		onInit: function () {
			this._firstMatched = true;
			this.getRouter().getRoute("Main").attachPatternMatched(this._onMasterMatched, this);
		},

		_onMasterMatched: function () {
			var startupParams = this.getOwnerComponent().getComponentData().startupParameters; // get Startup params from Owner Component
			if ((startupParams.prnumber && startupParams.prnumber[0])) {
				if (this._firstMatched) {
					this._firstMatched = false;
				} else {
					return;
				}
				if (startupParams.model[0] == "change") {
					this.getView().byId("ComboBox_ZzOption").setSelectedKey("3");
				} else if (startupParams.model[0] == "display") {
					this.getView().byId("ComboBox_ZzOption").setSelectedKey("4");
				}
				this.getModel("local").setProperty("/Banfn", startupParams.prnumber[0]);
				this.getView().byId("smartFilterBar").search();
			} 
		},
		/*		onBeforeExport: function(oEvt) {
					var mExcelSettings = oEvt.getParameter("exportSettings");
	
					mExcelSettings.workbook.columns.forEach(function(oColumn) {
						switch (oColumn.property) {
							case "CreationDate":
							case "BindingPeriodValidityStartDate":
								oColumn.type = sap.ui.export.EdmType.Date;
						}
					});
	
					mExcelSettings.fileName = this.getI18nBundle().getText("title") + new Date().getTime();
				},
		*/
		onGo: function () {
			var that = this;
			var aFilters;
			var oNewFilter,
				aNewFilters = [];

			var Osfb = this.getView().byId("smartFilterBar");
			var OsfbData = Osfb.getFilters();
			aFilters = OsfbData;
			aNewFilters.push(new Filter("Zzoption", FilterOperator.EQ, this.getView().byId("ComboBox_ZzOption").getSelectedItem().getKey()));
			this.getModel("local").setProperty("/Zzoption", this.getView().byId("ComboBox_ZzOption").getSelectedItem().getKey());
			var sOption = this.getView().byId("ComboBox_ZzOption").getSelectedItem().getKey();
			switch (sOption) {
				case "1":
					this.getModel("local").setProperty("/ZzTitle", "購買依頼書新規");
					break;
				case "2":
					this.getModel("local").setProperty("/ZzTitle", "購買依頼書参照新規");
					break;
				case "3":
					this.getModel("local").setProperty("/ZzTitle", "購買依頼書修正");
					break;
				case "4":
					this.getModel("local").setProperty("/ZzTitle", "購買依頼書照会");
					break;
				default:
					this.getModel("local").setProperty("/ZzTitle", "購買依頼書登録&修正&照会");
			}

			var sZbanfn = this.getModel("local").getProperty("/Zbanfn");
			//this.getModel("local").setProperty("/Zbanfn", "");
			var sBanfn = this.getModel("local").getProperty("/Banfn");
			//this.getModel("local").setProperty("/Banfn", "");
			var sZspzt = this.getModel("local").getProperty("/Zspzt");

			if (sOption !== "1" && (sZbanfn === "" && sBanfn === "")) {
				MessageBox.error(this.getI18nBundle().getText("msgSelectNoFirst"));
				return;
			}

			if (sOption === "2" && (sZspzt !== "8888")) {
				MessageBox.error(this.getI18nBundle().getText("msgCanNotRefCreate"));
				return;
			}

			if (sZbanfn !== "") {
				aNewFilters.push(new Filter("Zbanfn", FilterOperator.EQ, sZbanfn));
			}

			if (sBanfn !== "") {
				aNewFilters.push(new Filter("Banfn", FilterOperator.EQ, sBanfn));
			}

			oNewFilter = new Filter({
				filters: aNewFilters,
				and: true
			});

			aFilters.push(oNewFilter);

			that.setBusy(true);

			if (sOption === "1" || sOption === "2") {

			} else {
				this.getAttachment();
			}

			this.getInitData(aFilters).then(
				function (oData) {
					// 如果第一次查询通过搜索帮助，那这三个字的会有有值，
					// 如果第二次查询不通过搜索帮助，只填写采购申请号，那么Zbanfn和Zspzt需要情况，否则还是上一次的值，找不到结果
					// 所以查询完成后，清除值
					that.getModel("local").setProperty("/Zbanfn", "");
					that.getModel("local").setProperty("/Banfn", "");
					that.getModel("local").setProperty("/Zspzt", "");

					that.gotoDetailPage(oData);
				}
			).catch(
				function (err) {
					MessageBox.error(err);
				}
			).finally(
				function () {
					that.setBusy(false);
				}
			);
		},

		getInitData: function (aFilters) {
			var that = this;
			var promise = new Promise(function (resolve, reject) {

				var afilter = [];
				afilter.push(new Filter('Zzoption', sap.ui.model.FilterOperator.EQ, "1"));

				var oParam = {
					filters: aFilters,
					//filters: afilter,
					urlParameters: {
						$expand: "to_ZzPRItem,to_ZzPRSum"
					},
					success: function (oData) {
						resolve(oData);
					}.bind(that),
					error: function (oError) {
						var sErrorMessage;
						if (oError.statusCode === "500") {
							MessageBox.error(oError.responseText);
						}
						try {
							var oJsonMessage = JSON.parse(oError.responseText);
							sErrorMessage = oJsonMessage.error.message.value;
						} catch (e) {
							sErrorMessage = oError.responseText;
						}
						reject(sErrorMessage);
					}.bind(that)
				};
				that.getModel().read("/ZzPRHeaderSet", oParam);
				// that.getOwnerComponent().getModel().read("/ZzPRHeaderSet", oParam);
			});
			return promise;

		},

		gotoDetailPage: function (oData) {
			if (oData.results.length === 0) {
				MessageBox.error(this.getI18nBundle().getText("msgNoData"));
				return;
			}

			var oHeader = {
				Zbanfn: oData.results[0].Zbanfn,
				Banfn: oData.results[0].Banfn,
				Bukrs: oData.results[0].Bukrs,
				Ekgrp: oData.results[0].Ekgrp,
				Bsart: oData.results[0].Bsart,
				Badat: formatter.convertDate(oData.results[0].Badat),
				Zspqx: formatter.convertDate(oData.results[0].Zspqx),
				Zsprq: formatter.convertDate(oData.results[0].Zsprq),
				Department:oData.results[0].Department,
				Zjm: oData.results[0].Zjm,
				Zsqly: oData.results[0].Zsqly,
				Zspzt: oData.results[0].Zspzt,
				ZspztText: oData.results[0].ZspztText,
				Loekz: oData.results[0].Loekz,
				Zfinish: oData.results[0].Zfinish,
				Ernam: oData.results[0].Ernam,
				Erdat: formatter.convertDate(oData.results[0].Erdat),
				Erzet: oData.results[0].Erzet,
				Aenam: oData.results[0].Aenam,
				Aedat: formatter.convertDate(oData.results[0].Aedat),
				Aezet: oData.results[0].Aezet,
				Butxt: oData.results[0].Butxt,
				Eknam: oData.results[0].Eknam,
				Batxt: oData.results[0].Batxt,
				Name_text: oData.results[0].Name_text,
				Zzoption: oData.results[0].Zzoption,
				Zzaction: oData.results[0].Zzaction
			};

			var aItems = oData.results[0].to_ZzPRItem.results;
			var total1 = 0, total2 = 0, total3 = 0, total4 = 0;
			aItems.forEach(function (item, index, array) {
				var Menge = item.Menge;
				var Preis = item.Preis;
				var Peinh = item.Peinh;
				var Zvat = item.Zvat;
				var Zconsumtax = item.Zconsumtax;
				var Zzhje = item.Zzhje;
				array[index].Lfdat = formatter.convertDate(item.Lfdat);
				//array[index].Zbnfpo = array[index].Zbnfpo.toString().replace(/\b(0+)/gi, "");
				array[index].Menge = formatter.amountFormat(array[index].Menge);
				array[index].Preis = formatter.amountFormat(array[index].Preis);
				array[index].Peinh = formatter.amountFormat(array[index].Peinh);
				array[index].Zconsumtax = formatter.amountFormat(array[index].Zconsumtax);
				array[index].Zsubtotal = formatter.amountFormat(array[index].Zsubtotal);
				array[index].Zzhje = formatter.amountFormat(array[index].Zzhje);
				array[index].Zvat = formatter.amountFormat(array[index].Zvat);

				//金额合计
				//税抜総額
				var amount1 = 0;
				amount1 = this.formatter.accMul(Menge, Preis);
				amount1 = this.formatter.accDiv(amount1, Peinh);
				total1 = this.formatter.accAdd(total1, amount1);
				//税込総額
				total2 = this.formatter.accAdd(total2, Zvat);
				//消費税総額
				total3 = this.formatter.accAdd(total3, Zconsumtax);
				//値引き後総額
				total4 = this.formatter.accAdd(total4, Zzhje);
			}.bind(this));
			this.getModel("local").setProperty("/total1", formatter.amountFormat(total1));
			this.getModel("local").setProperty("/total2", formatter.amountFormat(total2));
			this.getModel("local").setProperty("/total3", formatter.amountFormat(total3));
			this.getModel("local").setProperty("/total4", formatter.amountFormat(total4));

			var aSum = oData.results[0].to_ZzPRSum.results;
			aSum.forEach(function (item, index, array) {
				array[index].Znetvalue = formatter.amountFormat(array[index].Znetvalue);
				array[index].Zconsumtax = formatter.amountFormat(array[index].Zconsumtax);
				array[index].Zsubtotal = formatter.amountFormat(array[index].Zsubtotal);
				array[index].Zestvat = formatter.amountFormat(array[index].Zestvat);
				array[index].Zzhje = formatter.amountFormat(array[index].Zzhje);
				array[index].Zvat = formatter.amountFormat(array[index].Zvat);
			});

			this.getModel("local").setProperty("/ZzHeader", oHeader);
			this.getModel("local").setProperty("/ZzItem", aItems);
			this.getModel("local").setProperty("/ZzSum", aSum);
			this.getModel("local").setProperty("/ZzHeaderOld", JSON.parse(JSON.stringify(oHeader)));
			this.getModel("local").setProperty("/ZzItemOld", JSON.parse(JSON.stringify(aItems)));
			this.getModel("local").setProperty("/ZzSumOld", JSON.parse(JSON.stringify(aSum)));

			if (this.getView().byId("ComboBox_ZzOption").getSelectedItem().getKey() === "1" || this.getView().byId("ComboBox_ZzOption").getSelectedItem()
				.getKey() === "2") {
				this.getModel("local").setProperty("/editCreate", true);
				this.getModel("local").setProperty("/editChange", true);
			} else if (this.getView().byId("ComboBox_ZzOption")
				.getSelectedItem().getKey() === "3") {
				this.getModel("local").setProperty("/editCreate", true);
				this.getModel("local").setProperty("/editChange", false);
			} else {
				this.getModel("local").setProperty("/editCreate", false);
				this.getModel("local").setProperty("/editChange", false);
			}

			if (oHeader.Loekz === true || oHeader.Loekz === "") {
				this.getModel("local").setProperty("/editCreate", false);
				this.getModel("local").setProperty("/editChange", false);
			}

			if (oHeader.Zspzt !== "0000" && oHeader.Zspzt !== "7777") {
				this.getModel("local").setProperty("/editCreate", false);
				this.getModel("local").setProperty("/editChange", false);
			}

			/*			if (oHeader.Zspzt === "" || oHeader.Zspzt === "02XX") {} else {
							this.getModel("local").setProperty("/editCreate", false);
							this.getModel("local").setProperty("/editChange", false);
						}*/

			this.getModel("local").refresh();

			this.getRouter().navTo("Detail");
		},

		onFilterBarChange: function (sValue) {
			//MessageBox.error(sValue.getParameters().getParameters().id.toString() + sValue.getParameters().getParameters().newValue.toString());
			//var oValue = sValue.getParameters();
			//var oPara;

			//MessageBox.error(sValue.getParameters().getParameters().newValue.toString());
		},

		setBusy: function (bFlag) {
			this.getModel("settings").setProperty("/appProperties/busy", bFlag);
			this.getModel("settings").refresh();
		},

		onShowBanfnHelp: function (oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Banfn"),
				"MMPurchaseRequest.fragment.ZzSHZbanfnSearchHelp",
				"ZzSHZbanfnSet",
				"Banfn",
				aFilters);
		},

		showCustomSearchHelpDialog: function (oContext, oEvent, sTitle, sViewName, sEntitySet, sBindingField, aFilters) {
			oContext._inputSource = oEvent.getSource();
			//oContext._aFilters = aFilters;
			oContext._sEntitySet = sEntitySet;
			oContext._sBindingField = sBindingField;
			oContext.loadFragment({
				name: sViewName
			}).then(function (oDialog) {
				oDialog.open();
				//var oSmartFilter = oContext.byId("smartFilter");
				//oSmartFilter.setEntitySet(oContext._sEntitySet);
				//var oSmartTable = oContext.byId("smartTable");
				//oSmartTable.setEntitySet(oContext._sEntitySet);
				//oContext.byId("dialogSelect").setTitle(sTitle);
			}.bind(oContext));
		},

		onSelectLineBanfn: function (oEvent) {
			var data;
			if (oEvent.sId === 'cellClick') {
				data = oEvent.mParameters.rowBindingContext.getObject();
			} else {
				data = oEvent.getParameter("rowContext").getObject();
			}

			if (data) {
				if (this._inputSource) {
					this._inputSource.setValue(data[this._sBindingField]);
					this.getModel("local").setProperty("/Zbanfn", data.Zbanfn);
					this.getModel("local").setProperty("/Banfn", data.Banfn);
					this.getModel("local").setProperty("/Zspzt", data.Zspzt);
					this._inputSource.fireChange({});
				}
			}

			this.onCloseSearchDialog();
		},

		onCloseSearchDialog: function () {
			this.byId("dialogSelect").close();
			this.byId("dialogSelect").destroy();
		}

	});

});