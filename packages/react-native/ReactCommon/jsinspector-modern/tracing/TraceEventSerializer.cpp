/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TraceEventSerializer.h"
#include "Timing.h"

namespace facebook::react::jsinspector_modern::tracing {

/* static */ folly::dynamic TraceEventSerializer::serialize(
    TraceEvent&& event) {
  folly::dynamic result = folly::dynamic::object;

  if (event.id.has_value()) {
    std::array<char, 16> buffer{};
    snprintf(buffer.data(), buffer.size(), "0x%x", event.id.value());
    result["id"] = buffer.data();
  }
  result["name"] = std::move(event.name);
  result["cat"] = std::move(event.cat);
  result["ph"] = std::string(1, event.ph);
  result["ts"] = highResTimeStampToTracingClockTimeStamp(event.ts);
  result["pid"] = event.pid;
  result["tid"] = event.tid;
  result["args"] = std::move(event.args);
  if (event.dur.has_value()) {
    result["dur"] = highResDurationToTracingClockDuration(event.dur.value());
  }

  return result;
}

} // namespace facebook::react::jsinspector_modern::tracing
