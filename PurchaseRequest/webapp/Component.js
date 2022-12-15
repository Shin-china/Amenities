sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"MMPurchaseRequest/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("MMPurchaseRequest.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// set local model
			this.setModel(models.createLocalModel(), "settings");

			// create local data model
			this.setModel(models.createDataModel(), "local");

		}
	});
});