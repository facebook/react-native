/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';

describe('WeakRefs in Fantom', () => {
  it('cannot be created outside tasks', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new WeakRef({});
    }).toThrow(
      'Unexpected instantiation of `WeakRef` outside of the Event Loop. Please create the instance within `Fantom.runTask()`.',
    );

    const task = jest.fn(() => {
      // eslint-disable-next-line no-new
      new WeakRef({});
    });

    Fantom.runTask(task);

    // TODO replace with expect(task).toHaveReturned() when available in Fantom.
    expect(task.mock.results[0].isThrow).toBe(false);
  });

  it('cannot be dereferenced outside tasks', () => {
    let weakRef;

    Fantom.runTask(() => {
      weakRef = new WeakRef({});
    });

    expect(() => {
      weakRef.deref();
    }).toThrow(
      'Unexpected call to `WeakRef.deref()` outside of the Event Loop. Please use this method within `Fantom.runTask()`.',
    );

    const task = jest.fn(() => {
      weakRef.deref();
    });

    Fantom.runTask(task);

    // TODO replace with expect(task).toHaveReturned() when available in Fantom.
    expect(task.mock.results[0].isThrow).toBe(false);
  });
});
