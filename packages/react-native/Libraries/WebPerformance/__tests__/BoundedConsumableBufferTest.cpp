/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ostream>

#include <gtest/gtest.h>

#include "../BoundedConsumableBuffer.h"

namespace facebook::react {

using namespace facebook::react;

constexpr auto OK = BoundedConsumableBuffer<int>::PushStatus::OK;
constexpr auto DROP = BoundedConsumableBuffer<int>::PushStatus::DROP;
constexpr auto OVERWRITE = BoundedConsumableBuffer<int>::PushStatus::OVERWRITE;

TEST(BoundedConsumableBuffer, CanAddAndRetrieveElements) {
  BoundedConsumableBuffer<int> buffer;

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

TEST(BoundedConsumableBuffer, CanConsumeElements) {
  BoundedConsumableBuffer<int> buffer;

  ASSERT_EQ(OK, buffer.add(1));
  ASSERT_EQ(OK, buffer.add(2));

  ASSERT_EQ(std::vector<int>({1, 2}), buffer.getEntries());

  auto elems1 = buffer.consume();

  ASSERT_EQ(std::vector<int>({1, 2}), elems1);
  ASSERT_EQ(std::vector<int>({1, 2}), buffer.getEntries());

  auto elems2 = buffer.consume();
  ASSERT_TRUE(elems2.empty());

  ASSERT_EQ(std::vector<int>({1, 2}), buffer.getEntries());

  ASSERT_EQ(OK, buffer.add(3));
  ASSERT_EQ(std::vector<int>({1, 2, 3}), buffer.getEntries());
  auto elems3 = buffer.consume();
  ASSERT_EQ(std::vector<int>({3}), elems3);

  auto elems4 = buffer.consume();
  ASSERT_TRUE(elems4.empty());

  ASSERT_EQ(OK, buffer.add(4));
  ASSERT_EQ(OK, buffer.add(5));

  ASSERT_EQ(std::vector<int>({1, 2, 3, 4, 5}), buffer.getEntries());
  auto elems5 = buffer.consume();
  ASSERT_EQ(std::vector<int>({4, 5}), elems5);

  auto elems6 = buffer.consume();
  ASSERT_TRUE(elems6.empty());
}

TEST(BoundedConsumableBuffer, WrapsAroundCorrectly) {
  BoundedConsumableBuffer<int> buffer(3);

  ASSERT_EQ(OK, buffer.add(1));
  ASSERT_EQ(OK, buffer.add(2));

  auto elems1 = buffer.consume();

  ASSERT_EQ(std::vector<int>({1, 2}), buffer.getEntries());
  ASSERT_EQ(std::vector<int>({1, 2}), elems1);

  auto elems2 = buffer.consume();
  ASSERT_TRUE(elems2.empty());

  ASSERT_EQ(OK, buffer.add(3));
  ASSERT_EQ(std::vector<int>({1, 2, 3}), buffer.getEntries());
  auto elems3 = buffer.consume();
  ASSERT_EQ(std::vector<int>({3}), elems3);

  auto elems4 = buffer.consume();
  ASSERT_TRUE(elems4.empty());

  ASSERT_EQ(OVERWRITE, buffer.add(4));
  ASSERT_EQ(OVERWRITE, buffer.add(5));

  ASSERT_EQ(std::vector<int>({3, 4, 5}), buffer.getEntries());
  auto elems5 = buffer.consume();
  ASSERT_EQ(std::vector<int>({4, 5}), elems5);

  auto elems6 = buffer.consume();
  ASSERT_TRUE(elems6.empty());

  ASSERT_EQ(OVERWRITE, buffer.add(6));
  ASSERT_EQ(OVERWRITE, buffer.add(7));

  ASSERT_EQ(std::vector<int>({5, 6, 7}), buffer.getEntries());

  auto elems7 = buffer.consume();

  ASSERT_EQ(std::vector<int>({5, 6, 7}), buffer.getEntries());
  ASSERT_EQ(std::vector<int>({6, 7}), elems7);

  ASSERT_EQ(OVERWRITE, buffer.add(8));
  ASSERT_EQ(OVERWRITE, buffer.add(9));
  ASSERT_EQ(OVERWRITE, buffer.add(10));
  ASSERT_EQ(DROP, buffer.add(11));
  ASSERT_EQ(std::vector<int>({9, 10, 11}), buffer.getEntries());

  ASSERT_EQ(DROP, buffer.add(12));
  ASSERT_EQ(std::vector<int>({10, 11, 12}), buffer.getEntries());

  ASSERT_EQ(10, buffer[0]);
  ASSERT_EQ(11, buffer[1]);
  ASSERT_EQ(12, buffer[2]);

  ASSERT_EQ(DROP, buffer.add(13));
  ASSERT_EQ(std::vector<int>({11, 12, 13}), buffer.getEntries());
  auto elems8 = buffer.consume();
  ASSERT_EQ(std::vector<int>({11, 12, 13}), elems8);

  ASSERT_EQ(11, buffer[0]);
  ASSERT_EQ(12, buffer[1]);
  ASSERT_EQ(13, buffer[2]);
  ASSERT_EQ(11, *buffer.getNextOverwriteCandidate());

  ASSERT_EQ(OVERWRITE, buffer.add(14));
  ASSERT_EQ(14, buffer.back());

  ASSERT_EQ(std::vector<int>({12, 13, 14}), buffer.getEntries());
  auto elems9 = buffer.consume();
  ASSERT_EQ(std::vector<int>({14}), elems9);
}

TEST(BoundedConsumableBuffer, CanClearByPredicate) {
  BoundedConsumableBuffer<int> buffer(5);

  buffer.add(1);
  buffer.add(0);
  buffer.add(2);
  buffer.add(0);

  buffer.consume();
  buffer.add(3);

  buffer.add(0);
  buffer.add(4);

  buffer.clear([](const int& el) { return el == 0; });

  ASSERT_EQ(std::vector<int>({2, 3, 4}), buffer.getEntries());
  auto elems = buffer.consume();
  ASSERT_EQ(std::vector<int>({3, 4}), elems);
  ASSERT_EQ(std::vector<int>({2, 3, 4}), buffer.getEntries());
}

TEST(BoundedConsumableBuffer, CanGetByPredicate) {
  BoundedConsumableBuffer<int> buffer(5);

  buffer.add(1);
  buffer.add(0);
  buffer.add(2);
  buffer.add(0);

  buffer.consume();
  buffer.add(3);

  ASSERT_EQ(std::vector<int>({1, 2, 3}), buffer.getEntries([](const int& el) {
    return el != 0;
  }));

  buffer.add(0);
  buffer.add(4);

  ASSERT_EQ(std::vector<int>({2, 3, 4}), buffer.getEntries([](const int& el) {
    return el != 0;
  }));
  auto elems = buffer.consume();
  ASSERT_EQ(std::vector<int>({2, 3, 4}), buffer.getEntries([](const int& el) {
    return el != 0;
  }));
}

} // namespace facebook::react
