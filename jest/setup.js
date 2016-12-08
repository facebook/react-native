/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const mockComponent = require.requireActual('./mockComponent');

require.requireActual('../packager/react-packager/src/Resolver/polyfills/babelHelpers.js');
require.requireActual('../packager/react-packager/src/Resolver/polyfills/Object.es7.js');
require.requireActual('../packager/react-packager/src/Resolver/polyfills/error-guard');

global.__DEV__ = true;

global.Promise = require.requireActual('promise');
global.regeneratorRuntime = require.requireActual('regenerator-runtime/runtime');

jest
  .mock('setupDevtools')
  .mock('npmlog');

// there's a __mock__ for it.
jest.setMock('ErrorUtils', require('ErrorUtils'));

jest
  .mock('ReactNativeDefaultInjection')
  .mock('Image', () => mockComponent('Image'))
  .mock('Text', () => mockComponent('Text'))
  .mock('TextInput', () => mockComponent('TextInput'))
  .mock('Modal', () => mockComponent('Modal'))
  .mock('View', () => mockComponent('View'))
  .mock('ScrollView', () => mockComponent('ScrollView'))
  .mock(
    'ActivityIndicator',
    () => mockComponent('ActivityIndicator'),
  )
  .mock('ListView', () => {
    const RealListView = require.requireActual('ListView');
    const ListView = mockComponent('ListView');
    ListView.prototype.render = RealListView.prototype.render;
    return ListView;
  })
  .mock('ListViewDataSource', () => {
    const DataSource = require.requireActual('ListViewDataSource');
    DataSource.prototype.toJSON = function() {
      function ListViewDataSource(dataBlob) {
        this.items = 0;
        // Ensure this doesn't throw.
        try {
          Object.keys(dataBlob).forEach(key => {
            this.items += dataBlob[key] && dataBlob[key].length;
          });
        } catch (e) {
          this.items = 'unknown';
        }
      }

      return new ListViewDataSource(this._dataBlob);
    };
    return DataSource;
  })
  .mock('ensureComponentIsNative', () => () => true);

const mockEmptyObject = {};
const mockNativeModules = {
  AlertManager: {
    alertWithArgs: jest.fn(),
  },
  AppState: {
    addEventListener: jest.fn(),
  },
  AsyncLocalStorage: {
    clear: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
  },
  BuildInfo: {
    appVersion: '0',
    buildVersion: '0',
  },
  Clipboard: {
    setString: jest.fn(),
  },
  DataManager: {
    queryData: jest.fn(),
  },
  FacebookSDK: {
    login: jest.fn(),
    logout: jest.fn(),
    queryGraphPath: jest.fn((path, method, params, callback) => callback()),
  },
  FbRelayNativeAdapter: {
    updateCLC: jest.fn(),
  },
  GraphPhotoUpload: {
    upload: jest.fn(),
  },
  I18n: {
    translationsDictionary: JSON.stringify({
      'Good bye, {name}!|Bye message': '\u{00A1}Adi\u{00F3}s {name}!',
    }),
  },
  ImageLoader: {
    getSize: jest.fn(
      (uri, success) => process.nextTick(() => success(320, 240))
    ),
    prefetchImage: jest.fn(),
  },
  ImageViewManager: {
    getSize: jest.fn(
      (uri, success) => process.nextTick(() => success(320, 240))
    ),
    prefetchImage: jest.fn(),
  },
  KeyboardObserver: {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
  ModalFullscreenViewManager: {},
  Networking: {
    sendRequest: jest.fn(),
    abortRequest: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
  SourceCode: {
    scriptURL: null,
  },
  StatusBarManager: {
    setStyle: jest.fn(),
    setHidden: jest.fn(),
    setNetworkActivityIndicatorVisible: jest.fn(),
    setBackgroundColor: jest.fn(),
    setTranslucent: jest.fn(),
  },
  Timing: {
    createTimer: jest.fn(),
    deleteTimer: jest.fn(),
  },
  UIManager: {
    customBubblingEventTypes: {},
    customDirectEventTypes: {},
    Dimensions: {
      window: {
        fontScale: 2,
        height: 1334,
        scale: 2,
        width: 750,
      },
    },
    ModalFullscreenView: {
      Constants: {},
    },
    ScrollView: {
      Constants: {},
    },
    View: {
      Constants: {},
    },
  },
  WebSocketModule: {
    connect: jest.fn(),
    send: jest.fn(),
    sendBinary: jest.fn(),
    ping: jest.fn(),
    close: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
};

Object.keys(mockNativeModules).forEach(module => {
  try {
    jest.doMock(module, () => mockNativeModules[module]); // needed by FacebookSDK-test
  } catch (e) {
    jest.doMock(module, () => mockNativeModules[module], {virtual: true});
  }
});

jest
  .doMock('NativeModules', () => mockNativeModules)
  .doMock('ReactNativePropRegistry', () => ({
    register: id => id,
    getByID: () => mockEmptyObject,
  }));

jest.doMock('requireNativeComponent', () => {
  const React = require('react');

  return viewName => props => React.createElement(
    viewName,
    props,
    props.children,
  );
});
