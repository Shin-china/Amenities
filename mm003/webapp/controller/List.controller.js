sap.ui.define(
    [
        "mm003/controller/Base",
        "sap/ui/core/UIComponent",
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/Filter",
        "../model/formatter",
        "sap/ui/core/routing/HashChanger"
    ],
    function(Base, UIComponent, BaseController, Filter, formatter, HashChanger) {
        "use strict";

        return BaseController.extend("mm003.controller.List", {

            formatter: formatter,

            onInit: function() {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },
            onBeforeRebindTable: function(oEvent) {
                HashChanger.getInstance().replaceHash("");
                //this._LocalData.setProperty("/layout", "OneColumn");
                this._oDataModel.resetChanges();
                this._oDataModel.refresh(true, true);
                var mBindingParams = oEvent.getParameter("bindingParams");
                mBindingParams.parameters["expand"] = "to_ZzItems,to_ZzTotal,to_ZzApprovalHistory";
            },

            onPressNavToDetail: function(oEvent, sType) {
                // this._LocalData.setProperty("/busy", true);
                //var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
                var sPath = oEvent.getSource().getBindingContext().getPath();

                var oRecord = this._oDataModel.getProperty(sPath);
                console.log(sPath);
                console.log(oRecord);
                console.log(oEvent);
                // 设置确认按钮可见性
                this._LocalData.setProperty("/saveVisible", oRecord.SAVE);
                this._LocalData.setProperty("/acceptVisible", oRecord.ACCEPT);
                //20230204
                var oRouter = UIComponent.getRouterFor(this);
                var oItem = oEvent.getSource();
                var oBindingContext = oItem.getBindingContext();
                //var path = path.substr(path.lastIndexOf("/") + 1);
                // 设置审批履历数据
                // this.setApprovalHistory(oRecord);

                sPath = sPath.substr(1);

                if (oRecord.TYPE == "PO") {
                    // this.getOwnerComponent().getRouter().navTo("PoItem", {layout: oNextUIState.layout, contextPath:sPath});
                    // this.getItem(sPath).then(function(res) {
                    //this.getOwnerComponent().getRouter().navTo("PoItem", { layout: oNextUIState.layout, contextPath: sPath });
                    this.getItem(sPath).then(function(res) {
                        oRouter.navTo("PoItem", { contextPath: sPath });
                    }.bind(this));
                    //}.bind(this));
                } else {
                    // this.getOwnerComponent().getRouter().navTo("Item", {layout: oNextUIState.layout, contextPath:sPath});
                    //this.getItem(sPath).then(function(res) {
                    //this.getOwnerComponent().getRouter().navTo("Item", { layout: oNextUIState.layout, contextPath: sPath });

                    this.getItem(sPath).then(function(res) {
                        oRouter.navTo("Item", { contextPath: sPath });
                    }.bind(this));
                    //}.bind(this));

                    // this.getAttachment();
                }
            },
            // 获取item数据
            getItem: function(sPath) {
                sPath = "/" + sPath;
                var oDetail = this._oDataModel.getProperty(sPath);
                var aFilters = [];
                aFilters.push(new Filter("EBELN", "EQ", oDetail.EBELN));
                aFilters.push(new Filter("TYPE", "EQ", oDetail.TYPE));

                var promise = new Promise(function(resolve, reject) {
                    var mParameters = {
                        groupId: "getDetail" + Math.floor(1 / 100),
                        changeSetId: 1,
                        filters: aFilters,
                        urlParameters: {
                            $expand: "to_ZzItems,to_ZzTotal,to_ZzApprovalHistory"
                        },
                        success: function(oData) {
                            resolve(oData);
                        }.bind(this),
                        error: function(oError) {
                            messages.showError(messages.parseErrors(oError));
                        }.bind(this),
                    };
                    this.getOwnerComponent().getModel().setHeaders({ "approval": "X" });
                    this.getOwnerComponent().getModel().read("/ZzHeaderSet", mParameters);
                }.bind(this));
                return promise;
            },
            // setApprovalHistory: function (oRecord) {
            //     // 设置审批履历数据
            //     var aApprovalHistory = [];
            //     try {
            //         var aHistoryPath = oRecord.to_ZzApprovalHistory.__list;
            //         aHistoryPath.forEach(function (path) {
            //             var item = this._oDataModel.getProperty("/" + path);
            //             // var sTime = this.formatter.dateTime(item.CREATE_DATE, item.CREATE_TIME);
            //             aApprovalHistory.push({
            //                 // user: item.CREATE_USER,
            //                 name: item.USERNAME,
            //                 // time: new Date(sTime),
            //                 comments: item.COMMENTS,
            //                 action: item.ACTION,
            //                 // approvalText: this.formatter.approvalText(item.ACTION),
            //                 // approvalStatus: this.formatter.approvalStatus(item.ACTION),
            //                 // approvalIcon: this.formatter.approvalIcon(item.ACTION),
            //                 nodename: item.NODENAME
            //             });
            //         }, this)
            //     } catch (error) {}
            //     this._LocalData.setProperty("/approvalHistory", aApprovalHistory);
            // },
        });
    }
);