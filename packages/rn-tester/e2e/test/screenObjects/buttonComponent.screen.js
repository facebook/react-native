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

    submitAlertBoxIOS = '[label="Your application has been submitted!"]';

    inputSearchIOS = '[name="example_search"]';

    btnOKIOS = '[label="OK"]';

    btnCancelIOS = '[label="Press to cancel your application!"]';

    cancelAlertBoxIOS = '[label="Your application has been cancelled!"]';


    async checkButtonsScreenIsDisplayed() {
        let deviceLocator;
        if (process.env.E2E_DEVICE.includes('ios')) {
            deviceLocator = this.buttonScreenIOS;
        }
        if (process.env.E2E_DEVICE.includes('android')) {
            deviceLocator = this.buttonScreen;
        }
        return await Utils.getElementText(deviceLocator);
    }

    async clickSubmitApplication() {
        let deviceLocator;
        if (process.env.E2E_DEVICE.includes('ios')) {
            deviceLocator = this.btnSubmitIOS;
        }
        if (process.env.E2E_DEVICE.includes('android')) {
            deviceLocator = this.btnSubmit;
        }
        await Utils.clickElement(deviceLocator);
    }

    async clickCancelApplication() {
        let deviceLocator;
        if (process.env.E2E_DEVICE.includes('ios')) {
            deviceLocator = this.btnCancelIOS;
        }
        if (process.env.E2E_DEVICE.includes('android')) {
            deviceLocator = this.btnCancel;
        }
        await Utils.clickElement(deviceLocator);
    }

    async getCancelAlertText() {
        let deviceLocator;
        if (process.env.E2E_DEVICE.includes('ios')) {
            deviceLocator = this.cancelAlertBoxIOS;
        }
        if (process.env.E2E_DEVICE.includes('android')) {
            deviceLocator = this.alertBox;
        }
        return await Utils.getElementText(deviceLocator);
    }

    async getSubmitAlertText() {
        let deviceLocator;
        if (process.env.E2E_DEVICE.includes('ios')) {
            deviceLocator = this.submitAlertBoxIOS;
        }
        if (process.env.E2E_DEVICE.includes('android')) {
            deviceLocator = this.alertBox;
        }
        return await Utils.getElementText(deviceLocator);
    }

    async clickOkButton() {
        let deviceLocator;
        if (process.env.E2E_DEVICE.includes('ios')) {
            deviceLocator = this.btnOKIOS;
        }
        if (process.env.E2E_DEVICE .includes('android')) {
            deviceLocator = this.btnOK;
        }
        await Utils.clickElement(deviceLocator);
    }

}
module.exports = new ButtonComponentScreen();
