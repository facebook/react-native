/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/executors/QueuedImmediateExecutor.h>

#include "JsiIntegrationTest.h"
#include "engines/JsiIntegrationTestHermesEngineAdapter.h"

#include <jsinspector-modern/tracing/PerformanceTracer.h>

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

/**
 * A test fixture for the console.timeStamp API.
 */
class ConsoleTimeStampTest : public JsiIntegrationPortableTestBase<
                                 JsiIntegrationTestHermesEngineAdapter,
                                 folly::QueuedImmediateExecutor> {
 protected:
  size_t countNumberOfTimeStampEvents(
      tracing::PerformanceTracer& performanceTracer) {
    size_t count = 0;
    performanceTracer.collectEvents(
        [&count](const folly::dynamic& chunk) {
          auto event = chunk[0];
          if (event["name"] == "TimeStamp") {
            count++;
          }
        },
        1);
    return count;
  }
};

TEST_F(ConsoleTimeStampTest, Installed) {
  auto result = eval("typeof console.timeStamp");
  auto& runtime = engineAdapter_->getRuntime();
  EXPECT_EQ(result.asString(runtime).utf8(runtime), "function");
}

TEST_F(ConsoleTimeStampTest, RecordsEntriesWithJustLabel) {
  auto& tracer = tracing::PerformanceTracer::getInstance();
  EXPECT_TRUE(tracer.startTracing());

  eval("console.timeStamp('test-label')");

  EXPECT_TRUE(tracer.stopTracing());
  EXPECT_EQ(countNumberOfTimeStampEvents(tracer), 1);
}

TEST_F(ConsoleTimeStampTest, RecordsEntriesWithSpecifiedTimestamps) {
  auto& tracer = tracing::PerformanceTracer::getInstance();
  EXPECT_TRUE(tracer.startTracing());

  eval("console.timeStamp('test-range', 100, 200)");

  EXPECT_TRUE(tracer.stopTracing());
  EXPECT_EQ(countNumberOfTimeStampEvents(tracer), 1);
}

TEST_F(ConsoleTimeStampTest, RecordsEntriesWithMarkNames) {
  auto& tracer = tracing::PerformanceTracer::getInstance();
  EXPECT_TRUE(tracer.startTracing());

  eval(
      "console.timeStamp('test-string-timestamps', 'start-marker', 'end-marker')");

  EXPECT_TRUE(tracer.stopTracing());
  EXPECT_EQ(countNumberOfTimeStampEvents(tracer), 1);
}

TEST_F(ConsoleTimeStampTest, KeepsEntriesWithUnknownMarkNames) {
  auto& tracer = tracing::PerformanceTracer::getInstance();
  EXPECT_TRUE(tracer.startTracing());

  eval(
      "console.timeStamp('test-string-timestamps', 'start-marker', 'end-marker')");

  EXPECT_TRUE(tracer.stopTracing());
  EXPECT_EQ(countNumberOfTimeStampEvents(tracer), 1);
}

TEST_F(ConsoleTimeStampTest, DoesNotThrowIfNotTracing) {
  auto& tracer = tracing::PerformanceTracer::getInstance();
  EXPECT_FALSE(tracer.stopTracing());

  // Call console.timeStamp - should be a no-op when not tracing
  eval("console.timeStamp('test-no-tracing')");
}

TEST_F(ConsoleTimeStampTest, SurvivesInvalidArguments) {
  auto& tracer = tracing::PerformanceTracer::getInstance();
  EXPECT_TRUE(tracer.startTracing());

  // Won't be logged, no label specified.
  eval("console.timeStamp()");
  // Will be logged - undefined will be stringified.
  eval("console.timeStamp(undefined)");
  // Will be logged - function will be stringified.
  eval("console.timeStamp(() => {})");
  // Will be logged - 123 will be stringified.
  eval("console.timeStamp(123)");
  // Will be logged - start will default to an empty string.
  eval("console.timeStamp('label', {})");

  EXPECT_TRUE(tracer.stopTracing());
  EXPECT_EQ(countNumberOfTimeStampEvents(tracer), 4);
}

TEST_F(ConsoleTimeStampTest, InvalidTrackNameIsIgnored) {
  auto& tracer = tracing::PerformanceTracer::getInstance();
  EXPECT_TRUE(tracer.startTracing());

  eval("console.timeStamp('label', 0, 1, {})");

  EXPECT_TRUE(tracer.stopTracing());
  EXPECT_EQ(countNumberOfTimeStampEvents(tracer), 1);
}

TEST_F(ConsoleTimeStampTest, InvalidTrackGroupIsIgnored) {
  auto& tracer = tracing::PerformanceTracer::getInstance();
  EXPECT_TRUE(tracer.startTracing());

  eval("console.timeStamp('label', 0, 1, 'trackName', {})");

  EXPECT_TRUE(tracer.stopTracing());
  EXPECT_EQ(countNumberOfTimeStampEvents(tracer), 1);
}

TEST_F(ConsoleTimeStampTest, InvalidColorIsIgnored) {
  auto& tracer = tracing::PerformanceTracer::getInstance();
  EXPECT_TRUE(tracer.startTracing());

  eval("console.timeStamp('test', 100, 200, 'FooTrack', 'BarGroup', 'red')");

  EXPECT_TRUE(tracer.stopTracing());
  EXPECT_EQ(countNumberOfTimeStampEvents(tracer), 1);
}

} // namespace facebook::react::jsinspector_modern
