/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactPerfLogger.h"

#include <react/timing/primitives.h>
#if __has_include(<reactperflogger/fusebox/FuseboxTracer.h>)
#include <reactperflogger/fusebox/FuseboxTracer.h>
#define HAS_FUSEBOX
#endif
#include <chrono>

#include "ReactPerfetto.h"

namespace facebook::react {

/* static */ void ReactPerfLogger::measure(
    const std::string_view& eventName,
    double startTime,
    double endTime,
    const std::string_view& trackName) {
#ifdef HAS_FUSEBOX
  FuseboxTracer::getFuseboxTracer().addEvent(
      eventName, (uint64_t)startTime, (uint64_t)endTime, trackName);
#endif

#ifdef WITH_PERFETTO
  if (TRACE_EVENT_CATEGORY_ENABLED("react-native")) {
    auto track = getPerfettoWebPerfTrackAsync(std::string(trackName));
    TRACE_EVENT_BEGIN(
        "react-native",
        perfetto::DynamicString(eventName.data(), eventName.size()),
        track,
        performanceNowToPerfettoTraceTime(startTime));
    TRACE_EVENT_END(
        "react-native", track, performanceNowToPerfettoTraceTime(endTime));
  }
#endif
}

/* static */ void ReactPerfLogger::mark(
    const std::string_view& eventName,
    double startTime,
    const std::string_view& trackName) {
  // TODO(T203046480) Support mark in FuseboxTracer

#ifdef WITH_PERFETTO
  if (TRACE_EVENT_CATEGORY_ENABLED("react-native")) {
    TRACE_EVENT_INSTANT(
        "react-native",
        perfetto::DynamicString(eventName.data(), eventName.size()),
        getPerfettoWebPerfTrackSync(std::string(trackName)),
        performanceNowToPerfettoTraceTime(startTime));
  }
#endif
}

/* static */ double ReactPerfLogger::performanceNow() {
  return chronoToDOMHighResTimeStamp(std::chrono::steady_clock::now());
}
} // namespace facebook::react
