sap.ui.define([
    "FICO/dailybalanceapproval/controller/BaseController",
    "sap/m/MessageToast",
	"sap/ui/Device",
	"sap/base/Log",
    "sap/ui/model/Filter",
    "sap/ui/core/Element"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, MessageToast, Device, Log, Filter, Element) {
        "use strict";

        return BaseController.extend("FICO.dailybalanceapproval.controller.Main", {
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
			    this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                this.oRouter = this.getOwnerComponent().getRouter();
                // this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                this.oRouter.attachBeforeRouteMatched(this.onBeforeRouteMatched, this);

                this.getConfiguration();
            },
    
            onBeforeRouteMatched: function(oEvent) {
    
                var sLayout = oEvent.getParameters().arguments.layout;
    
                // If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
                if (!sLayout) {
                    var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(0);
                    sLayout = oNextUIState.layout;
                }
    
                //Update the layout of the FlexibleColumnLayout
                if (sLayout) {this._LocalData.setProperty("/layout", sLayout);
                    
                }

                // 用以控制第二页面全屏的按钮
                this._LocalData.setProperty("/actionButtonsInfo/midColumn/exitFullScreen","OneColumn");
                this._LocalData.setProperty("/actionButtonsInfo/midColumn/fullScreen",null);
            },

            //获取配置参数
            getConfiguration: function () {
                var mParameters = {
                    success: this.configurationProcess.bind(this),
                    error: function (oError) {
                        this._LocalData.setProperty("/busy", false, false);
                    }.bind(this)
                };
                this.getOwnerComponent().getModel("abr").read("/ZzConfigurationSet", mParameters);
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
    
        });
    });
