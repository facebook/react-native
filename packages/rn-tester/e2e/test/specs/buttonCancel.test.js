
const componentsScreen = require('../screenObjects/components.screen.js');
const buttonComponentScreen = require('../screenObjects/buttonComponent.screen.js');
const cancelText = 'Your application has been cancelled!';

describe('First tests', () => {
  it('Should view properly submit cancel text', async () => {
    expect(await componentsScreen.checkButtonComponentIsDisplayed()).toBeTruthy();
    await componentsScreen.clickButtonComponent();
    expect(await buttonComponentScreen.checkButtonsScreenIsDisplayed()).toContain('Button');
    await buttonComponentScreen.clickCancelApplication();
    expect(await buttonComponentScreen.getAlertText()).toContain(cancelText);
    await buttonComponentScreen.clikOKButton;
  });

});
