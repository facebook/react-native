const Utils = require('../helpers/utils');

class ComponentsScreen {

    buttonComponent = '~Button Simple React Native button component.';
    buttonComponentIOS = '[label="Button Simple React Native button component."]';

     async checkButtonComponentIsDisplayed() {
      let deviceLocator;
        if (process.env.E2E_DEVICE.includes('ios')) {
            deviceLocator = this.buttonComponentIOS;
        }
        if (process.env.E2E_DEVICE .includes('android')) {
            deviceLocator = this.buttonComponent;
        }
       return await Utils.checkElementExistence(deviceLocator);
     }

     async clickButtonComponent() {
      let deviceLocator;
        if (process.env.E2E_DEVICE.includes('ios')) {
            deviceLocator = this.buttonComponentIOS;
        }
        if (process.env.E2E_DEVICE .includes('android')) {
            deviceLocator = this.buttonComponent;
        }
      await Utils.clickElement(deviceLocator);
    }
}
module.exports = new ComponentsScreen();

