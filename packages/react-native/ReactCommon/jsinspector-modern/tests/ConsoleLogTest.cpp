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

TEST_F(ReactInstanceIntegrationTest, ConsoleLogTest) {
  InSequence s;

  EXPECT_CALL(getRemoteConnection(), onMessage(_))
      .Times(2)
      .RetiresOnSaturation();

  EXPECT_CALL(
      getRemoteConnection(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/params/args/0/value", Eq("Hello, World!")),
          AtJsonPtr("/method", Eq("Runtime.consoleAPICalled"))))));

  EXPECT_CALL(getRemoteConnection(), onDisconnect());

  send("Runtime.enable");
  run("console.log('Hello, World!');");
}

} // namespace facebook::react::jsinspector_modern
