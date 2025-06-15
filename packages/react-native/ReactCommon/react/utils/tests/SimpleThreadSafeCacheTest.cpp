/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/utils/SimpleThreadSafeCache.h>

namespace facebook::react {

TEST(EvictingCacheMapTest, BasicInsertAndGet) {
  SimpleThreadSafeCache<int, std::string, 3> cache;
  EXPECT_EQ(cache.get(1), ""); // Default constructed value is returned
  EXPECT_EQ(cache.get(2), ""); // Default constructed value is returned
  EXPECT_EQ(cache.get(3), ""); // Default constructed value is returned

  cache.get(1, []() { return std::string("one"); });
  cache.get(2, []() { return std::string("two"); });
  cache.get(3, []() { return std::string("three"); });
  EXPECT_EQ(cache.get(1), "one");
  EXPECT_EQ(cache.get(2), "two");
  EXPECT_EQ(cache.get(3), "three");
}

TEST(EvictingCacheMapTest, Eviction) {
  SimpleThreadSafeCache<int, std::string, 2> cache;
  cache.get(1, []() { return std::string("one"); });
  cache.get(2, []() { return std::string("two"); });
  cache.get(3, []() { return std::string("three"); }); // should evict key 1

  EXPECT_EQ(
      cache.get(1),
      ""); // key 1 should be evicted and default constructed value is returned
  EXPECT_EQ(cache.get(2), "two");
  EXPECT_EQ(cache.get(3), "three");
}

} // namespace facebook::react
