/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ostream>

#include <gtest/gtest.h>

#include "../PerformanceEntryReporter.h"

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

[[maybe_unused]] static std::ostream& operator<<(
    std::ostream& os,
    const PerformanceEntry& entry) {
  static constexpr const char* entryTypeNames[] = {
      "UNDEFINED",
      "MARK",
      "MEASURE",
      "EVENT",
  };
  return os << "{ name: " << entry.name
            << ", type: " << entryTypeNames[static_cast<int>(entry.entryType)]
            << ", startTime: " << entry.startTime
            << ", duration: " << entry.duration << " }";
}
} // namespace facebook::react

using namespace facebook::react;

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestStartReporting) {
  auto reporter = PerformanceEntryReporter::getInstance();

  reporter->stopReporting();
  reporter->clearEntries();

  reporter->startReporting(PerformanceEntryType::MARK);
  reporter->startReporting(PerformanceEntryType::MEASURE);

  ASSERT_TRUE(reporter->isReporting(PerformanceEntryType::MARK));
  ASSERT_TRUE(reporter->isReporting(PerformanceEntryType::MEASURE));

  ASSERT_FALSE(reporter->isReporting(PerformanceEntryType::EVENT));
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestStopReporting) {
  auto reporter = PerformanceEntryReporter::getInstance();

  reporter->stopReporting();
  reporter->clearEntries();

  reporter->startReporting(PerformanceEntryType::MARK);

  reporter->mark("mark0", 0.0);
  reporter->mark("mark1", 0.0);
  reporter->mark("mark2", 0.0);
  reporter->measure("measure0", 0.0, 0.0);

  auto res = reporter->popPendingEntries();
  const auto& entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(3, entries.size());

  res = reporter->popPendingEntries();

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(0, res.entries.size());

  reporter->stopReporting(PerformanceEntryType::MARK);
  reporter->startReporting(PerformanceEntryType::MEASURE);

  reporter->mark("mark3");
  reporter->measure("measure1", 0.0, 0.0);

  res = reporter->popPendingEntries();

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(1, res.entries.size());
  ASSERT_STREQ("measure1", res.entries[0].name.c_str());
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestReportMarks) {
  auto reporter = PerformanceEntryReporter::getInstance();

  reporter->stopReporting();
  reporter->clearEntries();

  reporter->startReporting(PerformanceEntryType::MARK);

  reporter->mark("mark0", 0.0);
  reporter->mark("mark1", 1.0);
  reporter->mark("mark2", 2.0);
  // Report mark0 again
  reporter->mark("mark0", 3.0);

  auto res = reporter->popPendingEntries();
  const auto& entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(4, entries.size());

  const std::vector<PerformanceEntry> expected = {
      {.name = "mark0",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 0.0},
      {.name = "mark1",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 1.0},
      {.name = "mark2",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 2.0},
      {.name = "mark0",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 3.0},
  };

  ASSERT_EQ(expected, entries);
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestReportMeasures) {
  auto reporter = PerformanceEntryReporter::getInstance();

  reporter->stopReporting();
  reporter->clearEntries();

  reporter->startReporting(PerformanceEntryType::MARK);
  reporter->startReporting(PerformanceEntryType::MEASURE);

  reporter->mark("mark0", 0.0);
  reporter->mark("mark1", 1.0);
  reporter->mark("mark2", 2.0);

  reporter->measure("measure0", 0.0, 2.0);
  reporter->measure("measure1", 0.0, 2.0, 4.0);
  reporter->measure("measure2", 0.0, 0.0, std::nullopt, "mark1", "mark2");
  reporter->measure("measure3", 0.0, 0.0, 5.0, "mark1");
  reporter->measure("measure4", 1.5, 0.0, std::nullopt, std::nullopt, "mark2");

  reporter->setTimeStampProvider([]() { return 3.5; });
  reporter->measure("measure5", 0.0, 0.0, std::nullopt, "mark2");

  reporter->mark("mark3", 2.0);
  reporter->measure("measure6", 2.0, 2.0);
  reporter->mark("mark4", 2.0);
  reporter->mark("mark4", 3.0);
  // Uses the last reported time for mark4
  reporter->measure("measure7", 0.0, 0.0, std::nullopt, "mark1", "mark4");

  auto res = reporter->popPendingEntries();
  const auto& entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);

  const std::vector<PerformanceEntry> expected = {
      {.name = "mark0",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 0.0},
      {.name = "measure0",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 0.0,
       .duration = 2.0},
      {.name = "measure1",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 0.0,
       .duration = 4.0},
      {.name = "mark1",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 1.0},
      {.name = "measure2",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 1.0,
       .duration = 1.0},
      {.name = "measure7",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 1.0,
       .duration = 2.0},
      {.name = "measure3",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 1.0,
       .duration = 5.0},
      {.name = "measure4",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 1.5,
       .duration = 0.5},
      {.name = "mark2",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 2.0},
      {.name = "mark3",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 2.0},
      {.name = "mark4",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 2.0},
      {.name = "measure6",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 2.0,
       .duration = 0.0},
      {.name = "measure5",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 2.0,
       .duration = 1.5},
      {.name = "mark4",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 3.0}};

  ASSERT_EQ(expected, entries);
}

