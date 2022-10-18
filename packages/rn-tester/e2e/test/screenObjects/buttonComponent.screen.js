const Utils = require('../helpers/utils');

class ButtonComponentScreen {

    buttonScreen = '//android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView[1]';

    btnSubmit = '//android.widget.Button[@resource-id="button_default_styling"]';

    alertBox = '//android.widget.TextView[@resource-id="android:id/alertTitle"]';

    inputSearch = '//android.widget.EditText[@resource-id="example_search"]';

    btnOK = '//android.widget.Button[@text="OK"]';

    btnCancel = '//android.widget.Button[@resource-id="cancel_button"]';


    async checkButtonsScreenIsDisplayed() {
        return await Utils.checkElementText(this.buttonScreen);
    }

    async clickSubmitApplication() {
        await Utils.clickElement(this.btnSubmit);
    }

    async clickCancelApplication() {
        await Utils.clickElement(this.btnCancel);
    }

    async getAlertText() {
        return await Utils.checkElementText(this.alertBox);
    }

}
module.exports = new ButtonComponentScreen();
