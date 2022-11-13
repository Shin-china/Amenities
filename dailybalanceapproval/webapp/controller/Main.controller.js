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
                if (sLayout) {
                    this._LocalData.setProperty("/layout", sLayout);
                }
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
                    aReversalReason = [],
                    aCompany = [],
                    aShop = [],
                    aAccount = [],
                    aTax = [];
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
                        //税码
                        case "VH0005":
                            aTax.push({
                                Key1: line.ZKEY1,
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
                this._LocalData.setProperty("/TaxVH", aTax);
            },
    
            // onRouteMatched: function (oEvent) {
            //     var sRouteName = oEvent.getParameter("name"),
            //         oArguments = oEvent.getParameter("arguments");
    
            //     this._updateUIElements();
    
            //     // Save the current route name
            //     this.currentRouteName = sRouteName;
            //     this.currentProduct = oArguments.product;
            //     this.currentSupplier = oArguments.supplier;
            // },
    
            // onStateChanged: function (oEvent) {
            //     var bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
            //         sLayout = oEvent.getParameter("layout");
    
            //     this._updateUIElements();
    
            //     // Replace the URL with the new layout if a navigation arrow was used
            //     if (bIsNavigationArrow) {
            //         this.oRouter.navTo(this.currentRouteName, {layout: sLayout, product: this.currentProduct, supplier: this.currentSupplier}, true);
            //     }
            // },
    
            // // Update the close/fullscreen buttons visibility
            // _updateUIElements: function () {
            //     var oModel = this.getOwnerComponent().getModel();
            //     var oUIState = this.getOwnerComponent().getHelper().getCurrentUIState();
            //     oModel.setData(oUIState);
            // },
    
            // onExit: function () {
            //     this.oRouter.detachRouteMatched(this.onRouteMatched, this);
            //     this.oRouter.detachBeforeRouteMatched(this.onBeforeRouteMatched, this);
            // },
        });
    });
