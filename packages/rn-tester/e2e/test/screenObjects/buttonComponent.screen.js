const Utils = require('../helpers/utils');

class ButtonComponentScreen {

    buttonScreen = '//android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView[1]';

    btnSubmit = '//android.widget.Button[@resource-id="button_default_styling"]';

    alertBox = '//android.widget.TextView[@resource-id="android:id/alertTitle"]';

    inputSearch = '//android.widget.EditText[@resource-id="example_search"]';

    btnOK = '//android.widget.Button[@text="OK"]';

    btnCancel = '//android.widget.Button[@resource-id="cancel_button"]';


    buttonScreenIOS = '[label="Button"]';

    btnSubmitIOS = '[label="Press to submit your application!"]';

    inputSearchIOS = '[name="example_search"]';

    btnOKIOS = '[label="OK"]';

    btnCancelIOS = '[label="Press to cancel your application!"]';


    async checkButtonsScreenIsDisplayed() {
        let deviceLocator;
        if (process.env.ENV === 'ios') {
            deviceLocator === this.buttonScreenIOS;
        }
        if (process.env.ENV === 'android') {
            deviceLocator === this.buttonScreen;
        }
        return await Utils.getElementText(this.deviceLocator);
    }

    async clickSubmitApplication() {
        let deviceLocator;
        if (process.env.ENV === 'ios') {
            deviceLocator === this.btnSubmitIOS;
        }
        if (process.env.ENV === 'android') {
            deviceLocator === this.btnSubmit;
        }
        await Utils.clickElement(this.btnSubmit);
    }

    async clickCancelApplication() {
        let deviceLocator;
        if (process.env.ENV === 'ios') {
            deviceLocator === this.btnCancelIOS;
        }
        if (process.env.ENV === 'android') {
            deviceLocator === this.btnCancel;
        }
        await Utils.clickElement(this.btnCancel);
    }
    async getAlertText() {
        let deviceLocator;
        if (process.env.ENV === 'ios') {
            deviceLocator === this.buttonScreenIOS;
        }
        if (process.env.ENV === 'android') {
            deviceLocator === this.buttonScreen;
        }
        return await Utils.getElementText(this.alertBox);
    }

    async clickOkButton() {
        let deviceLocator;
        if (process.env.ENV === 'ios') {
            deviceLocator === this.btnOKIOS;
        }
        if (process.env.ENV === 'android') {
            deviceLocator === this.btnOK;
        }
        await Utils.clickElement(this.deviceLocator);
    }

}
module.exports = new ButtonComponentScreen();
