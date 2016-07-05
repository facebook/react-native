/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

var NativeModules = {
  I18n: {
    translationsDictionary: JSON.stringify({
      'Good bye, {name}!|Bye message': '¡Adiós {name}!',
    }),
  },
  Timing: {
    createTimer: jest.fn(),
    deleteTimer: jest.fn(),
  },
  GraphPhotoUpload: {
    upload: jest.fn(),
  },
  FacebookSDK: {
    login: jest.fn(),
    logout: jest.fn(),
    queryGraphPath: jest.fn((path, method, params, callback) => callback()),
  },
  DataManager: {
    queryData: jest.fn(),
  },
  UIManager: {
    customBubblingEventTypes: {},
    customDirectEventTypes: {},
    Dimensions: {
      window: {
        width: 750,
        height: 1334,
        scale: 2,
        fontScale: 2,
      }
    },
    RCTModalFullscreenView: {
      Constants: {},
    },
    RCTScrollView: {
      Constants: {},
    },
  },
  AsyncLocalStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  SourceCode: {
    scriptURL: null,
  },
  BuildInfo: {
    appVersion: '0',
    buildVersion: '0',
  },
  ModalFullscreenViewManager: {},
  AlertManager: {
    alertWithArgs: jest.fn(),
  },
  Clipboard: {
    setString: jest.fn(),
  },
};

module.exports = NativeModules;
