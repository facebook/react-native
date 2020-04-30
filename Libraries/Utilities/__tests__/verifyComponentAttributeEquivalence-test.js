/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const getNativeComponentAttributes = require('../../ReactNative/getNativeComponentAttributes');
const verifyComponentAttributeEquivalence = require('../verifyComponentAttributeEquivalence')
  .default;

jest.dontMock('../verifyComponentAttributeEquivalence');
jest.mock('../../ReactNative/getNativeComponentAttributes', () => () => ({
  NativeProps: {
    value: 'BOOL',
  },
  bubblingEventTypes: {
    topChange: {
      phasedRegistrationNames: {
        bubbled: 'onChange',
        captured: 'onChangeCapture',
      },
    },
  },
  directEventTypes: {
    topAccessibilityAction: {
      registrationName: 'onAccessibilityAction',
    },
  },
  validAttributes: {
    borderColor: true,
    style: {
      borderColor: true,
      transform: 'CATransform3D',
    },
    transform: 'CATransform3D',
  },
}));

beforeEach(() => {
  global.__DEV__ = true;
  console.error = jest.fn();
  jest.resetModules();
});

describe('verifyComponentAttributeEquivalence', () => {
  test('should not verify in prod', () => {
    global.__DEV__ = false;
    verifyComponentAttributeEquivalence('TestComponent', {});
  });

  test('should not error with native config that is a subset of the given config', () => {
    const configWithAdditionalProperties = getNativeComponentAttributes(
      'TestComponent',
    );

    configWithAdditionalProperties.bubblingEventTypes.topFocus = {
      phasedRegistrationNames: {
        bubbled: 'onFocus',
        captured: 'onFocusCapture',
      },
    };

    configWithAdditionalProperties.directEventTypes.topSlidingComplete = {
      registrationName: 'onSlidingComplete',
    };

    configWithAdditionalProperties.validAttributes.active = true;

    verifyComponentAttributeEquivalence(
      'TestComponent',
      configWithAdditionalProperties,
    );
    verifyComponentAttributeEquivalence(
      'TestComponent',
      configWithAdditionalProperties,
    );

    expect(console.error).not.toBeCalled();
  });

  test('should error if given config is missing native config properties', () => {
    verifyComponentAttributeEquivalence('TestComponent', {});

    expect(console.error).toBeCalledTimes(3);
    expect(console.error).toBeCalledWith(
      'TestComponent generated view config for directEventTypes does not match native, missing: topAccessibilityAction',
    );
    expect(console.error).toBeCalledWith(
      'TestComponent generated view config for bubblingEventTypes does not match native, missing: topChange',
    );
    expect(console.error).toBeCalledWith(
      'TestComponent generated view config for validAttributes does not match native, missing: borderColor style',
    );
  });
});
