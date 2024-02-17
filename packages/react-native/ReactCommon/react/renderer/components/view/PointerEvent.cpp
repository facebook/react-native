/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PointerEvent.h"

namespace facebook::react {

jsi::Value PointerEvent::asJSIValue(jsi::Runtime& runtime) const {
  auto object = jsi::Object(runtime);
  object.setProperty(runtime, "pointerId", this->pointerId);
  object.setProperty(runtime, "pressure", this->pressure);
  object.setProperty(runtime, "pointerType", this->pointerType);
  object.setProperty(runtime, "clientX", this->clientPoint.x);
  object.setProperty(runtime, "clientY", this->clientPoint.y);
  // x/y are an alias to clientX/Y
  object.setProperty(runtime, "x", this->clientPoint.x);
  object.setProperty(runtime, "y", this->clientPoint.y);
  // since RN doesn't have a scrollable root, pageX/Y will always equal
  // clientX/Y
  object.setProperty(runtime, "pageX", this->clientPoint.x);
  object.setProperty(runtime, "pageY", this->clientPoint.y);
  object.setProperty(runtime, "screenX", this->screenPoint.x);
  object.setProperty(runtime, "screenY", this->screenPoint.y);
  object.setProperty(runtime, "offsetX", this->offsetPoint.x);
  object.setProperty(runtime, "offsetY", this->offsetPoint.y);
  object.setProperty(runtime, "width", this->width);
  object.setProperty(runtime, "height", this->height);
  object.setProperty(runtime, "tiltX", this->tiltX);
  object.setProperty(runtime, "tiltY", this->tiltY);
  object.setProperty(runtime, "detail", this->detail);
  object.setProperty(runtime, "buttons", this->buttons);
  object.setProperty(runtime, "tangentialPressure", this->tangentialPressure);
  object.setProperty(runtime, "twist", this->twist);
  object.setProperty(runtime, "ctrlKey", this->ctrlKey);
  object.setProperty(runtime, "shiftKey", this->shiftKey);
  object.setProperty(runtime, "altKey", this->altKey);
  object.setProperty(runtime, "metaKey", this->metaKey);
  object.setProperty(runtime, "isPrimary", this->isPrimary);
  object.setProperty(runtime, "button", this->button);
  return object;
}

EventPayloadType PointerEvent::getType() const {
  return EventPayloadType::PointerEvent;
}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const PointerEvent& /*pointerEvent*/) {
  return "PointerEvent";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    const PointerEvent& pointerEvent,
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
      {"ctrlKey", getDebugDescription(pointerEvent.ctrlKey, options)},
      {"shiftKey", getDebugDescription(pointerEvent.shiftKey, options)},
      {"altKey", getDebugDescription(pointerEvent.altKey, options)},
      {"metaKey", getDebugDescription(pointerEvent.metaKey, options)},
      {"isPrimary", getDebugDescription(pointerEvent.isPrimary, options)},
      {"button", getDebugDescription(pointerEvent.button, options)},
  };
}

#endif

} // namespace facebook::react
