sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/Filter"
    ],
    function(BaseController,Filter) {
      "use strict";
  
      return BaseController.extend("mm003.controller.List", {
        onInit: function () {
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();
            this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        onBeforeRebindTable: function(oEvent) {
            this._oDataModel.resetChanges();
            this._oDataModel.refresh(true,true);
            var mBindingParams = oEvent.getParameter("bindingParams");
            mBindingParams.parameters["expand"] = "to_ZzItems,to_ZzTotal";
        },

        onPressNavToDetail: function (oEvent) {
            // this._LocalData.setProperty("/busy", true);
            var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
            var sPath = oEvent.getSource().getBindingContext().getPath();

            var oRecord = this._oDataModel.getProperty(sPath);

            // 设置审批履历数据
            // this.setApprovalHistory(oRecord);

            sPath = sPath.substr(1);
            //获取ABR店铺数据 导航到ABR店铺界面
            // this.getDailyBalance(sPath).then(function (res) {
            //     this.getRouter().navTo("Item", {layout: oNextUIState.layout, contextPath:sPath});
            // }.bind(this));

            //获取P店铺数据 导航到P店铺界面
            // this.getPstore(sPath).then(function (res) {

            // }.bind(this));

            if (oRecord.TYPE == "PO") {
                // this.getOwnerComponent().getRouter().navTo("PoItem", {layout: oNextUIState.layout, contextPath:sPath});
                this.getDailyBalance(sPath).then(function (res) {
                    this.getOwnerComponent().getRouter().navTo("PoItem", {layout: oNextUIState.layout, contextPath:sPath});
                }.bind(this));
            } else {
                // this.getOwnerComponent().getRouter().navTo("Item", {layout: oNextUIState.layout, contextPath:sPath});
                this.getDailyBalance(sPath).then(function (res) {
                    this.getOwnerComponent().getRouter().navTo("Item", {layout: oNextUIState.layout, contextPath:sPath});
                }.bind(this));
            }   
        },
        // 获取ABR店铺日计表数据
        getDailyBalance: function (sPath) {
            sPath = "/" + sPath;
            var oDetail = this._oDataModel.getProperty(sPath);
            var aFilters = [];
            aFilters.push(new Filter("EBELN", "EQ", oDetail.EBELN)); 
            aFilters.push(new Filter("TYPE", "EQ", oDetail.TYPE)); 

            var promise = new Promise (function (resolve, reject) {
                var mParameters = {
                    groupId: "getDetail" + Math.floor(1 / 100),
                    changeSetId: 1,
                    filters: aFilters,
                    urlParameters: {
                        $expand: "to_ZzItems,to_ZzTotal"
                    },
                    success: function (oData) {
                        resolve(oData);
                    }.bind(this),
                    error: function (oError) {  
                        messages.showError(messages.parseErrors(oError));
                    }.bind(this),
                };
                this.getOwnerComponent().getModel().setHeaders({"approval":"X"});
                this.getOwnerComponent().getModel().read("/ZzHeaderSet", mParameters);
            }.bind(this));
            return promise;
        },
      });
    }
  );
  