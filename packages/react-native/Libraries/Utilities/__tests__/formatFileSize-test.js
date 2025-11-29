/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import formatFileSize from '../formatFileSize';

describe('formatFileSize', () => {
  it('formats zero bytes', () => {
    expect(formatFileSize(0)).toEqual('0 Bytes');
  });

  it('formats bytes less than 1 KB', () => {
    expect(formatFileSize(512)).toEqual('512.00 Bytes');
    expect(formatFileSize(1023)).toEqual('1023.00 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toEqual('1.00 KB');
    expect(formatFileSize(1536)).toEqual('1.50 KB');
    expect(formatFileSize(2048)).toEqual('2.00 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toEqual('1.00 MB');
    expect(formatFileSize(1572864)).toEqual('1.50 MB');
    expect(formatFileSize(2097152)).toEqual('2.00 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toEqual('1.00 GB');
    expect(formatFileSize(1610612736)).toEqual('1.50 GB');
  });

  it('formats terabytes', () => {
    expect(formatFileSize(1099511627776)).toEqual('1.00 TB');
  });

  it('respects custom decimal places', () => {
    expect(formatFileSize(1536, 0)).toEqual('2 KB');
    expect(formatFileSize(1536, 1)).toEqual('1.5 KB');
    expect(formatFileSize(1536, 3)).toEqual('1.500 KB');
  });

  it('handles very large numbers', () => {
    const largeNumber = Math.pow(1024, 8); // YB
    const result = formatFileSize(largeNumber);
    expect(result).toContain('YB');
  });

  it('throws error for negative numbers', () => {
    expect(() => formatFileSize(-1)).toThrow(
      'Bytes must be a non-negative number',
    );
    expect(() => formatFileSize(-100)).toThrow(
      'Bytes must be a non-negative number',
    );
  });

  it('throws error for non-finite numbers', () => {
    expect(() => formatFileSize(Infinity)).toThrow(
      'Bytes must be a finite number',
    );
    expect(() => formatFileSize(-Infinity)).toThrow(
      'Bytes must be a finite number',
    );
    expect(() => formatFileSize(NaN)).toThrow('Bytes must be a finite number');
  });
});
