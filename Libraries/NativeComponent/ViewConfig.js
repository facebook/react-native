/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import ReactNativeViewViewConfig from '../Components/View/ReactNativeViewViewConfig';
import type {
  PartialViewConfig,
  ViewConfig,
} from '../Renderer/shims/ReactNativeTypes';

/**
 * Creates a complete `ViewConfig` from a `PartialViewConfig`.
 */
export function createViewConfig(
  partialViewConfig: PartialViewConfig,
): ViewConfig {
  return {
    uiViewClassName: partialViewConfig.uiViewClassName,
    Commands: {},
    bubblingEventTypes: composeIndexers(
      ReactNativeViewViewConfig.bubblingEventTypes,
      partialViewConfig.bubblingEventTypes,
    ),
    directEventTypes: composeIndexers(
      ReactNativeViewViewConfig.directEventTypes,
      partialViewConfig.directEventTypes,
    ),
    validAttributes: composeIndexers(
      // $FlowFixMe[incompatible-call] `style` property confuses Flow.
      ReactNativeViewViewConfig.validAttributes,
      // $FlowFixMe[incompatible-call] `style` property confuses Flow.
      partialViewConfig.validAttributes,
    ),
  };
}

function composeIndexers<T>(
  maybeA: ?{+[string]: T},
  maybeB: ?{+[string]: T},
): {+[string]: T} {
  return maybeA == null || maybeB == null
    ? maybeA ?? maybeB ?? {}
    : {...maybeA, ...maybeB};
}
