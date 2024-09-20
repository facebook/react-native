/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ostream>

#include <gtest/gtest.h>

#include "../CircularBuffer.h"

namespace facebook::react {

using namespace facebook::react;

constexpr auto OK = false;
constexpr auto OVERWRITE = true;

TEST(CircularBuffer, CanAddAndRetrieveElements) {
  CircularBuffer<int> buffer{5};

  ASSERT_EQ(OK, buffer.add(1));
  ASSERT_EQ(OK, buffer.add(2));

  ASSERT_EQ(1, buffer[0]);
  ASSERT_EQ(2, buffer[1]);
  ASSERT_EQ(2, buffer.size());
  ASSERT_EQ(std::vector<int>({1, 2}), buffer.getEntries());

  ASSERT_EQ(OK, buffer.add(3));
  ASSERT_EQ(3, buffer.size());
  ASSERT_EQ(std::vector<int>({1, 2, 3}), buffer.getEntries());

  ASSERT_EQ(1, buffer[0]);
  ASSERT_EQ(2, buffer[1]);
  ASSERT_EQ(3, buffer[2]);
}

TEST(BoundedConsumableBuffer, WrapsAroundCorrectly) {
  CircularBuffer<int> buffer(3);

  ASSERT_EQ(OK, buffer.add(1));
  ASSERT_EQ(OK, buffer.add(2));

  ASSERT_EQ(std::vector<int>({1, 2}), buffer.getEntries());

  ASSERT_EQ(OK, buffer.add(3));
  ASSERT_EQ(std::vector<int>({1, 2, 3}), buffer.getEntries());

  ASSERT_EQ(OVERWRITE, buffer.add(4));
  ASSERT_EQ(OVERWRITE, buffer.add(5));

  ASSERT_EQ(std::vector<int>({3, 4, 5}), buffer.getEntries());

  ASSERT_EQ(OVERWRITE, buffer.add(6));
  ASSERT_EQ(OVERWRITE, buffer.add(7));

  ASSERT_EQ(std::vector<int>({5, 6, 7}), buffer.getEntries());

  ASSERT_EQ(OVERWRITE, buffer.add(8));
  ASSERT_EQ(OVERWRITE, buffer.add(9));
  ASSERT_EQ(OVERWRITE, buffer.add(10));
  ASSERT_EQ(std::vector<int>({8, 9, 10}), buffer.getEntries());

  ASSERT_EQ(8, buffer[0]);
  ASSERT_EQ(9, buffer[1]);
  ASSERT_EQ(10, buffer[2]);
}

TEST(BoundedConsumableBuffer, CanClearByPredicate) {
  CircularBuffer<int> buffer(5);

  buffer.add(1);
  buffer.add(0);
  buffer.add(2);
  buffer.add(0);
  buffer.add(3);

  buffer.clear([](const int& el) { return el == 0; });
  ASSERT_EQ(std::vector<int>({1, 2, 3}), buffer.getEntries());

  buffer.add(0);
  buffer.add(4);
  buffer.clear([](const int& el) { return el == 0; });
  ASSERT_EQ(std::vector<int>({1, 2, 3, 4}), buffer.getEntries());
}

TEST(BoundedConsumableBuffer, CanClearBeforeReachingMaxSize) {
  CircularBuffer<int> buffer(5);

  buffer.add(1);
  buffer.add(2);
  buffer.add(3);

  buffer.clear([](const int&) { return false; }); // no-op clear
  ASSERT_EQ(std::vector<int>({1, 2, 3}), buffer.getEntries());

  buffer.add(4);
  buffer.add(5);

  ASSERT_EQ(std::vector<int>({1, 2, 3, 4, 5}), buffer.getEntries());
}

TEST(BoundedConsumableBuffer, CanGetByPredicate) {
  CircularBuffer<int> buffer(5);

  buffer.add(1);
  buffer.add(0);
  buffer.add(2);
  buffer.add(0);
  buffer.add(3);

  ASSERT_EQ(std::vector<int>({1, 2, 3}), buffer.getEntries([](const int& el) {
    return el != 0;
  }));

  buffer.add(0);
  buffer.add(4);

  ASSERT_EQ(std::vector<int>({2, 3, 4}), buffer.getEntries([](const int& el) {
    return el != 0;
  }));
}

} // namespace facebook::react
