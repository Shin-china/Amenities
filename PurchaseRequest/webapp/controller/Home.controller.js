sap.ui.define([
	"MMPurchaseRequest/controller/Base",
], function(
	Base
) {
	"use strict";

	return Base.extend("MMPurchaseRequest.controller.Home", {
		/**
		 * @override
		 */
		onInit: function() {
			this.accNumber();
			this.getOwnerComponent().getModel().setHeaders({view:"change"});
		},
		onSelect: function (oEvent) {
			var sSelectedKey = oEvent.getParameter("selectedKey");
			if (sSelectedKey == "view1") {
				this.getModel().setHeaders({view:"change"});
			} else if (sSelectedKey == "view2") {
				this.getModel().setHeaders({view:"display"});
			}
		},
	});
}); 