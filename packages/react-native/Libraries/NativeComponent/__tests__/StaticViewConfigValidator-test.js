/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

import * as StaticViewConfigValidator from '../StaticViewConfigValidator';

test('passes for identical configs', () => {
  const name = 'RCTView';
  const nativeViewConfig = {
    bubblingEventTypes: {
      topBlur: {
        phasedRegistrationNames: {
          bubbled: 'onBlur',
          captured: 'onBlurCapture',
        },
      },
      topFocus: {
        phasedRegistrationNames: {
          bubbled: 'onFocus',
          captured: 'onFocusCapture',
        },
      },
    },
    directEventTypes: {
      topLayout: {
        registrationName: 'onLayout',
      },
    },
    uiViewClassName: 'RCTView',
    validAttributes: {
      collapsable: true,
      nativeID: true,
      style: {
        height: true,
        width: true,
      },
    },
  };
  const staticViewConfig = {
    bubblingEventTypes: {
      topBlur: {
        phasedRegistrationNames: {
          bubbled: 'onBlur',
          captured: 'onBlurCapture',
        },
      },
      topFocus: {
        phasedRegistrationNames: {
          bubbled: 'onFocus',
          captured: 'onFocusCapture',
        },
      },
    },
    directEventTypes: {
      topLayout: {
        registrationName: 'onLayout',
      },
    },
    uiViewClassName: 'RCTView',
    validAttributes: {
      collapsable: true,
      nativeID: true,
      style: {
        height: true,
        width: true,
      },
    },
  };

  const validationResult = StaticViewConfigValidator.validate(
    name,
    nativeViewConfig,
    staticViewConfig,
  );

  expect(validationResult.type).toBe('valid');
});

test('fails for mismatched names', () => {
  const name = 'RCTView';
  const nativeViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      style: {},
    },
  };
  const staticViewConfig = {
    uiViewClassName: 'RCTImage',
    validAttributes: {
      style: {},
    },
  };

  expectSVCToNotMatchNVC(
    name,
    nativeViewConfig,
    staticViewConfig,
    `
StaticViewConfigValidator: Invalid static view config for 'RCTView'.

- 'uiViewClassName' is the wrong value.
`.trimStart(),
  );
});

test('fails for unequal attributes', () => {
  const name = 'RCTView';
  const nativeViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      nativeID: true,
      style: {},
    },
  };
  const staticViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      nativeID: {},
      style: {},
    },
  };

  expectSVCToNotMatchNVC(
    name,
    nativeViewConfig,
    staticViewConfig,
    `
StaticViewConfigValidator: Invalid static view config for 'RCTView'.

- 'validAttributes.nativeID' is the wrong value.
`.trimStart(),
  );
});

test('fails for missing attributes', () => {
  const name = 'RCTView';
  const nativeViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      collapsable: true,
      nativeID: true,
      style: {
        height: true,
        width: true,
      },
    },
  };
  const staticViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      style: {},
    },
  };

  expectSVCToNotMatchNVC(
    name,
    nativeViewConfig,
    staticViewConfig,
    `
StaticViewConfigValidator: Invalid static view config for 'RCTView'.

- 'validAttributes.collapsable' is missing.
- 'validAttributes.nativeID' is missing.
- 'validAttributes.style.height' is missing.
- 'validAttributes.style.width' is missing.
`.trimStart(),
  );
});

test('fails for unexpected attributes', () => {
  const name = 'RCTView';
  const nativeViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      style: {},
    },
  };
  const staticViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      collapsable: true,
      nativeID: true,
      style: {
        height: true,
        width: true,
      },
    },
  };

  expectSVCToNotMatchNVC(
    name,
    nativeViewConfig,
    staticViewConfig,
    `
StaticViewConfigValidator: Invalid static view config for 'RCTView'.

- 'validAttributes.style.height' is present but not expected to be.
- 'validAttributes.style.width' is present but not expected to be.
- 'validAttributes.collapsable' is present but not expected to be.
- 'validAttributes.nativeID' is present but not expected to be.
`.trimStart(),
  );
});

function expectSVCToNotMatchNVC(
  name: string,
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  nativeViewConfig,
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  staticViewConfig,
  message: string,
) {
  const validationResult = StaticViewConfigValidator.validate(
    name,
    nativeViewConfig,
    staticViewConfig,
  );

  expect(validationResult.type).toBe('invalid');
  if (validationResult.type === 'invalid') {
    expect(
      StaticViewConfigValidator.stringifyValidationResult(
        name,
        validationResult,
      ),
    ).toBe(message);
  }
}
