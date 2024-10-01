/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ostream>

#include <gtest/gtest.h>

#include "../PerformanceEntryReporter.h"

using namespace facebook::react;

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
      "PerformanceEntryType::UNDEFINED",
      "PerformanceEntryType::MARK",
      "PerformanceEntryType::MEASURE",
      "PerformanceEntryType::EVENT",
  };
  return os << "{ .name = \"" << entry.name << "\"" << ", .entryType = "
            << entryTypeNames[static_cast<int>(entry.entryType)]
            << ", .startTime = " << entry.startTime
            << ", .duration = " << entry.duration << " }";
}
} // namespace facebook::react

namespace {
std::vector<PerformanceEntry> toSorted(
    std::vector<PerformanceEntry>&& entries) {
  std::stable_sort(entries.begin(), entries.end(), PerformanceEntrySorter{});
  return entries;
}
} // namespace

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestReportMarks) {
  auto reporter = PerformanceEntryReporter::getInstance();

  reporter->clearEntries();

  reporter->reportMark("mark0", 0);
  reporter->reportMark("mark1", 1);
  reporter->reportMark("mark2", 2);
  // Report mark0 again
  reporter->reportMark("mark0", 3);

  const auto entries = toSorted(reporter->getEntries());

  ASSERT_EQ(4, entries.size());

  const std::vector<PerformanceEntry> expected = {
      {.name = "mark0",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 0,
       .duration = 0},
      {.name = "mark1",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 1,
       .duration = 0},
      {.name = "mark2",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 2,
       .duration = 0},
      {.name = "mark0",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 3,
       .duration = 0}};

  ASSERT_EQ(expected, entries);
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestReportMeasures) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  reporter->reportMark("mark0", 0);
  reporter->reportMark("mark1", 1);
  reporter->reportMark("mark2", 2);

  reporter->reportMeasure("measure0", 0, 2);
  reporter->reportMeasure("measure1", 0, 2, 4);
  reporter->reportMeasure("measure2", 0, 0, std::nullopt, "mark1", "mark2");
  reporter->reportMeasure("measure3", 0, 0, 5, "mark1");
  reporter->reportMeasure(
      "measure4", 1.5, 0, std::nullopt, std::nullopt, "mark2");

  reporter->setTimeStampProvider([]() { return 3.5; });
  reporter->reportMeasure("measure5", 0, 0, std::nullopt, "mark2");

  reporter->reportMark("mark3", 2.5);
  reporter->reportMeasure("measure6", 2.0, 2.0);
  reporter->reportMark("mark4", 2.1);
  reporter->reportMark("mark4", 3.0);
  // Uses the last reported time for mark4
  reporter->reportMeasure("measure7", 0, 0, std::nullopt, "mark1", "mark4");

  const auto entries = toSorted(reporter->getEntries());

  const std::vector<PerformanceEntry> expected = {
      {.name = "mark0",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 0,
       .duration = 0},
      {.name = "measure0",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 0,
       .duration = 2},
      {.name = "measure1",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 0,
       .duration = 4},
      {.name = "mark1",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 1,
       .duration = 0},
      {.name = "measure2",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 1,
       .duration = 1},
      {.name = "measure7",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 1,
       .duration = 2},
      {.name = "measure3",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 1,
       .duration = 5},
      {.name = "measure4",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 1.5,
       .duration = 0.5},
      {.name = "mark2",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 2,
       .duration = 0},
      {.name = "measure6",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 2,
       .duration = 0},
      {.name = "measure5",
       .entryType = PerformanceEntryType::MEASURE,
       .startTime = 2,
       .duration = 1.5},
      {.name = "mark4",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 2.1,
       .duration = 0},
      {.name = "mark3",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 2.5,
       .duration = 0},
      {.name = "mark4",
       .entryType = PerformanceEntryType::MARK,
       .startTime = 3,
       .duration = 0}};

  ASSERT_EQ(expected, entries);
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestGetEntries) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  {
    const auto entries = reporter->getEntries();
    ASSERT_EQ(0, entries.size());
  }

  reporter->reportMark("common_name", 0);
  reporter->reportMark("mark1", 1);
  reporter->reportMark("mark2", 2);

  reporter->reportMeasure("common_name", 0, 2);
  reporter->reportMeasure("measure1", 0, 2, 4);
  reporter->reportMeasure("measure2", 0, 0, std::nullopt, "mark1", "mark2");
  reporter->reportMeasure("measure3", 0, 0, 5, "mark1");
  reporter->reportMeasure(
      "measure4", 1.5, 0, std::nullopt, std::nullopt, "mark2");

  {
    const auto allEntries = toSorted(reporter->getEntries());
    const std::vector<PerformanceEntry> expected = {
        {.name = "common_name",
         .entryType = PerformanceEntryType::MARK,
         .startTime = 0,
         .duration = 0},
        {.name = "common_name",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 0,
         .duration = 2},
        {.name = "measure1",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 0,
         .duration = 4},
        {.name = "mark1",
         .entryType = PerformanceEntryType::MARK,
         .startTime = 1,
         .duration = 0},
        {.name = "measure2",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 1,
         .duration = 1},
        {.name = "measure3",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 1,
         .duration = 5},
        {.name = "measure4",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 1.5,
         .duration = 0.5},
        {.name = "mark2",
         .entryType = PerformanceEntryType::MARK,
         .startTime = 2,
         .duration = 0}};
    ASSERT_EQ(expected, allEntries);
  }

  {
    const auto marks =
        toSorted(reporter->getEntries(PerformanceEntryType::MARK));
    const std::vector<PerformanceEntry> expected = {
        {.name = "common_name",
         .entryType = PerformanceEntryType::MARK,
         .startTime = 0,
         .duration = 0},
        {.name = "mark1",
         .entryType = PerformanceEntryType::MARK,
         .startTime = 1,
         .duration = 0},
        {.name = "mark2",
         .entryType = PerformanceEntryType::MARK,
         .startTime = 2,
         .duration = 0}};
    ASSERT_EQ(expected, marks);
  }

  {
    const auto measures =
        toSorted(reporter->getEntries(PerformanceEntryType::MEASURE));
    const std::vector<PerformanceEntry> expected = {
        {.name = "common_name",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 0,
         .duration = 2},
        {.name = "measure1",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 0,
         .duration = 4},
        {.name = "measure2",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 1,
         .duration = 1},
        {.name = "measure3",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 1,
         .duration = 5},
        {.name = "measure4",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 1.5,
         .duration = 0.5}};
    ASSERT_EQ(expected, measures);
  }

  {
    const std::vector<PerformanceEntry> expected = {
        {.name = "common_name",
         .entryType = PerformanceEntryType::MARK,
         .startTime = 0}};
    const auto commonName =
        reporter->getEntries(PerformanceEntryType::MARK, "common_name");
    ASSERT_EQ(expected, commonName);
  }

  {
    const std::vector<PerformanceEntry> expected = {
        {.name = "common_name",
         .entryType = PerformanceEntryType::MEASURE,
         .startTime = 0,
         .duration = 2}};
    const auto commonName =
        reporter->getEntries(PerformanceEntryType::MEASURE, "common_name");
    ASSERT_EQ(expected, commonName);
  }
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestClearMarks) {
  auto reporter = PerformanceEntryReporter::getInstance();
  reporter->clearEntries();

  reporter->reportMark("common_name", 0);
  reporter->reportMark("mark1", 1);
  reporter->reportMark("mark1", 2.1);
  reporter->reportMark("mark2", 2);

  reporter->reportMeasure("common_name", 0, 2);
  reporter->reportMeasure("measure1", 0, 2, 4);
  reporter->reportMeasure("measure2", 0, 0, std::nullopt, "mark1", "mark2");
  reporter->reportMeasure("measure3", 0, 0, 5, "mark1");
  reporter->reportMeasure(
      "measure4", 1.5, 0, std::nullopt, std::nullopt, "mark2");

  reporter->clearEntries(PerformanceEntryType::MARK, "common_name");

  {
    auto entries = toSorted(reporter->getEntries(PerformanceEntryType::MARK));
    std::vector<PerformanceEntry> expected = {
        {.name = "mark1",
         .entryType = PerformanceEntryType::MARK,
         .startTime = 1,
         .duration = 0},
        {.name = "mark2",
         .entryType = PerformanceEntryType::MARK,
         .startTime = 2,
         .duration = 0},
        {.name = "mark1",
         .entryType = PerformanceEntryType::MARK,
         .startTime = 2.1,
         .duration = 0},
    };
    ASSERT_EQ(expected, entries);
  }

  reporter->clearEntries(PerformanceEntryType::MARK);

  {
    auto entries = reporter->getEntries(PerformanceEntryType::MARK);
    ASSERT_EQ(entries.size(), 0);
  }

  reporter->clearEntries();

  {
    auto entries = reporter->getEntries();
    ASSERT_EQ(entries.size(), 0);
  }
}
