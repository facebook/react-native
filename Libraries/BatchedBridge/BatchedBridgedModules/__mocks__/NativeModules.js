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
    createTimer: jest.genMockFunction(),
    deleteTimer: jest.genMockFunction(),
  },
  GraphPhotoUpload: {
    upload: jest.genMockFunction(),
  },
  FacebookSDK: {
    login: jest.genMockFunction(),
    logout: jest.genMockFunction(),
    queryGraphPath: jest.genMockFunction().mockImpl(
      (path, method, params, callback) => callback()
    ),
  },
  DataManager: {
    queryData: jest.genMockFunction(),
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
    getItem: jest.genMockFunction(),
    setItem: jest.genMockFunction(),
    removeItem: jest.genMockFunction(),
    clear: jest.genMockFunction(),
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
    alertWithArgs: jest.genMockFunction(),
  },
  Pasteboard: {
    setPasteboardString: jest.genMockFunction(),
  },
};

module.exports = NativeModules;
