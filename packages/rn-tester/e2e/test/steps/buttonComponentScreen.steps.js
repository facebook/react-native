import componentsScreen from '../screenObjects/components.screen.js';
import buttonComponentScreen from '../screenObjects/buttonComponent.screen.js';

export const thenVerifyThatTheButtonComponentIsDisplayed = (then) => {
    then('verify that the Button component is displayed', async () => {
        expect(await componentsScreen.checkButtonComponentIsDisplayed()).toBeTruthy();
    });
};

export const whenUserClicksOnTheButtonComponent = (when) => {
    when('user clicks on the Button component', async () => {
    await componentsScreen.clickButtonComponent();
});
};

export const thenVerifyThatTheButtonHeaderIsDisplayed = (then) => {
    then('verify that the Button header is displayed', async () => {
    expect(await buttonComponentScreen.checkButtonsScreenIsDisplayed()).toContain('Button');
});
};

export const whenUserClicksOnTheCancelApplicationButton = (when) => {
    when('user clicks on the Cancel Application button', async () => {
    await buttonComponentScreen.clickCancelApplication();
});
};

export const thenVerifyThatTheAlertBoxWithApplicationCancelledIsDisplayed = (then) => {
    then('verify that the alert box with Your application has been cancelled! text is displayed', async () => {
    const cancelText = 'Your application has been cancelled!';
    expect(await buttonComponentScreen.getCancelAlertText()).toContain(cancelText);
});
};

export const whenUserClicksOnTheOKButton = (when) => {
    when('user clicks on the OK button', async () => {
    await buttonComponentScreen.clickOkButton();
});
};

export const whenUserClicksOnTheSubmitApplicationButton = (when) => {
    when('user clicks on the Submit Application button', async () => {
    await buttonComponentScreen.clickSubmitApplication();
});
};

export const thenVerifyThatTheAlertBoxWithApplicationSubmittedIsDisplayed = (then) => {
    then('verify that the alert box with Your application has been submitted! text is displayed', async () => {
    const submitText = 'Your application has been submitted!';
    expect(await buttonComponentScreen.getSubmitAlertText()).toContain(submitText);
});
};