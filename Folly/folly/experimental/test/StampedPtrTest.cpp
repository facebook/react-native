/*
 * Copyright 2017-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/experimental/StampedPtr.h>

#include <folly/portability/GTest.h>

TEST(StampedPtr, Basic) {
  folly::StampedPtr<char> sp;
  char target[10];
  sp.set(target, 10);
  EXPECT_EQ(sp.ptr(), target);
  EXPECT_EQ(sp.stamp(), 10);
  sp.setStamp(sp.stamp() + 1);
  EXPECT_EQ(sp.stamp(), 11);
  sp.setPtr(target + 1);
  EXPECT_EQ(sp.ptr(), target + 1);

  uint64_t raw = sp.raw;
  sp.raw = 0;
  EXPECT_NE(sp.stamp(), 11);
  sp.raw = raw;
  EXPECT_EQ(sp.stamp(), 11);
  EXPECT_EQ(sp.ptr(), target + 1);
}

TEST(StampedPtr, Zero) {
  folly::StampedPtr<char> sp{0};
  EXPECT_TRUE(sp.ptr() == nullptr);
  EXPECT_EQ(sp.stamp(), 0);
}

TEST(StampedPtr, Void) {
  folly::StampedPtr<void> sp;
  char target[10];
  sp.set(target, 10);
  EXPECT_EQ(sp.ptr(), target);
}

TEST(StampedPtr, Make) {
  auto sp = folly::makeStampedPtr("abc", 0xffff);
  EXPECT_EQ(*sp.ptr(), 'a');
  EXPECT_EQ(sp.stamp(), 0xffff);

  double x;
  auto sp2 = folly::makeStampedPtr(&x, 0);
  EXPECT_EQ(sp2.ptr(), &x);
  EXPECT_EQ(sp2.stamp(), 0);
}

TEST(StampedPtr, Const) {
  folly::StampedPtr<const char> sp{};
  char target;
  sp.setPtr(&target);
}

TEST(StampedPtr, BitExtension) {
  //                                 fedcba9876543210
  auto lo = static_cast<uintptr_t>(0x00007fff672333ecLL);
  auto hi = static_cast<uintptr_t>(0xfffffffff72333ecLL);
  ASSERT_TRUE(static_cast<intptr_t>(lo) > 0);
  ASSERT_TRUE(static_cast<intptr_t>(hi) < 0);

  folly::StampedPtr<char> sp{0};
  sp.setPtr(reinterpret_cast<char*>(lo));
  EXPECT_EQ(sp.ptr(), reinterpret_cast<char*>(lo));
  sp.setPtr(reinterpret_cast<char*>(hi));
  EXPECT_EQ(sp.ptr(), reinterpret_cast<char*>(hi));
}
