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

} // namespace facebook::react::jsinspector_modern
