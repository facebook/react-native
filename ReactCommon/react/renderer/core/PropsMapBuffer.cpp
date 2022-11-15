/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PropsMapBuffer.h"
#include "Props.h"

#ifdef ANDROID

namespace facebook {
namespace react {

void Props::propsDiffMapBuffer(
    Props const *oldPropsPtr,
    MapBufferBuilder &builder) const {
  // Call with default props if necessary
  if (oldPropsPtr == nullptr) {
    Props defaultProps{};
    propsDiffMapBuffer(&defaultProps, builder);
    return;
  }

  Props const &oldProps = *oldPropsPtr;
  Props const &newProps = *this;

  if (oldProps.nativeId != newProps.nativeId) {
    builder.putString(PROPS_NATIVE_ID, nativeId);
  }
}

} // namespace react
} // namespace facebook
#endif
