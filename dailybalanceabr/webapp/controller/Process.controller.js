sap.ui.define([
    "FICO/dailybalanceabr/controller/BaseController",
    "../model/formatter",
    "sap/m/Button",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "./messages"
],
    function (BaseController, formatter, Button, MessageBox, JSONModel, messages) {
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
            },

            onBeforeRebindTable: function(oEvent) {
                this._oDataModel.resetChanges();
                this._oDataModel.refresh(true,true);
                var mBindingParams = oEvent.getParameter("bindingParams");
                mBindingParams.parameters["expand"] = "to_Header,to_ZzCashIncome,to_ZzCashPayment,to_ZzTreasuryCash";
                var oFilter = oEvent.getParameter("bindingParams").filters;
            },

            onNavDisplayView: function (oEvent) {
                this.setBusy(true);
                //localmodel中当前行的绑定路径
                var sPath = oEvent.getSource().getBindingContext().getPath();
                sPath = sPath.substr(1);
                this.getRouter().navTo("DailyBalanceDisplay",{
                    contextPath: sPath
                });
            },


            onNavCreateView: function (oEvent) {
                //localmodel中当前行的绑定路径
                // var sPath = oEvent.getSource().getBindingContext("local").getPath();
                // sPath = sPath.substring(sPath.length - 1);
                this.getRouter().navTo("DailyBalanceCreate", {});
            },

            onCreatePress: function (oEvent, sButton) {
                var sDialogTitle = "";
                //创建
                if (sButton === "Create") {
                    sDialogTitle = this._ResourceBundle.getText("DialogTitle1");
                    this.initialLocalModel();
                    this._LocalData.setProperty("/isCreate", true);
                    this._LocalData.setProperty("/dailyBalance/0/KAISHA_CD", "1000");
                //参考
                } else if (sButton === "Reference") {
                    sDialogTitle = this._ResourceBundle.getText("DialogTitle2");
                    this._LocalData.setProperty("/isCreate", false);

                    //参考只能选择一条
                    var oTable = this.byId("reportTable");
                    if (oTable.getSelectedIndices().length > 1) {
                        messages.showError(this._ResourceBundle.getText("tooManySelect"));
                        return;
                    } else if (oTable.getSelectedIndices().length == 0) {
                        messages.showError(this._ResourceBundle.getText("noSelect"));
                        return;
                    }
                }
                this.byId("idProcessPage").setBusy(true);
                if (!this.pDialog) {
                    this.pDialog = this.loadFragment({
                        name: "FICO.dailybalanceabr.view.fragment.CreateDialog"
                    });
                } 

                this.pDialog.then(function(oDialog) {
                    var beginButton = new Button({
                        type: "Emphasized",
                        text: this._ResourceBundle.getText("Create"),
                        //登录按钮
                        press: function () {
                            if (sButton === "Create") {
                                this.createButton();
                            } else if (sButton === "Reference")
                                this.refrenceButton();
                            oDialog.close();
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

            onConfirmBox: function (oEVent, sMessage) {
                MessageBox.confirm(this._ResourceBundle.getText(sMessage));
            },

            createButton: function () {
                // this.initialLocalModel.call(this);
                this.setLocalModel();
                this.getRouter().navTo("DailyBalanceCreate");
            },

            refrenceButton: function () {
                var oTable = this.byId("reportTable");
                var oBinding = oTable.getBinding();
                var sPath = oBinding.aKeys[oTable.getSelectedIndex()];
                this.getRouter().navTo("DailyBalanceDisplay",{
                    contextPath: sPath
                });
            },

            setLocalModel: function () {
                // 获取dialog中的参数
                var sCompany = this.byId("idCompany").getValue();
                var sShop = this.byId("idShop").getValue();
                var sDate = this.byId("idDP1").getValue();
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

                this._LocalData.setProperty("/table12/0/Shop", sShop);
                this._LocalData.refresh();
            },

            initialLocalModel: function () {
                //清空日记表
                this._LocalData.setProperty("/dailyBalance",[{}]);
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
                    aReversalReason = [],
                    aCompany = [],
                    aShop = [],
                    aAccount = [];
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
                    }
                }.bind(this));
                this._LocalData.setProperty("/FI0005", aFI0005);
                this._LocalData.setProperty("/FI0004", aFI0004);
                this._LocalData.setProperty("/ReversalReasonVH", aReversalReason);
                this._LocalData.setProperty("/CompanyVH", aCompany);
                this._LocalData.setProperty("/ShopVH", aShop);
                this._LocalData.setProperty("/AccountVH", aAccount);
            },

            setPageBusy: function (isBusy) {
                sap.ui.getCore().byId("idProcessPage").setBusy(isBusy);
            } 
            
        });
    });
