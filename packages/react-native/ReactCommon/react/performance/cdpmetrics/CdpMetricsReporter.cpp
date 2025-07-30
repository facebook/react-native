/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CdpMetricsReporter.h"

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

    folly::dynamic jsonPayload = folly::dynamic::object;
    jsonPayload["eventName"] = entry.name;
    jsonPayload["durationMs"] =
        static_cast<int>(entry.duration.toDOMHighResTimeStamp());
    jsonPayload["startTime"] =
        static_cast<int>(entry.startTime.toDOMHighResTimeStamp());
    auto jsonString = folly::toJson(jsonPayload);
    auto jsiString = jsi::String::createFromUtf8(runtime, jsonString);

    auto metricsReporter =
        global.getPropertyAsFunction(runtime, metricsReporterName.data());
    metricsReporter.call(runtime, jsiString);
  });
}

} // namespace facebook::react
