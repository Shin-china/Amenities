sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "com/shin/pstore/pstore/utils/Common"
], function (
    Controller,
    UIComponent,
    Common
) {
    "use strict";

    return Controller.extend("com.shin.pstore.pstore.controller.DailyTabulation", {

        onInit: function () {
            if (!this._comm) {
                this._comm = new Common();
            }
        },

        onNavigate: function (oEvent) {
            var oRouter = UIComponent.getRouterFor(this);
			var oItem = oEvent.getSource(); 
            var oBindingContext=oItem.getBindingContext();
            var path=oBindingContext.getPath();
            var id = path.substr(path.lastIndexOf("/") + 1);
			oRouter.navTo("StoreDetail", {
                    id: id
            });
        },

        onShowAddDialog: function () {
            this._comm.openDialog(this, "com.shin.pstore.pstore.view.AddStore");
        },

        onShowCopyDialog: function () {
            this._comm.openDialog(this, "com.shin.pstore.pstore.view.CopyStore");
        },

        onShowDeleteDialog: function () {
            this._comm.openDialog(this, "com.shin.pstore.pstore.view.DeleteStore");
        },

        onShowGenerateDialog: function () {
            this._comm.openDialog(this, "com.shin.pstore.pstore.view.GenerateDoc");
        },

        onCloseAddDialog: function () {
            this._comm.closeDialog(this, "addDialog");
        },

        onCloseCopyDialog: function () {
            this._comm.closeDialog(this, "copyDialog");
        },

        onCloseDeleteDialog: function () {
            this._comm.closeDialog(this, "deleteDialog");
        },

        onCloseGenerateDialog: function () {
            this._comm.closeDialog(this, "generateDialog");
        },

        onAddStore: function () {

        },

        onCopyStore: function () {

        },

        onDeleteStore: function () {

        },

        onGenerateDoc: function () {

        },

        onExportPdf: function(){
            
        }
    });
});