/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactPerfettoLogger.h"

#ifdef WITH_PERFETTO
#include "ReactPerfetto.h"
#endif

namespace facebook::react {

#ifdef WITH_PERFETTO
namespace {

const std::string PERFETTO_DEFAULT_TRACK_NAME = "# Web Performance";
const std::string PERFETTO_TRACK_NAME_PREFIX = "# Web Performance: ";

std::string toPerfettoTrackName(
    const std::optional<std::string_view>& trackName) {
  return trackName.has_value()
      ? PERFETTO_TRACK_NAME_PREFIX + std::string(trackName.value())
      : PERFETTO_DEFAULT_TRACK_NAME;
}

} // namespace
#endif

/* static */ void ReactPerfettoLogger::measure(
    const std::string_view& eventName,
    double startTime,
    double endTime,
    const std::optional<std::string_view>& trackName) {
#ifdef WITH_PERFETTO
  if (TRACE_EVENT_CATEGORY_ENABLED("react-native")) {
    auto track = getPerfettoWebPerfTrackAsync(toPerfettoTrackName(trackName));
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

/* static */ void ReactPerfettoLogger::mark(
    const std::string_view& eventName,
    double startTime,
    const std::optional<std::string_view>& trackName) {
#ifdef WITH_PERFETTO
  if (TRACE_EVENT_CATEGORY_ENABLED("react-native")) {
    TRACE_EVENT_INSTANT(
        "react-native",
        perfetto::DynamicString(eventName.data(), eventName.size()),
        getPerfettoWebPerfTrackSync(toPerfettoTrackName(trackName)),
        performanceNowToPerfettoTraceTime(startTime));
  }
#endif
}

} // namespace facebook::react
