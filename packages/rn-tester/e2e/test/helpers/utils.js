
class Utils {

  async checkElementExistence(locator) {
    await $(locator).waitForDisplayed();
    return await $(locator).isDisplayed();
  }

  async clickElement(locator) {
    await $(locator).waitForDisplayed();
    await $(locator).click();
    //TODO change to better solution like waitForDocumentFullyLoaded()
    await browser.pause(1000);
  }

  async checkElementText(locator) {
    await $(locator).waitForDisplayed();
    return await $(locator).getText();
  }

}
module.exports = new Utils();
