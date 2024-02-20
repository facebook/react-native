/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactInstanceIntegrationTest.h"

#include <glog/logging.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <jsinspector-modern/InspectorInterfaces.h>

namespace facebook::react::jsinspector_modern {

using testing::StrEq;

TEST_F(ReactInstanceIntegrationTest, RuntimeEvalTest) {
  auto val = run("1 + 2");
  EXPECT_EQ(val.asNumber(), 3);
}

} // namespace facebook::react::jsinspector_modern
