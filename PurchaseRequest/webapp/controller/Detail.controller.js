sap.ui.define([
    "./Base",
    "sap/m/MessageBox",
    "MMPurchaseRequest/model/formatter",
    "./messages",
    "sap/m/Button",
    "sap/ui/model/Filter"
], function(Base, MessageBox, formatter, messages, Button, Filter) {

    "use strict";
    return Base.extend("MMPurchaseRequest.controller.Detail", {
        formatter: formatter,

        /**
         * Init Function of view
         * set message model and message manager
         */
        onInit: function() {
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oData = this.getOwnerComponent().getModel();
            this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this.getView().setModel(this._oData);
            // post data
            this._postData = [];
            //this.byId("page").setTitle("test");


            var oRouter = this.getRouter();
            oRouter.getRoute("Detail").attachMatched(this._onRouteMatched, this);

            this._oData.setDeferredGroups(["changes"]);
        },

        _onRouteMatched: function(oEvent) {

            if (this._LocalData.getProperty("/viewModel") == "C") {
                this._LocalData.setProperty("/editCreate", true);
            } else if (this._LocalData.getProperty("/viewModel") == "D") {
                this._LocalData.setProperty("/editCreate", false);
                this.byId("idChange").setText(this._ResourceBundle.getText("ChangeButton"));
            }

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

            // if (oHeader.Department === "") {
            // 	MessageBox.error(this.getI18nBundle().getText("msgDepartmentIsEmpty"));
            // 	return;
            // }

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

                if (aItem[i].Tzx01 === "") {
                    MessageBox.error(this.getI18nBundle().getText("msgTxz01IsEmpty"));
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

                if (aItem[i].Meins === "") {
                    MessageBox.error(this.getI18nBundle().getText("msgMeinsIsEmpty"));
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

                if (aItem[i].Saknr === "") {
                    MessageBox.error(this.getI18nBundle().getText("msgSaknrIsEmpty"));
                    bHasError = true;
                    break;
                }

                if (aItem[i].Kostl === "") {
                    MessageBox.error(this.getI18nBundle().getText("msgKostlIsEmpty"));
                    bHasError = true;
                    break;
                }

                //ADD BY STANLEY 20250814
                if(String(aItem[i].Preis).includes('.')){
                    MessageBox.error(this.getI18nBundle().getText("msgPreisIsError"));
                    bHasError = true;
                    break;
                }
                //END ADD

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
                    Department: oHeader.Department,
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

        getLifnrname: function(sSupplier) {
            if (sSupplier) {
                var sBukrs = this.getOwnerComponent().getModel("local").getProperty("/ZzHeader/Bukrs");
                var promise = new Promise(function(resolve, reject) {
                    var aFilter = [new Filter("Lifnr", "EQ", sSupplier), new Filter("Bukrs", "EQ", sBukrs), ];
                    var mParameters = {
                        filters: aFilter,
                        success: function(oData) {
                            resolve(oData.results);
                            if (oData.results[0]) {}
                        }.bind(this),
                        error: function(oError) {
                            messages.showError(messages.parseErrors(oError));
                        }.bind(this)
                    }
                    this.getOwnerComponent().getModel().read("/KredaSet", mParameters);
                }.bind(this));
                return promise.then(function(res) {
                    if (res[0]) {
                        return res[0].Mcod1;
                    } else {
                        return sSupplier
                    }
                })
            }

        },

        onItemChange: function(oEvent, field) {
            //手动修改物料时 取描述
            if (oEvent && oEvent.getParameter("value") && field) {
                var sPath = oEvent.getSource().getBindingContext("local").sPath;
                switch (field) {
                    case "Matnr":
                        var sMaterial = oEvent.getParameter("value");
                        if (sMaterial) {
                            this.getOwnerComponent().getModel("local").setProperty(sPath + "/Txz01", "");
                            var sPlant = oEvent.getSource().getBindingContext("local").getObject().Werks;
                            var aFilter = [new Filter("Matnr", "EQ", sMaterial)];
                            if (sPlant) {
                                aFilter.push(new Filter("Werks", "EQ", sPlant));
                            }
                            var mParameters = {
                                filters: aFilter,
                                success: function(oData) {
                                    if (oData.results[0]) {
                                        this.getOwnerComponent().getModel("local").setProperty(sPath + "/Txz01", oData.results[0].Maktg);
                                    }
                                }.bind(this),
                                error: function(oError) {
                                    messages.showError(messages.parseErrors(oError));
                                }.bind(this)
                            }
                            this.getOwnerComponent().getModel().read("/Mat1wSet", mParameters)
                        }
                        break;
                    case "Lifnr":
                        var sSupplier = oEvent.getParameter("value");
                        if (sSupplier) {
                            this.getOwnerComponent().getModel("local").setProperty(sPath + "/Lifnrname", "");
                            var sPlant = oEvent.getSource().getBindingContext("local").getObject().Werks;
                            var aFilter = [new Filter("Lifnr", "EQ", sSupplier)];
                            if (sPlant) {
                                aFilter.push(new Filter("Bukrs", "EQ", sPlant));
                            }
                            var mParameters = {
                                filters: aFilter,
                                success: function(oData) {
                                    if (oData.results[0]) {
                                        this.getOwnerComponent().getModel("local").setProperty(sPath + "/Lifnrname", oData.results[0].Mcod1);
                                    }
                                }.bind(this),
                                error: function(oError) {
                                    messages.showError(messages.parseErrors(oError));
                                }.bind(this)
                            }
                            this.getOwnerComponent().getModel().read("/KredaSet", mParameters)
                        }
                        break;
                }

            }

            var oHeader = this.getModel("local").getProperty("/ZzHeader");
            var aItem = this.getModel("local").getProperty("/ZzItem");
            var aSum = this.getModel("local").getProperty("/ZzSum");
            var aCalc = [];
            var bExistFalg = false;
            var iZestvat = "0";
            var iZnetvalue = 0;
            var iMenge = 0;
            var iPreis = 0;
            var iTax = 0;

            var iPeinh = 1;
            var iConsumtaxSum = 0;
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

                    //add by stanley 20250801


                    if(oItem.Ztax !== 0){
                        iTax = oItem.Ztax / 100;
                    }
                    if(oEvent && field == "Ztax"){
                        //var iTaxLabel = oEvent.getParameters().selectedItem.mProperties.key;
                        switch(oItem.Ztax){
                            case "0":
                                iTax = 0;
                                break;
                            case "8":
                                iTax = 0.08;
                                break;
                            case "10":
                                iTax = 0.10;
                                break;

                        }


                    }
                    oItem.Ztax = parseInt(oItem.Ztax,10);
            
            

                    //end add

                    iMenge = oItem.Menge;
                    iPreis = oItem.Preis;
                    iPeinh = oItem.Peinh;

                    iZnetvalue = iMenge * iPreis;
                    iZnetvalue = iZnetvalue / iPeinh;
                    iZnetvalue = Number(iZnetvalue).toFixed(0);

                    // 明细行单个数量的税
                    //Del by stanley 20250801
                    //oItem.Zconsumtax = iPreis * 0.1;
                    //Add by stanley 20250801
                    oItem.Zconsumtax = Number(iPreis * iTax / iPeinh).toFixed(0);
                    // 明细行所有数量的税，本来在这里乘1.1的，但是现在明细行不显示了，所以在最后计算，减少合计误差
                    // iConsumtaxSum = iPreis * 0.1 * iMenge / iPeinh;
                    iConsumtaxSum = iPreis * iMenge / iPeinh;
                    iConsumtaxSum = Number(iConsumtaxSum).toFixed(2);
                    // oItem.Zsubtotal = iPreis * 1.1 * iMenge / iPeinh;
                    // 明细行的含税金额，本来在这里乘1.1的，但是现在明细行不显示了，所以在最后计算，减少合计误差
                    oItem.Zsubtotal = iPreis * iMenge / iPeinh;
                    // Change BY STANLEY 20250802 税率根据选择的税率来计算
                    //oItem.Zvat = iPreis * 1.1;
                    oItem.Zvat = Number(iPreis * iMenge * iTax / iPeinh).toFixed(0);
                    //End change

                    //oItem.Zconsumtax = oItem.Zconsumtax;
                    oItem.Zsubtotal = oItem.Zsubtotal.toFixed(0);
                    //oItem.Zvat = oItem.Zvat;
                    oItem.Zzhje = formatter.clearCommaToNumber(oItem.Zzhje).toFixed(0);

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
                    /* del by stanley 202030313
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
            } */

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
                            Ztax: oItem.Ztax,
                            Zzhje: oItem.Zzhje,
                            Zvat: oItem.Zvat
                        };
                        aCalc.push(oSumData);
                    }
                }
            }.bind(this));
            for (var i = 0; i < aCalc.length; i++) {
                aCalc[i].Znetvalue = formatter.clearCommaToNumber(aCalc[i].Znetvalue);
                //合计表的 税额（每行合计之后在这里计算税，减少误差）
                //Changed by stanley 20250802 根据选择税率机损
                //aCalc[i].Zconsumtax = (formatter.clearCommaToNumber(aCalc[i].Zconsumtax) * 0.1).toFixed(0);
                  aCalc[i].Zconsumtax = aCalc[i].Zvat;
                //End Changed

                //合计表的 含税金额（每行合计之后在这里计算税，减少误差）
                //Changed by stanley 20250802 根据选择税率
                //aCalc[i].Zsubtotal = (formatter.clearCommaToNumber(aCalc[i].Zsubtotal) * 1.1).toFixed(0);
                aCalc[i].Zsubtotal = (formatter.clearCommaToNumber(aCalc[i].Zsubtotal) + formatter.clearCommaToNumber(aCalc[i].Zvat));
                //END Changed
                aCalc[i].Zestvat = formatter.clearCommaToNumber(aCalc[i].Zestvat);
                aCalc[i].Zzhje = formatter.clearCommaToNumber(aCalc[i].Zzhje);
                aCalc[i].Zvat = formatter.clearCommaToNumber(aCalc[i].Zvat);

                aCalc[i].Znetvalue = formatter.amountFormat(aCalc[i].Znetvalue);
                //aCalc[i].Zconsumtax = formatter.amountFormat(aCalc[i].Zconsumtax);
                aCalc[i].Zconsumtax = aCalc[i].Zconsumtax;
                aCalc[i].Zsubtotal = formatter.amountFormat(aCalc[i].Zsubtotal);
                aCalc[i].Zestvat = formatter.amountFormat(aCalc[i].Zestvat);
                aCalc[i].Zzhje = formatter.amountFormat(aCalc[i].Zzhje);
                aCalc[i].Zvat = formatter.amountFormat(aCalc[i].Zvat);

            }
            // 金额合计 add by zk 
            this.itemSum(aCalc);
            this.getModel("local").setProperty("/ZzSum", aCalc);
            this.getModel("local").refresh();
        },

        //金额合计
        itemSum: function(aItem) {
            var total1 = 0,
                total2 = 0,
                total3 = 0,
                total4 = 0;

            aItem.forEach(function(item) {
                var Znetvalue = formatter.clearCommaToNumber(item.Znetvalue);
                var Zsubtotal = formatter.clearCommaToNumber(item.Zsubtotal);
                var Zconsumtax = formatter.clearCommaToNumber(item.Zconsumtax);
                //税抜総額 = 合计：税抜小計金額
                total1 = this.formatter.accAdd(total1, Znetvalue);
                //税込総額 = 合计：税込小計金額
                total2 = this.formatter.accAdd(total2, Zsubtotal);
                //消費税総額
                total3 = this.formatter.accAdd(total3, Zconsumtax);
            }.bind(this));

            // aItem.forEach(function (item) {
            // 	var Menge = formatter.clearCommaToNumber(item.Menge);
            // 	var Preis = formatter.clearCommaToNumber(item.Preis);
            // 	var Peinh = formatter.clearCommaToNumber(item.Peinh);
            // 	var Zvat = formatter.clearCommaToNumber(item.Zvat);
            // 	var Zconsumtax = formatter.clearCommaToNumber(item.Zconsumtax);
            // 	var Zzhje = formatter.clearCommaToNumber(item.Zzhje);

            // 	//金额合计
            // 	//税抜総額
            // 	var amount1 = 0;
            // 	amount1 = this.formatter.accMul(Menge, Preis);
            // 	total1 = this.formatter.accAdd(total1, amount1);
            // 	//税込総額
            // 	amount1 = 0;
            // 	amount1 = this.formatter.accMul(Menge, Zvat);
            // 	total2 = this.formatter.accAdd(total2, amount1);
            // 	//消費税総額
            // 	amount1 = 0;
            // 	amount1 = this.formatter.accMul(Menge, Zconsumtax);
            // 	total3 = this.formatter.accAdd(total3, amount1);
            // 	//値引き後総額
            // 	total4 = this.formatter.accAdd(total4, Zzhje);
            // }.bind(this));
            this.getModel("local").setProperty("/total1", formatter.amountFormat(total1));
            this.getModel("local").setProperty("/total2", formatter.amountFormat(total2));
            this.getModel("local").setProperty("/total3", formatter.amountFormat(total3));
            // this.getModel("local").setProperty("/total4", formatter.amountFormat(total4));
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

            // 納入日付 Lfdat
            var dLfdat = this._LocalData.getProperty("/ZzHeader/Badat");
            dLfdat = new Date(dLfdat);
            dLfdat.setDate(dLfdat.getDate() + 7);
            dLfdat = dLfdat.toLocaleDateString("ja");
            var sPlant = this._LocalData.getProperty("/ZzHeader/Bukrs");
            var oRow = {
                Zbanfn: this.getModel("local").getProperty("/ZzHeader/Zbanfn"),
                //Zbnfpo: iItemNo.toString(),
                Zbnfpo: sItemNo,
                Knttp: "K",
                Werks: sPlant,
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
                Lfdat: dLfdat,
                Saknr: "",
                Kostl: "",
                Zremarks: "",
                Zzhje: "",
                Zvat: "",
                Ztax: "",
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

        onCopyRow: function(oEvent) {
            var aItem = this.getModel("local").getProperty("/ZzItem");
            var index = this.getView().byId("tableItem").getSelectedIndex();
            var oRow = {};
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


            //ADD BY STANLEY 20230410
            if (index !== -1) {
                Object.assign(oRow, aItem[index]);
                oRow.Zbnfpo = sItemNo;
            }
            if (index === -1) {
                //error
                MessageBox.error(this.getI18nBundle().getText("msgSelectOneLine"));
                return;
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
            this._LocalData.setProperty("/dailogOpen", true);
            if (this.byId("dialogSelect")) {
                this.byId("dialogSelect").close();
                this.byId("dialogSelect").destroy();
            }
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

        //采购组搜索帮助联动过滤
        onRebingTableT024: function(oEvent) {
            if (this._LocalData.getProperty("/dailogOpen")) {
                this._LocalData.setProperty("/dailogOpen", false);
            } else {
                return;
            }
            var sValue1 = this._LocalData.getProperty("/ZzHeader/Bukrs");
            if (sValue1) {
                var binding = oEvent.getParameter("bindingParams");
                var oFilter;
                oFilter = new sap.ui.model.Filter("Bukrs", sap.ui.model.FilterOperator.EQ, sValue1);
                binding.filters.push(oFilter);

                var oFilterData = {
                    "Bukrs": {
                        "ranges": [{ "exclude": false, "operation": "EQ", "value1": sValue1, "tokenText": "=" + sValue1 }]
                    }

                };
                this.byId("smartFilter").setFilterData(oFilterData);
            }
        },
        //采购订单类型搜索帮助联动过滤
        onRebingTableT161: function(oEvent) {
            if (this._LocalData.getProperty("/dailogOpen")) {
                this._LocalData.setProperty("/dailogOpen", false);
            } else {
                return;
            }
            var oFilterData = {};
            var sValue1 = this._LocalData.getProperty("/ZzHeader/Bukrs");
            if (sValue1) {
                var binding = oEvent.getParameter("bindingParams");
                var oFilter;
                oFilter = new sap.ui.model.Filter("Bukrs", sap.ui.model.FilterOperator.EQ, sValue1);
                binding.filters.push(oFilter);
                oFilterData["Bukrs"] = {
                    "ranges": [{ "exclude": false, "operation": "EQ", "value1": sValue1, "tokenText": "=" + sValue1 }]
                };

            }
            var sValue2 = this._LocalData.getProperty("/ZzHeader/Ekgrp");
            if (sValue2) {
                var binding = oEvent.getParameter("bindingParams");
                var oFilter;
                oFilter = new sap.ui.model.Filter("Ekgrp", sap.ui.model.FilterOperator.EQ, sValue2);
                binding.filters.push(oFilter);

                oFilterData["Ekgrp"] = {
                    "ranges": [{ "exclude": false, "operation": "EQ", "value1": sValue2, "tokenText": "=" + sValue2 }]
                };

            }
            if (sValue1 || sValue2) {
                this.byId("smartFilter").setFilterData(oFilterData);
            }

        },
        //物料联动搜索帮助（工厂）
        onRebingTableMat1: function(oEvent) {
            if (this._LocalData.getProperty("/dailogOpen")) {
                this._LocalData.setProperty("/dailogOpen", false);
            } else {
                return;
            }
            var oFilterData = {};
            // 工厂等于公司代码
            var sValue1 = this._LocalData.getProperty("/ZzHeader/Bukrs");
            if (sValue1) {
                var binding = oEvent.getParameter("bindingParams");

                var oFilter;
                oFilter = new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, sValue1);

                binding.filters.push(oFilter);
                oFilterData["Werks"] = {
                    "ranges": [{ "exclude": false, "operation": "EQ", "value1": sValue1, "tokenText": "=" + sValue1 }]
                };

            }
            if (sValue1) {
                this.byId("smartFilter").setFilterData(oFilterData);
            }
        },
        //供应商联动搜索帮助（工厂）
        onRebingTableKreda: function(oEvent) {
            if (this._LocalData.getProperty("/dailogOpen")) {
                this._LocalData.setProperty("/dailogOpen", false);
            } else {
                return;
            }
            var oFilterData = {};
            // 工厂等于公司代码
            var sValue1 = this._LocalData.getProperty("/ZzHeader/Bukrs");
            if (sValue1) {
                var binding = oEvent.getParameter("bindingParams");
                var oFilter;
                oFilter = new sap.ui.model.Filter("Bukrs", sap.ui.model.FilterOperator.EQ, sValue1);
                binding.filters.push(oFilter);
                oFilterData["Bukrs"] = {
                    "ranges": [{ "exclude": false, "operation": "EQ", "value1": sValue1, "tokenText": "=" + sValue1 }]
                };

            }
            if (sValue1) {
                this.byId("smartFilter").setFilterData(oFilterData);
            }
        },
        //成本中心联动搜索帮助（工厂）
        onRebingTableKostn: function(oEvent) {
            if (this._LocalData.getProperty("/dailogOpen")) {
                this._LocalData.setProperty("/dailogOpen", false);
            } else {
                return;
            }
            var oFilterData = {};
            // 工厂等于公司代码
            var sValue1 = this._LocalData.getProperty("/ZzHeader/Bukrs");
            if (sValue1) {
                var binding = oEvent.getParameter("bindingParams");
                var oFilter;
                oFilter = new sap.ui.model.Filter("Kokrs", sap.ui.model.FilterOperator.EQ, sValue1);
                binding.filters.push(oFilter);
                oFilterData["Kokrs"] = {
                    "ranges": [{ "exclude": false, "operation": "EQ", "value1": sValue1, "tokenText": "=" + sValue1 }]
                };

            }
            if (sValue1) {
                this.byId("smartFilter").setFilterData(oFilterData);
            }
        },

        onRebingTableT023: function(oEvent) {
            if (this._LocalData.getProperty("/dailogOpen")) {
                this._LocalData.setProperty("/dailogOpen", false);
            } else {
                return;
            }
            var oFilterData = {};
            // 工厂等于公司代码
            var sValue1 = this._LocalData.getProperty("/ZzHeader/Bukrs");
            if (sValue1) {
                var binding = oEvent.getParameter("bindingParams");
                var oFilter;
                oFilter = new sap.ui.model.Filter("Bukrs", sap.ui.model.FilterOperator.EQ, sValue1);
                binding.filters.push(oFilter);
                oFilterData["Bukrs"] = {
                    "ranges": [{ "exclude": false, "operation": "EQ", "value1": sValue1, "tokenText": "=" + sValue1 }]
                };

            }
            if (sValue1) {
                this.byId("smartFilter").setFilterData(oFilterData);
            }
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
        },

        onChangePress: function() {
            if (this.getModel("local").getProperty("/editCreate")) {
                this.getModel("local").setProperty("/editCreate", false);
                this.byId("idChange").setText(this._ResourceBundle.getText("ChangeButton"));
            } else {
                this.getModel("local").setProperty("/editCreate", true);
                this.byId("idChange").setText(this._ResourceBundle.getText("DisplayButton"));
            }
        },

        onVariantPress: function(oEvent) {
            var oButton = oEvent.getSource(),
                oView = this.getView();

            // create popover
            if (!this._pPopover) {
                this._pPopover = this.loadFragment({
                    name: "MMPurchaseRequest.fragment.VariantPopover"
                }).then(function(oPopover) {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }

            if (this.byId("variantlist")) {
                this.byId("variantlist").getBinding("items").refresh();
                // this.getVariant();
            }

            this._pPopover.then(function(oPopover) {
                oPopover.openBy(oButton);
            }.bind(this));

            // this.getVariant().then(function(res){
            // 	this._pPopover.then(function(oPopover){
            // 		oPopover.openBy(oButton);
            // 	}.bind(this));
            // }.bind(this));

        },

        getVariant: function() {
            var promise = new Promise(function(resolve, reject) {
                var mParameters = {
                    filters: [new Filter("Isfavorite", "EQ", true)],
                    success: function(oData) {
                        // resolve(oData.results);
                        this.byId("variantlist").getBinding("items").filter([new Filter("Isfavorite", "EQ", true)]);
                    }.bind(this),
                    error: function(oError) {
                        messages.showError(messages.parseErrors(oError));
                    }.bind(this)
                }
                this.getOwnerComponent().getModel().read("/ZzVariantSet", mParameters);
            }.bind(this));
            return promise;
        },

        onPressSaveAs: function() {
            if (!this.pVariantSaveDialog) {
                this.pVariantSaveDialog = this.loadFragment({
                    name: "MMPurchaseRequest.fragment.VariantSave"
                });
            }
            this.pVariantSaveDialog.then(function(oDialog) {
                var beginButton = new Button({
                    type: "Emphasized",
                    text: this._ResourceBundle.getText("save"),
                    //保存按钮
                    press: function() {
                        this.onSaveVariant().then(function(res) {
                            oDialog.close();
                        });
                    }.bind(this)
                });
                var endButton = new Button({
                    text: this._ResourceBundle.getText("cancel"),
                    press: function() {
                        oDialog.close();
                    }.bind(this)
                });
                // 添加按钮
                if (oDialog.getButtons().length === 0) {
                    oDialog.addButton(beginButton);
                    oDialog.addButton(endButton);
                }
                oDialog.open();
            }.bind(this));
        },

        onSaveVariant: function() {
            var variantName = this.byId("idVariantName").getValue();
            if (!variantName) {
                this.byId("idVariantName").focus();
                return;
            }
            // 后台检查有没有同名变式
            var promise = new Promise(function(resolve) {
                var sVariant = this.byId("idVariantName").getValue();
                var isGlobal = this.byId("idGobal").getSelected();
                if (isGlobal) {
                    isGlobal = "X";
                } else {
                    isGlobal = "";
                }
                this.checkVariant(sVariant, isGlobal).then(function(res) {
                    var oInput = this.byId("idVariantName");
                    if (res.length > 0) {
                        oInput.setValueState("Error");
                        oInput.setValueStateText(this._ResourceBundle.getText("msgPleaseEnterName"));
                    } else {
                        oInput.setValueState("None");
                        this.onPostVariant().then(function(res) {

                            resolve();
                        })
                    }
                }.bind(this));
            }.bind(this));

            return promise;
        },

        onPostVariant: function() {
            var oHeader = this._LocalData.getProperty("/ZzHeader");
            var postData = {
                Variant: this.byId("idVariantName").getValue(),
                Bukrs: oHeader.Bukrs,
                Ekgrp: oHeader.Ekgrp,
                Bsart: oHeader.Bsart,
                Department: oHeader.Department,
                Isglobal: this.byId("idGobal").getSelected(),
            };
            var promise = new Promise(function(resolve) {
                var mParameters = {
                    // refreshAfterChange:true,
                    success: function(oData) {
                        resolve();
                    }.bind(this),
                    error: function(oError) {
                        messages.showError(messages.parseErrors(oError));
                    }.bind(this),
                };
                this.getOwnerComponent().getModel().create("/ZzVariantSet", postData, mParameters);
            }.bind(this));
            return promise;
        },

        checkVariant: function(sVariant, isGlobal) {
            var aFilter = [new Filter("Variant", "EQ", sVariant)];
            var promise = new Promise(function(resolve, reject) {
                var mParameters = {
                    filters: aFilter,
                    success: function(oData) {
                        this.getOwnerComponent().getModel().setHeaders(null);
                        if (oData.results) {
                            resolve(oData.results);
                        } else {
                            resolve([]);
                        }
                    }.bind(this),
                    error: function(oError) {
                        this.getOwnerComponent().getModel().setHeaders(null);
                        messages.showError(messages.parseErrors(oError));
                    }.bind(this)
                }
                this.getOwnerComponent().getModel().setHeaders({ "action": "check", "isglobal": isGlobal })
                this.getOwnerComponent().getModel().read("/ZzVariantSet", mParameters);
            }.bind(this));
            return promise;
        },

        onVariantChange: function(oEvent) {
            var value = oEvent.getParameter("value");
            if (!value) {
                oEvent.getSource().setValueState("Error");
                oEvent.getSource().setValueStateText(this._ResourceBundle.getText("msgPleaseEnterName"));
            } else {
                oEvent.getSource().setValueState("None");
            }
        },

        onPressManage: function(oEvent) {
            this._oData.resetChanges(["/ZzVariantSet"], true);
            this._oData.resetChanges();
            // this._oData.setUseBatch(false);
            if (!this.pVariantManageDialog) {
                this.pVariantManageDialog = this.loadFragment({
                    name: "MMPurchaseRequest.fragment.VariantManage"
                });
            }
            if (this.byId("idManageTable")) {
                this.byId("idManageTable").getBinding("items").refresh();
            }
            this.pVariantManageDialog.then(function(oDialog) {
                var beginButton = new Button({
                    type: "Emphasized",
                    text: this._ResourceBundle.getText("save"),
                    //保存按钮
                    press: function() {
                        // submitchanges因为设置的原因不会调用回调函数，所以这段没有作用
                        // this.onSaveVariantChanges().then(function(res){
                        // 	var aItems = this.byId("idManageTable").getItems()
                        // 	if (aItems) {
                        // 		aItems.forEach(function (item) {
                        // 			item.setVisible(true);
                        // 		});
                        // 	}
                        // 	oDialog.close();
                        // }.bind(this));
                        this.onSaveVariantChanges()
                            // this._oData.setUseBatch(true);
                        oDialog.close();
                    }.bind(this)
                });
                var endButton = new Button({
                    text: this._ResourceBundle.getText("cancel"),
                    press: function() {
                        // this._oData.resetChanges(["/ZzVariantSet"],true);
                        this._oData.resetChanges(["/ZzVariantSet"], true);
                        oDialog.close();
                    }.bind(this)
                });
                // 添加按钮
                if (oDialog.getButtons().length === 0) {
                    oDialog.addButton(beginButton);
                    oDialog.addButton(endButton);
                }
                oDialog.open();
            }.bind(this));
        },

        onDeleteVariant: function(oEvent) {
            var sPath = oEvent.getSource().getBindingContext().sPath;
            this._oData.remove(sPath, { "groupId": "changes", "refreshAfterChange": true });
            oEvent.getSource().getParent().setVisible(false);
        },

        onSaveVariantChanges: function() {
            var promise = new Promise(function(resolve, reject) {
                var mParameters = {
                    // 由于之前设置了批处理模式setUseBatch(false)
                    // submitChanges在禁用批处理模式的情况想不会调用回调函数，所以这里的函数没有实际用处
                    success: function(oData) {
                        resolve();
                    }.bind(this),
                    error: function(oError) {
                        messages.showError(messages.parseErrors(oError));
                    }.bind(this)
                }
                this._oData.submitChanges(mParameters);
            }.bind(this));
            return promise;
        },

        manageTableChange: function(oEvent) {
            // oEvent.getSource().getBinding("items").refresh()
            // var aItems = oEvent.getSource().getItems();
            // if (aItems) {
            // 	aItems.forEach(function (item) {
            // 		item.setVisible(true);
            // 	});
            // }
        },

        onVariantManageOpened: function() {
            this._oData.updateBindings();
            var aItems = this.byId("idManageTable").getItems()
            if (aItems) {
                aItems.forEach(function(item) {
                    item.setVisible(true);
                });
            }
        },

        onPressFavorite: function(oEvent) {
            var sPath = oEvent.getSource().getBindingContext().sPath;
            this._oData.setProperty(sPath + "/Isfavorite", oEvent.getParameter("pressed"));
        },

        onVariantSelection: function(oEvent) {
            var oHeader = oEvent.getParameter("listItem").getBindingContext().getObject();
            this._LocalData.setProperty("/ZzHeader/Bukrs", oHeader.Bukrs);
            this._LocalData.setProperty("/ZzHeader/Ekgrp", oHeader.Ekgrp);
            this._LocalData.setProperty("/ZzHeader/Bsart", oHeader.Bsart);
            this._LocalData.setProperty("/ZzHeader/Department", oHeader.Department);
            this._LocalData.refresh();
            oEvent.getSource().getParent().getParent().close();
        },

        onTogglePublic: function(oEvent) {
            var sPath = oEvent.getSource().getBindingContext().sPath;
            sPath = sPath + "/Isglobal"
            this._oData.setProperty(sPath, oEvent.getParameter("pressed"));
        },

        onVariantNameChange: function(oEvent) {
            var oInput = oEvent.getSource();
            var sVariant = oEvent.getParameter("value");
            var isGlobal = oInput.getBindingContext().getObject().Isglobal;
            if (isGlobal) {
                isGlobal = "X";
            } else {
                isGlobal = "";
            }
            this.checkVariant(sVariant, isGlobal).then(function(res) {
                if (res.length > 0) {
                    //跳过自己本来名字
                    var isError = false;
                    res.forEach(function(e) {
                        if (e.Uuid !== oInput.getBindingContext().getObject().Uuid) {
                            isError = true;
                        }
                    })
                    if (isError) {
                        oInput.setValueState("Error");
                        oInput.setValueStateText(this._ResourceBundle.getText("msgPleaseEnterName"));
                    } else {
                        oInput.setValueState("None");
                    }
                } else {
                    oInput.setValueState("None");
                }
            }.bind(this));
        },
        onBukrsChange: function(oEvent) {
            var sPlant = this.getModel("local").getProperty("/ZzHeader/Bukrs");
            var aItem = this.getModel("local").getProperty("/ZzItem");
            aItem.forEach(function(item) {
                item.Werks = sPlant;
            });
        },

        toUpperCase: function(oEvent) {
            var sPath = oEvent.getSource().mBindingInfos.value.binding.sPath;
            var value = this._LocalData.getProperty(sPath);
            this._LocalData.setProperty(sPath, value.toUpperCase());

        },
        itemToUpperCase: function(oEvent) {
            var sPath = oEvent.getSource().getBindingContext("local");
            sPath = sPath + "/" + oEvent.getSource().mBindingInfos.value.binding.sPath;
            var value = this._LocalData.getProperty(sPath);
            this._LocalData.setProperty(sPath, value.toUpperCase());
        }
    });
});