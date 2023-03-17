/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

// flowlint unsafe-getters-setters:off

export type MemoryInfoLike = {
  jsHeapSizeLimit: ?number,
  totalJSHeapSize: ?number,
  usedJSHeapSize: ?number,
};

// Read-only object with JS memory information. This is returned by the performance.memory API.
export default class MemoryInfo {
  _jsHeapSizeLimit: ?number;
  _totalJSHeapSize: ?number;
  _usedJSHeapSize: ?number;

  constructor(memoryInfo: ?MemoryInfoLike) {
    if (memoryInfo != null) {
      this._jsHeapSizeLimit = memoryInfo.jsHeapSizeLimit;
      this._totalJSHeapSize = memoryInfo.totalJSHeapSize;
      this._usedJSHeapSize = memoryInfo.usedJSHeapSize;
    }
  }

  /**
   * The maximum size of the heap, in bytes, that is available to the context
   */
  get jsHeapSizeLimit(): ?number {
    return this._jsHeapSizeLimit;
  }

  /**
   * The total allocated heap size, in bytes
   */
  get totalJSHeapSize(): ?number {
    return this._totalJSHeapSize;
  }

  /**
   * The currently active segment of JS heap, in bytes.
   */
  get usedJSHeapSize(): ?number {
    return this._usedJSHeapSize;
  }
}
