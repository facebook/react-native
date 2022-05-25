/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {type ViewConfig} from '../Renderer/shims/ReactNativeTypes';

type Difference = {
  path: $ReadOnlyArray<string>,
  type: 'missing' | 'unequal' | 'unexpected',
};

/**
 * During the migration from native view configs to static view configs, this is
 * used to validate that the two are equivalent.
 */
export function validate(
  name: string,
  nativeViewConfig: ViewConfig,
  staticViewConfig: ViewConfig,
): ?string {
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
    return null;
  }
  return [
    `StaticViewConfigValidator: Invalid static view config for '${name}'.`,
    '',
    ...differences.map(({path, type}) => {
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
      differences.push({path: [...path, nativeKey], type: 'missing'});
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
      differences.push({path: [...path, nativeKey], type: 'unequal'});
    }
  }

  for (const staticKey in staticObject) {
    if (!nativeObject.hasOwnProperty(staticKey)) {
      differences.push({path: [...path, staticKey], type: 'unexpected'});
    }
  }
}

function ifObject(value: mixed): ?{...} {
  return typeof value === 'object' && !Array.isArray(value) ? value : null;
}
