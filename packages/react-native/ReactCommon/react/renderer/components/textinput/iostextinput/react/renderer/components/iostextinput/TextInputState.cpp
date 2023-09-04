/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputState.h"

namespace facebook::react {

#ifdef ANDROID
TextInputState::TextInputState(
    const TextInputState& /*previousState*/,
    const folly::dynamic& /*data*/){};

/*
 * Empty implementation for Android because it doesn't use this class.
 */
folly::dynamic TextInputState::getDynamic() const {
  return {};
};

/*
 * Empty implementation for Android because it doesn't use this class.
 */
MapBuffer TextInputState::getMapBuffer() const {
  return MapBufferBuilder::EMPTY();
};
#endif

} // namespace facebook::react
