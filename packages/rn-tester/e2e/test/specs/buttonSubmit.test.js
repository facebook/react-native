
const componentsScreen = require('../screenObjects/components.screen.js');
const buttonComponentScreen = require('../screenObjects/buttonComponent.screen.js');
const submitText = 'Your application has been submitted!';

describe('First tests', () => {
  test('Should view properly submit alert text', async () => {
    expect(await componentsScreen.checkButtonComponentIsDisplayed()).toBeTruthy();
    await componentsScreen.clickButtonComponent();
    await buttonComponentScreen.clickSubmitApplication();
    expect(await buttonComponentScreen.getAlertText()).toContain(submitText);
    await buttonComponentScreen.clikOKButton();
  });
});
