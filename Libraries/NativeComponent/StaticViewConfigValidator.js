/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {type ViewConfig} from '../Renderer/shims/ReactNativeTypes';
// $FlowFixMe[nonstrict-import]
import getNativeComponentAttributes from '../ReactNative/getNativeComponentAttributes';
// $FlowFixMe[nonstrict-import]
import {createViewConfig} from './ViewConfig';

type Difference =
  | {
      type: 'missing',
      path: Array<string>,
      nativeValue: mixed,
    }
  | {
      type: 'unequal',
      path: Array<string>,
      nativeValue: mixed,
      staticValue: mixed,
    }
  | {
      type: 'unexpected',
      path: Array<string>,
      staticValue: mixed,
    };

type ValidationResult = ValidResult | InvalidResult;
type ValidResult = {
  type: 'valid',
};
type InvalidResult = {
  type: 'invalid',
  differences: Array<Difference>,
};

type ViewConfigValidationResult = {
  componentName: string,
  nativeViewConfig?: ?ViewConfig,
  staticViewConfig?: ?ViewConfig,
  validationResult?: ?ValidationResult,
};

// e.g. require('MyNativeComponent') where MyNativeComponent.js exports a HostComponent
type JSModule = $FlowFixMe;

export function validateStaticViewConfigs(
  nativeComponent: JSModule,
): ViewConfigValidationResult {
  const nativeViewConfig = getNativeComponentAttributes(
    nativeComponent.default || nativeComponent,
  );

  const generatedPartialViewConfig = nativeComponent.__INTERNAL_VIEW_CONFIG;
  const staticViewConfig: ?ViewConfig =
    generatedPartialViewConfig && createViewConfig(generatedPartialViewConfig);

  const componentName: string = nativeComponent.default || nativeComponent;
  const validationResult: ?ValidationResult =
    nativeViewConfig &&
    staticViewConfig &&
    validate(componentName, nativeViewConfig, staticViewConfig);

  return {
    componentName,
    nativeViewConfig,
    staticViewConfig,
    validationResult,
  };
}

/**
 * During the migration from native view configs to static view configs, this is
 * used to validate that the two are equivalent.
 */
export function validate(
  name: string,
  nativeViewConfig: ViewConfig,
  staticViewConfig: ViewConfig,
): ValidationResult {
  const differences = [];
  accumulateDifferences(
    differences,
    [],
    {
      bubblingEventTypes: nativeViewConfig.bubblingEventTypes,
      directEventTypes: nativeViewConfig.directEventTypes,
      uiViewClassName: nativeViewConfig.uiViewClassName,
      validAttributes: nativeViewConfig.validAttributes,
    },
    {
      bubblingEventTypes: staticViewConfig.bubblingEventTypes,
      directEventTypes: staticViewConfig.directEventTypes,
      uiViewClassName: staticViewConfig.uiViewClassName,
      validAttributes: staticViewConfig.validAttributes,
    },
  );

  if (differences.length === 0) {
    return {type: 'valid'};
  }

  return {
    type: 'invalid',
    differences,
  };
}

export function stringifyValidationResult(
  name: string,
  validationResult: InvalidResult,
): string {
  const {differences} = validationResult;
  return [
    `StaticViewConfigValidator: Invalid static view config for '${name}'.`,
    '',
    ...differences.map(difference => {
      const {type, path} = difference;
      switch (type) {
        case 'missing':
          return `- '${path.join('.')}' is missing.`;
        case 'unequal':
          return `- '${path.join('.')}' is the wrong value.`;
        case 'unexpected':
          return `- '${path.join('.')}' is present but not expected to be.`;
      }
    }),
    '',
  ].join('\n');
}

function accumulateDifferences(
  differences: Array<Difference>,
  path: Array<string>,
  nativeObject: {...},
  staticObject: {...},
): void {
  for (const nativeKey in nativeObject) {
    const nativeValue = nativeObject[nativeKey];

    if (!staticObject.hasOwnProperty(nativeKey)) {
      differences.push({
        path: [...path, nativeKey],
        type: 'missing',
        nativeValue,
      });
      continue;
    }

    const staticValue = staticObject[nativeKey];

    const nativeValueIfObject = ifObject(nativeValue);
    if (nativeValueIfObject != null) {
      const staticValueIfObject = ifObject(staticValue);
      if (staticValueIfObject != null) {
        path.push(nativeKey);
        accumulateDifferences(
          differences,
          path,
          nativeValueIfObject,
          staticValueIfObject,
        );
        path.pop();
        continue;
      }
    }

    if (nativeValue !== staticValue) {
      differences.push({
        path: [...path, nativeKey],
        type: 'unequal',
        nativeValue,
        staticValue,
      });
    }
  }

  for (const staticKey in staticObject) {
    if (!nativeObject.hasOwnProperty(staticKey)) {
      differences.push({
        path: [...path, staticKey],
        type: 'unexpected',
        staticValue: staticObject[staticKey],
      });
    }
  }
}

function ifObject(value: mixed): ?{...} {
  return typeof value === 'object' && !Array.isArray(value) ? value : null;
}
