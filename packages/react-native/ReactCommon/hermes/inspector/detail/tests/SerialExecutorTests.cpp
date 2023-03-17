/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <hermes/inspector/detail/SerialExecutor.h>

#include <array>
#include <iostream>

#include <gtest/gtest.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace detail {

TEST(SerialExecutorTests, testProcessesItems) {
  std::array<int, 1024> values{};

  {
    SerialExecutor executor("TestExecutor");

    for (int i = 0; i < values.size(); i++) {
      executor.add([=, &values]() { values[i] = i; });
    }
  }

  // By this time the serial executor destructor should have exited and waited
  // for all work items to complete.
  for (int i = 0; i < values.size(); i++) {
    EXPECT_EQ(values[i], i);
  }
}

} // namespace detail
} // namespace inspector
} // namespace hermes
} // namespace facebook
