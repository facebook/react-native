/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

// TODO(legacy-fake-timers): Fix these tests to work with modern timers.
jest.useFakeTimers({legacyFakeTimers: true});

import type {HostInstance} from '../../../Renderer/shims/ReactNativeTypes';

import * as React from 'react';
import {act} from 'react-test-renderer';

const TextInputState = require('../../../Components/TextInput/TextInputState');
const ReactFabric = require('../../../Renderer/shims/ReactFabric').default;
const ReactNativeViewConfigRegistry = require('../../../Renderer/shims/ReactNativeViewConfigRegistry');
const FabricUIManager = require('../../FabricUIManager');
const nullthrows = require('nullthrows');

const isWindows = process.platform === 'win32';
const itif = (condition: boolean) => {
  return condition ? it : it.skip;
};

jest.mock('../../FabricUIManager', () =>
  require('../../__mocks__/FabricUIManager'),
);

jest.mock('../../../../src/private/webapis/dom/nodes/specs/NativeDOM', () =>
  require('../../../../src/private/webapis/dom/nodes/specs/__mocks__/NativeDOMMock'),
);

/**
 * Given a mocked function, get a correctly typed mock function that preserves
 * the original function's type.
 */
function mockOf<TArguments: $ReadOnlyArray<mixed>, TReturn>(
  fn: (...args: TArguments) => TReturn,
): JestMockFn<TArguments, TReturn> {
  if (!jest.isMockFunction(fn)) {
    throw new Error(`Function ${fn.name} is not a mock function`);
  }
  return (fn: $FlowFixMe);
}

/**
 * Renders a sequence of mock views as dictated by `keyLists`. The `keyLists`
 * argument is an array of arrays which determines the number of render passes,
 * how many views will be rendered in each pass, and what the keys are for each
 * of the views.
 *
 * If an element in `keyLists` is null, the entire root will be unmounted.
 *
 * The return value is an array of arrays with the resulting refs from rendering
 * each corresponding array of keys.
 *
 * If the corresponding array of keys is null, the returned element at that
 * index will also be null.
 */
async function mockRenderKeys(
  keyLists: Array<?Array<?string>>,
): Promise<Array<?Array<?HostInstance>>> {
  const mockContainerTag = 11;
  const MockView = ReactNativeViewConfigRegistry.register(
    'RCTMockView',
    () => ({
      validAttributes: {foo: true, style: {}},
      uiViewClassName: 'RCTMockView',
    }),
  );

  const result: Array<?Array<?HostInstance>> = [];
  for (let i = 0; i < keyLists.length; i++) {
    const keyList = keyLists[i];
    if (Array.isArray(keyList)) {
      const refs: Array<?HostInstance> = keyList.map(key => undefined);
      await act(() => {
        ReactFabric.render(
          <MockView>
            {keyList.map((key, index) => (
              <MockView
                key={key}
                ref={ref => {
                  refs[index] = ((ref: $FlowFixMe): ?HostInstance);
                }}
              />
            ))}
          </MockView>,
          mockContainerTag,
        );
      });
      // Clone `refs` to ignore future passes.
      result.push([...refs]);
      continue;
    }
    if (keyList == null) {
      await act(() => {
        // $FlowFixMe[prop-missing] This actually exists in ReactFabric
        ReactFabric.stopSurface(mockContainerTag);
      });
      result.push(null);
      continue;
    }
    throw new TypeError(
      `Invalid 'keyLists' element of type ${typeof keyList}.`,
    );
  }

  return result;
}

