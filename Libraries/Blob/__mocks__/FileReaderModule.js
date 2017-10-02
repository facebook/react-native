/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */
const FileReaderModule = {
  async readAsText() {
    return '';
  },
  async readAsDataURL() {
    return 'data:text/plain;base64,NDI=';
  },
};

module.exports = FileReaderModule;
