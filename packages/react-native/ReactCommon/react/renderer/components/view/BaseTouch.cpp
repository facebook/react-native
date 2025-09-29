/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Touch.h"

namespace facebook::react {

void setTouchPayloadOnObject(
    jsi::Object& object,
    jsi::Runtime& runtime,
    const BaseTouch& touch) {
  object.setProperty(runtime, "locationX", touch.offsetPoint.x);
  object.setProperty(runtime, "locationY", touch.offsetPoint.y);
  object.setProperty(runtime, "pageX", touch.pagePoint.x);
  object.setProperty(runtime, "pageY", touch.pagePoint.y);
  object.setProperty(runtime, "screenX", touch.screenPoint.x);
  object.setProperty(runtime, "screenY", touch.screenPoint.y);
  object.setProperty(runtime, "identifier", touch.identifier);
  object.setProperty(runtime, "target", touch.target);
  object.setProperty(runtime, "timestamp", touch.timestamp * 1000);
  object.setProperty(runtime, "force", touch.force);
}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const BaseTouch& /*touch*/) {
  return "Touch";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    const BaseTouch& touch,
    DebugStringConvertibleOptions options) {
  return {
      {.name = "pagePoint",
       .value = getDebugDescription(touch.pagePoint, options)},
      {.name = "offsetPoint",
       .value = getDebugDescription(touch.offsetPoint, options)},
      {.name = "screenPoint",
       .value = getDebugDescription(touch.screenPoint, options)},
      {.name = "identifier",
       .value = getDebugDescription(touch.identifier, options)},
      {.name = "target", .value = getDebugDescription(touch.target, options)},
      {.name = "force", .value = getDebugDescription(touch.force, options)},
      {.name = "timestamp",
       .value = getDebugDescription(touch.timestamp, options)},
  };
}

#endif

} // namespace facebook::react
