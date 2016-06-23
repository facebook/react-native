/**
 * Copyright 2004-present Facebook. All Rights Reserved.
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
    Dimensions: {},
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
