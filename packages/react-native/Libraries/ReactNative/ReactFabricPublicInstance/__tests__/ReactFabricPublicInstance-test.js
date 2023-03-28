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

import type {HostComponent} from '../../../Renderer/shims/ReactNativeTypes';

import * as React from 'react';
import {act} from 'react-test-renderer';

const TextInputState = require('../../../Components/TextInput/TextInputState');
const FabricUIManager = require('../../../ReactNative/FabricUIManager');
const ReactFabric = require('../../../Renderer/shims/ReactFabric');
const ReactNativeViewConfigRegistry = require('../../../Renderer/shims/ReactNativeViewConfigRegistry');
const nullthrows = require('nullthrows');

jest.mock('../../../ReactNative/FabricUIManager', () =>
  require('../../../ReactNative/__mocks__/FabricUIManager'),
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
): Promise<Array<?Array<?React.ElementRef<HostComponent<mixed>>>>> {
  const mockContainerTag = 11;
  const MockView = ReactNativeViewConfigRegistry.register(
    'RCTMockView',
    () => ({
      validAttributes: {foo: true, style: {}},
      uiViewClassName: 'RCTMockView',
    }),
  );

  const result: Array<?Array<?React.ElementRef<HostComponent<mixed>>>> = [];
  for (let i = 0; i < keyLists.length; i++) {
    const keyList = keyLists[i];
    if (Array.isArray(keyList)) {
      const refs: Array<?React.ElementRef<HostComponent<mixed>>> = keyList.map(
        key => undefined,
      );
      await act(() => {
        ReactFabric.render(
          <MockView>
            {keyList.map((key, index) => (
              <MockView
                key={key}
                ref={ref => {
                  refs[index] = ((ref: $FlowFixMe): ?React.ElementRef<
                    HostComponent<mixed>,
                  >);
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

describe('ReactFabricPublicInstance', () => {
  beforeEach(() => {
    jest.resetModules();
    // Installs the global `nativeFabricUIManager` pointing to the mock.
    require('../../../ReactNative/__mocks__/FabricUIManager');
    jest.spyOn(TextInputState, 'blurTextInput');
    jest.spyOn(TextInputState, 'focusTextInput');
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
    test('component.measure(...) invokes callback', async () => {
      const result = await mockRenderKeys([['foo']]);
      const fooRef = nullthrows(result?.[0]?.[0]);

      const callback = jest.fn();
      fooRef.measure(callback);

      expect(
        nullthrows(FabricUIManager.getFabricUIManager()).measure,
      ).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls).toEqual([[10, 10, 100, 100, 0, 0]]);
    });

    test('unmounted.measure(...) does nothing', async () => {
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
    test('component.measureInWindow(...) invokes callback', async () => {
      const result = await mockRenderKeys([['foo']]);
      const fooRef = nullthrows(result?.[0]?.[0]);

      const callback = jest.fn();
      fooRef.measureInWindow(callback);

      expect(
        nullthrows(FabricUIManager.getFabricUIManager()).measureInWindow,
      ).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls).toEqual([[10, 10, 100, 100]]);
    });

    test('unmounted.measureInWindow(...) does nothing', async () => {
      const result = await mockRenderKeys([['foo'], null]);
      const fooRef = nullthrows(result?.[0]?.[0]);

      const callback = jest.fn();
      fooRef.measureInWindow(callback);

      expect(
        nullthrows(FabricUIManager.getFabricUIManager()).measureInWindow,
      ).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('measureLayout', () => {
    test('component.measureLayout(component, ...) invokes callback', async () => {
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
    });

    test('unmounted.measureLayout(component, ...) does nothing', async () => {
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
    });

    test('component.measureLayout(unmounted, ...) does nothing', async () => {
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
    });

    test('unmounted.measureLayout(unmounted, ...) does nothing', async () => {
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
    });
  });
});
