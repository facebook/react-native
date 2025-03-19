/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactPerfettoLogger.h"

#if defined(WITH_PERFETTO)
#include "ReactPerfetto.h"
#elif defined(WITH_FBSYSTRACE)
#include <fbsystrace.h>
#endif

#include <chrono>

namespace facebook::react {

namespace {

#if defined(WITH_PERFETTO)
const std::string PERFETTO_DEFAULT_TRACK_NAME = "# Web Performance";
const std::string PERFETTO_TRACK_NAME_PREFIX = "# Web Performance: ";

std::string toPerfettoTrackName(
    const std::optional<std::string_view>& trackName) {
  return trackName.has_value()
      ? PERFETTO_TRACK_NAME_PREFIX + std::string(trackName.value())
      : PERFETTO_DEFAULT_TRACK_NAME;
}
#elif defined(WITH_FBSYSTRACE)
int64_t getDeltaNanos(double jsTime) {
  auto now = std::chrono::steady_clock::now().time_since_epoch();
  return static_cast<int64_t>(jsTime * 1.e6) -
      std::chrono::duration_cast<std::chrono::nanoseconds>(now).count();
}
#endif

} // namespace

/* static */ bool ReactPerfettoLogger::isTracing() {
#if defined(WITH_PERFETTO)
  return TRACE_EVENT_CATEGORY_ENABLED("react-native");
#elif defined(WITH_FBSYSTRACE)
  return fbsystrace_is_tracing(TRACE_TAG_REACT_APPS);
#else
  return false;
#endif
}

/* static */ void ReactPerfettoLogger::measure(
    const std::string_view& eventName,
    double startTime,
    double endTime,
    const std::optional<std::string_view>& trackName) {
#if defined(WITH_PERFETTO)
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
#elif defined(WITH_FBSYSTRACE)
  static int cookie = 0;
  fbsystrace_begin_async_section_with_timedelta(
      TRACE_TAG_REACT_APPS, eventName.data(), cookie, getDeltaNanos(startTime));
  fbsystrace_end_async_section_with_timedelta(
      TRACE_TAG_REACT_APPS, eventName.data(), cookie, getDeltaNanos(endTime));
  cookie++;
#endif
}

/* static */ void ReactPerfettoLogger::mark(
    const std::string_view& eventName,
    double startTime,
    const std::optional<std::string_view>& trackName) {
#if defined(WITH_PERFETTO)
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
