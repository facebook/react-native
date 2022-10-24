const Utils = require('../helpers/utils');

class ButtonComponentScreen {

    // buttonScreen = '//android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView[1]';

    // btnSubmit = '//android.widget.Button[@resource-id="button_default_styling"]';

    // alertBox = '//android.widget.TextView[@resource-id="android:id/alertTitle"]';

    // inputSearch = '//android.widget.EditText[@resource-id="example_search"]';

    // btnOK = '//android.widget.Button[@text="OK"]';

    // btnCancel = '//android.widget.Button[@resource-id="cancel_button"]';


    buttonScreen = '[label="Button"]';

    btnSubmit = '[label="Press to submit your application!"]';

    submitAlertBox = '[value="Your application has been submitted!"]';

    cancelAlertBox = '[value="Your application has been cancelled!"]';

    inputSearch = '[name="example_search"]';

    btnOK = '[label="OK"]';

    btnCancel = '[label="Press to cancel your application!"]';

    async checkButtonsScreenIsDisplayed() {
        return await Utils.checkElementText(this.buttonScreen);
    }

    async clickSubmitApplication() {
        await Utils.clickElement(this.btnSubmit);
    }

    async clickCancelApplication() {
        await Utils.clickElement(this.btnCancel);
    }

    async getSubmitAlertText() {
        return await Utils.checkElementText(this.submitAlertBox);
    }

    async getCancelAlertText() {
        return await Utils.checkElementText(this.cancelAlertBox);
    }

}
module.exports = new ButtonComponentScreen();
