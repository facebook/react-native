/**
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../findMatchingSimulator');

const findMatchingSimulator = require('../findMatchingSimulator');

describe('findMatchingSimulator', () => {
  it('should find simulator', () => {
    expect(findMatchingSimulator({
        "devices": {
          "iOS 9.2": [
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 4s",
              "udid": "B9B5E161-416B-43C4-A78F-729CB96CC8C6"
            },
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 5",
              "udid": "1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB"
            },
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 6",
              "udid": "BA0D93BD-07E6-4182-9B0A-F60A2474139C"
            },
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 6 (Plus)",
              "udid": "9564ABEE-9EC2-4B4A-B443-D3710929A45A"
            },
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 6s",
              "udid": "D0F29BE7-CC3C-4976-888D-C739B4F50508"
            }
          ]
        }
      },
      'iPhone 6'
    )).toEqual({
      udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
      name: 'iPhone 6',
      version: 'iOS 9.2'
    });
  });

  it('should return null if no simulators available', () => {
    expect(findMatchingSimulator({
        "devices": {
          "iOS 9.2": [
            {
              "state": "Shutdown",
              "availability": "(unavailable, runtime profile not found)",
              "name": "iPhone 4s",
              "udid": "B9B5E161-416B-43C4-A78F-729CB96CC8C6"
            },
            {
              "state": "Shutdown",
              "availability": "(unavailable, runtime profile not found)",
              "name": "iPhone 5",
              "udid": "1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB"
            },
            {
              "state": "Shutdown",
              "availability": "(unavailable, runtime profile not found)",
              "name": "iPhone 6",
              "udid": "BA0D93BD-07E6-4182-9B0A-F60A2474139C"
            },
            {
              "state": "Shutdown",
              "availability": "(unavailable, runtime profile not found)",
              "name": "iPhone 6 (Plus)",
              "udid": "9564ABEE-9EC2-4B4A-B443-D3710929A45A"
            },
            {
              "state": "Shutdown",
              "availability": "(unavailable, runtime profile not found)",
              "name": "iPhone 6s",
              "udid": "D0F29BE7-CC3C-4976-888D-C739B4F50508"
            }
          ]
        }
      },
      'iPhone 6'
    )).toEqual(null);
  });

  it('should return null if an odd input', () => {
    expect(findMatchingSimulator('random string input', 'iPhone 6')).toEqual(null);
  });

  it('should return the first simulator in list if none is defined', () => {
    expect(findMatchingSimulator({
        "devices": {
          "iOS 9.2": [
            {
              "state": "Shutdown",
              "availability": "(unavailable, runtime profile not found)",
              "name": "iPhone 4s",
              "udid": "B9B5E161-416B-43C4-A78F-729CB96CC8C6"
            },
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 5",
              "udid": "1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB"
            },
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 6",
              "udid": "BA0D93BD-07E6-4182-9B0A-F60A2474139C"
            },
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 6 (Plus)",
              "udid": "9564ABEE-9EC2-4B4A-B443-D3710929A45A"
            },
            {
              "state": "Shutdown",
              "availability": "(unavailable, runtime profile not found)",
              "name": "iPhone 6s",
              "udid": "D0F29BE7-CC3C-4976-888D-C739B4F50508"
            }
          ]
        }
      },
      null
    )).toEqual({
      udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
      name: 'iPhone 5',
      version: 'iOS 9.2'
    });
  });

  it('should return the botted simulator in list if none is defined', () => {
    expect(findMatchingSimulator({
        "devices": {
          "iOS 9.2": [
            {
              "state": "Shutdown",
              "availability": "(unavailable, runtime profile not found)",
              "name": "iPhone 4s",
              "udid": "B9B5E161-416B-43C4-A78F-729CB96CC8C6"
            },
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 5",
              "udid": "1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB"
            },
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 6",
              "udid": "BA0D93BD-07E6-4182-9B0A-F60A2474139C"
            },
            {
              "state": "Shutdown",
              "availability": "(available)",
              "name": "iPhone 6 (Plus)",
              "udid": "9564ABEE-9EC2-4B4A-B443-D3710929A45A"
            },
            {
              "state": "Booted",
              "availability": "(available)",
              "name": "iPhone 6s",
              "udid": "D0F29BE7-CC3C-4976-888D-C739B4F50508"
            }
          ]
        }
      },
      null
    )).toEqual({
      udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
      name: 'iPhone 6s',
      version: 'iOS 9.2'
    });
  });
});
