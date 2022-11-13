sap.ui.define([
    "FICO/dailybalanceabr/controller/DailyBalance",
    "sap/ui/model/Filter",
	"sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "./messages"
],
    function (DailyBalance, Filter, Sorter, JSONModel, formatter, messages) {
        "use strict";
        
        return DailyBalance.extend("FICO.dailybalanceabr.controller.DailyBalanceDisplay", {
            formatter: formatter,
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                this._LocalData.setProperty("/DailyBalanceEditable", false);

                var oRouter = this.getRouter();
                oRouter.getRoute("DailyBalanceDisplay").attachMatched(this._onRouteMatched, this);
                this.InitModel = this.getOwnerComponent().getModel("init");
            },

            //当路径导航到此页面时，设置页面的数据绑定
            _onRouteMatched : function (oEvent) {
                this.setBusy(false)
            	var oArgs, oView;
            	//localmodel中当前行的绑定路径
            	oArgs = oEvent.getParameter("arguments");

                var oHeader = this._oDataModel.getProperty("/" + oArgs.contextPath);
                this.initialLocalModel_dis(oHeader);
                this.tableConverted_dis(oArgs.contextPath);
            },

            // 日记表数据保存
            onBalanceSave: function (sAction) {
                var postDoc = this.prepareBalanceSaveBody();
                delete postDoc.__metadata;
                this.postBalanceSave(postDoc,sAction);
            },

            //申请
            onBalanceApply: function () {
                var postDoc = this.prepareBalanceApplyBody();
                delete postDoc.__metadata;
                this.postBalanceApply(postDoc);
            },

            // 准备保存需要的数据
            prepareBalanceSaveBody: function() {
                var aDailyBalance = this._LocalData.getProperty("/dailyBalance");
                aDailyBalance = JSON.parse(JSON.stringify(aDailyBalance));
                // 1.2.3.4.5
                var postDoc = aDailyBalance[0];
                // 获取并转换数据
                postDoc = this.convertTables(postDoc);
                //その他現金収入 その他現金支出
                this.getCashTable(postDoc);
                //金庫内現金内訳
                this.getTreasuryCash(postDoc);
                return postDoc;
            },

            //准备申请需要的数据
            prepareBalanceApplyBody: function () {
                var aDailyBalance = this._LocalData.getProperty("/dailyBalance");
                var postDoc = {};
                postDoc.KAISHA_CD = aDailyBalance[0].KAISHA_CD;
                postDoc.KIHYO_NO = aDailyBalance[0].KIHYO_NO;
                return postDoc;
            },

            postBalanceSave: function (postData, sAction) {
                var i = 1;
                var mParameters = {
                    groupId: "DailyBalanceSave" + Math.floor(i / 100),
                    changeSetId: i,
                    success: function (oData) {
                        this.byId("idDailyBalanceCreate").setBusy(false);
                        messages.showText(oData.Message);
                        // this._LocalData.setProperty("/differenceConfirmDetail" , oData.to_Item.results);
                    }.bind(this),
                    error: function (oError) {
                        this.byId("idDailyBalanceCreate").setBusy(false);
                        messages.showError(messages.parseErrors(oError));
                        // this._LocalData.setProperty("/differenceConfirmDetail/" + i + "/Type", "E");
                        // this._LocalData.setProperty("/differenceConfirmDetail/" + i + "/Message", messages.parseErrors(oError));
                    }.bind(this),
                };
                this.getOwnerComponent().getModel().setHeaders({"button":sAction});
                //复杂结构
                this.getOwnerComponent().getModel().create("/ZzShopDailyBalanceSet", postData, mParameters);
                this.byId("idDailyBalanceCreate").setBusyIndicatorDelay(0);
                this.byId("idDailyBalanceCreate").setBusy(true);
            },

            postBalanceApply: function (postData, i) {
                i = 1;
                var mParameters = {
                    groupId: "DailyBalanceApply" + Math.floor(i / 100),
                    changeSetId: i,
                    success: function (oData) {
                        this.byId("idDailyBalanceCreate").setBusy(false);
                        messages.showText(oData.Message);
                        // this._LocalData.setProperty("/differenceConfirmDetail" , oData.to_Item.results);
                    }.bind(this),
                    error: function (oError) {
                        this.byId("idDailyBalanceCreate").setBusy(false);
                        messages.showError(messages.parseErrors(oError));
                        // this._LocalData.setProperty("/differenceConfirmDetail/" + i + "/Type", "E");
                        // this._LocalData.setProperty("/differenceConfirmDetail/" + i + "/Message", messages.parseErrors(oError));
                    }.bind(this),
                };
                this.getOwnerComponent().getModel().setHeaders({"button":"Apply"});
                //复杂结构
                this.getOwnerComponent().getModel().create("/ZzShopDailyBalanceSet", postData, mParameters);
                this.byId("idDailyBalanceCreate").setBusyIndicatorDelay(0);
                this.byId("idDailyBalanceCreate").setBusy(true);
            },

            onChangePress: function (oEvent) {
                // if (oEvent.getSource().getPressed()) {
                //     this._LocalData.setProperty("/DailyBalanceEditable", true);
                // } else {
                //     this._LocalData.setProperty("/DailyBalanceEditable", false);
                // }
            },

            

        });
    });