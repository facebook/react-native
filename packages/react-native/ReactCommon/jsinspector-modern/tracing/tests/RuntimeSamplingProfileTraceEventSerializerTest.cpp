/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/tracing/RuntimeSamplingProfileTraceEventSerializer.h>

#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include <chrono>
#include <utility>

namespace facebook::react::jsinspector_modern::tracing {

class RuntimeSamplingProfileTraceEventSerializerTest : public ::testing::Test {
 protected:
  std::vector<folly::dynamic> notificationEvents_;

  std::function<void(const folly::dynamic& traceEventsChunk)>
  createNotificationCallback() {
    return [this](const folly::dynamic& traceEventsChunk) {
      notificationEvents_.push_back(traceEventsChunk);
    };
  }

  RuntimeSamplingProfile::SampleCallStackFrame createJSCallFrame(
      std::string functionName,
      uint32_t scriptId = 1,
      std::optional<std::string> url = std::nullopt,
      std::optional<uint32_t> lineNumber = std::nullopt,
      std::optional<uint32_t> columnNumber = std::nullopt) {
    return RuntimeSamplingProfile::SampleCallStackFrame(
        RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
        scriptId,
        std::move(functionName),
        std::move(url),
        lineNumber,
        columnNumber);
  }

  RuntimeSamplingProfile::SampleCallStackFrame createGCCallFrame() {
    return RuntimeSamplingProfile::SampleCallStackFrame(
        RuntimeSamplingProfile::SampleCallStackFrame::Kind::GarbageCollector,
        0,
        "(garbage collector)");
  }

  RuntimeSamplingProfile::Sample createSample(
      uint64_t timestamp,
      uint64_t threadId,
      std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack) {
    return {timestamp, threadId, std::move(callStack)};
  }

  RuntimeSamplingProfile createEmptyProfile() {
    return {"TestRuntime", {}};
  }