[
  {enableAccessToHostTreeInFabric: false},
  {enableAccessToHostTreeInFabric: true},
].forEach(flags => {
  describe(`ReactFabricPublicInstance (ReactNativeFeatureFlags.enableAccessToHostTreeInFabric = ${String(
    flags.enableAccessToHostTreeInFabric,
  )})'`, () => {
    beforeEach(() => {
      jest.resetModules();
      // Installs the global `nativeFabricUIManager` pointing to the mock.
      require('../../../ReactNative/__mocks__/FabricUIManager');
      jest.spyOn(TextInputState, 'blurTextInput');
      jest.spyOn(TextInputState, 'focusTextInput');

      require('../../../../src/private/featureflags/ReactNativeFeatureFlags').override(
        {
          enableAccessToHostTreeInFabric: () =>
            flags.enableAccessToHostTreeInFabric,
        },
      );
    });

    describe('blur', () => {
      test('blur() invokes TextInputState', async () => {
        const result = await mockRenderKeys([['foo']]);
        const fooRef = nullthrows(result?.[0]?.[0]);

        fooRef.blur();

        expect(mockOf(TextInputState.blurTextInput).mock.calls).toEqual([
          [fooRef],
        ]);
      });
    });

    describe('focus', () => {
      test('focus() invokes TextInputState', async () => {
        const result = await mockRenderKeys([['foo']]);
        const fooRef = nullthrows(result?.[0]?.[0]);

        fooRef.focus();

        expect(mockOf(TextInputState.focusTextInput).mock.calls).toEqual([
          [fooRef],
        ]);
      });
    });

    describe('measure', () => {
      itif(!isWindows)('component.measure(...) invokes callback', async () => {
        const result = await mockRenderKeys([['foo']]);
        const fooRef = nullthrows(result?.[0]?.[0]);

        const callback = jest.fn();
        fooRef.measure(callback);

        expect(
          nullthrows(FabricUIManager.getFabricUIManager()).measure,
        ).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls).toEqual([[10, 10, 100, 100, 0, 0]]);
      });

      itif(!isWindows)('unmounted.measure(...) does nothing', async () => {
        const result = await mockRenderKeys([['foo'], null]);
        const fooRef = nullthrows(result?.[0]?.[0]);
        const callback = jest.fn();
        fooRef.measure(callback);

        expect(
          nullthrows(FabricUIManager.getFabricUIManager()).measure,
        ).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('measureInWindow', () => {
      itif(!isWindows)(
        'component.measureInWindow(...) invokes callback',
        async () => {
          const result = await mockRenderKeys([['foo']]);
          const fooRef = nullthrows(result?.[0]?.[0]);

          const callback = jest.fn();
          fooRef.measureInWindow(callback);

          expect(
            nullthrows(FabricUIManager.getFabricUIManager()).measureInWindow,
          ).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls).toEqual([[10, 10, 100, 100]]);
        },
      );

      itif(!isWindows)(
        'unmounted.measureInWindow(...) does nothing',
        async () => {
          const result = await mockRenderKeys([['foo'], null]);
          const fooRef = nullthrows(result?.[0]?.[0]);

          const callback = jest.fn();
          fooRef.measureInWindow(callback);

          expect(
            nullthrows(FabricUIManager.getFabricUIManager()).measureInWindow,
          ).not.toHaveBeenCalled();
          expect(callback).not.toHaveBeenCalled();
        },
      );
    });

    describe('measureLayout', () => {
      itif(!isWindows)(
        'component.measureLayout(component, ...) invokes callback',
        async () => {
          const result = await mockRenderKeys([['foo', 'bar']]);
          const fooRef = nullthrows(result?.[0]?.[0]);
          const barRef = nullthrows(result?.[0]?.[1]);

          const successCallback = jest.fn();
          const failureCallback = jest.fn();
          fooRef.measureLayout(barRef, successCallback, failureCallback);

          expect(
            nullthrows(FabricUIManager.getFabricUIManager()).measureLayout,
          ).toHaveBeenCalledTimes(1);
          expect(successCallback.mock.calls).toEqual([[1, 1, 100, 100]]);
        },
      );

      itif(!isWindows)(
        'unmounted.measureLayout(component, ...) does nothing',
        async () => {
          const result = await mockRenderKeys([
            ['foo', 'bar'],
            ['foo', null],
          ]);
          const fooRef = nullthrows(result?.[0]?.[0]);
          const barRef = nullthrows(result?.[0]?.[1]);

          const successCallback = jest.fn();
          const failureCallback = jest.fn();
          fooRef.measureLayout(barRef, successCallback, failureCallback);

          expect(
            nullthrows(FabricUIManager.getFabricUIManager()).measureLayout,
          ).not.toHaveBeenCalled();
          expect(successCallback).not.toHaveBeenCalled();
        },
      );

      itif(!isWindows)(
        'component.measureLayout(unmounted, ...) does nothing',
        async () => {
          const result = await mockRenderKeys([
            ['foo', 'bar'],
            [null, 'bar'],
          ]);
          const fooRef = nullthrows(result?.[0]?.[0]);
          const barRef = nullthrows(result?.[0]?.[1]);

          const successCallback = jest.fn();
          const failureCallback = jest.fn();
          fooRef.measureLayout(barRef, successCallback, failureCallback);

          expect(
            nullthrows(FabricUIManager.getFabricUIManager()).measureLayout,
          ).not.toHaveBeenCalled();
          expect(successCallback).not.toHaveBeenCalled();
        },
      );

      itif(!isWindows)(
        'unmounted.measureLayout(unmounted, ...) does nothing',
        async () => {
          const result = await mockRenderKeys([['foo', 'bar'], null]);
          const fooRef = nullthrows(result?.[0]?.[0]);
          const barRef = nullthrows(result?.[0]?.[1]);

          const successCallback = jest.fn();
          const failureCallback = jest.fn();
          fooRef.measureLayout(barRef, successCallback, failureCallback);

          expect(
            nullthrows(FabricUIManager.getFabricUIManager()).measureLayout,
          ).not.toHaveBeenCalled();
          expect(successCallback).not.toHaveBeenCalled();
        },
      );
    });
  });
});
