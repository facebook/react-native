/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

declare module 'electron-store' {
  declare export type Schema = any;

  declare export type Options = {
    +name?: string,
    defaults?: Object,
    schema?: any,
    migrations?: any,
    beforeEachMigration?: any,
    clearInvalidConfig?: boolean,
    serialize?: any,
    deserialize?: any,
    accessPropertiesByDotNotation?: boolean,
    watch?: boolean,
    encryptionKey?: string | Buffer | $ReadOnlyArray<number>,
    ...
  };

  declare class ElectronStore {
    constructor(options?: Options): this;
    get(key: string): any;
    get(key: string, defaultValue: any): any;
    set(key: string, value: any): void;
    set(object: Object): void;
    has(key: string): boolean;
    delete(key: string): void;
    clear(): void;
  }

  declare module.exports: Class<ElectronStore>;
}
