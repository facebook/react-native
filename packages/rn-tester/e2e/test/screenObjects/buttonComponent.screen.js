const Utils = require('../helpers/utils');
import { Platform } from 'react-native';

class ButtonComponentScreen {

    buttonScreenElement = Platform.select({
        ios: '[label="Button"]',
        android: '//android.view.ViewGroup/android.widget.TextView[@text="Button"]',
    })

    btnSubmitElement = Platform.select({
        ios: '[label="Press to submit your application!"]',
        android: '//android.widget.Button[@resource-id="button_default_styling"]',
    })

    inputSearchElement = Platform.select({
        ios: '[name="example_search"]',
        android: '//android.widget.EditText[@resource-id="example_search"]',
    })

    btnOKElement = Platform.select({
        ios: '[label="OK"]',
        android: '//android.widget.Button[@text="OK"]',
    })

    btnCancelElement = Platform.select({
        ios: '[label="Press to cancel your application!"]',
        android: '//android.widget.Button[@resource-id="cancel_button"]',
    })

    submitAlertBoxElement = Platform.select({
        ios: '[label="Your application has been submitted!"]',
        android: '//android.widget.TextView[@resource-id="android:id/alertTitle"]',
    })

    cancelAlertBoxElement = Platform.select({
        ios: '[label="Your application has been cancelled!"]',
        android: '//android.widget.TextView[@resource-id="android:id/alertTitle"]',
    })



    async checkButtonsScreenIsDisplayed() {
        return await Utils.getElementText(this.buttonScreenElement);
    }

    async clickSubmitApplication() {
        await Utils.clickElement(this.btnSubmitElement);
    }

    async clickCancelApplication() {
        await Utils.clickElement(this.btnCancelElement);
    }

    async getCancelAlertText() {
        return await Utils.getElementText(this.cancelAlertBoxElement);
    }

    async getSubmitAlertText() {
        return await Utils.getElementText(this.submitAlertBoxElement);
    }

    async clickOkButton() {
        await Utils.clickElement(this.btnOKElement);
    }

}
module.exports = new ButtonComponentScreen();
