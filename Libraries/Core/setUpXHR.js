/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {polyfillGlobal} = require('../Utilities/PolyfillFunctions');

/**
 * Set up XMLHttpRequest. The native XMLHttpRequest in Chrome dev tools is CORS
 * aware and won't let you fetch anything from the internet.
 *
 * You can use this module directly, or just require InitializeCore.
 */
polyfillGlobal('XMLHttpRequest', () => require('../Network/XMLHttpRequest'));
polyfillGlobal('FormData', () => require('../Network/FormData'));

polyfillGlobal('fetch', () => require('../Network/fetch').fetch); // flowlint-line untyped-import:off
polyfillGlobal('Headers', () => require('../Network/fetch').Headers); // flowlint-line untyped-import:off
polyfillGlobal('Request', () => require('../Network/fetch').Request); // flowlint-line untyped-import:off
polyfillGlobal('Response', () => require('../Network/fetch').Response); // flowlint-line untyped-import:off
polyfillGlobal('WebSocket', () => require('../WebSocket/WebSocket'));
polyfillGlobal('Blob', () => require('../Blob/Blob'));
polyfillGlobal('File', () => require('../Blob/File'));
polyfillGlobal('FileReader', () => require('../Blob/FileReader'));
polyfillGlobal('URL', () => require('../Blob/URL').URL); // flowlint-line untyped-import:off
polyfillGlobal('URLSearchParams', () => require('../Blob/URL').URLSearchParams); // flowlint-line untyped-import:off
polyfillGlobal(
  'AbortController',
  () => require('abort-controller/dist/abort-controller').AbortController, // flowlint-line untyped-import:off
);
polyfillGlobal(
  'AbortSignal',
  () => require('abort-controller/dist/abort-controller').AbortSignal, // flowlint-line untyped-import:off
);
