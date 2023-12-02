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

static std::ostream& operator<<(
    std::ostream& os,
    const RawPerformanceEntry& entry) {
  static constexpr const char* entryTypeNames[] = {
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
  auto& reporter = PerformanceEntryReporter::getInstance();

  reporter.stopReporting();
  reporter.clearEntries();

  reporter.startReporting(PerformanceEntryType::MARK);
  reporter.startReporting(PerformanceEntryType::MEASURE);

  ASSERT_TRUE(reporter.isReporting(PerformanceEntryType::MARK));
  ASSERT_TRUE(reporter.isReporting(PerformanceEntryType::MEASURE));

  ASSERT_FALSE(reporter.isReporting(PerformanceEntryType::EVENT));
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestStopReporting) {
  auto& reporter = PerformanceEntryReporter::getInstance();

  reporter.stopReporting();
  reporter.clearEntries();

  reporter.startReporting(PerformanceEntryType::MARK);

  reporter.mark("mark0", 0.0);
  reporter.mark("mark1", 0.0);
  reporter.mark("mark2", 0.0);
  reporter.measure("measure0", 0.0, 0.0);

  auto res = reporter.popPendingEntries();
  const auto& entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(3, entries.size());

  res = reporter.popPendingEntries();

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(0, res.entries.size());

  reporter.stopReporting(PerformanceEntryType::MARK);
  reporter.startReporting(PerformanceEntryType::MEASURE);

  reporter.mark("mark3");
  reporter.measure("measure1", 0.0, 0.0);

  res = reporter.popPendingEntries();

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(1, res.entries.size());
  ASSERT_STREQ("measure1", res.entries[0].name.c_str());
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestReportMarks) {
  auto& reporter = PerformanceEntryReporter::getInstance();

  reporter.stopReporting();
  reporter.clearEntries();

  reporter.startReporting(PerformanceEntryType::MARK);

  reporter.mark("mark0", 0.0);
  reporter.mark("mark1", 1.0);
  reporter.mark("mark2", 2.0);

  auto res = reporter.popPendingEntries();
  const auto& entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(3, entries.size());

  const std::vector<RawPerformanceEntry> expected = {
      {"mark0",
       static_cast<int>(PerformanceEntryType::MARK),
       0.0,
       0.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"mark1",
       static_cast<int>(PerformanceEntryType::MARK),
       1.0,
       0.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"mark2",
       static_cast<int>(PerformanceEntryType::MARK),
       2.0,
       0.0,
       std::nullopt,
       std::nullopt,
       std::nullopt}};

  ASSERT_EQ(expected, entries);
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestReportMeasures) {
  auto& reporter = PerformanceEntryReporter::getInstance();

  reporter.stopReporting();
  reporter.clearEntries();

  reporter.startReporting(PerformanceEntryType::MARK);
  reporter.startReporting(PerformanceEntryType::MEASURE);

  reporter.mark("mark0", 0.0);
  reporter.mark("mark1", 1.0);
  reporter.mark("mark2", 2.0);

  reporter.measure("measure0", 0.0, 2.0);
  reporter.measure("measure1", 0.0, 2.0, 4.0);
  reporter.measure("measure2", 0.0, 0.0, std::nullopt, "mark1", "mark2");
  reporter.measure("measure3", 0.0, 0.0, 5.0, "mark1");
  reporter.measure("measure4", 1.5, 0.0, std::nullopt, std::nullopt, "mark2");

  reporter.setTimeStampProvider([]() { return 3.5; });
  reporter.measure("measure5", 0.0, 0.0, std::nullopt, "mark2");

  reporter.mark("mark3", 2.0);
  reporter.measure("measure6", 2.0, 2.0);
  reporter.mark("mark4", 2.0);

  auto res = reporter.popPendingEntries();
  const auto& entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);

  const std::vector<RawPerformanceEntry> expected = {
      {"mark0",
       static_cast<int>(PerformanceEntryType::MARK),
       0.0,
       0.0,
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
      {"mark1",
       static_cast<int>(PerformanceEntryType::MARK),
       1.0,
       0.0,
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
       std::nullopt},
      {"mark2",
       static_cast<int>(PerformanceEntryType::MARK),
       2.0,
       0.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"mark3",
       static_cast<int>(PerformanceEntryType::MARK),
       2.0,
       0.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"mark4",
       static_cast<int>(PerformanceEntryType::MARK),
       2.0,
       0.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"measure6",
       static_cast<int>(PerformanceEntryType::MEASURE),
       2.0,
       0.0,
       std::nullopt,
       std::nullopt,
       std::nullopt},
      {"measure5",
       static_cast<int>(PerformanceEntryType::MEASURE),
       2.0,
       1.5,
       std::nullopt,
       std::nullopt,
       std::nullopt},
  };

  ASSERT_EQ(expected, entries);
}

static std::vector<std::string> getNames(
    const std::vector<RawPerformanceEntry>& entries) {
  std::vector<std::string> res;
  std::transform(
      entries.begin(),
      entries.end(),
      std::back_inserter(res),
      [](const RawPerformanceEntry& e) { return e.name; });
  return res;
}

static std::vector<int32_t> getTypes(
    const std::vector<RawPerformanceEntry>& entries) {
  std::vector<int32_t> res;
  std::transform(
      entries.begin(),
      entries.end(),
      std::back_inserter(res),
      [](const RawPerformanceEntry& e) { return e.entryType; });
  return res;
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestGetEntries) {
  auto& reporter = PerformanceEntryReporter::getInstance();

  reporter.stopReporting();
  reporter.clearEntries();

  auto res = reporter.popPendingEntries();
  const auto& entries = res.entries;

  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(0, entries.size());

  reporter.startReporting(PerformanceEntryType::MARK);
  reporter.startReporting(PerformanceEntryType::MEASURE);

  reporter.mark("common_name", 0.0);
  reporter.mark("mark1", 1.0);
  reporter.mark("mark2", 2.0);

  reporter.measure("common_name", 0.0, 2.0);
  reporter.measure("measure1", 0.0, 2.0, 4.0);
  reporter.measure("measure2", 0.0, 0.0, std::nullopt, "mark1", "mark2");
  reporter.measure("measure3", 0.0, 0.0, 5.0, "mark1");
  reporter.measure("measure4", 1.5, 0.0, std::nullopt, std::nullopt, "mark2");

  res = reporter.popPendingEntries();
  ASSERT_EQ(0, res.droppedEntriesCount);
  ASSERT_EQ(8, res.entries.size());

  reporter.getEntries(PerformanceEntryType::MARK);
  const auto marks = reporter.getEntries(PerformanceEntryType::MARK);

  const auto measures = reporter.getEntries(PerformanceEntryType::MEASURE);
  const auto common_name =
      reporter.getEntries(PerformanceEntryType::UNDEFINED, "common_name");

  reporter.getEntries();
  const auto all = reporter.getEntries();

  ASSERT_EQ(std::vector<int32_t>({2, 2, 2, 2, 2}), getTypes(measures));
  ASSERT_EQ(std::vector<int32_t>({1, 2}), getTypes(common_name));
  ASSERT_EQ(std::vector<int32_t>({1, 1, 1, 2, 2, 2, 2, 2}), getTypes(all));
  ASSERT_EQ(std::vector<int32_t>({1, 1, 1}), getTypes(marks));

  ASSERT_EQ(
      std::vector<std::string>({"common_name", "mark1", "mark2"}),
      getNames(marks));

  ASSERT_EQ(
      std::vector<std::string>({"common_name", "common_name"}),
      getNames(common_name));
}

TEST(PerformanceEntryReporter, PerformanceEntryReporterTestClearEntries) {
  auto& reporter = PerformanceEntryReporter::getInstance();

  reporter.stopReporting();
  reporter.clearEntries();

  reporter.startReporting(PerformanceEntryType::MARK);
  reporter.startReporting(PerformanceEntryType::MEASURE);

  reporter.mark("common_name", 0.0);
  reporter.mark("mark1", 1.0);
  reporter.mark("mark2", 2.0);

  reporter.measure("common_name", 0.0, 2.0);
  reporter.measure("measure1", 0.0, 2.0, 4.0);
  reporter.measure("measure2", 0.0, 0.0, std::nullopt, "mark1", "mark2");
  reporter.measure("measure3", 0.0, 0.0, 5.0, "mark1");
  reporter.measure("measure4", 1.5, 0.0, std::nullopt, std::nullopt, "mark2");

  reporter.clearEntries(PerformanceEntryType::UNDEFINED, "common_name");
  auto e1 = reporter.getEntries();

  ASSERT_EQ(6, e1.size());
  ASSERT_EQ(
      std::vector<std::string>(
          {"mark1", "mark2", "measure1", "measure2", "measure3", "measure4"}),
      getNames(e1));

  reporter.clearEntries(PerformanceEntryType::MARK, "mark1");
  auto e2 = reporter.getEntries();

  ASSERT_EQ(5, e2.size());
  ASSERT_EQ(
      std::vector<std::string>(
          {"mark2", "measure1", "measure2", "measure3", "measure4"}),
      getNames(e2));

  reporter.clearEntries(PerformanceEntryType::MEASURE);
  auto e3 = reporter.getEntries();

  ASSERT_EQ(1, e3.size());
  ASSERT_EQ(std::vector<std::string>({"mark2"}), getNames(e3));

  reporter.clearEntries();
  auto e4 = reporter.getEntries();

  ASSERT_EQ(0, e4.size());
}
