import Utils from '../helpers/utils';

class ComponentsScreen {

  buttonComponentElement = Utils.platformSelect({
    ios: '[label="Button Simple React Native button component."]',
    android: '~Button Simple React Native button component.',
  });


  async checkButtonComponentIsDisplayed() {
    return await Utils.checkElementExistence(this.buttonComponentElement);
  }

  async clickButtonComponent() {
    await Utils.clickElement(this.buttonComponentElement);
  }
}
module.exports = new ComponentsScreen();

