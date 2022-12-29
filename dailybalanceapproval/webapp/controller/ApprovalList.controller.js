sap.ui.define([
    "FICO/dailybalanceapproval/controller/BaseController",
    "sap/m/MessageToast",
	"sap/ui/Device",
	"sap/base/Log",
    "sap/ui/model/Filter",
    "sap/ui/core/Element",
    "../model/formatter",
    "sap/ui/core/routing/HashChanger"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, MessageToast, Device, Log, Filter, Element, formatter, HashChanger) {
        "use strict";

        return BaseController.extend("FICO.dailybalanceapproval.controller.ApprovalList", {
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
			    this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                this._abrModel = this.getOwnerComponent().getModel("abr");
            },

            onBeforeRebindTable: function (oEvent) {
                HashChanger.getInstance().replaceHash("");
                this._LocalData.setProperty("/layout", "OneColumn");

                var mBindingParams = oEvent.getParameter("bindingParams");
                mBindingParams.parameters["expand"] = "to_ZzApprovalHistory";

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
            },

            onPressNavToDetail: function (oEvent, sType) {
                // this._LocalData.setProperty("/busy", true);
                var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
                var sPath = oEvent.getSource().getBindingContext().getPath();

                var oRecord = this._oDataModel.getProperty(sPath);
                // 设置店铺确认按钮可见性
                this._LocalData.setProperty("/editVisible", oRecord.EDIT);
                this._LocalData.setProperty("/saveVisible", oRecord.SAVE);
                this._LocalData.setProperty("/acceptVisible", oRecord.ACCEPT);
                this._LocalData.setProperty("/rejectVisible", oRecord.REJECT);
                this._LocalData.setProperty("/confirmVisible", oRecord.CONFIRM);
                this._LocalData.refresh();
                
                this.setApprovalHistory(oRecord);

                //设置当前节点
                this._LocalData.setProperty("/Node", oRecord.NODE);
                this._LocalData.setProperty("/NodeName", oRecord.NODENAME);
                this._LocalData.setProperty("/TypeName", oRecord.NIKKEIHYO_KBN_NM);

                this._LocalData.setProperty("/detailPageBusy",true);

                sPath = sPath.substr(1);
                switch (oRecord.NIKKEIHYO_KBN) {
                    case "1":
                        //获取P店铺数据 导航到P店铺界面
                        this.getPstore(sPath).then(function (res) {
                            try {
                                var sPstorePath = res.results[0].__metadata.uri.split("ZZPSTORE_SRV/")[1];
                                this.getRouter().navTo("StoreDetail", {
                                    layout: oNextUIState.layout,
                                    path: sPstorePath,
                                    mode: "C"
                                });
                            } catch (e) {}
                        }.bind(this));
                        break;
                    case "2":
                        //获取ABR店铺数据 导航到ABR店铺界面
                        this.getDailyBalance(sPath, "abr").then(function (res) {
                            this.getRouter().navTo("DailyBalance", {layout: oNextUIState.layout, contextPath:sPath});
                        }.bind(this));
                        break;
                    case "3":
                        //获取AMU数据 导航到AMU店铺界面
                        this.getDailyBalance(sPath, "amu").then(function (res) {
                            this.getRouter().navTo("DailyBalance_amu", {layout: oNextUIState.layout, contextPath:sPath});
                        }.bind(this));
                        break;
                    case "4":
                        //获取AMU数据 导航到AMU店铺界面
                        this.getDailyBalance(sPath, "based").then(function (res) {
                            this.getRouter().navTo("DailyBalance_based", {layout: oNextUIState.layout, contextPath:sPath});
                        }.bind(this));
                        break;
                }
            },

            setApprovalHistory: function (oRecord) {
                // 设置审批履历数据
                var aApprovalHistory = [];
                try {
                    var aHistoryPath = oRecord.to_ZzApprovalHistory.__list;
                    aHistoryPath.forEach(function (path) {
                        var item = this._oDataModel.getProperty("/" + path);
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
            },

            // 获取日计表数据
            getDailyBalance: function (sPath, sModel) {
                sPath = "/" + sPath;
                var oDetail = this._oDataModel.getProperty(sPath);
                var aFilters = [];
                aFilters.push(new Filter("KAISHA_CD", "EQ", oDetail.KAISHA_CD)); 
                aFilters.push(new Filter("KIHYO_NO", "EQ", oDetail.KIHYO_NO)); 

                var promise = new Promise (function (resolve, reject) {
                    var mParameters = {
                        groupId: "getDetail" + Math.floor(1 / 100),
                        changeSetId: 1,
                        filters: aFilters,
                        urlParameters: {
                            $expand: "to_Header,to_ZzCashIncome,to_ZzCashPayment,to_ZzTreasuryCash"
                        },
                        success: function (oData) {
                            resolve(oData);
                        }.bind(this),
                        error: function (oError) {  
                            messages.showError(messages.parseErrors(oError));
                        }.bind(this),
                    };
                    this.getOwnerComponent().getModel(sModel).setHeaders({"approval":"X"});
                    this.getOwnerComponent().getModel(sModel).read("/ZzShopDailyBalanceSet", mParameters);
                }.bind(this));
                return promise;
            },
            //获取P店铺日计表数据
            getPstore: function (sPath) {
                sPath = "/" + sPath;
                var oDetail = this._oDataModel.getProperty(sPath);
                var aFilters = [];
                aFilters.push(new Filter("KaishaCd", "EQ", oDetail.KAISHA_CD)); 
                aFilters.push(new Filter("KihyoNo", "EQ", oDetail.KIHYO_NO)); 

                var promise = new Promise (function (resolve, reject) {
                    var mParameters = {
                        groupId: "getDetail" + Math.floor(1 / 100),
                        changeSetId: 1,
                        filters: aFilters,
                        success: function (oData) {
                            resolve(oData);
                        }.bind(this),
                        error: function (oError) {  
                            messages.showError(messages.parseErrors(oError));
                        }.bind(this),
                    };
                    this.getOwnerComponent().getModel("pstore").setHeaders({"approval":"X"});
                    this.getOwnerComponent().getModel("pstore").read("/StoreSet", mParameters);
                }.bind(this));
                return promise;
            }
            
        });
    });
