/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/tracing/RuntimeSamplingProfileTraceEventSerializer.h>
#include <jsinspector-modern/tracing/Timing.h>

#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include <utility>

namespace facebook::react::jsinspector_modern::tracing {

class RuntimeSamplingProfileTraceEventSerializerTest : public ::testing::Test {
 protected:
  std::vector<folly::dynamic> notificationEvents_;

  std::function<void(folly::dynamic&& traceEventsChunk)>
  createNotificationCallback() {
    return [this](folly::dynamic&& traceEventsChunk) {
      notificationEvents_.push_back(traceEventsChunk);
    };
  }

  RuntimeSamplingProfile::SampleCallStackFrame createJSCallFrame(
      std::string_view functionName,
      uint32_t scriptId = 1,
      std::optional<std::string_view> url = std::nullopt,
      std::optional<uint32_t> lineNumber = std::nullopt,
      std::optional<uint32_t> columnNumber = std::nullopt) {
    return RuntimeSamplingProfile::SampleCallStackFrame(
        RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
        scriptId,
        functionName,
        url,
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
      ThreadId threadId,
      std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack) {
    return {timestamp, threadId, std::move(callStack)};
  }

  RuntimeSamplingProfile createEmptyProfile() {
    return {"TestRuntime", 1, {}, {}};
  }

  RuntimeSamplingProfile createProfileWithSamples(
      std::vector<RuntimeSamplingProfile::Sample> samples) {
    return {"TestRuntime", 1, std::move(samples), {}};
  }
};

TEST_F(RuntimeSamplingProfileTraceEventSerializerTest, EmptyProfile) {
  // Setup
  auto notificationCallback = createNotificationCallback();
  IdGenerator profileIdGenerator;

  auto profile = createEmptyProfile();
  auto tracingStartTime = HighResTimeStamp::now();

  // Execute
  RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
      std::move(profile),
      profileIdGenerator,
      tracingStartTime,
      notificationCallback,
      10);

  // Nothing should be reported if the profile is empty.
  EXPECT_TRUE(notificationEvents_.empty());
}

TEST_F(
    RuntimeSamplingProfileTraceEventSerializerTest,
    SameCallFramesAreMerged) {
  // Setup
  auto notificationCallback = createNotificationCallback();
  IdGenerator profileIdGenerator;

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

  ThreadId threadId = 1;
  uint64_t timestamp1 = 1000000;
  uint64_t timestamp2 = 2000000;
  uint64_t timestamp3 = 3000000;

  auto samples = std::vector<RuntimeSamplingProfile::Sample>{};
  samples.emplace_back(createSample(timestamp1, threadId, callStack1));
  samples.emplace_back(createSample(timestamp2, threadId, callStack2));
  samples.emplace_back(createSample(timestamp3, threadId, callStack3));

  auto profile = createProfileWithSamples(std::move(samples));
  auto tracingStartTime = HighResTimeStamp::now();

  // Execute
  RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
      std::move(profile),
      profileIdGenerator,
      tracingStartTime,
      notificationCallback,
      10);

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
  IdGenerator profileIdGenerator;

  // Create an empty sample (no call stack)
  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> emptyCallStack;

  ThreadId threadId = 1;
  uint64_t timestamp = 1000000;

  auto samples = std::vector<RuntimeSamplingProfile::Sample>{};
  samples.emplace_back(createSample(timestamp, threadId, emptyCallStack));
  auto profile = createProfileWithSamples(std::move(samples));

  auto tracingStartTime = HighResTimeStamp::now();

  // Execute
  RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
      std::move(profile),
      profileIdGenerator,
      tracingStartTime,
      notificationCallback,
      10);

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
  IdGenerator profileIdGenerator;

  // Create samples with different thread IDs
  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack = {
      createJSCallFrame("foo", 1, "test.js", 10, 5)};

  uint64_t timestamp = 1000000;
  ThreadId threadId1 = 1;
  ThreadId threadId2 = 2;

  auto samples = std::vector<RuntimeSamplingProfile::Sample>{};
  samples.emplace_back(createSample(timestamp, threadId1, callStack));
  samples.emplace_back(createSample(timestamp + 1000, threadId2, callStack));
  samples.emplace_back(createSample(timestamp + 2000, threadId1, callStack));

  auto profile = createProfileWithSamples(std::move(samples));

  auto tracingStartTime = HighResTimeStamp::now();

  // Execute
  RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
      std::move(profile),
      profileIdGenerator,
      tracingStartTime,
      notificationCallback,
      10);

  /**
   * [
   *  ["Profile"],
   *  ["Profile"],
   *  ["ProfileChunk" for threadId1, "ProfileChunk" for threadId2]
   * ]
   *
   * Samples from different thread should never be grouped together in the same
   * chunk.
   **/
  ASSERT_EQ(notificationEvents_.size(), 3);
  ASSERT_EQ(notificationEvents_[2].size(), 2);
}

