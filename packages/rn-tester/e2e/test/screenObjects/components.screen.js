const Utils = require('../helpers/utils');

class ComponentsScreen {

    buttonComponent = '[label="Button Simple React Native button component."]';

     async checkButtonComponentIsDisplayed() {
       return await Utils.checkElementExistence(this.buttonComponent);
     }

     async clickButtonComponent() {
      await Utils.clickElement(this.buttonComponent);
    }
}
module.exports = new ComponentsScreen();

