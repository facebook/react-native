import { driver } from '../../jest.setup.js';

export const givenUserOnMainPage = (given) => {
    given('User is on the main screen', async () => {
        await driver.pause(2000);
    });
};
