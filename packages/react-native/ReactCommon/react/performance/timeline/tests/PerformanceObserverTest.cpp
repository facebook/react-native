/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <ostream>

#include "../PerformanceEntryReporter.h"
#include "../PerformanceObserver.h"

namespace facebook::react {

[[maybe_unused]] static bool operator==(
    const PerformanceEntry& lhs,
    const PerformanceEntry& rhs) {
  return std::visit(
      [&](const auto& left, const auto& right) {
        bool baseMatch = left.name == right.name &&
            left.entryType == right.entryType &&
            left.startTime == right.startTime &&
            left.duration == right.duration;

        if (baseMatch && left.entryType == PerformanceEntryType::EVENT) {
          auto leftEventTiming = std::get<PerformanceEventTiming>(lhs);
          auto rightEventTiming = std::get<PerformanceEventTiming>(rhs);

          return leftEventTiming.processingStart ==
              rightEventTiming.processingStart &&
              leftEventTiming.processingEnd == rightEventTiming.processingEnd &&
              leftEventTiming.interactionId == rightEventTiming.interactionId;
        }

        return baseMatch;
      },
      lhs,
      rhs);
}
} // namespace facebook::react

using namespace facebook::react;

TEST(PerformanceObserver, PerformanceObserverTestObserveFlushes) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  bool callbackCalled = false;
  auto observer = PerformanceObserver::create(
      reporter->getObserverRegistry(), [&]() { callbackCalled = true; });
  observer->observe(PerformanceEntryType::MARK);

  // buffer is empty
  ASSERT_FALSE(callbackCalled);

  reporter->reportMark("test", 10);
  ASSERT_TRUE(callbackCalled);

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestFilteredSingle) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto observer =
      PerformanceObserver::create(reporter->getObserverRegistry(), [&]() {});
  observer->observe(PerformanceEntryType::MEASURE);
  reporter->reportMark("test", 10);

  // wrong type
  ASSERT_EQ(observer->takeRecords().size(), 0);

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestFilterMulti) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto callbackCalled = false;
  auto observer = PerformanceObserver::create(
      reporter->getObserverRegistry(), [&]() { callbackCalled = true; });
  observer->observe(
      {PerformanceEntryType::MEASURE, PerformanceEntryType::MARK});

  reporter->reportEvent("test1", 10, 10, 0, 0, 0);
  reporter->reportEvent("test2", 10, 10, 0, 0, 0);
  reporter->reportEvent("test3", 10, 10, 0, 0, 0);

  ASSERT_EQ(observer->takeRecords().size(), 0);
  ASSERT_FALSE(callbackCalled);

  observer->disconnect();
}

TEST(
    PerformanceObserver,
    PerformanceObserverTestFilterSingleCallbackNotCalled) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto callbackCalled = false;
  auto observer = PerformanceObserver::create(
      reporter->getObserverRegistry(), [&]() { callbackCalled = true; });
  observer->observe(PerformanceEntryType::MEASURE);
  reporter->reportMark("test", 10);

  ASSERT_FALSE(callbackCalled);

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestFilterMultiCallbackNotCalled) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto callbackCalled = false;
  auto observer = PerformanceObserver::create(
      reporter->getObserverRegistry(), [&]() { callbackCalled = true; });
  observer->observe(
      {PerformanceEntryType::MEASURE, PerformanceEntryType::MARK});
  reporter->reportEvent("test1", 10, 10, 0, 0, 0);
  reporter->reportEvent("test2", 10, 10, 0, 0, 0);
  reporter->reportEvent("off3", 10, 10, 0, 0, 0);

  ASSERT_FALSE(callbackCalled);

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestObserveTakeRecords) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto observer =
      PerformanceObserver::create(reporter->getObserverRegistry(), [&]() {});
  observer->observe(PerformanceEntryType::MARK);
  reporter->reportMark("test1", 10);
  reporter->reportMeasure("off", 10, 20);
  reporter->reportMark("test2", 20);
  reporter->reportMark("test3", 30);

  const std::vector<PerformanceEntry> expected = {
      PerformanceMark{{.name = "test1", .startTime = 10}},
      PerformanceMark{{.name = "test2", .startTime = 20}},
      PerformanceMark{{.name = "test3", .startTime = 30}},
  };

  ASSERT_EQ(expected, observer->takeRecords());

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestObserveDurationThreshold) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto observer =
      PerformanceObserver::create(reporter->getObserverRegistry(), [&]() {});
  observer->observe(PerformanceEntryType::EVENT, {.durationThreshold = 50});
  reporter->reportEvent("test1", 0, 50, 0, 0, 0);
  reporter->reportEvent("test2", 0, 100, 0, 0, 0);
  reporter->reportEvent("off1", 0, 40, 0, 0, 0);
  reporter->reportMark("off2", 100);
  reporter->reportEvent("test3", 0, 60, 0, 0, 0);

  const std::vector<PerformanceEntry> expected = {
      PerformanceEventTiming{{.name = "test1", .duration = 50}, 0, 0, 0},
      PerformanceEventTiming{{.name = "test2", .duration = 100}, 0, 0, 0},
      PerformanceEventTiming{{.name = "test3", .duration = 60}, 0, 0, 0},
  };

  ASSERT_EQ(expected, observer->takeRecords());

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestObserveBuffered) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  reporter->reportEvent("test1", 0, 50, 0, 0, 0);
  reporter->reportEvent("test2", 0, 100, 0, 0, 0);
  reporter->reportEvent("test3", 0, 40, 0, 0, 0);
  reporter->reportEvent("test4", 0, 100, 0, 0, 0);

  auto observer =
      PerformanceObserver::create(reporter->getObserverRegistry(), [&]() {});
  observer->observe(
      PerformanceEntryType::EVENT, {.buffered = true, .durationThreshold = 50});

  const std::vector<PerformanceEntry> expected = {
      PerformanceEventTiming{
          {.name = "test1", .startTime = 0, .duration = 50}, 0, 0, 0},
      PerformanceEventTiming{
          {.name = "test2", .startTime = 0, .duration = 100}, 0, 0, 0},
      PerformanceEventTiming{
          {.name = "test4", .startTime = 0, .duration = 100}, 0, 0, 0},
  };

  ASSERT_EQ(expected, observer->takeRecords());

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestMultiple) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto observer1 =
      PerformanceObserver::create(reporter->getObserverRegistry(), [&]() {});
  auto observer2 =
      PerformanceObserver::create(reporter->getObserverRegistry(), [&]() {});
  observer1->observe(PerformanceEntryType::EVENT, {.durationThreshold = 50});
  observer2->observe(PerformanceEntryType::EVENT, {.durationThreshold = 80});

  reporter->reportMeasure("measure", 0, 50);
  reporter->reportEvent("event1", 0, 100, 0, 0, 0);
  reporter->reportEvent("event2", 0, 40, 0, 0, 0);
  reporter->reportMark("mark1", 100);
  reporter->reportEvent("event3", 0, 60, 0, 0, 0);

  const std::vector<PerformanceEntry> expected1 = {
      PerformanceEventTiming{{.name = "event1", .duration = 100}, 0, 0, 0},
      PerformanceEventTiming{{.name = "event3", .duration = 60}, 0, 0, 0},
  };

  const std::vector<PerformanceEntry> expected2 = {
      PerformanceEventTiming{{.name = "event1", .duration = 100}, 0, 0, 0},
  };

  ASSERT_EQ(expected1, observer1->takeRecords());
  ASSERT_EQ(expected2, observer2->takeRecords());

  observer1->disconnect();
  observer2->disconnect();
}
