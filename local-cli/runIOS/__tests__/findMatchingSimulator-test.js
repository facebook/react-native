/**
 * /**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+javascript_foundation
 */
'use strict';

jest.dontMock('../findMatchingSimulator');

const findMatchingSimulator = require('../findMatchingSimulator');

describe('findMatchingSimulator', () => {
  it('should find simulator', () => {
    expect(findMatchingSimulator({
        'devices': {
          'iOS 9.2': [
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 4s',
              'udid': 'B9B5E161-416B-43C4-A78F-729CB96CC8C6'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 5',
              'udid': '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6',
              'udid': 'BA0D93BD-07E6-4182-9B0A-F60A2474139C'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6 (Plus)',
              'udid': '9564ABEE-9EC2-4B4A-B443-D3710929A45A'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6s',
              'udid': 'D0F29BE7-CC3C-4976-888D-C739B4F50508'
            }
          ]
        }
      },
      'iPhone 6'
    )).toEqual({
      udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
      name: 'iPhone 6',
      booted: false,
      version: 'iOS 9.2'
    });
  });

  it('should return null if no simulators available', () => {
    expect(findMatchingSimulator({
        'devices': {
          'iOS 9.2': [
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 4s',
              'udid': 'B9B5E161-416B-43C4-A78F-729CB96CC8C6'
            },
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 5',
              'udid': '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB'
            },
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 6',
              'udid': 'BA0D93BD-07E6-4182-9B0A-F60A2474139C'
            },
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 6 (Plus)',
              'udid': '9564ABEE-9EC2-4B4A-B443-D3710929A45A'
            },
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 6s',
              'udid': 'D0F29BE7-CC3C-4976-888D-C739B4F50508'
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
        'devices': {
          'iOS 9.2': [
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 4s',
              'udid': 'B9B5E161-416B-43C4-A78F-729CB96CC8C6'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 5',
              'udid': '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6',
              'udid': 'BA0D93BD-07E6-4182-9B0A-F60A2474139C'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6 (Plus)',
              'udid': '9564ABEE-9EC2-4B4A-B443-D3710929A45A'
            },
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 6s',
              'udid': 'D0F29BE7-CC3C-4976-888D-C739B4F50508'
            }
          ]
        }
      },
      null
    )).toEqual({
      udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
      name: 'iPhone 5',
      booted: false,
      version: 'iOS 9.2'
    });
  });

  it('should return the first simulator in list if none is defined', () => {
    expect(findMatchingSimulator({
        'devices': {
          'iOS 9.2': [
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 4s',
              'udid': 'B9B5E161-416B-43C4-A78F-729CB96CC8C6'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 5',
              'udid': '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6',
              'udid': 'BA0D93BD-07E6-4182-9B0A-F60A2474139C'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6 (Plus)',
              'udid': '9564ABEE-9EC2-4B4A-B443-D3710929A45A'
            },
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 6s',
              'udid': 'D0F29BE7-CC3C-4976-888D-C739B4F50508'
            }
          ],
          'iOS 10.0': [
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6',
              'udid': '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6 (Plus)',
              'udid': '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6s',
              'udid': 'CBBB8FB8-77AB-49A9-8297-4CCFE3189C22'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 7',
              'udid': '3A409DC5-5188-42A6-8598-3AA6F34607A5'
            }
          ]
        }
      },
      null
    )).toEqual({
      udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
      name: 'iPhone 5',
      booted: false,
      version: 'iOS 9.2'
    });
  });

  it('should return the booted simulator in list if none is defined', () => {
    expect(findMatchingSimulator({
        'devices': {
          'iOS 9.2': [
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 4s',
              'udid': 'B9B5E161-416B-43C4-A78F-729CB96CC8C6'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 5',
              'udid': '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6',
              'udid': 'BA0D93BD-07E6-4182-9B0A-F60A2474139C'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6 (Plus)',
              'udid': '9564ABEE-9EC2-4B4A-B443-D3710929A45A'
            },
            {
              'state': 'Booted',
              'availability': '(available)',
              'name': 'iPhone 6s',
              'udid': 'D0F29BE7-CC3C-4976-888D-C739B4F50508'
            }
          ]
        }
      },
      null
    )).toEqual({
      udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
      name: 'iPhone 6s',
      booted: true,
      version: 'iOS 9.2'
    });
  });

  it('should return the defined simulator in list even if another device is booted', () => {
    expect(findMatchingSimulator({
        'devices': {
          'iOS 9.2': [
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 4s',
              'udid': 'B9B5E161-416B-43C4-A78F-729CB96CC8C6'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 5',
              'udid': '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6',
              'udid': 'BA0D93BD-07E6-4182-9B0A-F60A2474139C'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6 (Plus)',
              'udid': '9564ABEE-9EC2-4B4A-B443-D3710929A45A'
            },
            {
              'state': 'Booted',
              'availability': '(available)',
              'name': 'iPhone 6s',
              'udid': 'D0F29BE7-CC3C-4976-888D-C739B4F50508'
            }
          ]
        }
      },
      'iPhone 6'
    )).toEqual({
      udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
      name: 'iPhone 6',
      booted: false,
      version: 'iOS 9.2'
    });
  });

  it('should return the booted simulator in list if none is defined (multi ios versions)', () => {
    expect(findMatchingSimulator({
        'devices': {
          'iOS 9.2': [
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 4s',
              'udid': 'B9B5E161-416B-43C4-A78F-729CB96CC8C6'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 5',
              'udid': '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6',
              'udid': 'BA0D93BD-07E6-4182-9B0A-F60A2474139C'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6 (Plus)',
              'udid': '9564ABEE-9EC2-4B4A-B443-D3710929A45A'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6s',
              'udid': 'D0F29BE7-CC3C-4976-888D-C739B4F50508'
            }
          ],
          'iOS 10.0': [
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6',
              'udid': '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6 (Plus)',
              'udid': '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6s',
              'udid': 'CBBB8FB8-77AB-49A9-8297-4CCFE3189C22'
            },
            {
              'state': 'Booted',
              'availability': '(available)',
              'name': 'iPhone 7',
              'udid': '3A409DC5-5188-42A6-8598-3AA6F34607A5'
            }
          ]
        }
      },
      null
    )).toEqual({
      udid: '3A409DC5-5188-42A6-8598-3AA6F34607A5',
      name: 'iPhone 7',
      booted: true,
      version: 'iOS 10.0'
    });
  });

  it('should return the defined simulator in list even if another device is booted (multi ios versions)', () => {
    expect(findMatchingSimulator({
        'devices': {
          'iOS 9.2': [
            {
              'state': 'Shutdown',
              'availability': '(unavailable, runtime profile not found)',
              'name': 'iPhone 4s',
              'udid': 'B9B5E161-416B-43C4-A78F-729CB96CC8C6'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 5',
              'udid': '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6',
              'udid': 'BA0D93BD-07E6-4182-9B0A-F60A2474139C'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6 (Plus)',
              'udid': '9564ABEE-9EC2-4B4A-B443-D3710929A45A'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6s',
              'udid': 'D0F29BE7-CC3C-4976-888D-C739B4F50508'
            }
          ],
          'iOS 10.0': [
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6',
              'udid': '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6 (Plus)',
              'udid': '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC'
            },
            {
              'state': 'Shutdown',
              'availability': '(available)',
              'name': 'iPhone 6s',
              'udid': 'CBBB8FB8-77AB-49A9-8297-4CCFE3189C22'
            },
            {
              'state': 'Booted',
              'availability': '(available)',
              'name': 'iPhone 7',
              'udid': '3A409DC5-5188-42A6-8598-3AA6F34607A5'
            }
          ]
        }
      },
      'iPhone 6s'
    )).toEqual({
      udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
      name: 'iPhone 6s',
      booted: false,
      version: 'iOS 9.2'
    });
  });

  it('should return AppleTV devices if in the list', () => {
    expect(findMatchingSimulator({
      'devices': {
        'tvOS 11.2' : [
          {
            'state' : 'Booted',
            'availability' : '(available)',
            'name' : 'Apple TV',
            'udid' : '816C30EA-38EA-41AC-BFDA-96FB632D522E'
          },
          {
            'state' : 'Shutdown',
            'availability' : '(available)',
            'name' : 'Apple TV 4K',
            'udid' : 'BCBB7E4B-D872-4D61-BC61-7C9805551075'
          },
          {
            'state' : 'Shutdown',
            'availability' : '(available)',
            'name' : 'Apple TV 4K (at 1080p)',
            'udid' : '1DE12308-1C14-4F0F-991E-A3ADC41BDFFC'
          }
        ]
      }
    },
    'Apple TV'
  )).toEqual({
    udid: '816C30EA-38EA-41AC-BFDA-96FB632D522E',
    name: 'Apple TV',
    booted: true,
    version: 'tvOS 11.2'
  });
  });
});
