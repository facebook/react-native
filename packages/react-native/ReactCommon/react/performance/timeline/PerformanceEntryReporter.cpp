/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryReporter.h"

#include <cxxreact/JSExecutor.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>

namespace facebook::react {

namespace {
std::vector<PerformanceEntryType> getSupportedEntryTypesInternal() {
  std::vector<PerformanceEntryType> supportedEntryTypes{
      PerformanceEntryType::MARK,
      PerformanceEntryType::MEASURE,
      PerformanceEntryType::EVENT,
  };

  if (ReactNativeFeatureFlags::enableLongTaskAPI()) {
    supportedEntryTypes.emplace_back(PerformanceEntryType::LONGTASK);
  }

  return supportedEntryTypes;
}
} // namespace

std::shared_ptr<PerformanceEntryReporter>&
PerformanceEntryReporter::getInstance() {
  static auto instance = std::make_shared<PerformanceEntryReporter>();
  return instance;
}

PerformanceEntryReporter::PerformanceEntryReporter()
    : observerRegistry_(std::make_unique<PerformanceObserverRegistry>()) {}

DOMHighResTimeStamp PerformanceEntryReporter::getCurrentTimeStamp() const {
  return timeStampProvider_ != nullptr ? timeStampProvider_()
                                       : JSExecutor::performanceNow();
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

PerformanceEntry PerformanceEntryReporter::reportMark(
    const std::string& name,
    const std::optional<DOMHighResTimeStamp>& startTime) {
  const auto entry = PerformanceEntry{
      .name = name,
      .entryType = PerformanceEntryType::MARK,
      .startTime = startTime ? *startTime : getCurrentTimeStamp()};

  {
    std::unique_lock lock(buffersMutex_);
    markBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
  return entry;
}

PerformanceEntry PerformanceEntryReporter::reportMeasure(
    const std::string_view& name,
    DOMHighResTimeStamp startTime,
    DOMHighResTimeStamp endTime,
    const std::optional<DOMHighResTimeStamp>& duration,
    const std::optional<std::string>& startMark,
    const std::optional<std::string>& endMark) {
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

  const auto entry = PerformanceEntry{
      .name = std::string(name),
      .entryType = PerformanceEntryType::MEASURE,
      .startTime = startTimeVal,
      .duration = durationVal};

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
    return it->startTime;
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

  const auto entry = PerformanceEntry{
      .name = std::move(name),
      .entryType = PerformanceEntryType::EVENT,
      .startTime = startTime,
      .duration = duration,
      .processingStart = processingStart,
      .processingEnd = processingEnd,
      .interactionId = interactionId};

  {
    std::unique_lock lock(buffersMutex_);
    eventBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
}

void PerformanceEntryReporter::reportLongTask(
    DOMHighResTimeStamp startTime,
    DOMHighResTimeStamp duration) {
  const auto entry = PerformanceEntry{
      .name = std::string{"self"},
      .entryType = PerformanceEntryType::LONGTASK,
      .startTime = startTime,
      .duration = duration};

  {
    std::unique_lock lock(buffersMutex_);
    longTaskBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
}

} // namespace facebook::react
