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
  this._searchParams = this._searchParams.filter(
    param => param[0] !== name
  );
  }

  get(name: string): string | null {
  const found = this._searchParams.find(param => param[0] === name);
  return found ? found[1] : null;  }

  getAll(name: string): Array<string> {
  return this._searchParams
    .filter(param => param[0] === name)
    .map(param => param[1]);
    }

  has(name: string): boolean {
  return this._searchParams.some(param => param[0] === name);
  }

  set(name: string, value: string): void {
  const index = this._searchParams.findIndex(param => param[0] === name);
  if (index !== -1) {
    this._searchParams[index][1] = value;
  } else {
    this.append(name, value);
  }
  }

  sort(): void {
  this._searchParams.sort((a, b) => a[0].localeCompare(b[0]));
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
