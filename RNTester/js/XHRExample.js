/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule XHRExample
 */
'use strict';

var React = require('react');

var XHRExampleDownload = require('./XHRExampleDownload');
var XHRExampleBinaryUpload = require('./XHRExampleBinaryUpload');
var XHRExampleFormData = require('./XHRExampleFormData');
var XHRExampleHeaders = require('./XHRExampleHeaders');
var XHRExampleFetch = require('./XHRExampleFetch');
var XHRExampleOnTimeOut = require('./XHRExampleOnTimeOut');
var XHRExampleCookies = require('./XHRExampleCookies');

exports.framework = 'React';
exports.title = 'XMLHttpRequest';
exports.description = 'Example that demonstrates upload and download ' +
  'requests using XMLHttpRequest.';
exports.examples = [{
  title: 'File Download',
  render() {
    return <XHRExampleDownload/>;
  }
}, {
  title: 'multipart/form-data Upload',
  render() {
    return <XHRExampleBinaryUpload/>;
  }
}, {
  title: 'multipart/form-data Upload',
  render() {
    return <XHRExampleFormData/>;
  }
}, {
  title: 'Fetch Test',
  render() {
    return <XHRExampleFetch/>;
  }
}, {
  title: 'Headers',
  render() {
    return <XHRExampleHeaders/>;
  }
}, {
  title: 'Time Out Test',
  render() {
    return <XHRExampleOnTimeOut/>;
  }
}, {
  title: 'Cookies',
  render() {
    return <XHRExampleCookies/>;
  }
}];
