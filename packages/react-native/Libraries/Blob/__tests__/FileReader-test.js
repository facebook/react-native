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

const FileReaderModuleMock = require('../__mocks__/FileReaderModule').default;
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

  it('should retain the blob until the read resolves', async () => {
    let resolveRead: string => void = () => {};
    const spy = jest
      .spyOn(FileReaderModuleMock, 'readAsText')
      .mockImplementation(
        () =>
          new Promise(resolve => {
            resolveRead = resolve;
          }),
      );

    const reader = new FileReader();
    const blob = new Blob();
    const loadend = new Promise<Event>(resolve => {
      reader.onloadend = resolve;
    });
    reader.readAsText(blob);
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(blob);

    resolveRead('');
    await loadend;
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(null);

    spy.mockRestore();
  });

  it('should release the blob when the read rejects', async () => {
    let rejectRead: Error => void = () => {};
    const spy = jest
      .spyOn(FileReaderModuleMock, 'readAsText')
      .mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            rejectRead = reject;
          }),
      );

    const reader = new FileReader();
    const blob = new Blob();
    const loadend = new Promise<Event>(resolve => {
      reader.onloadend = resolve;
    });
    reader.readAsText(blob);
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(blob);

    rejectRead(new Error('nope'));
    await loadend;
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(null);

    spy.mockRestore();
  });

  it('should release the blob when a pending read is aborted', () => {
    const spy = jest
      .spyOn(FileReaderModuleMock, 'readAsText')
      .mockImplementation(() => new Promise(() => {}));

    const reader = new FileReader();
    const blob = new Blob();
    reader.readAsText(blob);
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(blob);

    reader.abort();
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(null);

    spy.mockRestore();
  });

  it('should keep retaining the new blob when a stale read settles after abort', async () => {
    const resolvers: Array<(string) => void> = [];
    const spy = jest
      .spyOn(FileReaderModuleMock, 'readAsText')
      .mockImplementation(
        () =>
          new Promise(resolve => {
            resolvers.push(resolve);
          }),
      );

    const reader = new FileReader();
    const staleBlob = new Blob();
    reader.readAsText(staleBlob);
    reader.abort();

    const newBlob = new Blob();
    reader.readAsText(newBlob);
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(newBlob);

    // Settle the first (aborted) read; it must not drop the new blob.
    resolvers[0]('');
    await Promise.resolve();
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(newBlob);

    spy.mockRestore();
  });
});
