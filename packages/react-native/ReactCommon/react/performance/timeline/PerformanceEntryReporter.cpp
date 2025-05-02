/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryReporter.h"

#include <jsinspector-modern/tracing/PerformanceTracer.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/timing/primitives.h>
#include <reactperflogger/ReactPerfettoLogger.h>

#ifdef WITH_PERFETTO
#include <reactperflogger/ReactPerfetto.h>
#endif

#include <variant>

namespace facebook::react {

namespace {

std::vector<PerformanceEntryType> getSupportedEntryTypesInternal() {
  std::vector<PerformanceEntryType> supportedEntryTypes{
      PerformanceEntryType::MARK,
      PerformanceEntryType::MEASURE,
      PerformanceEntryType::EVENT,
      PerformanceEntryType::LONGTASK,
  };

  return supportedEntryTypes;
}

uint64_t timestampToMicroseconds(DOMHighResTimeStamp timestamp) {
  return static_cast<uint64_t>(timestamp * 1000);
}

double performanceNow() {
  return chronoToDOMHighResTimeStamp(std::chrono::steady_clock::now());
}

#if defined(__clang__)
#define NO_DESTROY [[clang::no_destroy]]
#else
#define NO_DESTROY
#endif

NO_DESTROY const std::string TRACK_PREFIX = "Track:";

std::tuple<std::optional<std::string>, std::string_view> parseTrackName(
    const std::string& name) {
  // Until there's a standard way to pass through track information, parse it
  // manually, e.g., "Track:Foo:Event name"
  // https://github.com/w3c/user-timing/issues/109
  std::optional<std::string> trackName;
  std::string_view eventName(name);
  if (name.starts_with(TRACK_PREFIX)) {
    const auto trackNameDelimiter = name.find(':', TRACK_PREFIX.length());
    if (trackNameDelimiter != std::string::npos) {
      trackName = name.substr(
          TRACK_PREFIX.length(), trackNameDelimiter - TRACK_PREFIX.length());
      eventName = std::string_view(name).substr(trackNameDelimiter + 1);
    }
  }

  return std::make_tuple(trackName, eventName);
}

} // namespace

std::shared_ptr<PerformanceEntryReporter>&
PerformanceEntryReporter::getInstance() {
  static auto instance = std::make_shared<PerformanceEntryReporter>();
  return instance;
}

PerformanceEntryReporter::PerformanceEntryReporter()
    : observerRegistry_(std::make_unique<PerformanceObserverRegistry>()) {
#ifdef WITH_PERFETTO
  initializePerfetto();
#endif
}

DOMHighResTimeStamp PerformanceEntryReporter::getCurrentTimeStamp() const {
  return timeStampProvider_ != nullptr ? timeStampProvider_()
                                       : performanceNow();
}

std::vector<PerformanceEntryType>
PerformanceEntryReporter::getSupportedEntryTypes() {
  static std::vector<PerformanceEntryType> supportedEntries =
      getSupportedEntryTypesInternal();
  return supportedEntries;
}

uint32_t PerformanceEntryReporter::getDroppedEntriesCount(
    PerformanceEntryType entryType) const noexcept {
  std::shared_lock lock(buffersMutex_);

  return (uint32_t)getBuffer(entryType).droppedEntriesCount;
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntries() const {
  std::vector<PerformanceEntry> entries;
  getEntries(entries);
  return entries;
}

void PerformanceEntryReporter::getEntries(
    std::vector<PerformanceEntry>& dest) const {
  std::shared_lock lock(buffersMutex_);

  for (auto entryType : getSupportedEntryTypes()) {
    getBuffer(entryType).getEntries(dest);
  }
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntries(
    PerformanceEntryType entryType) const {
  std::vector<PerformanceEntry> dest;
  getEntries(dest, entryType);
  return dest;
}

void PerformanceEntryReporter::getEntries(
    std::vector<PerformanceEntry>& dest,
    PerformanceEntryType entryType) const {
  std::shared_lock lock(buffersMutex_);

  getBuffer(entryType).getEntries(dest);
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntries(
    PerformanceEntryType entryType,
    const std::string& entryName) const {
  std::vector<PerformanceEntry> entries;
  getEntries(entries, entryType, entryName);
  return entries;
}

void PerformanceEntryReporter::getEntries(
    std::vector<PerformanceEntry>& dest,
    PerformanceEntryType entryType,
    const std::string& entryName) const {
  std::shared_lock lock(buffersMutex_);

  getBuffer(entryType).getEntries(dest, entryName);
}

void PerformanceEntryReporter::clearEntries() {
  std::unique_lock lock(buffersMutex_);

  for (auto entryType : getSupportedEntryTypes()) {
    getBufferRef(entryType).clear();
  }
}

void PerformanceEntryReporter::clearEntries(PerformanceEntryType entryType) {
  std::unique_lock lock(buffersMutex_);

  getBufferRef(entryType).clear();
}

void PerformanceEntryReporter::clearEntries(
    PerformanceEntryType entryType,
    const std::string& entryName) {
  std::unique_lock lock(buffersMutex_);

  getBufferRef(entryType).clear(entryName);
}

PerformanceMark PerformanceEntryReporter::reportMark(
    const std::string& name,
    const std::optional<DOMHighResTimeStamp>& startTime) {
  // Resolve timings
  auto startTimeVal = startTime ? *startTime : getCurrentTimeStamp();
  const auto entry = PerformanceMark{{.name = name, .startTime = startTimeVal}};

  traceMark(entry);

  // Add to buffers & notify observers
  {
    std::unique_lock lock(buffersMutex_);
    markBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);

  return entry;
}

PerformanceMeasure PerformanceEntryReporter::reportMeasure(
    const std::string& name,
    DOMHighResTimeStamp startTime,
    DOMHighResTimeStamp endTime,
    const std::optional<DOMHighResTimeStamp>& duration,
    const std::optional<std::string>& startMark,
    const std::optional<std::string>& endMark,
    const std::optional<jsinspector_modern::DevToolsTrackEntryPayload>&
        trackMetadata) {
  DOMHighResTimeStamp startTimeVal =
      startMark ? getMarkTime(*startMark) : startTime;
  DOMHighResTimeStamp endTimeVal = endMark ? getMarkTime(*endMark) : endTime;

  if (!endMark && endTime < startTimeVal) {
    // The end time is not specified, take the current time, according to the
    // standard
    endTimeVal = getCurrentTimeStamp();
  }

  DOMHighResTimeStamp durationVal =
      duration ? *duration : endTimeVal - startTimeVal;

  const auto entry = PerformanceMeasure{
      {.name = std::string(name),
       .startTime = startTimeVal,
       .duration = durationVal}};

  traceMeasure(entry);

  // Add to buffers & notify observers
  {
    std::unique_lock lock(buffersMutex_);
    measureBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);

  return entry;
}

DOMHighResTimeStamp PerformanceEntryReporter::getMarkTime(
    const std::string& markName) const {
  std::shared_lock lock(buffersMutex_);

  if (auto it = markBuffer_.find(markName); it) {
    return std::visit(
        [](const auto& entryData) { return entryData.startTime; }, *it);
  } else {
    return 0.0;
  }
}

void PerformanceEntryReporter::reportEvent(
    std::string name,
    DOMHighResTimeStamp startTime,
    DOMHighResTimeStamp duration,
    DOMHighResTimeStamp processingStart,
    DOMHighResTimeStamp processingEnd,
    uint32_t interactionId) {
  eventCounts_[name]++;

  if (duration < eventBuffer_.durationThreshold) {
    // The entries duration is lower than the desired reporting threshold,
    // skip
    return;
  }

  const auto entry = PerformanceEventTiming{
      {.name = std::move(name), .startTime = startTime, .duration = duration},
      processingStart,
      processingEnd,
      interactionId};

  {
    std::unique_lock lock(buffersMutex_);
    eventBuffer_.add(entry);
  }

  // TODO(T198982346): Log interaction events to jsinspector_modern
  observerRegistry_->queuePerformanceEntry(entry);
}

void PerformanceEntryReporter::reportLongTask(
    DOMHighResTimeStamp startTime,
    DOMHighResTimeStamp duration) {
  const auto entry = PerformanceLongTaskTiming{
      {.name = std::string{"self"},
       .startTime = startTime,
       .duration = duration}};

  {
    std::unique_lock lock(buffersMutex_);
    longTaskBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
}

void PerformanceEntryReporter::traceMark(const PerformanceMark& entry) const {
  auto& performanceTracer =
      jsinspector_modern::PerformanceTracer::getInstance();
  if (ReactPerfettoLogger::isTracing() || performanceTracer.isTracing()) {
    auto [trackName, eventName] = parseTrackName(entry.name);

    if (performanceTracer.isTracing()) {
      performanceTracer.reportMark(
          entry.name, timestampToMicroseconds(entry.startTime));
    }

    if (ReactPerfettoLogger::isTracing()) {
      ReactPerfettoLogger::mark(eventName, entry.startTime, trackName);
    }
  }
}

void PerformanceEntryReporter::traceMeasure(
    const PerformanceMeasure& entry) const {
  auto& performanceTracer =
      jsinspector_modern::PerformanceTracer::getInstance();
  if (performanceTracer.isTracing() || ReactPerfettoLogger::isTracing()) {
    auto [trackName, eventName] = parseTrackName(entry.name);

    if (performanceTracer.isTracing()) {
      std::optional<jsinspector_modern::DevToolsTrackEntryPayload>
          trackMetadata;

      if (trackName.has_value()) {
        trackMetadata = {.track = trackName.value()};
      }
      performanceTracer.reportMeasure(
          eventName,
          timestampToMicroseconds(entry.startTime),
          timestampToMicroseconds(entry.duration),
          trackMetadata);
    }

    if (ReactPerfettoLogger::isTracing()) {
      ReactPerfettoLogger::measure(
          eventName,
          entry.startTime,
          entry.startTime + entry.duration,
          trackName);
    }
  }
}

} // namespace facebook::react
