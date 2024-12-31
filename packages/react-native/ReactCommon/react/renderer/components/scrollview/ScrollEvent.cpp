/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollEvent.h"

namespace facebook::react {

jsi::Value ScrollEvent::asJSIValue(jsi::Runtime& runtime) const {
  auto payload = jsi::Object(runtime);

  {
    auto contentOffsetObj = jsi::Object(runtime);
    contentOffsetObj.setProperty(runtime, "x", contentOffset.x);
    contentOffsetObj.setProperty(runtime, "y", contentOffset.y);
    payload.setProperty(runtime, "contentOffset", contentOffsetObj);
  }

  {
    auto contentInsetObj = jsi::Object(runtime);
    contentInsetObj.setProperty(runtime, "top", contentInset.top);
    contentInsetObj.setProperty(runtime, "left", contentInset.left);
    contentInsetObj.setProperty(runtime, "bottom", contentInset.bottom);
    contentInsetObj.setProperty(runtime, "right", contentInset.right);
    payload.setProperty(runtime, "contentInset", contentInsetObj);
  }

  {
    auto contentSizeObj = jsi::Object(runtime);
    contentSizeObj.setProperty(runtime, "width", contentSize.width);
    contentSizeObj.setProperty(runtime, "height", contentSize.height);
    payload.setProperty(runtime, "contentSize", contentSizeObj);
  }

  {
    auto containerSizeObj = jsi::Object(runtime);
    containerSizeObj.setProperty(runtime, "width", containerSize.width);
    containerSizeObj.setProperty(runtime, "height", containerSize.height);
    payload.setProperty(runtime, "layoutMeasurement", containerSizeObj);
  }

  payload.setProperty(runtime, "zoomScale", zoomScale);
  payload.setProperty(runtime, "timestamp", timestamp * 1000);

  return payload;
}

folly::dynamic ScrollEvent::asDynamic() const {
  auto contentOffsetObj =
      folly::dynamic::object("x", contentOffset.x)("y", contentOffset.y);

  auto contentInsetObj = folly::dynamic::object("top", contentInset.top)(
      "left", contentInset.left)("bottom", contentInset.bottom)(
      "right", contentInset.right);

  auto contentSizeObj = folly::dynamic::object("width", contentSize.width)(
      "height", contentSize.height);

  auto containerSizeObj = folly::dynamic::object("width", containerSize.width)(
      "height", containerSize.height);

  auto metrics =
      folly::dynamic::object("contentOffset", std::move(contentOffsetObj))(
          "contentInset", std::move(contentInsetObj))(
          "contentSize", std::move(contentSizeObj))(
          "layoutMeasurement", std::move(containerSizeObj))(
          "zoomScale", zoomScale)("timestamp", timestamp * 1000);

  return metrics;
};

EventPayloadType ScrollEvent::getType() const {
  return EventPayloadType::ScrollEvent;
}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const ScrollEvent& /*scrollEvent*/) {
  return "ScrollEvent";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    const ScrollEvent& scrollEvent,
    DebugStringConvertibleOptions options) {
  return {
      {"contentOffset",
       getDebugDescription(scrollEvent.contentOffset, options)},
      {"contentInset", getDebugDescription(scrollEvent.contentInset, options)},
      {"contentSize", getDebugDescription(scrollEvent.contentSize, options)},
      {"layoutMeasurement",
       getDebugDescription(scrollEvent.layoutMeasurement, options)},
      {"zoomScale", getDebugDescription(scrollEvent.zoomScale, options)},
      {"timestamp", getDebugDescription(scrollEvent.timestamp, options)}};
}

#endif

} // namespace facebook::react
