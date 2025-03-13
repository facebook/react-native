/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

// Small subset from whatwg-url: https://github.com/jsdom/whatwg-url/tree/master/src
// The reference code bloat comes from Unicode issues with URLs, so those won't work here.
export class URLSearchParams {
  _searchParams: Array<Array<string>> = [];

  constructor(params: any) {
    if (typeof params === 'object') {
      Object.keys(params).forEach(key => this.append(key, params[key]));
    }
  }

  append(key: string, value: string): void {
    this._searchParams.push([key, value]);
  }

  delete(name: string): void {
    throw new Error('URLSearchParams.delete is not implemented');
  }

  get(name: string): void {
    throw new Error('URLSearchParams.get is not implemented');
  }

  getAll(name: string): void {
    throw new Error('URLSearchParams.getAll is not implemented');
  }

  has(name: string): void {
    throw new Error('URLSearchParams.has is not implemented');
  }

  set(name: string, value: string): void {
    throw new Error('URLSearchParams.set is not implemented');
  }

  sort(): void {
    throw new Error('URLSearchParams.sort is not implemented');
  }

  // $FlowFixMe[unsupported-syntax]
  // $FlowFixMe[missing-local-annot]
  [Symbol.iterator]() {
    return this._searchParams[Symbol.iterator]();
  }

  toString(): string {
    if (this._searchParams.length === 0) {
      return '';
    }
    const last = this._searchParams.length - 1;
    return this._searchParams.reduce((acc, curr, index) => {
      return (
        acc +
        encodeURIComponent(curr[0]) +
        '=' +
        encodeURIComponent(curr[1]) +
        (index === last ? '' : '&')
      );
    }, '');
  }
}
