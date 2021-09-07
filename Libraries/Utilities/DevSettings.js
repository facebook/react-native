/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import NativeDevSettings from '../NativeModules/specs/NativeDevSettings';
import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';

interface IDevSettings {
  addMenuItem(title: string, handler: () => mixed): void;
  reload(reason?: string): void;
  onFastRefresh(): void;
}

class DevSettings extends NativeEventEmitter implements IDevSettings {
  _menuItems: Map<string, () => mixed>;

  constructor() {
    super(NativeDevSettings);

    this._menuItems = new Map();
  }

  addMenuItem(title: string, handler: () => mixed) {
    // Make sure items are not added multiple times. This can
    // happen when hot reloading the module that registers the
    // menu items. The title is used as the id which means we
    // don't support multiple items with the same name.
    const oldHandler = this._menuItems.get(title);
    if (oldHandler != null) {
      this.removeListener('didPressMenuItem', oldHandler);
    } else {
      NativeDevSettings.addMenuItem(title);
    }

    this._menuItems.set(title, handler);
    this.addListener('didPressMenuItem', event => {
      if (event.title === title) {
        handler();
      }
    });
  }

  reload(reason?: string) {
    if (typeof NativeDevSettings.reloadWithReason === 'function') {
      NativeDevSettings.reloadWithReason(reason ?? 'Uncategorized from JS');
    } else {
      NativeDevSettings.reload();
    }
  }

  onFastRefresh() {
    if (typeof NativeDevSettings.onFastRefresh === 'function') {
      NativeDevSettings.onFastRefresh();
    }
  }

  // TODO: Add other dev setting methods exposed by the native module.
}

// Avoid including the full `NativeDevSettings` class in prod.
class NoopDevSettings implements IDevSettings {
  addMenuItem(title: string, handler: () => mixed) {}
  reload(reason?: string) {}
  onFastRefresh() {}
}

module.exports = ((__DEV__
  ? new DevSettings()
  : new NoopDevSettings()): IDevSettings);
