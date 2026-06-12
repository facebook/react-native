/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <string>
#include <variant>
#include <vector>

#include "../PerformanceEntry.h"
#include "../PerformanceEntryCircularBuffer.h"

namespace facebook::react {

namespace {

std::string getName(const PerformanceEntry& entry) {
  return std::visit([](const auto& data) { return data.name; }, entry);
}

std::vector<std::string> getNames(
    const std::vector<PerformanceEntry>& entries) {
  std::vector<std::string> names;
  names.reserve(entries.size());
  for (const auto& entry : entries) {
    names.push_back(getName(entry));
  }
  return names;
}

PerformanceEntry makeMark(const std::string& name) {
  return PerformanceMark{{.name = name, .startTime = HighResTimeStamp::now()}};
}

} // namespace

// Overflowing the buffer must overwrite the oldest entries and increment
// droppedEntriesCount by exactly the number of evictions (not by the number of
// adds beyond capacity at any other rate).
TEST(PerformanceEntryCircularBufferTest, AddTracksDroppedEntriesOnOverflow) {
  PerformanceEntryCircularBuffer buffer{3};

  buffer.add(makeMark("a"));
  buffer.add(makeMark("b"));
  buffer.add(makeMark("c"));

  // Filling up to capacity must not drop anything.
  EXPECT_EQ(0u, buffer.droppedEntriesCount);

  buffer.add(makeMark("d"));
  buffer.add(makeMark("e"));

  EXPECT_EQ(2u, buffer.droppedEntriesCount);

  std::vector<PerformanceEntry> entries;
  buffer.getEntries(entries);
  EXPECT_EQ((std::vector<std::string>{"c", "d", "e"}), getNames(entries));
}

// getEntries(target) must append (not replace) the buffer contents to the
// caller-provided target vector, preserving any pre-existing elements.
TEST(PerformanceEntryCircularBufferTest, GetEntriesAppendsToTarget) {
  PerformanceEntryCircularBuffer buffer{5};
  buffer.add(makeMark("x"));
  buffer.add(makeMark("y"));

  std::vector<PerformanceEntry> target;
  target.push_back(makeMark("preexisting"));

  buffer.getEntries(target);

  EXPECT_EQ(
      (std::vector<std::string>{"preexisting", "x", "y"}), getNames(target));
}

// getEntries(target, name) must only return entries matching the given name,
// even when entries of other variant types share the buffer.
TEST(PerformanceEntryCircularBufferTest, GetEntriesByNameFiltersAcrossTypes) {
  PerformanceEntryCircularBuffer buffer{10};
  buffer.add(
      PerformanceMark{{.name = "foo", .startTime = HighResTimeStamp::now()}});
  buffer.add(
      PerformanceMeasure{
          {.name = "bar", .startTime = HighResTimeStamp::now()}});
  buffer.add(
      PerformanceMark{{.name = "foo", .startTime = HighResTimeStamp::now()}});
  buffer.add(
      PerformanceLongTaskTiming{
          {.name = "foo", .startTime = HighResTimeStamp::now()}});
  buffer.add(
      PerformanceMeasure{
          {.name = "foo", .startTime = HighResTimeStamp::now()}});

  std::vector<PerformanceEntry> matches;
  buffer.getEntries(matches, "foo");

  EXPECT_EQ(4u, matches.size());
  for (const auto& entry : matches) {
    EXPECT_EQ("foo", getName(entry));
  }

  std::vector<PerformanceEntry> noMatches;
  buffer.getEntries(noMatches, "missing");
  EXPECT_TRUE(noMatches.empty());
}

// clear() must empty the buffer so a subsequent getEntries returns nothing,
// while leaving droppedEntriesCount untouched (it tracks lifetime overflow,
// not current contents).
TEST(
    PerformanceEntryCircularBufferTest,
    ClearEmptiesBufferButKeepsDroppedCount) {
  PerformanceEntryCircularBuffer buffer{2};
  buffer.add(makeMark("a"));
  buffer.add(makeMark("b"));
  buffer.add(makeMark("c")); // evicts "a"
  ASSERT_EQ(1u, buffer.droppedEntriesCount);

  buffer.clear();

  std::vector<PerformanceEntry> entries;
  buffer.getEntries(entries);
  EXPECT_TRUE(entries.empty());
  EXPECT_EQ(1u, buffer.droppedEntriesCount);

  // The buffer remains usable after clear.
  buffer.add(makeMark("d"));
  buffer.getEntries(entries);
  EXPECT_EQ((std::vector<std::string>{"d"}), getNames(entries));
}

// clear(name) must remove only entries whose name matches, regardless of
// variant type, and leave other entries (and their order) intact.
TEST(PerformanceEntryCircularBufferTest, ClearByNameRemovesOnlyMatching) {
  PerformanceEntryCircularBuffer buffer{10};
  buffer.add(
      PerformanceMark{{.name = "keep", .startTime = HighResTimeStamp::now()}});
  buffer.add(
      PerformanceMeasure{
          {.name = "drop", .startTime = HighResTimeStamp::now()}});
  buffer.add(
      PerformanceMark{{.name = "drop", .startTime = HighResTimeStamp::now()}});
  buffer.add(
      PerformanceLongTaskTiming{
          {.name = "keep", .startTime = HighResTimeStamp::now()}});
  buffer.add(
      PerformanceMeasure{
          {.name = "drop", .startTime = HighResTimeStamp::now()}});

  buffer.clear("drop");

  std::vector<PerformanceEntry> remaining;
  buffer.getEntries(remaining);
  EXPECT_EQ(2u, remaining.size());
  for (const auto& entry : remaining) {
    EXPECT_EQ("keep", getName(entry));
  }

  // Clearing a name that no longer exists is a no-op.
  buffer.clear("drop");
  remaining.clear();
  buffer.getEntries(remaining);
  EXPECT_EQ(2u, remaining.size());
}

} // namespace facebook::react
