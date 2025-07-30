/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CdpMetricsReporter.h"
#include "CdpInteractionTypes.h"

#include <folly/dynamic.h>
#include <folly/json.h>
#include <string_view>

namespace facebook::react {

namespace {

constexpr std::string_view metricsReporterName =
    "__chromium_devtools_metrics_reporter";

} // namespace

CdpMetricsReporter::CdpMetricsReporter(RuntimeExecutor runtimeExecutor)
    : runtimeExecutor_(std::move(runtimeExecutor)) {}

void CdpMetricsReporter::onEventTimingEntry(
    const PerformanceEventTiming& entry) {
  runtimeExecutor_([entry = std::move(entry)](jsi::Runtime& runtime) {
    auto global = runtime.global();
    if (!global.hasProperty(runtime, metricsReporterName.data())) {
      return;
    }

    auto inputDelay = entry.processingStart - entry.startTime;
    auto processingDuration = entry.processingEnd - entry.processingStart;
    auto nextPaintTime = entry.startTime + entry.duration;
    auto presentationDelay = nextPaintTime - entry.processingEnd;

    folly::dynamic jsonPayload = folly::dynamic::object;
    jsonPayload["name"] = "InteractionEntry";
    jsonPayload["duration"] =
        static_cast<int>(entry.duration.toDOMHighResTimeStamp());
    jsonPayload["phases"] = folly::dynamic::object(
        "inputDelay", static_cast<int>(inputDelay.toDOMHighResTimeStamp()))(
        "processingDuration",
        static_cast<int>(processingDuration.toDOMHighResTimeStamp()))(
        "presentationDelay",
        static_cast<int>(presentationDelay.toDOMHighResTimeStamp()));
    jsonPayload["startTime"] =
        static_cast<int>(entry.startTime.toDOMHighResTimeStamp());
    jsonPayload["nextPaintTime"] =
        static_cast<int>(nextPaintTime.toDOMHighResTimeStamp());
    jsonPayload["interactionType"] =
        std::string(getInteractionTypeForEvent(entry.name));
    jsonPayload["eventName"] = std::string(entry.name);
    jsonPayload["longAnimationFrameEntries"] = folly::dynamic::array();

    auto jsonString = folly::toJson(jsonPayload);
    auto jsiString = jsi::String::createFromUtf8(runtime, jsonString);
    auto metricsReporter =
        global.getPropertyAsFunction(runtime, metricsReporterName.data());
    metricsReporter.call(runtime, jsiString);
  });
}

} // namespace facebook::react
