/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const FileReaderModule = {
  async readAsText(): Promise<string> {
    return '';
  },
  async readAsDataURL(): Promise<string> {
    return 'data:text/plain;base64,NDI=';
  },
};

export default FileReaderModule;
