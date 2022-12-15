sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createLocalModel: function() {
			var oSettingModel = new JSONModel({
				appProperties: {
					busy: false
				}
			});
			return oSettingModel;
		},

		createDataModel: function() {
			var oDataModel = new JSONModel({
				ZzPRHeaderSet: {
					//converflag: " <-> "
				},
				ZzItem: [],
				ZzSum: [],
				ZzAttachment: [],
				ZzPRHeaderSetOld: {
					//converflag: " <-> "
				},
				ZzItemOld: [],
				ZzItemSumOld: [],
				Zzoption: "",
				ZzTitle: "",
				Zspzt: "",
				Zbanfn: "",
				Banfn: ""
			});
			return oDataModel;
		}

	};
});