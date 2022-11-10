import { driver } from '../../jest.setup.js';

export const givenUserOnMainPage = (given) => {
    given(/user is on the main page/, async () => {
        await driver.pause(2000);
    })
}