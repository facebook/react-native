/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/AtomicBitSet.h>

#include <folly/portability/GTest.h>

#include <glog/logging.h>

namespace folly { namespace test {

TEST(AtomicBitSet, Simple) {
  constexpr size_t kSize = 1000;
  AtomicBitSet<kSize> bs;

  EXPECT_EQ(kSize, bs.size());

  for (size_t i = 0; i < kSize; ++i) {
    EXPECT_FALSE(bs[i]);
  }

  bs.set(42);
  for (size_t i = 0; i < kSize; ++i) {
    EXPECT_EQ(i == 42, bs[i]);
  }

  bs.set(43);
  for (size_t i = 0; i < kSize; ++i) {
    EXPECT_EQ((i == 42 || i == 43), bs[i]);
  }

  bs.reset(42);
  for (size_t i = 0; i < kSize; ++i) {
    EXPECT_EQ((i == 43), bs[i]);
  }

  bs.reset(43);
  for (size_t i = 0; i < kSize; ++i) {
    EXPECT_FALSE(bs[i]);
  }
}

}}  // namespaces

int main(int argc, char *argv[]) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  return RUN_ALL_TESTS();
}
