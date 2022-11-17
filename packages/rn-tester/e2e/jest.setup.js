const wdio = require('webdriverio');
import capabilities from './e2e-config.js';
import { beforeEach, afterEach, jest } from '@jest/globals';


jest.setTimeout(40000);

let driver;
const config = {
  path: '/wd/hub',
  host: 'localhost',
  port: 4723,
  waitforTimeout: 30000,
  logLevel: 'silent',
  capabilities: {
    ...capabilities,
  },
};

beforeEach(async () => {
  driver = await wdio.remote(config);
});

afterEach(async () => {
  console.info('[afterAll] Done with testing!');
  await driver.deleteSession();
});

export { driver };

