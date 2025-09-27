/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/renderer/core/RawValue.h>

using namespace facebook;
using namespace facebook::react;

TEST(RawValueTest, intValueDoesNotOverflow) {
  auto runtime = facebook::hermes::makeHermesRuntime();
  auto rawValue = RawValue(*runtime, jsi::Value(*runtime, 4294967040.0));
  EXPECT_EQ((int64_t)rawValue, 4294967040);
  EXPECT_EQ((int)rawValue, static_cast<int>(4294967040));

  rawValue = RawValue(folly::dynamic(4294967040.0));
  EXPECT_EQ((int64_t)rawValue, 4294967040);
  EXPECT_EQ((int)rawValue, static_cast<int>(4294967040));
}
