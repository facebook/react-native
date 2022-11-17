const Utils = require('../helpers/utils');
import { Platform } from 'react-native';

class ComponentsScreen {

  buttonComponentElement = Platform.select({
    ios: '[label="Button Simple React Native button component."]',
    android: '~Button Simple React Native button component.',
  })


  async checkButtonComponentIsDisplayed() {
    return await Utils.checkElementExistence(this.buttonComponentElement);
  }

  async clickButtonComponent() {
    await Utils.clickElement(this.buttonComponentElement);
  }
}
module.exports = new ComponentsScreen();

