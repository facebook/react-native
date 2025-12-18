/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TracingTest.h"
#include "engines/JsiIntegrationTestHermesEngineAdapter.h"

#include <folly/executors/QueuedImmediateExecutor.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/networking/NetworkReporter.h>

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

class TracingTest : public TracingTestBase<
                        JsiIntegrationTestHermesEngineAdapter,
                        folly::QueuedImmediateExecutor> {
 protected:
  TracingTest() : TracingTestBase() {}

  void SetUp() override {
    JsiIntegrationPortableTestBase::SetUp();
    connect();
    EXPECT_CALL(
        fromPage(),
        onMessage(
            JsonParsed(AllOf(AtJsonPtr("/method", "Debugger.scriptParsed")))))
        .Times(AnyNumber());
  }
};

TEST_F(TracingTest, EnablesSamplingProfilerOnlyCategoryIsSpecified) {
  InSequence s;

  startTracing({});
  auto allTraceEvents = endTracingAndCollectEvents();

  EXPECT_THAT(
      allTraceEvents,
      Not(Contains(AllOf(
          AtJsonPtr("/name", "Profile"),
          AtJsonPtr("/cat", "disabled-by-default-v8.cpu_profiler")))));

  startTracing({tracing::Category::JavaScriptSampling});
  allTraceEvents = endTracingAndCollectEvents();

  EXPECT_THAT(
      allTraceEvents,
      Contains(AllOf(
          AtJsonPtr("/name", "Profile"),
          AtJsonPtr("/cat", "disabled-by-default-v8.cpu_profiler"))));
}

TEST_F(TracingTest, RecordsFrameTimings) {
  InSequence s;

  page_->startTracing(tracing::Mode::Background, {tracing::Category::Timeline});

  auto now = HighResTimeStamp::now();
  auto frameTimingSequence = tracing::FrameTimingSequence(
      1, // id
      11, // threadId
      now,
      now + HighResDuration::fromNanoseconds(10),
      now + HighResDuration::fromNanoseconds(50));

  page_->recordFrameTimings(frameTimingSequence);

  auto tracingProfile = page_->stopTracing();
  EXPECT_EQ(tracingProfile.frameTimings.size(), 1u);
  EXPECT_EQ(tracingProfile.frameTimings[0].id, frameTimingSequence.id);
}

TEST_F(TracingTest, EmitsRecordedFrameTimingSequences) {
  InSequence s;

  startTracing();
  auto now = HighResTimeStamp::now();
  page_->recordFrameTimings(
      tracing::FrameTimingSequence(
          1, // id
          11, // threadId
          now,
          now + HighResDuration::fromNanoseconds(10),
          now + HighResDuration::fromNanoseconds(50)));

  auto allTraceEvents = endTracingAndCollectEvents();
  EXPECT_THAT(allTraceEvents, Contains(AtJsonPtr("/name", "BeginFrame")));
  EXPECT_THAT(allTraceEvents, Contains(AtJsonPtr("/name", "Commit")));
  EXPECT_THAT(allTraceEvents, Contains(AtJsonPtr("/name", "DrawFrame")));
}

TEST_F(TracingTest, EmitsScreenshotEventWhenScreenshotValuePassed) {
  InSequence s;

  startTracing({tracing::Category::Screenshot});
  auto now = HighResTimeStamp::now();
  page_->recordFrameTimings(
      tracing::FrameTimingSequence(
          1, // id
          11, // threadId
          now,
          now + HighResDuration::fromNanoseconds(10),
          now + HighResDuration::fromNanoseconds(50),
          "base64EncodedScreenshotData"));

  auto allTraceEvents = endTracingAndCollectEvents();
  EXPECT_THAT(allTraceEvents, Contains(AtJsonPtr("/name", "Screenshot")));
}

} // namespace facebook::react::jsinspector_modern
