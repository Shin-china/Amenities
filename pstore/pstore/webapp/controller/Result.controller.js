sap.ui.define([
    "sap/ui/core/mvc/Controller", 
    "com/shin/pstore/pstore/utils/Common"
], function (
    Controller, 
    Common
) {
    "use strict";

    return Controller.extend("com.shin.pstore.pstore.controller.Result", {

        onInit: function () {
            if (!this._comm) {
                this._comm = new Common();
            }
        },



        onShowCancelDialog: function () {
            this._comm.openDialog(this, "com.shin.pstore.pstore.view.CancelDoc");
        },

        onCloseCancelDialog: function () {
            this._comm.closeDialog(this, "cancelDialog");
        },

        onCancelDoc: function () {

        }
    });
});