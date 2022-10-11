sap.ui.define([
	"sap/ui/base/Object"
], function(
	BaseObject
) {
	"use strict";

	return BaseObject.extend("com.shin.pstore.pstore.utils.Common",{

        constructor:function(){
            
        },

		closeDialog: function(context=this, dialogId){
            var oDialog = context.getView().byId(dialogId);
            oDialog.close();
            oDialog.destroy();
        },

        openDialog: function(context=this, viewName){
            var oDialog = context.loadFragment({
					name: viewName
			});

			oDialog.then(function(oDialog) {
				oDialog.open();
			});
        }

	});
});