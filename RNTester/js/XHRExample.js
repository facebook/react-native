/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const XHRExampleDownload = require('./XHRExampleDownload');
const XHRExampleBinaryUpload = require('./XHRExampleBinaryUpload');
const XHRExampleFormData = require('./XHRExampleFormData');
const XHRExampleHeaders = require('./XHRExampleHeaders');
const XHRExampleFetch = require('./XHRExampleFetch');
const XHRExampleOnTimeOut = require('./XHRExampleOnTimeOut');
const XHRExampleCookies = require('./XHRExampleCookies');

exports.framework = 'React';
exports.title = 'XMLHttpRequest';
exports.description =
  'Example that demonstrates upload and download ' +
  'requests using XMLHttpRequest.';
exports.examples = [
  {
    title: 'File Download',
    render() {
      return <XHRExampleDownload />;
    },
  },
  {
    title: 'multipart/form-data Upload',
    render() {
      return <XHRExampleBinaryUpload />;
    },
  },
  {
    title: 'multipart/form-data Upload',
    render() {
      return <XHRExampleFormData />;
    },
  },
  {
    title: 'Fetch Test',
    render() {
      return <XHRExampleFetch />;
    },
  },
  {
    title: 'Headers',
    render() {
      return <XHRExampleHeaders />;
    },
  },
  {
    title: 'Time Out Test',
    render() {
      return <XHRExampleOnTimeOut />;
    },
  },
  {
    title: 'Cookies',
    render() {
      return <XHRExampleCookies />;
    },
  },
];
