import { defineFeature, loadFeature } from 'jest-cucumber';
import { givenUserOnMainPage } from '../common_steps/commonSteps.steps';
import { thenVerifyAlertBoxHasText, thenVerifyThatTheButtonComponentIsDisplayed, thenVerifyThatTheButtonHeaderIsDisplayed, whenUserClicksOnTheButtonComponent, whenUserClicksOnTheCancelApplicationButton, whenUserClicksOnTheOKButton, whenUserClicksOnTheSubmitApplicationButton } from '../steps/buttonComponentScreen.steps';

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
    });

    test('Submit Button', ({ given, when, then }) => {

        givenUserOnMainPage(given);

        thenVerifyThatTheButtonComponentIsDisplayed(then);

        whenUserClicksOnTheButtonComponent(when);

        thenVerifyThatTheButtonHeaderIsDisplayed(then);

        whenUserClicksOnTheSubmitApplicationButton(when);

        thenVerifyAlertBoxHasText(then);

        whenUserClicksOnTheOKButton(when);
    });
  });
