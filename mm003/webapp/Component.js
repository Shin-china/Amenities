/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "mm003/model/models",
        "sap/f/FlexibleColumnLayoutSemanticHelper",
        "sap/f/library",
        "sap/ui/core/routing/HashChanger"
    ],
    function (UIComponent, Device, models, FlexibleColumnLayoutSemanticHelper, library, HashChanger) {
        "use strict";
        var LayoutType = library.LayoutType;
        return UIComponent.extend("mm003.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // reset the routing hash
                HashChanger.getInstance().replaceHash("");

                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");

                // set the local model
			    this.setModel(models.createLocalModel(), "local");

            },

            getHelper: function () {
                var oFCL = this.getRootControl().byId("fcl"),
                    // oParams = UriParameters.fromQuery(location.search),
                    oSettings = {
                        defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
                        defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
                        maxColumnsCount: 2
                    };
    
                return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
            }
        });
    }
);