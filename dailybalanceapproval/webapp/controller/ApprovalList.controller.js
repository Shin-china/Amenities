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

            onPressNavToDetail: function (oEvent) {
                this._LocalData.setProperty("/busy", true);
                var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
                var sPath = oEvent.getSource().getBindingContext().getPath();

                var oRecord = this._oDataModel.getProperty(sPath);
                // 设置店铺确认按钮可见性
                this._LocalData.setProperty("/editVisible", oRecord.EDIT);
                this._LocalData.setProperty("/saveVisible", oRecord.SAVE);
                this._LocalData.setProperty("/acceptVisible", oRecord.ACCEPT);
                this._LocalData.setProperty("/rejectVisible", oRecord.REJECT);
                this._LocalData.setProperty("/confirmVisible", oRecord.CONFIRM);
                
                this.setApprovalHistory(oRecord);

                sPath = sPath.substr(1);
                this.getDailyBalance(sPath).then(function (res) {
                    this.getRouter().navTo("DailyBalance", {layout: oNextUIState.layout, contextPath:sPath});
                }.bind(this));
                
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
                            action: item.ACTION
                        });
                    }, this)
                } catch (error) {}
                this._LocalData.setProperty("/approvalHistory", aApprovalHistory);
            },

            getDailyBalance: function (sPath) {
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
                    this.getOwnerComponent().getModel("abr").setHeaders({"approval":"X"});
                    this.getOwnerComponent().getModel("abr").read("/ZzShopDailyBalanceSet", mParameters);
                }.bind(this));
                return promise;
            }
            
        });
    });