  RuntimeSamplingProfile createProfileWithSamples(
      std::vector<RuntimeSamplingProfile::Sample> samples) {
    return {"TestRuntime", std::move(samples)};
  }
};

TEST_F(RuntimeSamplingProfileTraceEventSerializerTest, EmptyProfile) {
  // Setup
  auto notificationCallback = createNotificationCallback();
  RuntimeSamplingProfileTraceEventSerializer serializer(
      PerformanceTracer::getInstance(), notificationCallback, 10);

  auto profile = createEmptyProfile();
  auto tracingStartTime = std::chrono::steady_clock::now();

  // Execute
  serializer.serializeAndNotify(profile, tracingStartTime);

  // Nothing should be reported if the profile is empty.
  EXPECT_TRUE(notificationEvents_.empty());
}

TEST_F(
    RuntimeSamplingProfileTraceEventSerializerTest,
    SameCallFramesAreMerged) {
  // Setup
  auto notificationCallback = createNotificationCallback();
  RuntimeSamplingProfileTraceEventSerializer serializer(
      PerformanceTracer::getInstance(), notificationCallback, 10);

  // [     foo     ]
  // [     bar     ]
  //     [baz][(gc)]
  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack1 = {
      createJSCallFrame("bar", 1, "test.js", 20, 10),
      createJSCallFrame("foo", 1, "test.js", 10, 5),
  };

  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack2 = {
      createJSCallFrame("baz", 1, "other.js", 5, 1),
      createJSCallFrame("bar", 1, "test.js", 20, 10),
      createJSCallFrame("foo", 1, "test.js", 10, 5),
  };

  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack3 = {
      createGCCallFrame(),
      createJSCallFrame("bar", 1, "test.js", 20, 10),
      createJSCallFrame("foo", 1, "test.js", 10, 5),
  };

  uint64_t threadId = 1;
  uint64_t timestamp1 = 1000000;
  uint64_t timestamp2 = 2000000;
  uint64_t timestamp3 = 3000000;

  auto samples = std::vector<RuntimeSamplingProfile::Sample>{};
  samples.emplace_back(createSample(timestamp1, threadId, callStack1));
  samples.emplace_back(createSample(timestamp2, threadId, callStack2));
  samples.emplace_back(createSample(timestamp3, threadId, callStack3));

  auto profile = createProfileWithSamples(std::move(samples));
  auto tracingStartTime = std::chrono::steady_clock::now();

  // Execute
  serializer.serializeAndNotify(profile, tracingStartTime);

  // Verify
  ASSERT_EQ(notificationEvents_.size(), 2);
  // (root), (program), (idle), foo, bar, baz, (garbage collector)
  ASSERT_EQ(
      notificationEvents_[1][0]["args"]["data"]["cpuProfile"]["nodes"].size(),
      7);
}

TEST_F(RuntimeSamplingProfileTraceEventSerializerTest, EmptySample) {
  // Setup
  auto notificationCallback = createNotificationCallback();
  RuntimeSamplingProfileTraceEventSerializer serializer(
      PerformanceTracer::getInstance(), notificationCallback, 10);

  // Create an empty sample (no call stack)
  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> emptyCallStack;

  uint64_t threadId = 1;
  uint64_t timestamp = 1000000;

  auto samples = std::vector<RuntimeSamplingProfile::Sample>{};
  samples.emplace_back(createSample(timestamp, threadId, emptyCallStack));
  auto profile = createProfileWithSamples(std::move(samples));

  auto tracingStartTime = std::chrono::steady_clock::now();

  // Mock the performance tracer methods
  folly::dynamic profileEvent = folly::dynamic::object;
  folly::dynamic chunkEvent = folly::dynamic::object;

  // Execute
  serializer.serializeAndNotify(profile, tracingStartTime);

  // Verify
  // [["Profile"], ["ProfileChunk"]]
  ASSERT_EQ(notificationEvents_.size(), 2);
  // (root), (program), (idle)
  ASSERT_EQ(
      notificationEvents_[1][0]["args"]["data"]["cpuProfile"]["nodes"].size(),
      3);
}

TEST_F(
    RuntimeSamplingProfileTraceEventSerializerTest,
    SamplesFromDifferentThreads) {
  // Setup
  auto notificationCallback = createNotificationCallback();
  RuntimeSamplingProfileTraceEventSerializer serializer(
      PerformanceTracer::getInstance(), notificationCallback, 10);

  // Create samples with different thread IDs
  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack = {
      createJSCallFrame("foo", 1, "test.js", 10, 5)};

  uint64_t timestamp = 1000000;
  uint64_t threadId1 = 1;
  uint64_t threadId2 = 2;

  auto samples = std::vector<RuntimeSamplingProfile::Sample>{};
  samples.emplace_back(createSample(timestamp, threadId1, callStack));
  samples.emplace_back(createSample(timestamp + 1000, threadId2, callStack));
  samples.emplace_back(createSample(timestamp + 2000, threadId1, callStack));

  auto profile = createProfileWithSamples(std::move(samples));

  auto tracingStartTime = std::chrono::steady_clock::now();

  // Execute
  serializer.serializeAndNotify(profile, tracingStartTime);

  // [["Profile"], ["ProfileChunk", "ProfileChunk", "ProfileChunk]]
  // Samples from different thread should never be grouped together in the same
  // chunk.
  ASSERT_EQ(notificationEvents_.size(), 2);
  ASSERT_EQ(notificationEvents_[1].size(), 3);
}

TEST_F(
    RuntimeSamplingProfileTraceEventSerializerTest,
    TraceEventChunkSizeLimit) {
  // Setup
  auto notificationCallback = createNotificationCallback();
  uint16_t traceEventChunkSize = 2;
  uint16_t profileChunkSize = 2;
  RuntimeSamplingProfileTraceEventSerializer serializer(
      PerformanceTracer::getInstance(),
      notificationCallback,
      traceEventChunkSize,
      profileChunkSize);

  // Create multiple samples
  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack = {
      createJSCallFrame("foo", 1, "test.js", 10, 5)};

  uint64_t timestamp = 1000000;
  uint64_t threadId = 1;

  std::vector<RuntimeSamplingProfile::Sample> samples;
  samples.reserve(5);
  for (int i = 0; i < 5; i++) {
    samples.push_back(createSample(timestamp + i * 1000, threadId, callStack));
  }

  auto profile = createProfileWithSamples(std::move(samples));
  auto tracingStartTime = std::chrono::steady_clock::now();

  // Execute
  serializer.serializeAndNotify(profile, tracingStartTime);

  // [["Profile"], ["ProfileChunk", "ProfileChunk"], ["ProfileChunk"]]
  ASSERT_EQ(notificationEvents_.size(), 3);

  // Check that each chunk has at most traceEventChunkSize events
  for (size_t i = 1; i < notificationEvents_.size(); i++) {
    EXPECT_LE(notificationEvents_[i].size(), traceEventChunkSize);
  }
}

TEST_F(RuntimeSamplingProfileTraceEventSerializerTest, ProfileChunkSizeLimit) {
  // Setup
  auto notificationCallback = createNotificationCallback();
  // Set a small profile chunk size to test profile chunking
  uint16_t traceEventChunkSize = 10;
  uint16_t profileChunkSize = 2;
  double samplesCount = 5;
  RuntimeSamplingProfileTraceEventSerializer serializer(
      PerformanceTracer::getInstance(),
      notificationCallback,
      traceEventChunkSize,
      profileChunkSize);

  // Create multiple samples
  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack = {
      createJSCallFrame("foo", 1, "test.js", 10, 5)};

  uint64_t timestamp = 1000000;
  uint64_t threadId = 1;

  std::vector<RuntimeSamplingProfile::Sample> samples;
  samples.reserve(samplesCount);
  for (int i = 0; i < samplesCount; i++) {
    samples.push_back(createSample(timestamp + i * 1000, threadId, callStack));
  }

  auto profile = createProfileWithSamples(std::move(samples));
  auto tracingStartTime = std::chrono::steady_clock::now();

  // Execute
  serializer.serializeAndNotify(profile, tracingStartTime);

  // [["Profile"], ["ProfileChunk", "ProfileChunk", "ProfileChunk"]]
  ASSERT_EQ(notificationEvents_.size(), 2);
  ASSERT_EQ(
      notificationEvents_[1].size(),
      std::ceil(samplesCount / profileChunkSize));

  for (auto& profileChunk : notificationEvents_[1]) {
    EXPECT_LE(
        profileChunk["args"]["data"]["cpuProfile"]["samples"].size(),
        profileChunkSize);
  }
}

} // namespace facebook::react::jsinspector_modern::tracing
