/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * Formats a number of bytes into a human-readable string.
 *
 * @param bytes - The number of bytes to format
 * @param decimals - The number of decimal places to show (default: 2)
 * @returns A formatted string like "1.5 KB", "2.3 MB", etc.
 *
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1536) // "1.50 KB"
 * formatFileSize(1048576) // "1.00 MB"
 */
export default function formatFileSize(
  bytes: number,
  decimals: number = 2,
): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  if (!Number.isFinite(bytes)) {
    throw new Error('Bytes must be a finite number');
  }

  if (bytes < 0) {
    throw new Error('Bytes must be a non-negative number');
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Ensure we don't go beyond the available sizes
  const sizeIndex = Math.min(i, sizes.length - 1);
  const size = sizes[sizeIndex];
  const value = bytes / Math.pow(k, sizeIndex);

  return `${value.toFixed(decimals)} ${size}`;
}
