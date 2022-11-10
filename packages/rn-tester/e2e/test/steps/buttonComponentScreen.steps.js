import componentsScreen from '../screenObjects/components.screen.js';
import buttonComponentScreen from '../screenObjects/buttonComponent.screen.js';
import { expect } from '@jest/globals';

export const thenVerifyThatTheButtonComponentIsDisplayed = (then) => {
    then(/^Verify that the Button component is displayed$/, async () => {
        expect(await componentsScreen.checkButtonComponentIsDisplayed()).toBeTruthy();
    });
};

export const whenUserClicksOnTheButtonComponent = (when) => {
    when(/^User clicks on the Button component$/, async () => {
        await componentsScreen.clickButtonComponent();
    });
};

export const thenVerifyThatTheButtonHeaderIsDisplayed = (then) => {
    then(/^Verify that the "(.*)" header is displayed$/, async (headerScreenName) => {
        expect(await buttonComponentScreen.checkButtonsScreenIsDisplayed()).toContain(headerScreenName);
    });
};

export const whenUserClicksOnTheCancelApplicationButton = (when) => {
    when(/^User clicks on the Cancel Application button$/, async () => {
        await buttonComponentScreen.clickCancelApplication();
    });
};

export const thenVerifyAlertBoxHasText = (then) => {
    then(/^Verify that the alert box has text: "(.*)"$/, async (alertBoxText) => {
        expect(await buttonComponentScreen.getCancelAlertText()).toContain(alertBoxText);
    });
};

export const whenUserClicksOnTheOKButton = (when) => {
    when(/^User clicks on the OK button$/, async () => {
        await buttonComponentScreen.clickOkButton();
    });
};

export const whenUserClicksOnTheSubmitApplicationButton = (when) => {
    when(/^User clicks on the Submit Application button$/, async () => {
        await buttonComponentScreen.clickSubmitApplication();
    });
};
