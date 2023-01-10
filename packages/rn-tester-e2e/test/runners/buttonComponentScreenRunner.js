import { defineFeature, loadFeature } from 'jest-cucumber';
import { userIsOnMainScreen, clickOkButton } from '../common_steps/common.steps';
import componentsScreen from '../screenObjects/components.screen.js';
import buttonComponentScreen from '../screenObjects/buttonComponent.screen.js';

// Object.entries(steps).forEach(([name, exported]) => window[name] = exported);
const feature = loadFeature('test/features/buttonComponentScreen.feature');

//Methods used more than once in the feature
const buttonComponentShouldBeDisplayed = (then) => {
    then('Verify that the Button component is displayed', async () => {
        expect(await componentsScreen.checkButtonComponentIsDisplayed()).toBeTruthy();
    });
};

const clickOnButtonComponent = (when) => {
    when('User clicks on the Button component', async () => {
        await componentsScreen.clickButtonComponent();
    });
};

const buttonHeaderShouldBeDisplayed = (then) => {
    then(/^Verify that the "(.*)" header is displayed$/, async (headerScreenName) => {
        switch (headerScreenName) {
            case 'Button':
                expect(await buttonComponentScreen.checkButtonsScreenIsDisplayed()).toBeTruthy();
                break;
            // here you can add more similar assertions
            default: throw new Error(`Wrong parameter provided. There is no such case as: ${headerScreenName}`)
        }
    });
};

const alertBoxShouldHaveText = (then) => {
    then(/^Verify that the cancel|submit alert box has text: "(.*)"$/, async (alertBoxType, alertBoxText) => {
        switch (alertBoxType) {
            case 'cancel':
                expect(await buttonComponentScreen.getCancelAlertText()).toContain(alertBoxText);
                break;
            case 'submit':
                expect(await buttonComponentScreen.getSubmitAlertText()).toContain(alertBoxText);
                break;
        }
    });
};

defineFeature(feature, (test) => {
    test('Cancel Button', ({ given, when, then }) => {

        userIsOnMainScreen(given);

        buttonComponentShouldBeDisplayed(then);

        clickOnButtonComponent(when);

        buttonHeaderShouldBeDisplayed(then);

        //method which is used only once in whole feature
        when(/^User clicks on the Cancel Application button$/, async () => {
            await buttonComponentScreen.clickCancelApplication();
        })

        alertBoxShouldHaveText(then);

        clickOkButton(when);

        // buttonHeaderShouldBeDisplayed(then);
    });

    test('Submit Button', ({ given, when, then }) => {

        userIsOnMainScreen(given);

        buttonComponentShouldBeDisplayed(then);

        clickOnButtonComponent(when);

        buttonHeaderShouldBeDisplayed(then);

        when(/^User clicks on the Submit Application button$/, async () => {
            await buttonComponentScreen.clickCancelApplication();
        })

        alertBoxShouldHaveText(then);

        clickOkButton(when);

        // buttonHeaderShouldBeDisplayed(then);
    });
});
