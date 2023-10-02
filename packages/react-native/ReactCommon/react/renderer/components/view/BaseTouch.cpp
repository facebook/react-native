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
#if TARGET_OS_OSX // [macOS
  object.setProperty(runtime, "button", touch.button);
  object.setProperty(runtime, "altKey", touch.altKey);
  object.setProperty(runtime, "ctrlKey", touch.ctrlKey);
  object.setProperty(runtime, "shiftKey", touch.shiftKey);
  object.setProperty(runtime, "metaKey", touch.metaKey);
#endif // macOS]
}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const BaseTouch& /*touch*/) {
  return "Touch";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    const BaseTouch& touch,
    DebugStringConvertibleOptions options) {
  return {
      {"pagePoint", getDebugDescription(touch.pagePoint, options)},
      {"offsetPoint", getDebugDescription(touch.offsetPoint, options)},
      {"screenPoint", getDebugDescription(touch.screenPoint, options)},
      {"identifier", getDebugDescription(touch.identifier, options)},
      {"target", getDebugDescription(touch.target, options)},
      {"force", getDebugDescription(touch.force, options)},
      {"timestamp", getDebugDescription(touch.timestamp, options)},
#if TARGET_OS_SX // [macOS
	  {"button", getDebugDescription(touch.button, options)},
	  {"altKey", getDebugDescription(touch.altKey, options)},
	  {"ctrlKey", getDebugDescription(touch.ctrlKey, options)},
	  {"shiftKey", getDebugDescription(touch.shiftKey, options)},
	  {"metaKey", getDebugDescription(touch.metaKey, options)},
#endif // macOS]
  };
}

#endif

} // namespace facebook::react
