/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

jest.dontMock('../verifyComponentAttributeEquivalence');

const verifyComponentAttributeEquivalence =
  require('../verifyComponentAttributeEquivalence').default;

const TestComponentNativeViewConfig = {
  uiViewClassName: 'TestComponent',
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
};

describe('verifyComponentAttributeEquivalence', () => {
  beforeEach(() => {
    global.__DEV__ = true;
    console.error = jest.fn();
    jest.resetModules();
  });

  it('should not verify in prod', () => {
    global.__DEV__ = false;
    verifyComponentAttributeEquivalence(TestComponentNativeViewConfig, {});
  });

  it('should not error with native config that is a subset of the given config', () => {
    const configWithAdditionalProperties = {
      ...TestComponentNativeViewConfig,
      bubblingEventTypes: {
        ...TestComponentNativeViewConfig.bubblingEventTypes,
        topFocus: {
          phasedRegistrationNames: {
            bubbled: 'onFocus',
            captured: 'onFocusCapture',
          },
        },
      },
      directEventTypes: {
        ...TestComponentNativeViewConfig.directEventTypes,
        topSlidingComplete: {
          registrationName: 'onSlidingComplete',
        },
      },
      validAttributes: {
        ...TestComponentNativeViewConfig.validAttributes,
        active: true,
      },
    };
    verifyComponentAttributeEquivalence(
      TestComponentNativeViewConfig,
      configWithAdditionalProperties,
    );

    expect(console.error).not.toBeCalled();
  });

  it('should error if given config is missing native config properties', () => {
    verifyComponentAttributeEquivalence(TestComponentNativeViewConfig, {});

    expect(console.error).toBeCalledTimes(3);
    expect(console.error).toBeCalledWith(
      "'TestComponent' has a view config that does not match native. 'validAttributes' is missing: borderColor, style",
    );
    expect(console.error).toBeCalledWith(
      "'TestComponent' has a view config that does not match native. 'bubblingEventTypes' is missing: topChange",
    );
    expect(console.error).toBeCalledWith(
      "'TestComponent' has a view config that does not match native. 'directEventTypes' is missing: topAccessibilityAction",
    );
  });
});
