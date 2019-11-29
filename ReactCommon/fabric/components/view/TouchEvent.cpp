/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TouchEvent.h"

namespace facebook {
namespace react {

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(TouchEvent const &touchEvent) {
  return "TouchEvent";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    TouchEvent const &touchEvent,
    DebugStringConvertibleOptions options) {

  return {
      {"touches", getDebugDescription(touchEvent.touches, options)},
      {"changedTouches", getDebugDescription(touchEvent.changedTouches, options)},
      {"targetTouches", getDebugDescription(touchEvent.targetTouches, options)},
  };
}

#endif

} // namespace react
} // namespace facebook
