/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type Event from '../../../src/private/webapis/dom/events/Event';

const Blob = require('../Blob').default;
const FileReader = require('../FileReader').default;

jest.mock('../../BatchedBridge/NativeModules', () => ({
  __esModule: true,
  default: {
    BlobModule: require('../__mocks__/BlobModule').default,
    FileReaderModule: require('../__mocks__/FileReaderModule').default,
  },
}));

describe('FileReader', function () {
  it('should read blob as text', async () => {
    const e = await new Promise<Event>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = resolve;
      reader.onerror = reject;
      reader.readAsText(new Blob());
    });
    // $FlowFixMe[prop-missing]
    expect(e.target?.result).toBe('');
  });

  it('should read blob as data URL', async () => {
    const e = await new Promise<Event>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = resolve;
      reader.onerror = reject;
      reader.readAsDataURL(new Blob());
    });
    // $FlowFixMe[prop-missing]
    expect(e.target?.result).toBe('data:text/plain;base64,NDI=');
  });

  it('should read blob as ArrayBuffer', async () => {
    const e = await new Promise<Event>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = resolve;
      reader.onerror = reject;
      reader.readAsArrayBuffer(new Blob());
    });
    // $FlowFixMe[prop-missing]
    const ab = e.target?.result;
    expect(ab?.byteLength).toBe(2);
    // $FlowFixMe[cannot-resolve-name]
    expect(new TextDecoder().decode(ab)).toBe('42');
  });
});
