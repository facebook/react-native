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
static std::ostream &operator<<(
    std::ostream &os,
    const RawPerformanceEntry &entry) {
  static constexpr const char *entryTypeNames[] = {
      "UNDEFINED",
      "MARK",
      "MEASURE",
      "EVENT",
  };
  return os << "{ name: " << entry.name
            << ", type: " << entryTypeNames[entry.entryType]
            << ", startTime: " << entry.startTime
            << ", duration: " << entry.duration << " }";
}
} // namespace facebook::react

using namespace facebook::react;

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestStartReporting) {
  auto &reporter = PerformanceEntryReporter::getInstance();

  reporter.stopReporting();
  reporter.clearEntries();

  reporter.startReporting(PerformanceEntryType::MARK);
  reporter.startReporting(PerformanceEntryType::MEASURE);

  ASSERT_TRUE(reporter.isReporting(PerformanceEntryType::MARK));
  ASSERT_TRUE(reporter.isReporting(PerformanceEntryType::MEASURE));

  ASSERT_FALSE(reporter.isReporting(PerformanceEntryType::EVENT));
  ASSERT_FALSE(reporter.isReportingEvents());
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestStopReporting) {
  auto &reporter = PerformanceEntryReporter::getInstance();

  reporter.stopReporting();
  reporter.clearEntries();

  reporter.startReporting(PerformanceEntryType::MARK);

  reporter.mark("mark0", 0.0, 0.0);
  reporter.mark("mark1", 0.0, 0.0);
  reporter.mark("mark2", 0.0, 0.0);
  reporter.measure("measure0", 0.0, 0.0);

  auto res = reporter.popPendingEntries();
  const auto &entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(3, entries.size());

  res = reporter.popPendingEntries();

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(0, res.entries.size());

  reporter.stopReporting(PerformanceEntryType::MARK);
  reporter.startReporting(PerformanceEntryType::MEASURE);

  reporter.mark("mark3", 0.0, 0.0);
  reporter.measure("measure1", 0.0, 0.0);

  res = reporter.popPendingEntries();

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(1, res.entries.size());
  ASSERT_STREQ("measure1", res.entries[0].name.c_str());
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestReportMarks) {
  auto &reporter = PerformanceEntryReporter::getInstance();

  reporter.stopReporting();
  reporter.clearEntries();

  reporter.startReporting(PerformanceEntryType::MARK);

  reporter.mark("mark0", 0.0, 1.0);
  reporter.mark("mark1", 1.0, 3.0);
  reporter.mark("mark2", 2.0, 4.0);

  auto res = reporter.popPendingEntries();
  const auto &entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(3, entries.size());

  const std::vector<RawPerformanceEntry> expected = {
      {"mark0",
       static_cast<int>(PerformanceEntryType::MARK),
       0.0,
       1.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"mark1",
       static_cast<int>(PerformanceEntryType::MARK),
       1.0,
       3.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"mark2",
       static_cast<int>(PerformanceEntryType::MARK),
       2.0,
       4.0,
       std::nullopt,
       std::nullopt,
       std::nullopt}};

  ASSERT_EQ(expected, entries);
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestReportMeasures) {
  auto &reporter = PerformanceEntryReporter::getInstance();

  reporter.stopReporting();
  reporter.clearEntries();

  reporter.startReporting(PerformanceEntryType::MARK);
  reporter.startReporting(PerformanceEntryType::MEASURE);

  reporter.mark("mark0", 0.0, 1.0);
  reporter.mark("mark1", 1.0, 3.0);
  reporter.mark("mark2", 2.0, 4.0);

  reporter.measure("measure0", 0.0, 2.0);
  reporter.measure("measure1", 0.0, 2.0, 4.0);
  reporter.measure("measure2", 0.0, 0.0, std::nullopt, "mark1", "mark2");
  reporter.measure("measure3", 0.0, 0.0, 5.0, "mark1");
  reporter.measure("measure4", 1.5, 0.0, std::nullopt, std::nullopt, "mark2");

  auto res = reporter.popPendingEntries();
  const auto &entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);

  ASSERT_STREQ("mark0", entries[0].name.c_str());
  ASSERT_STREQ("mark1", entries[1].name.c_str());
  ASSERT_STREQ("mark2", entries[2].name.c_str());
  ASSERT_STREQ("measure0", entries[3].name.c_str());
  ASSERT_STREQ("measure1", entries[4].name.c_str());
  ASSERT_STREQ("measure2", entries[5].name.c_str());
  ASSERT_STREQ("measure3", entries[6].name.c_str());
  ASSERT_STREQ("measure4", entries[7].name.c_str());

  ASSERT_EQ(8, entries.size());

  const std::vector<RawPerformanceEntry> expected = {
      {"mark0",
       static_cast<int>(PerformanceEntryType::MARK),
       0.0,
       1.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"mark1",
       static_cast<int>(PerformanceEntryType::MARK),
       1.0,
       3.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"mark2",
       static_cast<int>(PerformanceEntryType::MARK),
       2.0,
       4.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"measure0",
       static_cast<int>(PerformanceEntryType::MEASURE),
       0.0,
       2.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"measure1",
       static_cast<int>(PerformanceEntryType::MEASURE),
       0.0,
       4.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"measure2",
       static_cast<int>(PerformanceEntryType::MEASURE),
       1.0,
       1.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"measure3",
       static_cast<int>(PerformanceEntryType::MEASURE),
       1.0,
       5.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"measure4",
       static_cast<int>(PerformanceEntryType::MEASURE),
       1.5,
       0.5,
       std::nullopt,
       std::nullopt,
       std::nullopt}};

  ASSERT_EQ(expected, entries);
}