static std::vector<std::string> getNames(
    const std::vector<PerformanceEntry>& entries) {
  std::vector<std::string> res;
  std::transform(
      entries.begin(),
      entries.end(),
      std::back_inserter(res),
      [](const PerformanceEntry& e) { return e.name; });
  return res;
}

static std::vector<PerformanceEntryType> getTypes(
    const std::vector<PerformanceEntry>& entries) {
  std::vector<PerformanceEntryType> res;
  std::transform(
      entries.begin(),
      entries.end(),
      std::back_inserter(res),
      [](const PerformanceEntry& e) { return e.entryType; });
  return res;
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestGetEntries) {
  auto reporter = PerformanceEntryReporter::getInstance();

  reporter->stopReporting();
  reporter->clearEntries();

  auto res = reporter->popPendingEntries();
  const auto& entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(0, entries.size());

  reporter->startReporting(PerformanceEntryType::MARK);
  reporter->startReporting(PerformanceEntryType::MEASURE);

  reporter->mark("common_name", 0.0);
  reporter->mark("mark1", 1.0);
  reporter->mark("mark2", 2.0);

  reporter->measure("common_name", 0.0, 2.0);
  reporter->measure("measure1", 0.0, 2.0, 4.0);
  reporter->measure("measure2", 0.0, 0.0, std::nullopt, "mark1", "mark2");
  reporter->measure("measure3", 0.0, 0.0, 5.0, "mark1");
  reporter->measure("measure4", 1.5, 0.0, std::nullopt, std::nullopt, "mark2");

  res = reporter->popPendingEntries();
  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(8, res.entries.size());

  reporter->getEntries(PerformanceEntryType::MARK);
  const auto marks = reporter->getEntries(PerformanceEntryType::MARK);

  const auto measures = reporter->getEntries(PerformanceEntryType::MEASURE);
  const auto common_name = reporter->getEntries(std::nullopt, "common_name");

  reporter->getEntries();
  const auto all = reporter->getEntries();

  ASSERT_EQ(
      std::vector(
          {PerformanceEntryType::MEASURE,
           PerformanceEntryType::MEASURE,
           PerformanceEntryType::MEASURE,
           PerformanceEntryType::MEASURE,
           PerformanceEntryType::MEASURE}),
      getTypes(measures));
  ASSERT_EQ(
      std::vector({PerformanceEntryType::MARK, PerformanceEntryType::MEASURE}),
      getTypes(common_name));
  ASSERT_EQ(
      std::vector(
          {PerformanceEntryType::MARK,
           PerformanceEntryType::MARK,
           PerformanceEntryType::MARK,
           PerformanceEntryType::MEASURE,
           PerformanceEntryType::MEASURE,
           PerformanceEntryType::MEASURE,
           PerformanceEntryType::MEASURE,
           PerformanceEntryType::MEASURE}),
      getTypes(all));
  ASSERT_EQ(
      std::vector(
          {PerformanceEntryType::MARK,
           PerformanceEntryType::MARK,
           PerformanceEntryType::MARK}),
      getTypes(marks));

  ASSERT_EQ(
      std::vector<std::string>({"common_name", "mark1", "mark2"}),
      getNames(marks));

  ASSERT_EQ(
      std::vector<std::string>({"common_name", "common_name"}),
      getNames(common_name));
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestClearEntries) {
  auto reporter = PerformanceEntryReporter::getInstance();

  reporter->stopReporting();
  reporter->clearEntries();

  reporter->startReporting(PerformanceEntryType::MARK);
  reporter->startReporting(PerformanceEntryType::MEASURE);

  reporter->mark("common_name", 0.0);
  reporter->mark("mark1", 1.0);
  reporter->mark("mark2", 2.0);

  reporter->measure("common_name", 0.0, 2.0);
  reporter->measure("measure1", 0.0, 2.0, 4.0);
  reporter->measure("measure2", 0.0, 0.0, std::nullopt, "mark1", "mark2");
  reporter->measure("measure3", 0.0, 0.0, 5.0, "mark1");
  reporter->measure("measure4", 1.5, 0.0, std::nullopt, std::nullopt, "mark2");

  reporter->clearEntries(std::nullopt, "common_name");
  auto e1 = reporter->getEntries();

  ASSERT_EQ(6, e1.size());
  ASSERT_EQ(
      std::vector<std::string>(
          {"mark1", "mark2", "measure1", "measure2", "measure3", "measure4"}),
      getNames(e1));

  reporter->clearEntries(PerformanceEntryType::MARK, "mark1");
  auto e2 = reporter->getEntries();

  ASSERT_EQ(5, e2.size());
  ASSERT_EQ(
      std::vector<std::string>(
          {"mark2", "measure1", "measure2", "measure3", "measure4"}),
      getNames(e2));

  reporter->clearEntries(PerformanceEntryType::MEASURE);
  auto e3 = reporter->getEntries();

  ASSERT_EQ(1, e3.size());
  ASSERT_EQ(std::vector<std::string>({"mark2"}), getNames(e3));

  reporter->clearEntries();
  auto e4 = reporter->getEntries();

  ASSERT_EQ(0, e4.size());
}
