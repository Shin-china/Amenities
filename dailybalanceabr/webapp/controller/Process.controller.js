sap.ui.define([
    "FICO/dailybalanceabr/controller/BaseController",
    "../model/formatter",
    "sap/m/Button",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "./messages",
    "sap/ui/model/Filter",
],
    function (BaseController, formatter, Button, MessageBox, JSONModel, messages, Filter) {
        "use strict";
        return BaseController.extend("FICO.dailybalanceabr.controller.Process", {
            formatter: formatter,
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
			    this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                this.InitModel = new JSONModel(sap.ui.require.toUrl("FICO/dailybalanceabr/model/CreateInit.json"));
                
                this._oDataModel.attachBatchRequestCompleted(function(oEvent){
                    this.setBusy(false);
                    var errors = this._LocalData.getProperty("/errors");
                    if(errors){
                        messages.showError(errors);
                    }
                    this._LocalData.setProperty("/errors", "");
                }.bind(this));

                this.getConfiguration.call(this);

                this._LocalData.setProperty("/processBusy", true);
                this.getButtonAuth().then(function (oData) {
                    this.setButtonStatus(oData);
                    this._LocalData.setProperty("/processBusy", false);
                }.bind(this));

                //filter 默认值
                var oDateRange = this.byId("idDateRange");
                var currentDate = new Date();
                var dateFrom = new Date();
                var dateTo = new Date();
                if (currentDate.getDate() == 1) {
                    dateFrom.setMonth(dateFrom.getMonth() - 1);
                } else {
                    dateFrom.setDate(1);
                    dateTo.setMonth(dateTo.getMonth() + 1) ;
                    dateTo.setDate(0);
                }
                oDateRange.setFrom(dateFrom);
                oDateRange.setTo(dateTo);
            },

            onBeforeRebindTable: function(oEvent) {
                this._oDataModel.resetChanges();
                this._oDataModel.refresh(true,true);
                var mBindingParams = oEvent.getParameter("bindingParams");
                mBindingParams.parameters["expand"] = "to_Header,to_ZzCashIncome,to_ZzCashPayment,to_ZzTreasuryCash";
                var aFilter = oEvent.getParameter("bindingParams").filters;

                var aFilters = [];
                var dFrom = this.byId("idDateRange").getFrom();
                var dTo = this.byId("idDateRange").getTo();
                if (dTo && dFrom) {
                    dFrom = this.formatter.date_8(dFrom);
                    dTo = this.formatter.date_8(dTo);
                    aFilters.push(new Filter("EIGYO_BI", "BT", dFrom, dTo)); 
                }

                var oNewFilter = new Filter({
                    filters:aFilters,
                    and:true
                });
                if (aFilters.length > 0) {
                    aFilter.push(oNewFilter);
                }

                this.byId("idCol1").setVisible(false);
                this.byId("idCol2").setVisible(false);
                this.byId("idCol3").setVisible(false);
            },

            onNavDailyBalanceView: function (oEvent,sView) {
                this._LocalData.setProperty("/processBusy", true);

                this._LocalData.setProperty("/isRefrence", false)
                this._LocalData.setProperty("/isCreate", false)
                
                var oUrl = {view: sView};
                if (sView == "Display") {
                    //localmodel中当前行的绑定路径
                    var sPath = oEvent.getSource().getBindingContext().getPath();
                    sPath = sPath.substr(1);
                    oUrl.contextPath = sPath;
                }
                this.getRouter().navTo("DailyBalance",oUrl);
            },

            onCreatePress: function (oEvent, sButton) {
                var sDialogTitle = "";
                //创建
                if (sButton === "Create") {
                    sDialogTitle = this._ResourceBundle.getText("DialogTitle1");
                    this.initialLocalModel();
                    this._LocalData.setProperty("/isCreate", true);
                    this._LocalData.setProperty("/dailyBalance/0/KAISHA_CD", "1000");
                    this._LocalData.setProperty("/isRefrence", false);
                //参考
                } else if (sButton === "Reference") {
                    sDialogTitle = this._ResourceBundle.getText("DialogTitle2");
                    this._LocalData.setProperty("/isCreate", false);
                    this._LocalData.setProperty("/isRefrence", true);

                    //参考只能选择一条
                    var oTable = this.byId("reportTable");
                    if (oTable.getSelectedIndices().length > 1) {
                        messages.showText(this._ResourceBundle.getText("tooManySelect"));
                        return;
                    } else if (oTable.getSelectedIndices().length == 0) {
                        messages.showText(this._ResourceBundle.getText("noSelect"));
                        return;
                    }

                }
                this._LocalData.setProperty("/processBusy", true);
                if (!this.pDialog) {
                    this.pDialog = this.loadFragment({
                        name: "FICO.dailybalanceabr.view.fragment.CreateDialog"
                    });
                } 

                this.pDialog.then(function(oDialog) {
                    this.byId("idCompany").setValueState("None");
                    this.byId("idShop").setValueState("None");
                    this.byId("idDP1").setValueState("None");
                    if (sButton === "Reference") {
                        var oTable = this.byId("reportTable");
                        var oBinding = oTable.getBinding();
                        var sPath = oBinding.aKeys[oTable.getSelectedIndex()];
                        var oHeader = this._oDataModel.getProperty("/" + sPath);
                        //check action
                        if(!this.checkButtonEnable(oHeader.NIKKEIHYO_STATUS_CD, "refrence")){
                            this._LocalData.setProperty("/processBusy", false);
                            return;
                        }

                        this.byId("idCompany").setValue(oHeader.KAISHA_CD);
                        this.byId("idShop").setValue(oHeader.TENPO_CD);
                        this.byId("idDP1").setValue(oHeader.EIGYO_BI);
                    }
                    this.sButton = sButton;
                    var beginButton = new Button({
                        type: "Emphasized",
                        text: this._ResourceBundle.getText("Create"),
                        //登录按钮
                        press: function ( ) {
                            if (this.sButton === "Create") {
                                this.createButton(oDialog);
                            } else if (this.sButton === "Reference") {
                                this.refrenceButton();
                                oDialog.close();
                            }
                        }.bind(this)
                    });
                    var endButton = new Button({
                        text: this._ResourceBundle.getText("Suspend"),
                        press: function () {
                            oDialog.close();
                            this.byId("idProcessPage").setBusy(false);
                        }.bind(this)
                    });
                    //设置标题
                    oDialog.setTitle(sDialogTitle);
                    // 添加按钮
                    if (oDialog.getButtons().length === 0){
                        oDialog.addButton(beginButton);
                        oDialog.addButton(endButton);
                    }
                    oDialog.open();
                }.bind(this));
            },

            createButton: function (oDialog) {
                if (this.requiredCheck()) {
                    return true;
                }

                this.checkError().then(function (res) {
                    if(res.TYPE) {
                        if (res.TYPE == "E") {
                            MessageBox.error(res.MESSAGE);
                            return;
                        } else {
                            this.getLastRecord().then(function (res) {
                                this.setLocalModel();
                                this.getRouter().navTo("DailyBalance",{view:"Create"});
                                oDialog.close();
                            }.bind(this));
                        }
                    } else {
                        MessageBox.error(messages.parseErrors(res));
                        return;
                    }
                }.bind(this));
            },

            onPressHistory: function(oEvent) {
                var sObjectid = oEvent.getSource().getBindingContext().getObject().KIHYO_NO;
                this.getApprovalHistory(sObjectid).then(function (res) {
                    try {
                        var aApprovalHistory = [];
                        res.forEach(function (item) {
                            var sTime = this.formatter.dateTime(item.CREATE_DATE, item.CREATE_TIME);
                            aApprovalHistory.push({
                                user: item.CREATE_USER,
                                name: item.USERNAME,
                                time: new Date(sTime),
                                comments: item.COMMENTS,
                                action: item.ACTION,
                                nodename: item.NODENAME
                            });
                        }, this)
                    } catch (error) {}
                    this._LocalData.setProperty("/approvalHistory", aApprovalHistory);
                    this.approvalHistoryDialog();
                }.bind(this));
            },

            getApprovalHistory: function (sObjectid) {
                var promise = new Promise( function (resolve, reject) {
                    var mParameters = {
                        refreshAfterChange: false,
                        success: function (oData) {
                            resolve(oData.results);
                        }.bind(this),
                        error: function (oError) {
                            messages.showError(messages.parseErrors(oError));
                        }.bind(this)
                    };
                    this.getOwnerComponent().getModel().setHeaders({"objectid":sObjectid});
                    this.getOwnerComponent().getModel().read("/ZzApprovalHistorySet", mParameters);
                }.bind(this));
                return promise;
            },
            
            // 显示审批履历
            approvalHistoryDialog: function () {
                this.byId("reportTable").setBusyIndicatorDelay(0);
                this.byId("reportTable").setBusy(true);
                var oView = this.getView();
                if (!this.HistoryDialog) {
                    this.HistoryDialog = this.loadFragment({
                        id: oView.getId(),
                        name: "FICO.dailybalanceabr.view.fragment.ApprovalHistory"
                    })
                }
                this.HistoryDialog.then(function (oHistoryDialog) {
                    var endButton = new Button({
                        text: this._ResourceBundle.getText("Suspend"),
                        press: function () {
                            oHistoryDialog.close();
                        }.bind(this)
                    });
                    // 添加按钮
                    if (oHistoryDialog.getButtons().length === 0){
                        oHistoryDialog.addButton(endButton);
                    }
                    oHistoryDialog.open();
                    this.byId("reportTable").setBusy(false);
                }.bind(this));
            },

            requiredCheck: function () {
                var isError = false;
                var oCompany = this.byId("idCompany");
                var oShop = this.byId("idShop");
                var oDatePicker = this.byId("idDP1");
                if (oCompany.getValue() == "") {
                    oCompany.setValueState("Warning");
                    isError = true;
                }
                if (oShop.getValue() == "") {
                    oShop.setValueState("Warning");
                    isError = true;
                }
                if (oDatePicker.getValue() == "") {
                    oDatePicker.setValueState("Warning");
                    isError = true;
                } else if (oDatePicker.getDateValue() > new Date()){
                    isError = true;
                    oDatePicker.setValueState("Warning");
                    oDatePicker.setValueStateText(this._ResourceBundle.getText("msg2"));
                }

                var aShop = this._LocalData.getProperty("/ShopVH");
                var sCompany = oCompany.getValue();
                var sShop = oShop.getValue();
                var aShopTemp = aShop.filter( line => line.Key1 == sShop && line.Key2 == sCompany);
                if (aShopTemp.length == 0) {
                    MessageBox.error(this._ResourceBundle.getText("msg1"));                    
                    isError = true;
                }

                return isError;
            },

            checkError: function() {
                var i = 1;
                var sCompany = this.byId("idCompany").getValue();
                var sShop = this.byId("idShop").getValue();
                var sDate = this.byId("idDP1").getDateValue().toLocaleDateString("ja");
                sDate = this.formatter.date_8(sDate);
                var postData = {
                    "KAISHA_CD": sCompany,
                    "TENPO_CD": sShop,
                    "EIGYO_BI": sDate
                };
                var promise = new Promise (function (resolve, reject) {
                    var mParameters = {
                        groupId: "checkError" + Math.floor(i / 100),
                        changeSetId: i,
                        success: function (oData) {
                            resolve(oData);
                        }.bind(this),
                        error: function (oError) {  
                            resolve(oError);
                            // messages.showError(messages.parseErrors(oError));
                        }.bind(this),
                    };
                    this.getOwnerComponent().getModel().create("/ZzCheckErrorSet", postData, mParameters);
                }.bind(this));
                return promise;
            },

            // 获取前日金额
            getLastRecord: function () {
                var aFilters = [];
                aFilters.push(new Filter("KAISHA_CD", "EQ", this.byId("idCompany").getValue())); 
                aFilters.push(new Filter("TENPO_CD", "EQ", this.byId("idShop").getValue())); 
                var sDate = this.byId("idDP1").getDateValue().toLocaleDateString("ja");
                aFilters.push(new Filter("EIGYO_BI", "EQ", this.formatter.date_8(sDate))); 
                var promise = new Promise( function (resolve, reject) {
                    var mParameters = {
                        refreshAfterChange: false,
                        filters: aFilters,
                        success: function (oData) {
                            resolve();
                            if (oData.results.length > 0) {
                                //Ⅳ本日繰越高
                                this._LocalData.setProperty("/dailyBalance/0/ZNJTS_KRKSH_GANKIN",oData.results[0].HONZITUKURIKOSI);
                                //Ⅵ元金金額
                                this._LocalData.setProperty("/dailyBalance/0/GANKIN_AMT",oData.results[0].GANKIN_AMT);
                                this._LocalData.setProperty("/CurrencyTable4/5/Amount",oData.results[0].YOKUZITUKITEIMOTOKIN);
                            }
                        }.bind(this),
                        error: function (oError) {
                            reject();
                        }.bind(this)
                    };
                    this.getOwnerComponent().getModel().read("/ZzShopDailyBalanceSet", mParameters);
                }.bind(this));
                return promise;

            },

            onDatePickerChange: function (oEvent) {
                if (oEvent.getParameter("value") != "") {
                    oEvent.getSource().setValueState("None");
                }
            },

            refrenceButton: function () {
                this.checkError().then(function (res) {
                    if(res.TYPE) {
                        if (res.TYPE == "E") {
                            this._LocalData.setProperty("/processBusy", false);
                            MessageBox.error(res.MESSAGE);
                            return;
                        } else {
                            var oTable = this.byId("reportTable");
                            var oBinding = oTable.getBinding();
                            var sPath = oBinding.aKeys[oTable.getSelectedIndex()];
                            this.getRouter().navTo("DailyBalance",{
                                contextPath: sPath,
                                view:"Display"
                            });
                        }
                    } else {
                        this._LocalData.setProperty("/processBusy", false);
                        MessageBox.error(messages.parseErrors(res));
                        return;
                    }
                }.bind(this));
            },

            onConfirmBox: function (oEvent, sMessage) {
                //至少选择一条
                var oTable = this.byId("reportTable");
                if (oTable.getSelectedIndices().length == 0) {
                    messages.showText(this._ResourceBundle.getText("noSelect"));
                    return;
                }

                //check action
                var aSelectedIndex = oTable.getSelectedIndices();
                var isError = false;
                aSelectedIndex.forEach(function (selectedIndex) {
                    if (isError) {return;}
                    var oItem = oTable.getContextByIndex(selectedIndex).getObject();
                    if (sMessage == "DeleteConfirmMsg") {
                        isError = !this.checkButtonEnable(oItem.NIKKEIHYO_STATUS_CD, "delete")
                    } else if (sMessage == "PostingConfirmMsg") {
                        isError = !this.checkButtonEnable(oItem.NIKKEIHYO_STATUS_CD, "posting")
                    }
                }.bind(this));
                if (isError) {return;}

                var sTitle = this._ResourceBundle.getText("ConfirmTitle");
                var sText = this._ResourceBundle.getText(sMessage);
                MessageBox.confirm(sText, {
                    title: sTitle,
                    icon: MessageBox.Icon.WARNING,
                    styleClass: "sapUiSizeCompact",
                    actions: [
                        MessageBox.Action.YES,
                        MessageBox.Action.NO
                    ],
                    onClose: function (sResult) {
                        if (sResult === MessageBox.Action.YES) {
                            if (sMessage == "DeleteConfirmMsg") {
                                this.onBalanceDelete();
                            } else if (sMessage == "PostingConfirmMsg") {
                                this.onBatchPosting("Posting");
                            }
                        }
                    }.bind(this)
                });
            },

            onBalanceDelete: function () {
                var postDocs = this.prepareBalanceDeleteBody();
                postDocs.forEach(function (line, index) {
                    this.postDelet(line, index, "Delete");
                }.bind(this));
            },

            // 批量过账
            onBatchPosting: function (sAction) {
                var postDocs = this.prepareBatchPostingBody();
                postDocs.forEach(function (line, index) {
                    this.postBatchPosting(line, index, sAction);
                }.bind(this));
            },

            prepareBalanceDeleteBody: function() {
                var postDocs = [];	
                var oTable = this.byId("reportTable");
                var listItems = oTable.getSelectedIndices();
                //得到选中行的flag
                listItems.forEach(function (sSelected) {
                    let key = oTable.getContextByIndex(sSelected).getPath();
                    let lineData = this._oDataModel.getProperty(key); 
                    postDocs.push({
                        KAISHA_CD: lineData.KAISHA_CD,
                        KIHYO_NO: lineData.KIHYO_NO,
                        TENPO_CD: lineData.TENPO_CD,
                        EIGYO_BI: lineData.EIGYO_BI
                    })            
                }.bind(this));
                return postDocs;
            },

            //批量过账
            prepareBatchPostingBody: function () {
                var postDocs = [];	
                var oTable = this.byId("reportTable");
                //获取选中的行
                var listItems = oTable.getSelectedIndices();
                //得到选中行的flag
                listItems.forEach(function (sSelected) {
                    let sKey = oTable.getContextByIndex(sSelected).getPath();
                    let lineData = this._oDataModel.getProperty(sKey); 

                    var aHeaderKey = this._oDataModel.getProperty(sKey + "/to_Header");
                    var aCahsIncomKey = this._oDataModel.getProperty(sKey + "/to_ZzCashIncome");
                    var aCahsPaymentKey = this._oDataModel.getProperty(sKey + "/to_ZzCashPayment");
                    var aTreasuryCashKey = this._oDataModel.getProperty(sKey + "/to_ZzTreasuryCash");

                    var aHeader = [], aCahsIncome = [], aCahsPayment = [], aTreasuryCash = [];
                    aHeader.push(this._oDataModel.getProperty("/" + aHeaderKey[0]));
                    aCahsIncomKey.forEach(function (path) {
                        var item = this._oDataModel.getProperty("/" + path);
                        delete item.__metadata;
                        aCahsIncome.push(item);
                    }.bind(this));
                    aCahsPaymentKey.forEach(function (path) {
                        var item = this._oDataModel.getProperty("/" + path);
                        delete item.__metadata;
                        aCahsPayment.push(item);
                    }.bind(this));
                    aTreasuryCash.push(this._oDataModel.getProperty("/" + aTreasuryCashKey[0]));

                    lineData = JSON.parse(JSON.stringify(lineData));
                    lineData.EIGYO_BI = this.formatter.date_8(lineData.EIGYO_BI);
                    lineData = aHeader[0];
                    delete lineData.__metadata;
                    lineData.key = sKey;
                    lineData.to_ZzCashIncome = aCahsIncome;
                    lineData.to_ZzCashPayment = aCahsPayment;
                    lineData.to_ZzTreasuryCash = aTreasuryCash;

                    postDocs.push(lineData);
                }.bind(this));

                return postDocs;
            },

            postDelet: function (postData, i, sAction) {
                this.byId("idProcessPage").setBusy(true);
                var mParameters = {
                    groupId: "ProcessDelete" + Math.floor(i / 100),
                    changeSetId: i,
                    success: function (oData) {
                        this.byId("smartFilterBarProcess").search();
                        messages.showText(oData.Message);
                        this.byId("idProcessPage").setBusy(false);
                    }.bind(this),
                    error: function (oError) {  
                        messages.showError(messages.parseErrors(oError));
                        this.byId("idProcessPage").setBusy(false);
                    }.bind(this),
                };
                this.getOwnerComponent().getModel().setHeaders({"button":sAction});
                //复杂结构
                this.getOwnerComponent().getModel().create("/ZzShopDailyBalanceSet", postData, mParameters);
                this.byId("idProcessPage").setBusyIndicatorDelay(0);
                this.byId("idProcessPage").setBusy(true);
            },

            postBatchPosting: function (postData, i, sAction) {
                var sPath = postData.key;
                delete postData.key;
                this.byId("idProcessPage").setBusy(true);
                var mParameters = {
                    groupId: "BatchPosting" + Math.floor(i / 100),
                    changeSetId: i,
                    success: function (oData) {
                        this.byId("idCol1").setVisible(true);
                        this.byId("idCol2").setVisible(true);
                        this.byId("idCol3").setVisible(true);
                        this.byId("idProcessPage").setBusy(false);
                        this._oDataModel.setProperty(sPath + "/Type", "S");
                        this._oDataModel.setProperty(sPath + "/Message", oData.Message);
                    }.bind(this),
                    error: function (oError) {  
                        this.byId("idCol1").setVisible(true);
                        this.byId("idCol2").setVisible(true);
                        this.byId("idCol3").setVisible(true);
                        this._oDataModel.setProperty(sPath + "/Type", "E");
                        this._oDataModel.setProperty(sPath + "/Message", messages.parseErrors(oError));
                        this.byId("idProcessPage").setBusy(false);
                    }.bind(this),
                };
                this.getOwnerComponent().getModel().setHeaders({"button":sAction});
                //复杂结构
                this.getOwnerComponent().getModel().create("/ZzShopDailyBalanceSet", postData, mParameters);
            },
            setLocalModel: function () {
                // 获取dialog中的参数
                var sCompany = this.byId("idCompany").getValue();
                var sShop = this.byId("idShop").getValue();
                var sDate = this.byId("idDP1").getDateValue().toLocaleDateString("ja");
                this._LocalData.setProperty("/dailyBalance/0/KAISHA_CD", sCompany);
                this._LocalData.setProperty("/dailyBalance/0/TENPO_CD", sShop);
                this._LocalData.setProperty("/dailyBalance/0/EIGYO_BI", this.formatter.date(sDate));

                // 写入店铺code
                var aTable8 = this._LocalData.getProperty("/table8");
                var aTable9 = this._LocalData.getProperty("/table9");
                var aTable10 = this._LocalData.getProperty("/table10");
                aTable8.forEach(function (line, index) {
                    // 最后一行不处理
                    if (index >= aTable8.length - 1) {
                        return;
                    }
                    line.Shop = sShop;
                });
                aTable9.forEach(function (line, index) {
                    // 最后一行不处理
                    if (index >= aTable9.length - 1) {
                        return;
                    }
                    line.ShopD = sShop;
                    line.ShopC = sShop;
                });
                aTable10.forEach(function (line, index) {
                    // 最后一行不处理
                    if (index >= aTable10.length - 1) {
                        return;
                    }
                    line.ShopC = sShop;
                });

                var aFI0004 = this._LocalData.getProperty("/FI0004");
                var aCurrencyTable3 = this._LocalData.getProperty("/CurrencyTable3/Item");
                //準備金明細
                var sShopTmp = sShop;
                if (sShopTmp.length == 4 && sShopTmp.substr(0,1) == "0") {
                    sShopTmp = sShopTmp.substr(1);
                }
                var aFI0004a = aFI0004.filter( line => line.Value2 === sShopTmp);
                if (aFI0004a.length > 0) {
                    aCurrencyTable3.forEach(function (line, index) {
                        try {
                            line.Title = aFI0004a[index].Value4;
                        } catch (e) {}
                    });
                    this._LocalData.setProperty("/CurrencyTable3/Item", aCurrencyTable3);
                }

                //掛売上（クレジット、電子マネー、QR決済）
                var aFI0007 = this._LocalData.getProperty("/FI0007");
                var aTable8 = this._LocalData.getProperty("/table8");
                if (aFI0007.length > 0) {
                    aTable8.forEach(function (line, index) {
                        try {
                            line.Title = aFI0007[index].Value4;
                        } catch (e) {}
                    });
                    this._LocalData.setProperty("/table8", aTable8);
                }

                this._LocalData.setProperty("/table12/0/Shop", sShop);
                this._LocalData.refresh();
            },

            initialLocalModel: function () {
                //清空日记表
                // 初始化为0
                var aFields = [
                    "GNK_NYUKIN_SOGAKU",
                    "RYOGAEKIN_UKEIRE",
                    "INSHOKU_URIAGE",
                    "BENTO_URIAGE",
                    "GAME_URIAGE",
                    "LANE_URIAGE",
                    "SHOES_URIAGE",
                    "PRO_SHOP_URIAGE",
                    "BILLIARD_URIAGE",
                    "JITEN_TVG_URIAGE",
                    "KYOWA_TVG_URIAGE",
                    "LOCKER_DAI_URIAGE",
                    "KARAOKE_URIAGE",
                    "FK_URIAGE8",
                    "FK_URIAGE10",
                    "NYUJORYO_URIAGE",
                    "HANSOKUHIN_URIAGE",
                    "KOKA_URIAGE",
                    "HAIBUN_URIAGE",
                    "JIHANKI_URIAGE",
                    "BUPPAN_URIAGE8",
                    "BUPPAN_URIAGE10",
                    "REJI_URIAGE",
                    "EVENT_URIAGEA8",
                    "EVENT_URIAGEB8",
                    "EVENT_URIAGEA10",
                    "EVENT_URIAGEB10",
                    "SONOTA_URIAGEA8",
                    "SONOTA_URIAGEB8",
                    "SONOTA_URIAGEA10",
                    "SONOTA_URIAGEB10",
                    "URIAGE_NEBIKI",//売上値引
                    "URIAGE_GOKEI",
                    "GENKIN_URIAGE",
                    "KAKEURI_TO",
                    "URAG_SHNY_UCHWK_KI",
                    "SNT_GNKN_SHNY_GKI",
                    "SNT_GNKN_SHSHT_GKI",
                    "SHUSHI_SAGAKU",
                    "ZNJT_HNSH_SFKN_RKI",
                    "HNJTS_SOFUKIN",
                    "RYOGAEKIN_MODOSHI",
                    "GANKIN_ZOUGAKU",
                    "SOFUKIN_YOTEIGAKU",
                    "GANKIN_AMT",
                    "MOTOKINKAFUSOKU_AMT",
                    "AMAREA_FURIKAE"
                ];
                //为了初始值为0
                var oDailyBalance = {};
                aFields.forEach(function (field) {
                    oDailyBalance[field] = "0";
                }.bind(this));
                this._LocalData.setProperty("/dailyBalance",[oDailyBalance]);
                this._LocalData.setProperty("/table6", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table6"))));
                this._LocalData.setProperty("/table7", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table7"))));
                this._LocalData.setProperty("/table8", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table8"))));
                this._LocalData.setProperty("/table9", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table9"))));
                this._LocalData.setProperty("/table10", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table10"))));
                this._LocalData.setProperty("/table11", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table11"))));
                this._LocalData.setProperty("/table12", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table12"))));
                this._LocalData.setProperty("/CashIncome", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CashIncome"))));
                this._LocalData.setProperty("/CashPayment", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CashPayment"))));
                this._LocalData.setProperty("/CurrencyTable1", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable1"))));
                this._LocalData.setProperty("/CurrencyTable2", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable2"))));
                this._LocalData.setProperty("/CurrencyTable3", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable3"))));
                this._LocalData.setProperty("/CurrencyTable4", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable4"))));

                this._LocalData.refresh();
            },
            //获取配置参数
            getConfiguration: function () {
                var mParameters = {
                    success: this.configurationProcess.bind(this),
                    error: function (oError) {
                        this._LocalData.setProperty("/busy", false, false);
                    }.bind(this)
                };
                this.getOwnerComponent().getModel().read("/ZzConfigurationSet", mParameters);
            },

            configurationProcess: function (oData) {
                var aFI0004 = [],
                    aFI0005 = [],
                    aFI0007 = [],
                    aReversalReason = [],
                    aCompany = [],
                    aShop = [],
                    aAccount = [],
                    aTax = [],
                    aProfit = [],
                    aCost = [],
                    aFI0006 = [],
                    aFieldId = [],
                    aFI0009 = [],
                    aFI0010 = [];
                oData.results.forEach(function(line){
                    switch (line.ZID) {
                        //天气
                        case "FI0005":
                            aFI0005.push({
                                Seq: line.ZSEQ,
                                Value1: line.ZVALUE1
                            });
                            break;
                        //"準備金明細
                        case "FI0004":
                            aFI0004.push({
                                Seq: line.ZSEQ,
                                Value1: line.ZVALUE1,
                                Value2: line.ZVALUE2,
                                Value3: line.ZVALUE3,
                                Value4: line.ZVALUE4,
                                Value5: line.ZVALUE5,
                                Value6: line.ZVALUE6,
                                Remark: line.REMARK
                            });
                            break;
                        //"掛売上（クレジット、電子マネー、QR決済）
                        case "FI0007":
                            aFI0007.push({
                                Seq: line.ZSEQ,
                                Value1: line.ZVALUE1,
                                Value2: line.ZVALUE2,
                                Value3: line.ZVALUE3,
                                Value4: line.ZVALUE4,
                                Value5: line.ZVALUE5,
                                Value6: line.ZVALUE6,
                                Remark: line.REMARK
                            });
                            break;
                        //冲销原因
                        case "VH0001":
                            aReversalReason.push({
                                Key1: line.ZKEY1,
                                Value1: line.ZVALUE1
                            });
                            break;
                        //公司代码
                        case "VH0002":
                            aCompany.push({
                                Key1: line.ZKEY1,
                                Value1: line.ZVALUE1
                            });
                            break;
                        //店铺
                        case "VH0003":
                            aShop.push({
                                Key1: line.ZKEY1,
                                Key2: line.ZKEY2,
                                Value1: line.ZVALUE1
                            });
                            break;
                        //科目
                        case "VH0004":
                            aAccount.push({
                                Key1: line.ZKEY1,//科目
                                Key2: line.ZKEY2,//公司代码
                                Value1: line.ZVALUE1
                            });
                            break;
                        //税码
                        case "VH0005":
                            aTax.push({
                                Key1: line.ZKEY1,
                                Value1: line.ZVALUE1
                            });
                            break;
                        //利润中心
                        case "VH0006":
                            aProfit.push({
                                Key1: line.ZKEY1,
                                Value1: line.ZVALUE1,
                                Key2: line.ZKEY2,
                                Key3: line.ZKEY3
                            });
                            break;
                        //成本中心
                        case "VH0007":
                            aCost.push({
                                Key1: line.ZKEY1,
                                Value1: line.ZVALUE1,
                                Key2: line.ZKEY2,
                                Key3: line.ZKEY3
                            });
                            break;
                        //成本中心
                        case "FI0006":
                            aFI0006.push({
                                Seq: line.ZSEQ,
                                Value1: line.ZVALUE1,
                                Value2: line.ZVALUE2,
                                Value3: line.ZVALUE3
                            });
                            break;
                        // 控制字段是否可编辑
                        case "CF0001":
                            aFieldId.push({
                                Shop: line.ZVALUE1,
                                FieldId: line.ZVALUE2,
                            });
                            break;
                        // 本日送付金(＝5収支差額:プラザコリア店舗）
                        case "FI0009":
                            aFI0009.push({
                                Seq: line.ZSEQ,
                                Value1: line.ZVALUE1,
                                Value2: line.ZVALUE2,
                                Value3: line.ZVALUE3,
                                Value4: line.ZVALUE4,
                                Value5: line.ZVALUE5,
                                Value6: line.ZVALUE6,
                                Remark: line.REMARK
                            });
                            break;
                        // Ⅶアムエリア振替(＝5収支差額:ビレッジ店舗)
                        case "FI0010":
                            aFI0010.push({
                                Seq: line.ZSEQ,
                                Value1: line.ZVALUE1,
                                Value2: line.ZVALUE2,
                                Value3: line.ZVALUE3,
                                Value4: line.ZVALUE4,
                                Value5: line.ZVALUE5,
                                Value6: line.ZVALUE6,
                                Remark: line.REMARK
                            });
                            break;
                    }
                }.bind(this));
                aFI0005.splice(0, 0, {Seq:"", Value1:""});
                this._LocalData.setProperty("/FI0005", aFI0005);
                this._LocalData.setProperty("/FI0004", aFI0004);
                this._LocalData.setProperty("/FI0007", aFI0007);
                this._LocalData.setProperty("/ReversalReasonVH", aReversalReason);
                this._LocalData.setProperty("/CompanyVH", aCompany);
                this._LocalData.setProperty("/ShopVH", aShop);
                this._LocalData.setProperty("/AccountVH", aAccount);
                this._LocalData.setProperty("/TaxVH", aTax);
                this._LocalData.setProperty("/ProfitVH", aProfit);
                this._LocalData.setProperty("/CostVH", aCost);
                this._LocalData.setProperty("/FI0006", aFI0006);
                this._LocalData.setProperty("/FieldId", aFieldId);
                this._LocalData.setProperty("/FI0009", aFI0009);
                this._LocalData.setProperty("/FI0010", aFI0010);
            },

            getButtonAuth: function () {
                var promise = new Promise( function (resolve, reject) {
                    var mParameters = {
                        // success: this.setButtonStatus.bind(this),
                        success: function(oData) {
                            resolve(oData);
                        },
                        error: function (oError) {
                            this._LocalData.setProperty("/busy", false, false);
                        }.bind(this)
                    };
                    this.getOwnerComponent().getModel().read("/ZzButtonAuthSet", mParameters);
                }.bind(this));
                
                return promise;
            },

            setButtonStatus: function (oData) {
                if (oData.results.length > 0) {
                    var oButtonAuth = oData.results[0];
                    //登録
                    this._LocalData.setProperty("/btCreate", oButtonAuth.TOUROKU);
                    //参照新規
                    this._LocalData.setProperty("/btReference", oButtonAuth.COPY);
                    //削除
                    this._LocalData.setProperty("/btDelete", oButtonAuth.SAKUZYO);
                    //仮保存
                    this._LocalData.setProperty("/btSave", oButtonAuth.KARIHOZON);
                    //変更
                    this._LocalData.setProperty("/btChange", oButtonAuth.HENKOU);
                    //申請
                    this._LocalData.setProperty("/btApply", oButtonAuth.SINSEI);
                    //照会
                    this._LocalData.setProperty("/btDisplay", oButtonAuth.SYOUKAI);
                    //PDF作成
                    this._LocalData.setProperty("/btPrint", oButtonAuth.PDFSAKUSEI);
                    //仕訳作成
                    this._LocalData.setProperty("/btPosting", oButtonAuth.SIWAKESAKUSEI);
                    //一括取消
                    this._LocalData.setProperty("/btReverse", oButtonAuth.TORIKESI);
                } else {

                }
            },

            onPrintPDF: function () {
                var oTable = this.byId("smartTable").getTable();
                var aIndex = oTable.getSelectedIndices();
                // check button
                var isError = false;
                aIndex.forEach(function (selectedIndex) {
                    if (isError) {return;}
                    var oItem = oTable.getContextByIndex(selectedIndex).getObject();
                    isError = !this.checkButtonEnable(oItem.NIKKEIHYO_STATUS_CD, "pdf")
                }.bind(this));
                if (isError) {return;}

                for (var i = 0; i < aIndex.length; i++) {
                    var oContext = oTable.getContextByIndex(aIndex[i]);
                    var oData = oContext.getObject();
                    var sUrl = "/sap/opu/odata/sap/ZZDAILYBALANCEABR_SRV/ZzExportSet(KAISHA_CD='" + oData.KAISHA_CD + "',KIHYO_NO='" + oData.KIHYO_NO + "')/$value";
                    // window.open(sUrl, "_blank");
                    var sShop = oData.TENPO_CD;
                    if (sShop.length == 3) {
                        sShop = "0" + sShop;
                    }
                    var sFielName = "Amenities_ABR_" + sShop + "_" + oData.EIGYO_BI + oData.NIKKEIHYO_STATUS;
                    this.download(sUrl, sFielName);
                }
            },

            

            getBlob: function (url) {
                return new Promise(resolve => {
                  const xhr = new XMLHttpRequest();
            
                  xhr.open('GET', url, true);
                  xhr.responseType = 'blob';
                  xhr.onload = () => {
                    if (xhr.status === 200) {
                      resolve(xhr.response);
                    }
                  };
            
                  xhr.send();
                });
            },
            saveAs: function (blob, filename) {
                if (window.navigator.msSaveOrOpenBlob) {
                  navigator.msSaveBlob(blob, filename);
                } else {
                  const link = document.createElement('a');
                  const body = document.querySelector('body');
            
                  link.href = window.URL.createObjectURL(blob);
                  link.download = filename;
            
                  // fix Firefox
                  link.style.display = 'none';
                  body.appendChild(link);
            
                  link.click();
                  body.removeChild(link);
            
                  window.URL.revokeObjectURL(link.href);
                }
            },
            download: function (url, sFielName) {
                this.getBlob(url).then(blob => {
                  this.saveAs(blob, sFielName);
                });
            },

            //第一界面要限制的按钮：参照新规，删除，凭证做成，pdf打印
            checkButtonEnable: function (sDocumentStatus, sAction) {
                var oButtonMap = {
                    //仮保存
                    "1":{"refrence":false, "delete":true, "posting":false, "pdf":true},
                    //申請中
                    "2":{"refrence":false, "delete":false, "posting":false, "pdf":true},
                    //申請済
                    "3":{"refrence":false, "delete":false, "posting":false, "pdf":true},
                    //承認済
                    "4":{"refrence":false, "delete":false, "posting":true, "pdf":true},
                    //否認
                    "5":{"refrence":false, "delete":false, "posting":false, "pdf":true},
                    //再申請
                    "6":{"refrence":false, "delete":false, "posting":false, "pdf":true},
                    //仕訳作成済
                    "7":{"refrence":false, "delete":false, "posting":false, "pdf":true},
                    //取消済
                    "8":{"refrence":true, "delete":false, "posting":false, "pdf":false}
                };
                if (!oButtonMap[sDocumentStatus][sAction]) {
                    messages.showError(this._ResourceBundle.getText("msg5"));
                    return false;
                }
                return true;
            }
            
        });
    });
