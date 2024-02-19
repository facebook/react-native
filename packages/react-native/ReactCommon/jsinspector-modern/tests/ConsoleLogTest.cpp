/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FollyDynamicMatchers.h"
#include "ReactInstanceIntegrationTest.h"

#include <glog/logging.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <jsinspector-modern/InspectorInterfaces.h>

namespace facebook::react::jsinspector_modern {

using namespace testing;

TEST_P(ReactInstanceIntegrationTestWithFlags, ConsoleLog) {
  InSequence s;

  EXPECT_CALL(
      getRemoteConnection(),
      onMessage(JsonParsed(AllOf(AtJsonPtr("/id", Eq(1))))));

  EXPECT_CALL(
      getRemoteConnection(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/params/context/name", Eq("hermes")),
          AtJsonPtr("/method", Eq("Runtime.executionContextCreated"))))));

  // Hermes console.* interception is currently explicitly disabled under the
  // modern registry, and the runtime does not yet fire these events. When the
  // implementation is more complete we should be able to remove this
  // condition.
  if (!featureFlags->enableModernCDPRegistry) {
    EXPECT_CALL(
        getRemoteConnection(),
        onMessage(JsonParsed(AllOf(
            AtJsonPtr("/params/args/0/value", Eq("Hello, World!")),
            AtJsonPtr("/method", Eq("Runtime.consoleAPICalled"))))));
  }

  EXPECT_CALL(getRemoteConnection(), onDisconnect());

  send("Runtime.enable");
  run("console.log('Hello, World!');");
}

INSTANTIATE_TEST_SUITE_P(
    ConsoleLogVaryingInspectorFlags,
    ReactInstanceIntegrationTestWithFlags,
    ::testing::Values(
        FeatureFlags{
            .enableCxxInspectorPackagerConnection = true,
            .enableModernCDPRegistry = true},
        FeatureFlags{
            .enableCxxInspectorPackagerConnection = false,
            .enableModernCDPRegistry = false},
        FeatureFlags{
            .enableCxxInspectorPackagerConnection = true,
            .enableModernCDPRegistry = false}));

} // namespace facebook::react::jsinspector_modern
