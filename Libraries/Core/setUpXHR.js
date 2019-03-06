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

const {polyfillGlobal} = require('PolyfillFunctions');

/**
 * Set up XMLHttpRequest. The native XMLHttpRequest in Chrome dev tools is CORS
 * aware and won't let you fetch anything from the internet.
 *
 * You can use this module directly, or just require InitializeCore.
 */
polyfillGlobal('XMLHttpRequest', () => require('XMLHttpRequest'));
polyfillGlobal('FormData', () => require('FormData'));

polyfillGlobal('fetch', () => require('fetch').fetch); // flowlint-line untyped-import:off
polyfillGlobal('Headers', () => require('fetch').Headers); // flowlint-line untyped-import:off
polyfillGlobal('Request', () => require('fetch').Request); // flowlint-line untyped-import:off
polyfillGlobal('Response', () => require('fetch').Response); // flowlint-line untyped-import:off
polyfillGlobal('WebSocket', () => require('WebSocket'));
polyfillGlobal('Blob', () => require('Blob'));
polyfillGlobal('File', () => require('File'));
polyfillGlobal('FileReader', () => require('FileReader'));
polyfillGlobal('URL', () => require('URL'));
