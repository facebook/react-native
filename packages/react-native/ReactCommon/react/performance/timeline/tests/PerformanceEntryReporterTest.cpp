/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ostream>

#include <gtest/gtest.h>

#include "../PerformanceEntryReporter.h"

#include <variant>

using namespace facebook::react;

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

[[maybe_unused]] static std::ostream& operator<<(
    std::ostream& os,
    const PerformanceEntry& entry) {
  static constexpr const char* entryTypeNames[] = {
      "PerformanceEntryType::UNDEFINED",
      "PerformanceEntryType::MARK",
      "PerformanceEntryType::MEASURE",
      "PerformanceEntryType::EVENT",
      "PerformanceEntryType::RESOURCE",
  };

  return std::visit(
      [&](const auto& entryDetails) -> std::ostream& {
        os << "{ .name = \"" << entryDetails.name << "\"" << ", .entryType = "
           << entryTypeNames[static_cast<int>(entryDetails.entryType) - 1]
           << ", .startTime = " << entryDetails.startTime
           << ", .duration = " << entryDetails.duration << " }";
        return os;
      },
      entry);
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
      PerformanceMark{{.name = "mark0", .startTime = 0, .duration = 0}},
      PerformanceMark{{.name = "mark1", .startTime = 1, .duration = 0}},
      PerformanceMark{{.name = "mark2", .startTime = 2, .duration = 0}},
      PerformanceMark{{.name = "mark0", .startTime = 3, .duration = 0}}};

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
      PerformanceMark{{.name = "mark0", .startTime = 0, .duration = 0}},
      PerformanceMeasure{{.name = "measure0", .startTime = 0, .duration = 2}},
      PerformanceMeasure{{.name = "measure1", .startTime = 0, .duration = 4}},
      PerformanceMark{{.name = "mark1", .startTime = 1, .duration = 0}},
      PerformanceMeasure{{.name = "measure2", .startTime = 1, .duration = 1}},
      PerformanceMeasure{{.name = "measure7", .startTime = 1, .duration = 2}},
      PerformanceMeasure{{.name = "measure3", .startTime = 1, .duration = 5}},
      PerformanceMeasure{
          {.name = "measure4", .startTime = 1.5, .duration = 0.5}},
      PerformanceMark{{.name = "mark2", .startTime = 2, .duration = 0}},
      PerformanceMeasure{{.name = "measure6", .startTime = 2, .duration = 0}},
      PerformanceMeasure{{.name = "measure5", .startTime = 2, .duration = 1.5}},
      PerformanceMark{{.name = "mark4", .startTime = 2.1, .duration = 0}},
      PerformanceMark{{.name = "mark3", .startTime = 2.5, .duration = 0}},
      PerformanceMark{{.name = "mark4", .startTime = 3, .duration = 0}}};

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
        PerformanceMark{{.name = "common_name", .startTime = 0, .duration = 0}},
        PerformanceMeasure{
            {.name = "common_name", .startTime = 0, .duration = 2}},
        PerformanceMeasure{{.name = "measure1", .startTime = 0, .duration = 4}},
        PerformanceMark{{.name = "mark1", .startTime = 1, .duration = 0}},
        PerformanceMeasure{{.name = "measure2", .startTime = 1, .duration = 1}},
        PerformanceMeasure{{.name = "measure3", .startTime = 1, .duration = 5}},
        PerformanceMeasure{
            {.name = "measure4", .startTime = 1.5, .duration = 0.5}},
        PerformanceMark{{.name = "mark2", .startTime = 2, .duration = 0}}};
    ASSERT_EQ(expected, allEntries);
  }

  {
    const auto marks =
        toSorted(reporter->getEntries(PerformanceEntryType::MARK));
    const std::vector<PerformanceEntry> expected = {
        PerformanceMark{{.name = "common_name", .startTime = 0, .duration = 0}},
        PerformanceMark{{.name = "mark1", .startTime = 1, .duration = 0}},
        PerformanceMark{{.name = "mark2", .startTime = 2, .duration = 0}}};
    ASSERT_EQ(expected, marks);
  }

  {
    const auto measures =
        toSorted(reporter->getEntries(PerformanceEntryType::MEASURE));
    const std::vector<PerformanceEntry> expected = {
        PerformanceMeasure{
            {.name = "common_name", .startTime = 0, .duration = 2}},
        PerformanceMeasure{{.name = "measure1", .startTime = 0, .duration = 4}},
        PerformanceMeasure{{.name = "measure2", .startTime = 1, .duration = 1}},
        PerformanceMeasure{{.name = "measure3", .startTime = 1, .duration = 5}},
        PerformanceMeasure{
            {.name = "measure4", .startTime = 1.5, .duration = 0.5}}};
    ASSERT_EQ(expected, measures);
  }

  {
    const std::vector<PerformanceEntry> expected = {
        PerformanceMark{{.name = "common_name", .startTime = 0}}};
    const auto commonName =
        reporter->getEntries(PerformanceEntryType::MARK, "common_name");
    ASSERT_EQ(expected, commonName);
  }

  {
    const std::vector<PerformanceEntry> expected = {PerformanceMeasure{
        {.name = "common_name", .startTime = 0, .duration = 2}}};
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
        PerformanceMark{{.name = "mark1", .startTime = 1, .duration = 0}},
        PerformanceMark{{.name = "mark2", .startTime = 2, .duration = 0}},
        PerformanceMark{{.name = "mark1", .startTime = 2.1, .duration = 0}},
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