TEST_F(
    RuntimeSamplingProfileTraceEventSerializerTest,
    TraceEventChunkSizeLimit) {
  // Setup
  auto notificationCallback = createNotificationCallback();
  IdGenerator profileIdGenerator;
  uint16_t traceEventChunkSize = 2;
  uint16_t profileChunkSize = 2;

  // Create multiple samples
  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack = {
      createJSCallFrame("foo", 1, "test.js", 10, 5)};

  uint64_t timestamp = 1000000;
  ThreadId threadId = 1;

  std::vector<RuntimeSamplingProfile::Sample> samples;
  samples.reserve(5);
  for (int i = 0; i < 5; i++) {
    samples.push_back(createSample(timestamp + i * 1000, threadId, callStack));
  }

  auto profile = createProfileWithSamples(std::move(samples));
  auto tracingStartTime = HighResTimeStamp::now();

  // Execute
  RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
      std::move(profile),
      profileIdGenerator,
      tracingStartTime,
      notificationCallback,
      traceEventChunkSize,
      profileChunkSize);

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
  IdGenerator profileIdGenerator;
  // Set a small profile chunk size to test profile chunking
  uint16_t traceEventChunkSize = 10;
  uint16_t profileChunkSize = 2;
  double samplesCount = 5;

  // Create multiple samples
  std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack = {
      createJSCallFrame("foo", 1, "test.js", 10, 5)};

  uint64_t timestamp = 1000000;
  ThreadId threadId = 1;

  std::vector<RuntimeSamplingProfile::Sample> samples;
  samples.reserve(samplesCount);
  for (int i = 0; i < samplesCount; i++) {
    samples.push_back(createSample(timestamp + i * 1000, threadId, callStack));
  }

  auto profile = createProfileWithSamples(std::move(samples));
  auto tracingStartTime = HighResTimeStamp::now();

  // Execute
  RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
      std::move(profile),
      profileIdGenerator,
      tracingStartTime,
      notificationCallback,
      traceEventChunkSize,
      profileChunkSize);

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

TEST_F(RuntimeSamplingProfileTraceEventSerializerTest, UniqueNodesThreshold) {
  // Setup
  auto notificationCallback = createNotificationCallback();
  IdGenerator profileIdGenerator;
  uint16_t traceEventChunkSize = 10;
  uint16_t profileChunkSize = 10;
  uint16_t maxUniqueNodesPerChunk = 3;

  // Create samples with different function names to generate unique nodes
  ThreadId threadId = 1;
  uint64_t timestamp = 1000000;

  std::vector<RuntimeSamplingProfile::Sample> samples;

  // In total we would have 8 unique nodes, 5 of which are created here.
  // Other 3 are (root), (program), (idle).
  for (int i = 0; i < 5; i++) {
    std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack = {
        createJSCallFrame(
            "function" + std::to_string(i), 1, "test.js", 10 + i, 5)};
    samples.push_back(createSample(timestamp + i * 1000, threadId, callStack));
  }

  auto profile = createProfileWithSamples(std::move(samples));
  auto tracingStartTime = HighResTimeStamp::now();

  // Execute
  RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
      std::move(profile),
      profileIdGenerator,
      tracingStartTime,
      notificationCallback,
      traceEventChunkSize,
      profileChunkSize,
      maxUniqueNodesPerChunk);

  // [["Profile"], ["ProfileChunk", "ProfileChunk", "ProfileChunk"]]
  ASSERT_EQ(notificationEvents_.size(), 2);
  EXPECT_EQ(notificationEvents_[1].size(), 3);

  // Verify that each chunk respects the unique nodes limit
  for (auto& profileChunk : notificationEvents_[1]) {
    auto& nodes = profileChunk["args"]["data"]["cpuProfile"]["nodes"];
    EXPECT_LE(nodes.size(), maxUniqueNodesPerChunk);
  }
}

} // namespace facebook::react::jsinspector_modern::tracing
