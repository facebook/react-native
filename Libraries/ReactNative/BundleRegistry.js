/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */
'use strict';

// $FlowFixMe
import EventEmitter from '../vendor/emitter/EventEmitter';
import BatchedBridge from '../BatchedBridge/BatchedBridge';

class BundleRegistry extends EventEmitter {
  _loadStartTimestamp: {[bundleName: string]: number} = {};
  _print: (...args: mixed[]) => void = () => {};

  constructor() {
    super();
    BatchedBridge.registerCallableModule('BundleRegistry', {
      bundleRegistryOnLoad: (bundleName: string) => {
        this._bundleRegistryOnLoad(bundleName);
      },
    });
  }

  enableLogging() {
    this._print = (...args: mixed[]) => {
      console.log('BundleRegistry:', ...args);
    };
  }

  disableLogging() {
    this._print = () => {};
  }

  _bundleRegistryOnLoad(bundleName: string) {
    this._print(`bundle '${bundleName}' loaded, emitting 'bundleLoaded' event`);
    this.emit('bundleLoaded', {
      bundleName,
      loadStartTimestamp: this._loadStartTimestamp[bundleName],
    });
  }

  loadBundle(bundleName: string, synchronously?: boolean = false) {
    this._loadStartTimestamp[bundleName] = Date.now();
    const isBundleLoaded = this.isBundleLoaded(bundleName);

    this._print(
      `request to load '${bundleName}' received at '${new Date(
        this._loadStartTimestamp[bundleName],
      ).toLocaleTimeString()}'`,
    );

    if (!isBundleLoaded) {
      this._print(
        `bundle '${bundleName}' not available - loading ${
          synchronously ? 'synchronously' : 'asynchronously'
        }`,
      );
      global.bundleRegistryLoad(bundleName, synchronously, true);
    }

    if (isBundleLoaded || synchronously) {
      this._print(`bundle '${bundleName}' already loaded`);
      this._bundleRegistryOnLoad(bundleName);
    }
  }

  isBundleLoaded(bundleName: string) {
    return Boolean(global[bundleName]);
  }

  getBundleExport(bundleName: string) {
    if (!this.isBundleLoaded(bundleName)) {
      throw new Error(`Bundle ${bundleName} was not loaded`);
    }
    return global[bundleName].default;
  }
}

export default new BundleRegistry();
