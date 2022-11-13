sap.ui.define(
    [
      "FICO/dailybalanceapproval/controller/abr/DailyBalance",
      "sap/f/library",
      "sap/ui/model/Filter",
    ],
    function(DailyBalance, library, Filter) {
      "use strict";
      var LayoutType = library.LayoutType;
      return DailyBalance.extend("FICO.dailybalanceapproval.controller.abr.DailyBalanceABR", {
        onInit() {
          this.InitModel = this.getOwnerComponent().getModel("init");
          this._abrModel = this.getOwnerComponent().getModel("abr");
          this._LocalData = this.getOwnerComponent().getModel("local");
          this._oDataModel = this.getOwnerComponent().getModel();
			    this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
          this.oRouter = this.getRouter();
          this.oRouter.getRoute("DailyBalanceABR").attachMatched(this.onRouteMatched, this);
          
        },

        onRouteMatched: function(oEvent) {
          var oArgs = oEvent.getParameter("arguments");
          var sPath = "/" + oArgs.path;
          this.byId("idDailyBalanceABR").setBusy(true);
          this.goSearch(sPath).then(function () {
            sPath = "ZzShopDailyBalanceSet" + sPath.split("Set")[1];
            var oHeader = this._abrModel.getProperty("/" + sPath);
            this.initialLocalModel_dis(oHeader);
            this.tableConverted_dis(sPath);
            this.byId("idDailyBalanceABR").setBusy(false);
          }.bind(this));
        },

        goSearch: function(sPath) {
          var oItem = this._oDataModel.getProperty(sPath);
          var aFilters = [];
          aFilters.push(new Filter("KAISHA_CD", "EQ", oItem.KAISHA_CD)); 
          aFilters.push(new Filter("KIHYO_NO", "EQ", oItem.KIHYO_NO)); 
          var promise = new Promise(function (resolve, reject) {
            var mParameters = {
                filters: aFilters,
                urlParameters: {
                  "$expand": "to_Header,to_ZzCashIncome,to_ZzCashPayment,to_ZzTreasuryCash"
                },
                success: function (oData) {
                    resolve();
                    // that._LocalData.progressConfir = oData.results;
                    // that._LocalData.setProperty("/progressConfir", oData.results);
                    // sap.ui.getCore().getElementById(sViewId +"--reportTable").setBusy(false);
                },
                error: function (oError) {
                    // sap.ui.getCore().getElementById(sViewId +"--reportTable").setBusy(false);
                    resolve();
                }.bind(this)
            };
            this._abrModel.read("/ZzShopDailyBalanceSet", mParameters);
          }.bind(this));
          return promise;
          
        },

        handleFullScreen: function () {
          // this.bFocusFullScreenButton = true;
          var sNextLayout = this._LocalData.getProperty("/actionButtonsInfo/midColumn/fullScreen");
          sNextLayout = LayoutType.MidColumnFullScreen
          this.oRouter.navTo("DailyBalanceABR", {layout: sNextLayout});
          this._LocalData.setProperty("/actionButtonsInfo/midColumn/exitFullScreen","OneColumn");
          this._LocalData.setProperty("/actionButtonsInfo/midColumn/fullScreen",null);
        },
        handleExitFullScreen: function () {
          // this.bFocusFullScreenButton = true;
          var sNextLayout = this._LocalData.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
          sNextLayout = LayoutType.TwoColumnsMidExpanded
          this.oRouter.navTo("DailyBalanceABR", {layout: sNextLayout});
          this._LocalData.setProperty("/actionButtonsInfo/midColumn/fullScreen","MidColumnFullScreen");
          this._LocalData.setProperty("/actionButtonsInfo/midColumn/exitFullScreen",null);
        },
        handleClose: function () {
          var sNextLayout = this._LocalData.getProperty("/actionButtonsInfo/midColumn/closeColumn");
          this.oRouter.navTo("ApprovalList", {layout: sNextLayout});
        },
      });
    }
  );
  