/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/tracing/TimeWindowedBuffer.h>

#include <gmock/gmock.h>
#include <gtest/gtest.h>

namespace facebook::react::jsinspector_modern::tracing {

// Test structure with timestamp field
struct TestEvent {
  int value;
  HighResTimeStamp timestamp;

  bool operator==(const TestEvent& other) const {
    return value == other.value;
  }
};

// ============================================================================
// Tests for unbounded buffer (no timestamp accessor)
// ============================================================================

TEST(TimeWindowedBufferTest, DefaultConstructorCreatesEmptyBuffer) {
  TimeWindowedBuffer<int> buffer;
  auto result = buffer.pruneExpiredAndExtract();
  EXPECT_EQ(result.size(), 0u);
}

TEST(TimeWindowedBufferTest, PushAddsElementsToUnboundedBuffer) {
  TimeWindowedBuffer<int> buffer;
  buffer.push(1);
  buffer.push(2);
  buffer.push(3);

  auto result = buffer.pruneExpiredAndExtract();
  EXPECT_EQ(result.size(), 3u);
  EXPECT_EQ(result[0], 1);
  EXPECT_EQ(result[1], 2);
  EXPECT_EQ(result[2], 3);
}

TEST(TimeWindowedBufferTest, UnboundedBufferPreservesAllElements) {
  TimeWindowedBuffer<int> buffer;
  for (int i = 0; i < 100; ++i) {
    buffer.push(i);
  }

  auto result = buffer.pruneExpiredAndExtract();
  EXPECT_EQ(result.size(), 100u);
  for (int i = 0; i < 100; ++i) {
    EXPECT_EQ(result[i], i);
  }
}

TEST(TimeWindowedBufferTest, ClearEmptiesBuffer) {
  TimeWindowedBuffer<int> buffer;
  buffer.push(1);
  buffer.push(2);
  buffer.push(3);

  buffer.clear();

  auto result = buffer.pruneExpiredAndExtract();
  EXPECT_EQ(result.size(), 0u);
}

TEST(TimeWindowedBufferTest, PushRvalueReference) {
  TimeWindowedBuffer<std::string> buffer;
  std::string str = "test";
  buffer.push(std::move(str));

  auto result = buffer.pruneExpiredAndExtract();
  EXPECT_EQ(result.size(), 1u);
  EXPECT_EQ(result[0], "test");
}

// ============================================================================
// Tests for time-windowed buffer (with timestamp accessor)
// ============================================================================

TEST(TimeWindowedBufferTest, TimeWindowedBufferCreation) {
  auto timestampAccessor = [](const TestEvent& e) { return e.timestamp; };
  auto windowSize = HighResDuration::fromMilliseconds(100);

  TimeWindowedBuffer<TestEvent> buffer(timestampAccessor, windowSize);

  auto result = buffer.pruneExpiredAndExtract();
  EXPECT_EQ(result.size(), 0u);
}

TEST(TimeWindowedBufferTest, TimeWindowedBufferAddsElements) {
  auto timestampAccessor = [](const TestEvent& e) { return e.timestamp; };
  auto windowSize = HighResDuration::fromMilliseconds(1000);

  TimeWindowedBuffer<TestEvent> buffer(timestampAccessor, windowSize);

  auto baseTime = HighResTimeStamp::now();
  buffer.push(TestEvent{.value = 1, .timestamp = baseTime});
  buffer.push(
      TestEvent{
          .value = 2,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(100)});

  auto result = buffer.pruneExpiredAndExtract(baseTime + windowSize);
  EXPECT_EQ(result.size(), 2u);
  EXPECT_EQ(result[0].value, 1);
  EXPECT_EQ(result[1].value, 2);
}

TEST(TimeWindowedBufferTest, ElementsWithinWindowArePreserved) {
  auto timestampAccessor = [](const TestEvent& e) { return e.timestamp; };
  auto windowSize = HighResDuration::fromMilliseconds(500);

  TimeWindowedBuffer<TestEvent> buffer(timestampAccessor, windowSize);

  auto baseTime = HighResTimeStamp::now();
  buffer.push(TestEvent{.value = 1, .timestamp = baseTime});
  buffer.push(
      TestEvent{
          .value = 2,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(100)});
  buffer.push(
      TestEvent{
          .value = 3,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(200)});
  buffer.push(
      TestEvent{
          .value = 4,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(300)});

  // Extract with window [300ms, 800ms] - only event at 300ms should be included
  auto result = buffer.pruneExpiredAndExtract(
      baseTime + HighResDuration::fromMilliseconds(800));
  EXPECT_EQ(result.size(), 1u);
  EXPECT_EQ(result[0].value, 4);
}

TEST(TimeWindowedBufferTest, BufferSwitchingWhenWindowExceeded) {
  auto timestampAccessor = [](const TestEvent& e) { return e.timestamp; };
  auto windowSize = HighResDuration::fromMilliseconds(100);

  TimeWindowedBuffer<TestEvent> buffer(timestampAccessor, windowSize);

  auto baseTime = HighResTimeStamp::now();

  // Add events within first window
  buffer.push(TestEvent{.value = 1, .timestamp = baseTime});
  buffer.push(
      TestEvent{
          .value = 2,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(50)});

  // Add event that exceeds the window - should trigger buffer switch
  buffer.push(
      TestEvent{
          .value = 3,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(150)});

  // Extract events within the window using reference point at 250ms
  auto result = buffer.pruneExpiredAndExtract(
      baseTime + HighResDuration::fromMilliseconds(250));

  // Events from 150ms should be in the window (250 - 100 = 150)
  EXPECT_GE(result.size(), 1u);
}

TEST(TimeWindowedBufferTest, PruneExpiredFiltersOldElements) {
  auto timestampAccessor = [](const TestEvent& e) { return e.timestamp; };
  auto windowSize = HighResDuration::fromMilliseconds(100);

  TimeWindowedBuffer<TestEvent> buffer(timestampAccessor, windowSize);

  auto baseTime = HighResTimeStamp::now();

  // Add events in first window
  buffer.push(TestEvent{.value = 1, .timestamp = baseTime});
  buffer.push(
      TestEvent{
          .value = 2,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(50)});

  // Move to second window
  buffer.push(
      TestEvent{
          .value = 3,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(150)});

  // Move to third window
  buffer.push(
      TestEvent{
          .value = 4,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(300)});

  // Extract with reference at 300ms: window is [200ms, 300ms]
  // Only event 4 at 300ms should be within window
  auto result = buffer.pruneExpiredAndExtract(
      baseTime + HighResDuration::fromMilliseconds(300));

  EXPECT_EQ(result.size(), 1u);
  EXPECT_EQ(result[0].value, 4);
}

TEST(TimeWindowedBufferTest, OutOfOrderTimestampsAreHandled) {
  auto timestampAccessor = [](const TestEvent& e) { return e.timestamp; };
  auto windowSize = HighResDuration::fromMilliseconds(10000);

  TimeWindowedBuffer<TestEvent> buffer(timestampAccessor, windowSize);

  auto baseTime = HighResTimeStamp::now();

  // Add events out of order (by timestamp)
  buffer.push(
      TestEvent{
          .value = 1,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(100)});
  buffer.push(
      TestEvent{.value = 2, .timestamp = baseTime}); // Earlier timestamp
  buffer.push(
      TestEvent{
          .value = 3,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(200)});

  // Extract with window [200ms, 10200ms] - only event at 200ms should be
  // included
  auto result = buffer.pruneExpiredAndExtract(
      baseTime + HighResDuration::fromMilliseconds(10200));
  EXPECT_EQ(result.size(), 1u);
  EXPECT_EQ(result[0].value, 3);
}

TEST(TimeWindowedBufferTest, ClearResetsTimeWindowedBuffer) {
  auto timestampAccessor = [](const TestEvent& e) { return e.timestamp; };
  auto windowSize = HighResDuration::fromMilliseconds(100);

  TimeWindowedBuffer<TestEvent> buffer(timestampAccessor, windowSize);

  auto baseTime = HighResTimeStamp::now();
  buffer.push(TestEvent{.value = 1, .timestamp = baseTime});
  buffer.push(
      TestEvent{
          .value = 2,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(200)});

  buffer.clear();

  auto result = buffer.pruneExpiredAndExtract();
  EXPECT_EQ(result.size(), 0u);
}

// ============================================================================
// Tests for edge cases
// ============================================================================

TEST(TimeWindowedBufferTest, SingleElementBuffer) {
  TimeWindowedBuffer<int> buffer;
  buffer.push(42);

  auto result = buffer.pruneExpiredAndExtract();
  EXPECT_EQ(result.size(), 1u);
  EXPECT_EQ(result[0], 42);
}

TEST(TimeWindowedBufferTest, LargeNumberOfElements) {
  TimeWindowedBuffer<int> buffer;

  const int count = 10000;
  for (int i = 0; i < count; ++i) {
    buffer.push(i);
  }

  auto result = buffer.pruneExpiredAndExtract();
  EXPECT_EQ(result.size(), static_cast<size_t>(count));
  EXPECT_EQ(result[0], 0);
  EXPECT_EQ(result[count - 1], count - 1);
}

TEST(TimeWindowedBufferTest, VerySmallTimeWindow) {
  auto timestampAccessor = [](const TestEvent& e) { return e.timestamp; };
  auto windowSize = HighResDuration::fromNanoseconds(1000);

  TimeWindowedBuffer<TestEvent> buffer(timestampAccessor, windowSize);

  auto baseTime = HighResTimeStamp::now();
  buffer.push(TestEvent{.value = 1, .timestamp = baseTime});

  // Next event with significant time difference should trigger switch
  buffer.push(
      TestEvent{
          .value = 2,
          .timestamp = baseTime + HighResDuration::fromMilliseconds(1)});

  auto result = buffer.pruneExpiredAndExtract(
      baseTime + HighResDuration::fromMilliseconds(1));
  EXPECT_GE(result.size(), 1u);
}

TEST(TimeWindowedBufferTest, VeryLargeTimeWindow) {
  auto timestampAccessor = [](const TestEvent& e) { return e.timestamp; };
  auto windowSize = HighResDuration::fromMilliseconds(3600000); // 1 hour

  TimeWindowedBuffer<TestEvent> buffer(timestampAccessor, windowSize);

  auto baseTime = HighResTimeStamp::now();

  // Add many events spread over time
  for (int i = 0; i < 100; ++i) {
    buffer.push(
        TestEvent{
            .value = i,
            .timestamp =
                baseTime + HighResDuration::fromMilliseconds(i * 10000)});
  }

  // All events should still be in the window
  auto result = buffer.pruneExpiredAndExtract(
      baseTime + HighResDuration::fromMilliseconds(100 * 10000));
  EXPECT_EQ(result.size(), 100u);
}

// ============================================================================
// Tests for complex types
// ============================================================================

TEST(TimeWindowedBufferTest, WorksWithComplexTypes) {
  struct ComplexType {
    std::string name;
    std::vector<int> data;
    HighResTimeStamp timestamp;
  };

  auto timestampAccessor = [](const ComplexType& e) { return e.timestamp; };
  auto windowSize = HighResDuration::fromMilliseconds(1000);

  TimeWindowedBuffer<ComplexType> buffer(timestampAccessor, windowSize);

  auto baseTime = HighResTimeStamp::now();
  buffer.push(
      ComplexType{.name = "test", .data = {1, 2, 3}, .timestamp = baseTime});

  auto result = buffer.pruneExpiredAndExtract();
  EXPECT_EQ(result.size(), 1u);
  EXPECT_EQ(result[0].name, "test");
  EXPECT_EQ(result[0].data.size(), 3u);
}

} // namespace facebook::react::jsinspector_modern::tracing
