sap.ui.define([
	"./Base",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	//"../model/formatter",
	"MMPurchaseRequest/model/formatter",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/mvc/Controller",
	//"MMPurchaseRequest/lib/xml-js",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast"
], function(Base, MessageBox, Filter, formatter, DateFormat, Controller, FilterOperator, MessageToast) {

	"use strict";
	return Base.extend("MMPurchaseRequest.controller.Detail", {
		formatter: formatter,

		/**
		 * Init Function of view
		 * set message model and message manager
		 */
		onInit: function() {
			// post data
			this._postData = [];
			//this.byId("page").setTitle("test");
		},

		onSave: function() {
			if (this._postData.length === 0) {
				MessageBox.error(this.getI18nBundle().getText("msgNoData"));
				return;
			}

			// set busy status
			this.setBusy(true);

			this.loopImportPR(this._postData).then(
				function(result) {
					if (result.iFailed === 0 && result.iSuccess !== 0) {
						var sMessage = this.getModel("local").getProperty("/ZzHeader/Message");
						if (!sMessage) {
							MessageBox.success(this.getI18nBundle().getText("Success"));
						} else {
							MessageBox.error(sMessage);
						}
						//this.getModel("local").setProperty("/ZzHeader/Zspzt", '0');
					}

					var aItem = this.getModel("local").getProperty("/ZzItem");
					for (var i = 0; i < aItem.length; i++) {
						aItem[i].Lfdat = formatter.convertDate(aItem[i].Lfdat);
						aItem[i].Erdat = formatter.convertDate(aItem[i].Erdat);
						aItem[i].Aedat = formatter.convertDate(aItem[i].Aedat);
					}
					this.getModel("local").setProperty("/ZzHeader/Message", "");
					this.getModel("local").setProperty("/ZzHeader/Zzaction", "");
					// disable save button in case of duplicate saving
					this.getModel("local").setProperty("/saveButtonEdit", false);
					// refresh data model
					this.getModel("local").refresh();
					// clear busy status
					this.setBusy(false);
				}.bind(this)
			);

		},

		loopImportPR: function(aPostData) {
			var oPromise = new Promise(
				function(resolve, reject) {
					var oResult = {
						iSuccess: 0,
						iFailed: 0
					};

					aPostData.forEach(function(oPostData, index) {
						this.importPR(oPostData, index).then(
							function() {
								oResult.iSuccess += 1;
								resolve(oResult);
							},
							function() {
								oResult.iFailed += 1;
								resolve(oResult);
							}
						);
					}.bind(this));
				}.bind(this)
			);
			return oPromise;
		},

		importPR: function(oPostData, iIndex) {
			var oPromise = new Promise(
				function(resolve, reject) {
					var sChangeSetId = iIndex;
					var oParam = {
						success: function(oData) {
							this.getModel("local").setProperty("/ZzHeader/Zbanfn", oData.Zbanfn);
							this.getModel("local").setProperty("/ZzHeader/Banfn", oData.Banfn);
							this.getModel("local").setProperty("/ZzHeader/Message", oData.Message);
							this.getModel("local").setProperty("/ZzHeader/Zspzt", oData.Zspzt);
							this.getModel("local").setProperty("/ZzHeader/ZspztText", oData.ZspztText);
							if (oData.Zspzt !== "0000" && oData.Zspzt !== "7777") {
								this.getModel("local").setProperty("/editCreate", false);
								this.getModel("local").setProperty("/editChange", false);
							}
							this.getModel("local").refresh();
							resolve();
						}.bind(this),

						error: function(oError) {
							var sMsgString;
							if (oError.statusCode === "500" || oError.statusCode === 500) {
								MessageBox.error(oError.responseText);
							} else {
								try {
									var oJsonMessage = JSON.parse(oError.responseText);
									sMsgString = oJsonMessage.error.message.value;
								} catch (e) {
									sMsgString = oError.responseText;
								}

								if (sMsgString !== "") {
									MessageBox.error(sMsgString);
								}
							}
							reject();
						}.bind(this),

						changeSetId: sChangeSetId

					};
					this.getModel().create("/ZzPRHeaderSet", oPostData, oParam);
				}.bind(this)
			);
			return oPromise;
		},

		_getPostData: function() {
			//var aPostData = [];
			var oHeader1 = this.getModel("local").getProperty("/ZzHeader");
			var aItem1 = this.getModel("local").getProperty("/ZzItem");
			var aSum1 = this.getModel("local").getProperty("/ZzSum");

			var oHeader = JSON.parse(JSON.stringify(oHeader1));
			var aItem = JSON.parse(JSON.stringify(aItem1));
			var aSum = JSON.parse(JSON.stringify(aSum1));

			//var oHeaderOld = this.getModel("local").getProperty("/ZzHeaderOld");
			//var aItemOld = this.getModel("local").getProperty("/ZzItemOld");
			//var aSumOld = this.getModel("local").getProperty("/ZzSumOld");

			var aHeader = [];
			var bHasError = false;

			//Check input
			if (oHeader.Bukrs === "") {
				MessageBox.error(this.getI18nBundle().getText("msgBukrsIsEmpty"));
				return;
			}

			if (oHeader.Ekgrp === "") {
				MessageBox.error(this.getI18nBundle().getText("msgEkgrpIsEmpty"));
				return;
			}

			if (oHeader.Bsart === "") {
				MessageBox.error(this.getI18nBundle().getText("msgBsartIsEmpty"));
				return;
			}

			if (oHeader.Department === "") {
				MessageBox.error(this.getI18nBundle().getText("msgDepartmentIsEmpty"));
				return;
			}

			if (oHeader.Zjm === "") {
				MessageBox.error(this.getI18nBundle().getText("msgZjmIsEmpty"));
				return;
			}

			if (aItem.length < 1) {
				MessageBox.error(this.getI18nBundle().getText("msgInputItems"));
				return;
			}

			for (var i = 0; i < aItem.length; i++) {
				/*	if (aItem[i].Zbnfpo === "") {
						MessageBox.error(this.getI18nBundle().getText("msgZbnfpoIsEmpty"));
						bHasError = true;
						break;
					}*/

				if (aItem[i].Werks === "") {
					MessageBox.error(this.getI18nBundle().getText("msgWerksIsEmpty"));
					bHasError = true;
					break;
				}

				if (aItem[i].Matnr === "" && aItem[i].Matkl === "") {
					MessageBox.error(this.getI18nBundle().getText("msgMatnrIsEmpty"));
					bHasError = true;
					break;
				}

				if (aItem[i].Lfdat === "" || aItem[i].Lfdat === null) {
					MessageBox.error(this.getI18nBundle().getText("msgLfdatIsEmpty"));
					bHasError = true;
					break;
				}

				if (aItem[i].Menge === "" || aItem[i].Menge === "0" || aItem[i].Menge === 0) {
					MessageBox.error(this.getI18nBundle().getText("msgMengeIsEmpty"));
					bHasError = true;
					break;
				}

				if (aItem[i].Preis === "" || aItem[i].Preis === "0" || aItem[i].Preis === 0) {
					MessageBox.error(this.getI18nBundle().getText("msgPreisIsEmpty"));
					bHasError = true;
					break;
				}

				if (oHeader.Bsart !== "Z999" && aItem[i].Lifnr === "") {
					MessageBox.error(this.getI18nBundle().getText("msgLifnrIsEmpty"));
					bHasError = true;
					break;
				}

				aItem[i].Lfdat = (aItem[i].Lfdat === "" || aItem[i].Lfdat === null) ? null : this.convertDateToOdata(aItem[i].Lfdat);
				aItem[i].Erdat = (aItem[i].Erdat === "" || aItem[i].Erdat === null) ? null : this.convertDateToOdata(aItem[i].Erdat);
				aItem[i].Aedat = (aItem[i].Aedat === "" || aItem[i].Aedat === null) ? null : this.convertDateToOdata(aItem[i].Aedat);
				aItem[i].Menge = (aItem[i].Menge === "") ? null : aItem[i].Menge;
				aItem[i].Zconsumtax = (aItem[i].Zconsumtax === "") ? null : aItem[i].Zconsumtax;
				aItem[i].Zsubtotal = (aItem[i].Zsubtotal === "") ? null : aItem[i].Zsubtotal;
				aItem[i].Zzhje = (aItem[i].Zzhje === "") ? null : aItem[i].Zzhje;
				aItem[i].Zvat = (aItem[i].Zvat === "") ? null : aItem[i].Zvat;
				aItem[i].Peinh = (aItem[i].Zvat === "") ? "1" : aItem[i].Peinh;
				aItem[i].Loekz = this.convertCheckBoxValue(aItem[i].Loekz);
				//aItem[i].Erzet = null;
				//aItem[i].Aezet = null;

				aItem[i].Menge = formatter.clearCommaToNumber(aItem[i].Menge).toString();
				aItem[i].Preis = formatter.clearCommaToNumber(aItem[i].Preis).toString();
				aItem[i].Peinh = formatter.clearCommaToNumber(aItem[i].Peinh).toString();
				aItem[i].Zconsumtax = formatter.clearCommaToNumber(aItem[i].Zconsumtax).toString();
				aItem[i].Zsubtotal = formatter.clearCommaToNumber(aItem[i].Zsubtotal).toString();
				aItem[i].Zzhje = formatter.clearCommaToNumber(aItem[i].Zzhje).toString();
				aItem[i].Zvat = formatter.clearCommaToNumber(aItem[i].Zvat).toString();
			}

			for (var i = 0; i < aSum.length; i++) {
				aSum[i].Zconsumtax = (aSum[i].Zconsumtax === "") ? null : aSum[i].Zconsumtax;
				aSum[i].Zsubtotal = (aSum[i].Zsubtotal === "") ? null : aSum[i].Zsubtotal;
				aSum[i].Zestvat = (aSum[i].Zestvat === "") ? null : aSum[i].Zestvat;
				aSum[i].Zzhje = (aSum[i].Zzhje === "") ? null : aSum[i].Zzhje;
				aSum[i].Zvat = (aSum[i].Zvat === "") ? null : aSum[i].Zvat;
				aSum[i].Znetvalue = (aSum[i].Znetvalue === "") ? null : aSum[i].Znetvalue;
				aSum[i].Znetvalue = aSum[i].Znetvalue.toString();

				aSum[i].Znetvalue = formatter.clearCommaToNumber(aSum[i].Znetvalue).toString();
				aSum[i].Zconsumtax = formatter.clearCommaToNumber(aSum[i].Zconsumtax).toString();
				aSum[i].Zsubtotal = formatter.clearCommaToNumber(aSum[i].Zsubtotal).toString();
				aSum[i].Zestvat = formatter.clearCommaToNumber(aSum[i].Zestvat).toString();
				aSum[i].Zzhje = formatter.clearCommaToNumber(aSum[i].Zzhje).toString();
				aSum[i].Zvat = formatter.clearCommaToNumber(aSum[i].Zvat).toString();

			}

			if (bHasError) {
				return;
			}

			aHeader.push(oHeader);

			MessageBox.warning(this.getI18nBundle().getText("msgSaveZtableConfirm"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: function(sAction) {
					//MessageToast.show("Action selected: " + sAction);
					if (sAction === "CANCEL") {
						return;
					} else {
						this._postData = this._buildPostData(aHeader, aItem, aSum);
						this.onSave();
					}
				}.bind(this)
			});

		},

		_buildPostData: function(aHeader, aItemNew, aSum) {
			var aPostData = [];
			aHeader.forEach(function(oHeader) {
				var oPostData = {
					Zbanfn: oHeader.Zbanfn,
					Banfn: oHeader.Banfn,
					Bukrs: oHeader.Bukrs,
					Ekgrp: oHeader.Ekgrp,
					Bsart: oHeader.Bsart,
					Badat: (oHeader.Badat === "" || oHeader.Badat === null) ? null : this.convertDateToOdata(oHeader.Badat),
					Zspqx: (oHeader.Zspqx === "" || oHeader.Zspqx === null) ? null : this.convertDateToOdata(oHeader.Zspqx),
					Zsprq: (oHeader.Zsprq === "" || oHeader.Zsprq === null) ? null : this.convertDateToOdata(oHeader.Zsprq),
					Department:oHeader.Department,
					Zjm: oHeader.Zjm,
					Zsqly: oHeader.Zsqly,
					Zspzt: oHeader.Zspzt,
					Loekz: this.convertCheckBoxValue(oHeader.Loekz),
					Zfinish: oHeader.Zfinish,
					Ernam: oHeader.Ernam,
					Erdat: (oHeader.Erdat === "" || oHeader.Erdat === null) ? null : this.convertDateToOdata(oHeader.Erdat),
					Erzet: oHeader.Erzet,
					Aenam: oHeader.Aenam,
					Aedat: (oHeader.Aedat === "" || oHeader.Aedat === null) ? null : this.convertDateToOdata(oHeader.Aedat),
					Aezet: oHeader.Aezet,
					Butxt: oHeader.Butxt,
					Eknam: oHeader.Eknam,
					Batxt: oHeader.Batxt,
					Name_text: oHeader.Name_text,
					Zzoption: oHeader.Zzoption,
					Zzaction: oHeader.Zzaction,
					to_ZzPRItem: aItemNew,
					to_ZzPRSum: aSum

				};

				aPostData.push(oPostData);

			}.bind(this));

			return aPostData;
		},

		convertDateToOdata: function(sDate) {
			var oDate = new Date(sDate);
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			var sFormatDate = oDateFormat.format(oDate, false);
			return new Date(sFormatDate);
		},

		convertCheckBoxValue: function(sValue) {
			/*	if (sValue === true) {
					return "X";
				} else {
					return "";
				}*/

			if (sValue === "X") {
				return true;
			} else if (sValue === "") {
				return false;
			} else {
				return sValue;
			}
		},

		convertbooltostring: function(sValue) {
			if (sValue === true) {
				return "X";
			} else {
				return "";
			}
		},

		onItemChange: function(sValue) {
			var oHeader = this.getModel("local").getProperty("/ZzHeader");
			var aItem = this.getModel("local").getProperty("/ZzItem");
			var aSum = this.getModel("local").getProperty("/ZzSum");
			var aCalc = [];
			var bExistFalg = false;
			var iZestvat = "0";
			var iZnetvalue = 0;
			var iMenge = 0;
			var iPreis = 0;
			var iPeinh = 1;
			var iConsumtaxSum = 0;
			//sValue.getSource().getBindingContext("local").getObject().Zbanfn
			aItem.forEach(function(oItem) {
				if (oItem.Loekz === true || oItem.Loekz === "X") {

				} else {
					if (oItem.Peinh == "") {
						oItem.Peinh = 1;
					} else {
						oItem.Peinh = formatter.clearCommaToNumber(oItem.Peinh);
					}

					oItem.Menge = formatter.clearCommaToNumber(oItem.Menge);
					oItem.Preis = formatter.clearCommaToNumber(oItem.Preis);
					oItem.Peinh = formatter.clearCommaToNumber(oItem.Peinh);

					iMenge = oItem.Menge;
					iPreis = oItem.Preis;
					iPeinh = oItem.Peinh;

					iZnetvalue = iMenge * iPreis;
					iZnetvalue = iZnetvalue / iPeinh;
					iZnetvalue = Number(iZnetvalue).toFixed(2);

					oItem.Zconsumtax = iPreis * 0.1;
					iConsumtaxSum = iPreis * 0.1 * iMenge / iPeinh;
					iConsumtaxSum = Number(iConsumtaxSum).toFixed(2);
					oItem.Zsubtotal = iPreis * 1.1 * iMenge / iPeinh;
					oItem.Zvat = iPreis * 1.1;

					oItem.Zconsumtax = oItem.Zconsumtax.toFixed(2);
					oItem.Zsubtotal = oItem.Zsubtotal.toFixed(2);
					oItem.Zvat = oItem.Zvat.toFixed(2);
					oItem.Zzhje = formatter.clearCommaToNumber(oItem.Zzhje).toFixed(2);

					oItem.Zconsumtax = formatter.clearCommaToNumber(oItem.Zconsumtax);
					oItem.Zsubtotal = formatter.clearCommaToNumber(oItem.Zsubtotal);
					oItem.Zzhje = formatter.clearCommaToNumber(oItem.Zzhje);
					oItem.Zvat = formatter.clearCommaToNumber(oItem.Zvat);

					oItem.Menge = formatter.amountFormat(oItem.Menge);
					oItem.Preis = formatter.amountFormat(oItem.Preis);
					oItem.Peinh = formatter.amountFormat(oItem.Peinh);
					oItem.Zconsumtax = formatter.amountFormat(oItem.Zconsumtax);
					oItem.Zsubtotal = formatter.amountFormat(oItem.Zsubtotal);
					oItem.Zzhje = formatter.amountFormat(oItem.Zzhje);
					oItem.Zvat = formatter.amountFormat(oItem.Zvat);

					if (oItem.Txz01 === "" || oItem.Lifnrname === "") {
						for (var i = 0; i < aItem.length; i++) {
							if (oItem.Txz01 === "" && aItem[i].Matnr === oItem.Matnr && aItem[i].Txz01 !== "") {
								oItem.Txz01 = aItem[i].Txz01;
								break;
							}

							if (oItem.Lifnrname === "" && aItem[i].Lifnr === oItem.Lifnr && aItem[i].Lifnrname !== "") {
								oItem.Lifnrname = aItem[i].Lifnrname;
								break;
							}
						}
					}

					for (var i = 0; i < aSum.length; i++) {
						if (aSum[i].Lifnr === oItem.Lifnr && aSum[i].Waers === oItem.Waers) {
							iZestvat = aSum[i].Zestvat;
							break;
						}
					}

					bExistFalg = false;
					for (var i = 0; i < aCalc.length; i++) {
						if (aCalc[i].Lifnr === oItem.Lifnr && aCalc[i].Waers === oItem.Waers) {
							aCalc[i].Znetvalue = formatter.clearCommaToNumber(aCalc[i].Znetvalue) + formatter.clearCommaToNumber(iZnetvalue);
							aCalc[i].Zconsumtax = formatter.clearCommaToNumber(aCalc[i].Zconsumtax) + formatter.clearCommaToNumber(iConsumtaxSum);
							aCalc[i].Zsubtotal = formatter.clearCommaToNumber(aCalc[i].Zsubtotal) + formatter.clearCommaToNumber(oItem.Zsubtotal);
							aCalc[i].Zestvat = formatter.clearCommaToNumber(iZestvat);
							aCalc[i].Zzhje = formatter.clearCommaToNumber(aCalc[i].Zzhje) + formatter.clearCommaToNumber(oItem.Zzhje);
							aCalc[i].Zvat = formatter.clearCommaToNumber(aCalc[i].Zvat) + formatter.clearCommaToNumber(oItem.Zvat);
							bExistFalg = true;
							break;
						}
					}

					if (!bExistFalg) {
						var oSumData = {
							Zbanfn: oHeader.Zbanfn,
							Lifnr: oItem.Lifnr,
							Waers: oItem.Waers,
							Znetvalue: iZnetvalue,
							Zconsumtax: iConsumtaxSum,
							Zsubtotal: oItem.Zsubtotal,
							Zestvat: 0,
							Zzhje: oItem.Zzhje,
							Zvat: oItem.Zvat
						};
						aCalc.push(oSumData);
					}
				}
			}.bind(this));
			for (var i = 0; i < aCalc.length; i++) {
				aCalc[i].Znetvalue = formatter.clearCommaToNumber(aCalc[i].Znetvalue);
				aCalc[i].Zconsumtax = formatter.clearCommaToNumber(aCalc[i].Zconsumtax);
				aCalc[i].Zsubtotal = formatter.clearCommaToNumber(aCalc[i].Zsubtotal);
				aCalc[i].Zestvat = formatter.clearCommaToNumber(aCalc[i].Zestvat);
				aCalc[i].Zzhje = formatter.clearCommaToNumber(aCalc[i].Zzhje);
				aCalc[i].Zvat = formatter.clearCommaToNumber(aCalc[i].Zvat);

				aCalc[i].Znetvalue = formatter.amountFormat(aCalc[i].Znetvalue);
				aCalc[i].Zconsumtax = formatter.amountFormat(aCalc[i].Zconsumtax);
				aCalc[i].Zsubtotal = formatter.amountFormat(aCalc[i].Zsubtotal);
				aCalc[i].Zestvat = formatter.amountFormat(aCalc[i].Zestvat);
				aCalc[i].Zzhje = formatter.amountFormat(aCalc[i].Zzhje);
				aCalc[i].Zvat = formatter.amountFormat(aCalc[i].Zvat);

			}
			// 金额合计 add by zk 
			this.itemSum(aItem);
			this.getModel("local").setProperty("/ZzSum", aCalc);
			this.getModel("local").refresh();
		},

		itemSum: function (aItem) {
			var total1 = 0, total2 = 0, total3 = 0, total4 = 0;
			aItem.forEach(function (item) {
				var Menge = formatter.clearCommaToNumber(item.Menge);
				var Preis = formatter.clearCommaToNumber(item.Preis);
				var Peinh = formatter.clearCommaToNumber(item.Peinh);
				var Zvat = formatter.clearCommaToNumber(item.Zvat);
				var Zconsumtax = formatter.clearCommaToNumber(item.Zconsumtax);
				var Zzhje = formatter.clearCommaToNumber(item.Zzhje);

				//金额合计
				//税抜総額
				var amount1 = 0;
				amount1 = this.formatter.accMul(Menge, Preis);
				total1 = this.formatter.accAdd(total1, amount1);
				//税込総額
				amount1 = 0;
				amount1 = this.formatter.accMul(Menge, Zvat);
				total2 = this.formatter.accAdd(total2, amount1);
				//消費税総額
				amount1 = 0;
				amount1 = this.formatter.accMul(Menge, Zconsumtax);
				total3 = this.formatter.accAdd(total3, amount1);
				//値引き後総額
				total4 = this.formatter.accAdd(total4, Zzhje);
			}.bind(this));
			this.getModel("local").setProperty("/total1", formatter.amountFormat(total1));
			this.getModel("local").setProperty("/total2", formatter.amountFormat(total2));
			this.getModel("local").setProperty("/total3", formatter.amountFormat(total3));
			this.getModel("local").setProperty("/total4", formatter.amountFormat(total4));
			this.getModel("local").refresh();
		},

		onItemChangeSum: function(sValue) {
			var aSum = this.getModel("local").getProperty("/ZzSum");
			for (var i = 0; i < aSum.length; i++) {
				aSum[i].Zestvat = formatter.clearCommaToNumber(aSum[i].Zestvat);
				aSum[i].Zestvat = formatter.amountFormat(aSum[i].Zestvat);
			}
			this.getModel("local").setProperty("/ZzSum", aSum);
			this.getModel("local").refresh();
		},

		onItemChange1: function(sValue) {
			var oHeader = this.getModel("local").getProperty("/ZzHeaderOld");
			var aItem = this.getModel("local").getProperty("/ZzItem");
			var aSum = this.getModel("local").getProperty("/ZzSum");
			var sPath = sValue.getSource()._getBindingContext("local").sPath; //  /ZzItem/1
			var sIndex = sPath.substr(8, sPath.length - 8); //  1
			var oRow = aItem[sIndex];
			// MessageBox.error(sValue.getParameters().value + 'New' + sValue.getParameters().newValue + '////' + oRow.Meins);
			if (oRow.Lifnr !== "") {
				this.getModel("local").setProperty("/ZzHeader/Bprme", oRow.Meins);
				if (oRow.Meins.toUpperCase() === oHeader.Bprme.toUpperCase()) {
					this.getModel("local").setProperty("/ZzHeader/Bpumz", oHeader.Bpumz);
				} else {
					this.getModel("local").setProperty("/ZzHeader/Bpumz", "0");
				}
			}
		},

		onAddRow: function(oEvent) {
			var aItem = this.getModel("local").getProperty("/ZzItem");
			// MessageBox.error(this.getView().byId("tableItem").getSelectedIndex().toString());
			var index = this.getView().byId("tableItem").getSelectedIndex();
			var iItemNo = 0;
			var sItemNo = "";
			var iZbnfpo = 0;

			for (var i = 0; i < aItem.length; i++) {
				if (aItem[i].Zbnfpo) {
					iZbnfpo = aItem[i].Zbnfpo;
				} else {
					iZbnfpo = 0;
				}
				if (Number(iZbnfpo) > Number(iItemNo)) {
					iItemNo = iZbnfpo;
				}
			}

			iItemNo = Number(iItemNo) + 10;
			if (iItemNo < 10) {
				sItemNo = "0000" + iItemNo;
			} else if (iItemNo < 100) {
				sItemNo = "000" + iItemNo;
			} else if (iItemNo < 1000) {
				sItemNo = "00" + iItemNo;
			} else if (iItemNo < 10000) {
				sItemNo = "0" + iItemNo;
			} else sItemNo = iItemNo;

			var oRow = {
				Zbanfn: this.getModel("local").getProperty("/ZzHeader/Zbanfn"),
				//Zbnfpo: iItemNo.toString(),
				Zbnfpo: sItemNo,
				Knttp: "K",
				Werks: "",
				Lgort: "",
				Matnr: "",
				Txz01: "",
				Menge: "",
				Meins: "",
				Preis: "",
				Peinh: "1",
				Waers: "JPY",
				Zconsumtax: "",
				Zsubtotal: "",
				Lifnr: "",
				Lifnrname: "",
				Lfdat: null,
				Saknr: "",
				Kostl: "",
				Zremarks: "",
				Zzhje: "",
				Zvat: "",
				Loekz: false,
				Ebeln: "",
				Ebelp: "",
				Ernam: "",
				Erdat: null,
				Erzet: null,
				Aenam: "",
				Aedat: null,
				Aezet: null,
				Banfn: "",
				Bnfpo: "",
				Msgtype: "",
				Message: ""
			};

			if (index === -1) {
				//appends
				aItem.push(oRow);
			} else {
				//insert
				index++;
				aItem.splice(index, 0, oRow);
			}
			this.onItemChange();
			this.getModel("local").refresh();

		},

		onDeleteRow: function(oEvent) {
			var oHeader = this.getModel("local").getProperty("/ZzHeader");
			if (oHeader.Zspzt !== "0000" && oHeader.Zspzt !== "7777") {
				MessageBox.error(this.getI18nBundle().getText("msginApproval"));
				return;
			}
			var aItem = this.getModel("local").getProperty("/ZzItem");
			var index = oEvent.getSource().getParent().getIndex();
			if (aItem[index].Banfn !== "") {
				MessageBox.error(this.getI18nBundle().getText("msgSAPPRExist"));
				return;
			}

			if (index !== -1) {
				aItem.splice(index, 1);
				this.onItemChange();
				this.getModel("local").refresh();
			}

		},

		onDelCheckBoxSelect: function(oEvent) {
			var oHeader = this.getModel("local").getProperty("/ZzHeader");
			if (oHeader.Zspzt !== "0000" && oHeader.Zspzt !== "7777") {
				MessageBox.error(this.getI18nBundle().getText("msginApproval"));
				return;
			}
			var aItem = this.getModel("local").getProperty("/ZzItem");
			var index = oEvent.getSource().getParent().getIndex();
			if (aItem[index].Ebeln !== "" && aItem[index].Loekz === true) {
				MessageBox.error(this.getI18nBundle().getText("msgSAPPRExist"));
				aItem[index].Loekz = false;
				return;
			}
			this.onItemChange();
			this.getModel("local").refresh();
		},

		setBusy: function(bFlag) {
			this.getModel("settings").setProperty("/appProperties/busy", bFlag);
			this.getModel("settings").refresh();
		},

		onSendToApprove1: function() {
			var that = this;
			var oHeader = that.getModel("local").getProperty("/ZzHeader");
			//if (!oHeader.Zbanfn) {
			that.getModel("local").setProperty("/ZzHeader/Zzaction", "A");
			that._getPostData();
			//} else {
			//	that.onSendToApprove();
			//}
		},
		onSendToApprove: function() {
			var that = this;
			var oHeader = this.getModel("local").getProperty("/ZzHeader");
			if (!oHeader.Zbanfn) {
				MessageBox.error(this.getI18nBundle().getText("msgSaveDataFirst"));
				return;
			}

			if (oHeader.Loekz === "X" || oHeader.Loekz === true) {
				MessageBox.error(this.getI18nBundle().getText("msgPRDelete"));
				return;
			}

			if (oHeader.Zspzt !== "0000" && oHeader.Zspzt !== "7777") {
				MessageBox.error(this.getI18nBundle().getText("msginApproval"));
				return;
			}

			MessageBox.warning(this.getI18nBundle().getText("msgSendToApproveConfirm"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: function(sAction) {
					if (sAction === "CANCEL") {
						return;
					} else {
						var mParams = {
							urlParameters: {
								"Zbanfn": oHeader.Zbanfn,
								"Zspzt": "0010",
								"Zfinish": oHeader.Zfinish,
								"Loekz": this.convertbooltostring(oHeader.Loekz)
							},
							success: function(oData, response) {
								// this.getView().byId("SFB").search(true);
								this.getModel("local").setProperty("/ZzHeader/Zspzt", "0010");
								this.getModel("local").setProperty("/ZzHeader/ZspztText", "提出済み");
								this.getModel("local").setProperty("/ZzHeader/Banfn", oData.Banfn);
								this.getModel("local").refresh();
								MessageBox.success("msgApproveSubmitSuccessfully");

							}.bind(this),
							error: function(oError) {
								var sErrorMessage;
								try {
									var oJsonMessage = JSON.parse(oError.responseText);
									sErrorMessage = oJsonMessage.error.message.value;
								} catch (e) {
									sErrorMessage = oError.responseText;
								}

								MessageBox.error(sErrorMessage);
							}.bind(this)
						};
						that.getModel().callFunction("/updateApprovalStatus", mParams);
					}
				}.bind(this)
			});
		},

		//Click the delete button
		onDelete: function() {
			var oHeader = this.getModel("local").getProperty("/ZzHeader");
			var aItem = this.getModel("local").getProperty("/ZzItem");
			var bFlag = false;
			if (oHeader.Loekz === "X" || oHeader.Loekz === true) {
				MessageBox.error(this.getI18nBundle().getText("msgAlreadyDelete"));
				return;
			}

			if (!oHeader.Zbanfn) {
				MessageBox.error(this.getI18nBundle().getText("msgSaveDataFirst"));
				return;
			}

			if (oHeader.Zspzt !== "0000" && oHeader.Zspzt !== "7777") {
				MessageBox.error(this.getI18nBundle().getText("msginApproval"));
				return;
			}

			for (var i = 0; i < aItem.length; i++) {
				if (aItem[i].Ebeln !== "") {
					MessageBox.error(this.getI18nBundle().getText("msgSAPPRExist"));
					bFlag = true;
					break;
				}
			}

			if (bFlag) {
				return;
			}

			MessageBox.warning(this.getI18nBundle().getText("msgDeleteConfirm"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: function(sAction) {
					//MessageToast.show("Action selected: " + sAction);
					if (sAction === "CANCEL") {
						return;
					} else {
						this.setBusy(true);
						var mParams = {
							urlParameters: {
								"Zbanfn": oHeader.Zbanfn,
								"Zspzt": oHeader.Zspzt,
								"Zfinish": oHeader.Zfinish,
								"Loekz": "X"
							},
							success: function(oData, response) {
								// this.getView().byId("SFB").search(true);
								this.getModel("local").setProperty("/ZzHeader/Loekz", true);
								this.getModel("local").refresh();
								MessageBox.success(this.getI18nBundle().getText("msgDeleteSuccessfully"));
								this.setBusy(false);
							}.bind(this),
							error: function(oError) {
								var sErrorMessage;
								try {
									var oJsonMessage = JSON.parse(oError.responseText);
									sErrorMessage = oJsonMessage.error.message.value;
								} catch (e) {
									sErrorMessage = oError.responseText;
								}
								MessageBox.error(sErrorMessage);
								this.setBusy(false);
							}.bind(this)
						};
						this.getModel().callFunction("/updateApprovalStatus", mParams);
					}
				}.bind(this)
			});
		},

		_handleError: function(error) {
			this.setBusy(false);
			MessageBox.error(error.toLocaleString());
		},

		onRecallApprove: function() {
			MessageBox.information(this.getI18nBundle().getText("to be designed..."));
			return;
		},

		onAddAttachment: function(oEvent) {
			var sZbanfn = this.getModel("local").getProperty("/ZzHeader/Zbanfn");
			if (!sZbanfn) {
				MessageBox.error(this.getI18nBundle().getText("msgSaveDataFirst"));
				return;
			}
			this.onOpenUploadWindow();
		},

		onAttachmentPress: function(oEvent) {
			var Zbanfn = this.getModel("local").getProperty("/ZzHeader/Zbanfn");
			var fileName = oEvent.getSource().getProperty("title");
			var url = "/sap/opu/odata/SAP/ZUI5_FILE_UPLOAD_N_SRV";
			if (fileName !== undefined && fileName != null) {
				url = url + "/UploadSet(Objtype='01',Objectid=" + "'" + Zbanfn + "'" + ",Filename=" + "'" + fileName + "'" + ")/$value";
				window.open(url, "_blank");
			}

		},

		onAttachmentDelete: function(oEvent) {
			var that = this;
			var Zbanfn = that.getModel("local").getProperty("/ZzHeader/Zbanfn");
			var fileName = oEvent.getParameters().listItem.getProperty("title");
			var bEditable = that.getModel("local").getProperty("/editCreate");
			if (!bEditable) {
				return;
			}

			MessageBox.warning(that.getI18nBundle().getText("msgDeleteFileConfirm"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: function(sAction) {
					if (sAction === "CANCEL") {
						return;
					} else {
						var mParams = {
							urlParameters: {
								"Objtype": "01",
								"Objectid": Zbanfn,
								"Filename": fileName
							},
							success: function(oData, response) {
								var aAtta = that.getModel("local").getProperty("/ZzAttachment");
								var index = -1;
								for (var i = 0; i < aAtta.length; i++) {
									if (aAtta[i].Filename === fileName) {
										index = i;
										break;
									}
								}

								if (index !== -1) {
									aAtta.splice(index, 1);
									this.getModel("local").refresh();
								}
								MessageBox.success(this.getI18nBundle().getText("msgDeleteSuccessfully"));

							}.bind(this),
							error: function(oError) {
								var sErrorMessage;
								try {
									var oJsonMessage = JSON.parse(oError.responseText);
									sErrorMessage = oJsonMessage.error.message.value;
								} catch (e) {
									sErrorMessage = oError.responseText;
								}

								MessageBox.error(sErrorMessage);
							}.bind(this)
						};
						that.getModel("Attachment").callFunction("/deleteFile", mParams);
					}
				}.bind(this)
			});
		},

		onPDFPrint: function(oEvent) {
			var sZbanfn = this.getModel("local").getProperty("/ZzHeader/Zbanfn");
			if (!sZbanfn) {
				MessageBox.error(this.getI18nBundle().getText("msgSaveDataFirst"));
				return;
			}
			var sUrl = "/sap/opu/odata/sap/ZZPURCHASEREQUEST_SRV/ExportSet(Zbanfn='" + sZbanfn + "')/$value";
			window.open(sUrl, "_blank");
		},

		showCustomSearchHelpDialog: function(oContext, oEvent, sTitle, sViewName, sEntitySet, sBindingField, aFilters) {
			oContext._inputSource = oEvent.getSource();
			//oContext._aFilters = aFilters;
			oContext._sEntitySet = sEntitySet;
			oContext._sBindingField = sBindingField;
			oContext.loadFragment({
				name: sViewName
			}).then(function(oDialog) {
				oDialog.open();
				//var oSmartFilter = oContext.byId("smartFilter");
				//oSmartFilter.setEntitySet(oContext._sEntitySet);
				//var oSmartTable = oContext.byId("smartTable");
				//oSmartTable.setEntitySet(oContext._sEntitySet);
				//oContext.byId("dialogSelect").setTitle(sTitle);
			}.bind(oContext));
		},

		/*	onRebingTable: function(oEvent) {
				var binding = oEvent.getParameter("bindingParams");
				var oFilter;
				for (var o of this._aFilters) {
					oFilter = new sap.ui.model.Filter(o.field, sap.ui.model.FilterOperator.EQ, o.value);
					binding.filters.push(oFilter);
				}
			},*/

		onSelectLine: function(oEvent) {
			var data;
			if (oEvent.sId === 'cellClick') {
				data = oEvent.mParameters.rowBindingContext.getObject();
			} else {
				data = oEvent.getParameter("rowContext").getObject();
			}

			if (data && data[this._sBindingField]) {
				if (this._inputSource) {
					this._inputSource.setValue(data[this._sBindingField]);
					this._inputSource.fireChange({});
				}
			}

			this.onCloseSearchDialog();
		},

		onSelectLineMatnr: function(oEvent) {
			var data;
			if (oEvent.sId === 'cellClick') {
				data = oEvent.mParameters.rowBindingContext.getObject();
			} else {
				data = oEvent.getParameter("rowContext").getObject();
			}

			if (data && data[this._sBindingField]) {
				if (this._inputSource) {
					this._inputSource.setValue(data[this._sBindingField]);
					this._inputSource.getBindingContext("local").getObject().Txz01 = data.Maktg;
					this._inputSource.fireChange({});
				}
			}

			this.onCloseSearchDialog();
		},

		onSelectLineLifnr: function(oEvent) {
			var data;
			if (oEvent.sId === 'cellClick') {
				data = oEvent.mParameters.rowBindingContext.getObject();
			} else {
				data = oEvent.getParameter("rowContext").getObject();
			}

			if (data && data[this._sBindingField]) {
				if (this._inputSource) {
					this._inputSource.setValue(data[this._sBindingField]);
					this._inputSource.getBindingContext("local").getObject().Lifnrname = data.Mcod1;
					this._inputSource.fireChange({});
				}
			}

			this.onCloseSearchDialog();
		},

		onCloseSearchDialog: function() {
			this.byId("dialogSelect").close();
			this.byId("dialogSelect").destroy();
		},

		onShowCompanyHelp: function(oEvent) {
			//this.getOwnerComponent().loadFragment( "MMPurchaseRequest.fragment.SearchHelp" );

			var aFilters = [];
			/*		this.showCustomSearchHelpDialog(
						this,
						oEvent,
						this.getI18nBundle().getText("Bukrs"),
						"MMPurchaseRequest.fragment.SearchHelp",
						"HT001Set",
						"Bukrs",
						aFilters);*/

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Bukrs"),
				"MMPurchaseRequest.fragment.HT001SearchHelp",
				"HT001Set",
				"Bukrs",
				aFilters);
		},

		onShowEkgrpHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Ekgrp"),
				"MMPurchaseRequest.fragment.HT024SearchHelp",
				"HT024Set",
				"Ekgrp",
				aFilters);
		},

		onShowBsartHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Bsart"),
				"MMPurchaseRequest.fragment.HT161SearchHelp",
				"HT161Set",
				"Bsart",
				aFilters);
		},

		onShowWerksHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Werks"),
				"MMPurchaseRequest.fragment.HT001wSearchHelp",
				"HT001wSet",
				"Werks",
				aFilters);
		},

		onShowMatnrHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Matnr"),
				"MMPurchaseRequest.fragment.Mat1wSearchHelp",
				"Mat1wSet",
				"Matnr",
				aFilters);
		},

		onShowLifnrHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Lifnr"),
				"MMPurchaseRequest.fragment.KredaSearchHelp",
				"KredaSet",
				"Lifnr",
				aFilters);
		},

		onShowLgortHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Lgort"),
				"MMPurchaseRequest.fragment.HT001lSearchHelp",
				"HT001lSet",
				"Lgort",
				aFilters);
		},

		onShowMatklHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Matkl"),
				"MMPurchaseRequest.fragment.HT023SearchHelp",
				"HT023Set",
				"Matkl",
				aFilters);
		},

		onShowMeinsHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Meins"),
				"MMPurchaseRequest.fragment.HT006SearchHelp",
				"HT006Set",
				"Msehi",
				aFilters);
		},

		onShowSaknrHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Saknr"),
				"MMPurchaseRequest.fragment.ZzSHSaknrSearchHelp",
				"ZzSHSaknrSet",
				"Saknr",
				aFilters);
		},

		onShowKostlHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Kostl"),
				"MMPurchaseRequest.fragment.KostnSearchHelp",
				"KostnSet",
				"Kostl",
				aFilters);
		},

		onShowDepartmentHelp: function(oEvent) {
			var aFilters = [];

			this.showCustomSearchHelpDialog(
				this,
				oEvent,
				this.getI18nBundle().getText("Department"),
				"MMPurchaseRequest.fragment.DepartmentSearchHelp",
				"ZzDepartmentVHSet",
				"Department",
				aFilters);
		},

		onOpenUploadWindow: function() {
			if (!this.pDialog) {
				this.pDialog = this.loadFragment({
					name: "MMPurchaseRequest.fragment.Upload"
				});
			}

			this.pDialog.then(function(oDialog) {
				oDialog.open();
			});
		},

		onUploadFile: function() {
			var that = this;
			var oFileUploader = this.byId("fileUploader");
			var oModel = this.getView().getModel("Attachment");
			var sZbanfn = this.getModel("local").getProperty("/ZzHeader/Zbanfn");
			var sFileName = encodeURIComponent(oFileUploader.getValue());
			if (!sFileName) {
				MessageBox.error(this.getI18nBundle().getText("msgSelectFileFirst"));
				return;
			}

			//删除所有header parameter，防止重复添加导致csrf token错误
			oFileUploader.destroyHeaderParameters();

			oFileUploader.checkFileReadable().then(function() {
				oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
					name: "SLUG",
					value: sFileName
				}));

				oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
					name: "ATTACHMENTOBJECTID",
					value: sZbanfn
				}));

				oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
					name: "ATTACHMENTOBJECTTYPE",
					value: "01" //01 PR假保存 
				}));

				oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
					name: "x-csrf-token",
					value: oModel.getSecurityToken()
				}));

				oFileUploader.setSendXHR(true);
				oFileUploader.upload();
			}, function(error) {
				MessageBox.success(that.getI18nBundle().getText("msgFailedtoFileUpload"));
			}).then(function() {
				oFileUploader.clear();
			});
		},

		onUploadStart: function() {
			this.byId("fileUploader").setBusy(true);
		},

		onUploadComplete: function() {
			this.byId("fileUploader").setBusy(false);
			this.byId("uploadDialog").close();
			this.getView().getModel().refresh();
			this.getAttachment();
			this.getModel("local").refresh();
			MessageBox.success(this.getI18nBundle().getText("msgFileUploadSuccessfully"));
		},

		onClose: function() {
			this.byId("uploadDialog").close();
		}

	});
});