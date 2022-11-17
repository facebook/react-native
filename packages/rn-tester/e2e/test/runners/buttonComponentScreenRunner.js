import { defineFeature, loadFeature } from 'jest-cucumber';
import { givenUserOnMainPage } from '../common_steps/commonSteps.steps';
import * as steps from '../steps/buttonComponentScreen.steps';

Object.entries(steps).forEach(([name, exported]) => window[name] = exported);
const feature = loadFeature('test/features/buttonComponentScreen.feature');

defineFeature(feature, (test) => {
    test('Cancel Button', ({ given, when, then }) => {

        givenUserOnMainPage(given);

        thenVerifyThatTheButtonComponentIsDisplayed(then);

        whenUserClicksOnTheButtonComponent(when);

        thenVerifyThatTheButtonHeaderIsDisplayed(then);

        whenUserClicksOnTheCancelApplicationButton(when);

        thenVerifyAlertBoxHasText(then);

        whenUserClicksOnTheOKButton(when);

        thenVerifyThatTheButtonHeaderIsDisplayed(then);
    });

    test('Submit Button', ({ given, when, then }) => {

        givenUserOnMainPage(given);

        thenVerifyThatTheButtonComponentIsDisplayed(then);

        whenUserClicksOnTheButtonComponent(when);

        thenVerifyThatTheButtonHeaderIsDisplayed(then);

        whenUserClicksOnTheSubmitApplicationButton(when);

        thenVerifyAlertBoxHasText(then);

        whenUserClicksOnTheOKButton(when);

        thenVerifyThatTheButtonHeaderIsDisplayed(then);
    });
  });
