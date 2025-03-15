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
  _searchParams: Map<string, string[]> = new Map();

  constructor(params?: Record<string, string> | string | [string, string][]) {
    // URLSearchParams("key1=value1&key2=value2");
    if (typeof params === 'string') {
      params
        .replace(/^\?/, '')
        .split('&')
        .forEach(pair => {
          if (!pair) return;
          const [key, value] = pair.split('=').map(decodeURIComponent);
          this.append(key, value);
        });
    }

    //URLSearchParams([["key1", "value1"], ["key2", "value2"]]);
    else if (Array.isArray(params)) {
      params.forEach(([key, value]) => this.append(key, value));
    }
    //URLSearchParams({ key1: "value1", key2: "value2" });
    else if (typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => this.append(key, value));
    }
  }

  append(key: string, value: string): void {
    if (!this._searchParams.has(key)) {
      this._searchParams.set(key, [value]); // Initialize with an array if key is missing
    } else {
      this._searchParams.get(key)?.push(value); // Else push the value to the array
    }
  }

  delete(name: string): void {
    this._searchParams.delete(name);
  }

  get(name: string): string | null {
    const values = this._searchParams.get(name);
    return values ? values[0] : null;
  }

  getAll(name: string): string[] {
    return this._searchParams.get(name) ?? [];
  }

  has(name: string): boolean {
    return this._searchParams.has(name);
  }

  set(name: string, value: string): void {
    this._searchParams.set(name, [value]);
  }

  keys(name: string): Iterator<string> {
    return this._searchParams.keys();
  }

  values(name: string): Iterator<string> {
    function* generateValues(params: Map<string, string[]>): Iterator<string> {
      for (const valueArray of params.values()) {
        for (const value of valueArray) {
          yield value;
        }
      }
    }
    return generateValues(this._searchParams);
  }

  entries(name: string): Iterator<[string, string]> {
    function* generateEntries(
      params: Map<string, string[]>,
    ): Iterator<[string, string]> {
      for (const [key, values] of params) {
        for (const value of values) {
          yield [key, value];
        }
      }
    }

    return generateEntries(this._searchParams);
  }

  forEach(
    callback: (value: string, key: string, searchParams: this) => void,
  ): void {
    for (const [key, values] of this._searchParams) {
      for (const value of values) {
        callback(value, key, this);
      }
    }
  }

  sort(): void {
    this._searchParams = new Map(
      [...this._searchParams.entries()].sort(([a], [b]) => a.localeCompare(b)),
    );
  }

  // $FlowFixMe[unsupported-syntax]
  [Symbol.iterator](): Iterator<[string, string]> {
    const entries: [string, string][] = [];

    for (const [key, values] of this._searchParams) {
      for (const value of values) {
        entries.push([key, value]);
      }
    }

    return entries[Symbol.iterator]();
  }

  toString(): string {
    return Array.from(this._searchParams.entries())
      .map(([key, values]) =>
        values
          .map(
            value => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
          )
          .join('&'),
      )
      .join('&');
  }
}
