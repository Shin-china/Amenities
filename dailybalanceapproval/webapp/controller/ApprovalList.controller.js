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

        return BaseController.extend("FICO.dailybalanceapproval.controller.ApprovalList", {
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
			    this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                this._abrModel = this.getOwnerComponent().getModel("abr");
            },

            

            // onAfterRendering: function(){
            //     var oSplitApp = this.getView().byId("oSplitApp");
            //     oSplitApp.getAggregation("_navMaster").addStyleClass("splitAppMasterStyle");
            // },

            // onExit: function () {
            //     Device.orientation.detachHandler(this.onOrientationChange, this);
            // },
    
            // onOrientationChange: function (mParams) {
            //     var sMsg = "Orientation now is: " + (mParams.landscape ? "Landscape" : "Portrait");
            //     MessageToast.show(sMsg, { duration: 5000 });
            // },
    
            // onPressNavToDetail: function () {
            //     this.getSplitAppObj().to(this.createId("detailDetail"));
            // },
    
            // onPressDetailBack: function () {
            //     this.getSplitAppObj().backDetail();
            // },
    
            // onPressMasterBack: function () {
            //     this.getSplitAppObj().backMaster();
            // },
    
            // onPressGoToMaster: function () {
            //     this.getSplitAppObj().toMaster(this.createId("master2"));
            // },
    
            // onListItemPress: function (oEvent) {
            //     var sToPageId = oEvent.getParameter("listItem").getCustomData()[0].getValue();
    
            //     this.getSplitAppObj().toDetail(this.createId(sToPageId));
            // },
    
            // onPressModeBtn: function (oEvent) {
            //     var sSplitAppMode = oEvent.getSource().getSelectedButton().getCustomData()[0].getValue();
    
            //     this.getSplitAppObj().setMode(sSplitAppMode);
            //     MessageToast.show("Split Container mode is changed to: " + sSplitAppMode, { duration: 5000 });
            // },
    
            // getSplitAppObj: function () {
            //     var result = this.byId("SplitAppDemo");
            //     if (!result) {
            //         Log.info("SplitApp object can't be found");
            //     }
            //     return result;
            // },

            // _applyFilter: function(oFilter) {
            //     // Get the table (last thing in the VBox) and apply the filter
            //     // var aVBoxItems = this.byId("idVBox").getItems(),
            //     //     oTable = aVBoxItems[aVBoxItems.length - 1];
            //     var oTable = this.byId("uitable");
    
            //     oTable.getBinding("rows").filter(oFilter);
            // },
    
            // handleFacetFilterReset: function(oEvent) {
            //     var oFacetFilter = Element.registry.get(oEvent.getParameter("id")),
            //         aFacetFilterLists = oFacetFilter.getLists();
    
            //     for (var i = 0; i < aFacetFilterLists.length; i++) {
            //         aFacetFilterLists[i].setSelectedKeys();
            //     }
    
            //     this._applyFilter([]);
            // },
    
            // handleListClose: function(oEvent) {
            //     // Get the Facet Filter lists and construct a (nested) filter for the binding
            //     var oFacetFilter = oEvent.getSource().getParent();
    
            //     this._filterModel(oFacetFilter);
            // },
    
            // handleConfirm: function (oEvent) {
            //     // Get the Facet Filter lists and construct a (nested) filter for the binding
            //     var oFacetFilter = oEvent.getSource();
            //     this._filterModel(oFacetFilter);
            //     MessageToast.show("confirm event fired");
            // },
    
            // _filterModel: function(oFacetFilter) {
            //     var mFacetFilterLists = oFacetFilter.getLists().filter(function(oList) {
            //         return oList.getSelectedItems().length;
            //     });
    
            //     if (mFacetFilterLists.length) {
            //         // Build the nested filter with ORs between the values of each group and
            //         // ANDs between each group
            //         var oFilter = new Filter(mFacetFilterLists.map(function(oList) {
            //             return new Filter(oList.getSelectedItems().map(function(oItem) {
            //                 return new Filter(oList.getKey(), "EQ", oItem.getText());
            //             }), false);
            //         }), true);
            //         this._applyFilter(oFilter);
            //     } else {
            //         this._applyFilter([]);
            //     }
            // },

            onPressNavToDetail: function (oEvent) {
                 //localmodel中当前行的绑定路径
                //  var sPath = oEvent.getSource().getBindingContext("local").getPath();
                //  this.byId("idSimpleForm1").bindElement("local>" + sPath);
                //  this.byId("idDetialPage1").setVisible(true);
                var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
                var sPath = oEvent.getSource().getBindingContext().getPath();
                sPath = sPath.substr(1);
                this.getRouter().navTo("DailyBalanceABR", {layout: oNextUIState.layout, path:sPath});
            },
            
        });
    });
