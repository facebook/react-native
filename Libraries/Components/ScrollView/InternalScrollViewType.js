/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const ReactNative = require('ReactNative');

// This class is purely a facsimile of ScrollView so that we can
// properly type it with Flow before migrating ScrollView off of
// createReactClass. If there are things missing here that are in
// ScrollView, that is unintentional.
class InternalScrollViewType<Props> extends ReactNative.NativeComponent<Props> {
  scrollTo(
    y?: number | {x?: number, y?: number, animated?: boolean},
    x?: number,
    animated?: boolean,
  ) {}

  flashScrollIndicators() {}
  propTypes: empty;
  scrollToEnd(options?: ?{animated?: boolean}) {}
  scrollWithoutAnimationTo(y: number = 0, x: number = 0) {}

  getScrollResponder(): any {}
  getScrollableNode(): any {}
  getInnerViewNode(): any {}

  scrollResponderScrollNativeHandleToKeyboard(
    nodeHandle: any,
    additionalOffset?: number,
    preventNegativeScrollOffset?: boolean,
  ) {}

  scrollResponderScrollTo(
    x?: number | {x?: number, y?: number, animated?: boolean},
    y?: number,
    animated?: boolean,
  ) {}
}

module.exports = InternalScrollViewType;
