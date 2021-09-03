/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphEventEmitter.h"

namespace facebook {
namespace react {

static jsi::Value linesMeasurementsPayload(
    jsi::Runtime &runtime,
    LinesMeasurements const &linesMeasurements) {
  auto payload = jsi::Object(runtime);
  auto lines = jsi::Array(runtime, linesMeasurements.size());

  for (size_t i = 0; i < linesMeasurements.size(); ++i) {
    auto const &lineMeasurement = linesMeasurements[i];
    auto jsiLine = jsi::Object(runtime);
    jsiLine.setProperty(runtime, "text", lineMeasurement.text);
    jsiLine.setProperty(runtime, "x", lineMeasurement.frame.origin.x);
    jsiLine.setProperty(runtime, "y", lineMeasurement.frame.origin.y);
    jsiLine.setProperty(runtime, "width", lineMeasurement.frame.size.width);
    jsiLine.setProperty(runtime, "height", lineMeasurement.frame.size.height);
    jsiLine.setProperty(runtime, "descender", lineMeasurement.descender);
    jsiLine.setProperty(runtime, "capHeight", lineMeasurement.capHeight);
    jsiLine.setProperty(runtime, "ascender", lineMeasurement.ascender);
    jsiLine.setProperty(runtime, "xHeight", lineMeasurement.xHeight);
    lines.setValueAtIndex(runtime, i, jsiLine);
  }

  payload.setProperty(runtime, "lines", lines);

  return payload;
}

void ParagraphEventEmitter::onTextLayout(
    LinesMeasurements const &linesMeasurements) const {
  {
    std::lock_guard<std::mutex> guard(linesMeasurementsMutex_);
    if (linesMeasurementsMetrics_ == linesMeasurements) {
      return;
    }
    linesMeasurementsMetrics_ = linesMeasurements;
  }

  dispatchEvent("textLayout", [linesMeasurements](jsi::Runtime &runtime) {
    return linesMeasurementsPayload(runtime, linesMeasurements);
  });
}

} // namespace react
} // namespace facebook
