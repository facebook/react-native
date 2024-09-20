/*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

#include <ostream>
#include <gtest/gtest.h>

#include "../PerformanceEntryReporter.h"
#include "../PerformanceObserver.h"

namespace facebook::react {

[[maybe_unused]] static bool operator==(
   const PerformanceEntry& lhs,
   const PerformanceEntry& rhs) {
 return lhs.name == rhs.name && lhs.entryType == rhs.entryType &&
     lhs.startTime == rhs.startTime && lhs.duration == rhs.duration &&
     lhs.processingStart == rhs.processingStart &&
     lhs.processingEnd == rhs.processingEnd &&
     lhs.interactionId == rhs.interactionId;
}
} // namespace facebook::react

 using namespace facebook::react;

TEST(PerformanceObserver, PerformanceObserverTestObserveFlushes) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto& registry = reporter->getObserverRegistry();

  bool in = false;
  auto observer = PerformanceObserver::create(registry, [&]() { in = true; });
  observer->observe(PerformanceEntryType::MARK);

  // buffer is empty
  ASSERT_FALSE(in);

  registry.queuePerformanceEntry({ .name = "test", .entryType = PerformanceEntryType::MARK, .startTime = 10, .duration = 10 });
  ASSERT_TRUE(in);

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestFilteredSingle) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto& registry = reporter->getObserverRegistry();

  auto observer = PerformanceObserver::create(registry, [&]() {});
  observer->observe(PerformanceEntryType::MEASURE);
  registry.queuePerformanceEntry({ .name = "test", .entryType = PerformanceEntryType::MARK, .startTime = 10, .duration = 10 });

  // wrong type
  ASSERT_EQ(observer->takeRecords().size(), 0);

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestFilterMulti) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto& registry = reporter->getObserverRegistry();

  auto called = false;
  auto observer = PerformanceObserver::create(registry, [&]() {});
  observer->observe({ PerformanceEntryType::MEASURE, PerformanceEntryType::MARK });
  registry.queuePerformanceEntry(PerformanceEntry { .name = "test1", .entryType = PerformanceEntryType::EVENT, .startTime = 10, .duration = 10 });
  registry.queuePerformanceEntry(PerformanceEntry { .name = "test2", .entryType = PerformanceEntryType::EVENT, .startTime = 10, .duration = 10 });
  registry.queuePerformanceEntry(PerformanceEntry { .name = "off3", .entryType = PerformanceEntryType::EVENT, .startTime = 10, .duration = 10 });

  ASSERT_EQ(observer->takeRecords().size(), 2);
  ASSERT_FALSE(called);

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestFilterSingleCallbackNotCalled) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto& registry = reporter->getObserverRegistry();

  auto called = false;
  auto observer = PerformanceObserver::create(registry, [&]() { called = true; });
  observer->observe(PerformanceEntryType::MEASURE);
  registry.queuePerformanceEntry({ .name = "test", .entryType = PerformanceEntryType::MARK, .startTime = 10, .duration = 10 });

  ASSERT_FALSE(called);

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestFilterMultiCallbackNotCalled) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto& registry = reporter->getObserverRegistry();

  auto called = false;
  auto observer = PerformanceObserver::create(registry, [&]() { called = true; });
  observer->observe({ PerformanceEntryType::MEASURE, PerformanceEntryType::MARK });
  registry.queuePerformanceEntry(PerformanceEntry { .name = "test1", .entryType = PerformanceEntryType::EVENT, .startTime = 10, .duration = 10 });
  registry.queuePerformanceEntry(PerformanceEntry { .name = "test2", .entryType = PerformanceEntryType::EVENT, .startTime = 10, .duration = 10 });
  registry.queuePerformanceEntry(PerformanceEntry { .name = "off3", .entryType = PerformanceEntryType::EVENT, .startTime = 10, .duration = 10 });

  ASSERT_FALSE(called);

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestObserveTakeRecords) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto& registry = reporter->getObserverRegistry();

  auto observer = PerformanceObserver::create(registry, [&]() {});
  observer->observe(PerformanceEntryType::MARK);
  registry.queuePerformanceEntry({ .name = "test1", .entryType = PerformanceEntryType::MARK, .startTime = 10 });
  registry.queuePerformanceEntry({ .name = "off", .entryType = PerformanceEntryType::MEASURE, .startTime = 10 });
  registry.queuePerformanceEntry({ .name = "test2", .entryType = PerformanceEntryType::MARK, .startTime = 20 });
  registry.queuePerformanceEntry({ .name = "test3", .entryType = PerformanceEntryType::MARK, .startTime = 30 });

  const std::vector<PerformanceEntry> expected = {
      { .name = "test1", .entryType = PerformanceEntryType::MARK, .startTime = 10 },
      { .name = "test2", .entryType = PerformanceEntryType::MARK, .startTime = 20 },
      { .name = "test3", .entryType = PerformanceEntryType::MARK, .startTime = 30 },
  };

  ASSERT_EQ(expected, observer->takeRecords());

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestObserveDurationThreshold) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto& registry = reporter->getObserverRegistry();

  auto observer = PerformanceObserver::create(registry, [&]() {});
  observer->observe(PerformanceEntryType::EVENT, { .durationThreshold = 50 });
  registry.queuePerformanceEntry({ .name = "test1", .entryType = PerformanceEntryType::EVENT, .duration = 50 });
  registry.queuePerformanceEntry({ .name = "test2", .entryType = PerformanceEntryType::EVENT, .duration = 100 });
  registry.queuePerformanceEntry({ .name = "off1", .entryType = PerformanceEntryType::EVENT, .duration = 40 });
  registry.queuePerformanceEntry({ .name = "off2", .entryType = PerformanceEntryType::MARK, .duration = 100 });
  registry.queuePerformanceEntry({ .name = "test3", .entryType = PerformanceEntryType::EVENT, .duration = 60 });

  const std::vector<PerformanceEntry> expected = {
      { .name = "test1", .entryType = PerformanceEntryType::EVENT, .duration = 50 },
      { .name = "test2", .entryType = PerformanceEntryType::EVENT, .duration = 100 },
      { .name = "test3", .entryType = PerformanceEntryType::EVENT, .duration = 60 },
  };

  ASSERT_EQ(expected, observer->takeRecords());

  observer->disconnect();
}

TEST(PerformanceObserver, PerformanceObserverTestMultiple) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  auto& registry = reporter->getObserverRegistry();

  auto observer1 = PerformanceObserver::create(registry, [&]() {});
  auto observer2 = PerformanceObserver::create(registry, [&]() {});
  observer1->observe(PerformanceEntryType::EVENT, { .durationThreshold = 50 });
  observer2->observe(PerformanceEntryType::EVENT, { .durationThreshold = 80 });

  registry.queuePerformanceEntry({ .name = "test1", .entryType = PerformanceEntryType::MEASURE, .duration = 50 });
  registry.queuePerformanceEntry({ .name = "test2", .entryType = PerformanceEntryType::EVENT, .duration = 100 });
  registry.queuePerformanceEntry({ .name = "off1", .entryType = PerformanceEntryType::EVENT, .duration = 40 });
  registry.queuePerformanceEntry({ .name = "off2", .entryType = PerformanceEntryType::MARK, .duration = 100 });
  registry.queuePerformanceEntry({ .name = "test3", .entryType = PerformanceEntryType::EVENT, .duration = 60 });

  const std::vector<PerformanceEntry> expected1 = {
      { .name = "test1", .entryType = PerformanceEntryType::EVENT, .duration = 50 },
      { .name = "test2", .entryType = PerformanceEntryType::EVENT, .duration = 100 },
      { .name = "test3", .entryType = PerformanceEntryType::EVENT, .duration = 60 },
  };

  const std::vector<PerformanceEntry> expected2 = {
      { .name = "test2", .entryType = PerformanceEntryType::EVENT, .duration = 100 }
  };

  ASSERT_EQ(expected1, observer1->takeRecords());
  ASSERT_EQ(expected2, observer2->takeRecords());

  observer1->disconnect();
  observer2->disconnect();
}