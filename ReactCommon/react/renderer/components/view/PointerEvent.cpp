/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PointerEvent.h"

namespace facebook {
namespace react {

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(PointerEvent const &pointerEvent) {
  return "PointerEvent";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    PointerEvent const &pointerEvent,
    DebugStringConvertibleOptions options) {
  return {
      {"pointerId", getDebugDescription(pointerEvent.pointerId, options)},
      {"pressure", getDebugDescription(pointerEvent.pressure, options)},
      {"pointerType", getDebugDescription(pointerEvent.pointerType, options)},
      {"clientPoint", getDebugDescription(pointerEvent.clientPoint, options)},
      {"screenPoint", getDebugDescription(pointerEvent.screenPoint, options)},
      {"offsetPoint", getDebugDescription(pointerEvent.offsetPoint, options)},
      {"width", getDebugDescription(pointerEvent.width, options)},
      {"height", getDebugDescription(pointerEvent.height, options)},
      {"tiltX", getDebugDescription(pointerEvent.tiltX, options)},
      {"tiltY", getDebugDescription(pointerEvent.tiltY, options)},
      {"detail", getDebugDescription(pointerEvent.detail, options)},
      {"buttons", getDebugDescription(pointerEvent.buttons, options)},
      {"tangentialPressure",
       getDebugDescription(pointerEvent.tangentialPressure, options)},
      {"twist", getDebugDescription(pointerEvent.twist, options)},
  };
}

#endif

} // namespace react
} // namespace facebook
