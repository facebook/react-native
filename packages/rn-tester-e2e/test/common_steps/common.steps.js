import { driver } from '../../jest.setup.js';

// Common steps reusable between different features
export const userIsOnMainScreen = (given) => {
    given('User is on the main screen', async () => {
        await driver.pause(2000);
    });
};

export const clickOkButton = (given) => {
    given('User clicks on the OK button', async () => {
        await driver.pause(2000);
    });
};
