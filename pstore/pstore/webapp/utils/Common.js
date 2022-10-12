sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/ui/core/routing/History"
], function (
    BaseObject,
    MessagePopover,
    MessageItem,
    History
) {
    "use strict";

    return BaseObject.extend("com.shin.pstore.pstore.utils.Common", {

        constructor: function () {

        },

        closeDialog: function (oContext, sDialogId) {
            var oDialog = oContext.getView().byId(sDialogId);
            oDialog.close();
            oDialog.destroy();
        },

        openDialog: function (oContext, sViewName) {
            var oDialog = oContext.loadFragment({
                name: sViewName
            });

            oDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        showMessagePopoverFor: function (oContext, sBindingPath, sAttachButtonId) {

            var oMessageTemplate = new MessageItem({
                type: '{type}',
                title: '{title}',
                activeTitle: "{active}",
                description: '{description}',
                subtitle: '{subtitle}',
                counter: '{counter}'
            });

            oContext._oMessagePopover = new MessagePopover({
                items: {
                    path: sBindingPath,
                    template: oMessageTemplate
                }
            });

            oContext.byId(sAttachButtonId).addDependent(oContext._oMessagePopover);
            oContext.byId(sAttachButtonId).setVisible(true);
        },

        navBackFrom: function(context){
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(context);
                oRouter.navTo("RouteMain", {}, true);
            }

            context.getView().getModel().refresh();
        }

    });
});