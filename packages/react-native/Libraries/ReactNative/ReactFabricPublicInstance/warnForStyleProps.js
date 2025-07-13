/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AttributeConfiguration} from '../../Renderer/shims/ReactNativeTypes';

export default function warnForStyleProps(
  props: {...},
  validAttributes: AttributeConfiguration,
): void {
  if (__DEV__) {
    for (const key in validAttributes.style) {
      // $FlowFixMe[invalid-computed-prop]
      if (!(validAttributes[key] || props[key] === undefined)) {
        console.error(
          'You are setting the style `{ %s' +
            ': ... }` as a prop. You ' +
            'should nest it in a style object. ' +
            'E.g. `{ style: { %s' +
            ': ... } }`',
          key,
          key,
        );
      }
    }
  }
}
