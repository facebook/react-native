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

#include <set>

#include <folly/EvictingCacheMap.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(EvictingCacheMap, SanityTest) {
  EvictingCacheMap<int, int> map(0);

  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  EXPECT_FALSE(map.exists(1));
  map.set(1, 1);
  EXPECT_EQ(1, map.size());
  EXPECT_FALSE(map.empty());
  EXPECT_EQ(1, map.get(1));
  EXPECT_TRUE(map.exists(1));
  map.set(1, 2);
  EXPECT_EQ(1, map.size());
  EXPECT_FALSE(map.empty());
  EXPECT_EQ(2, map.get(1));
  EXPECT_TRUE(map.exists(1));
  map.erase(1);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  EXPECT_FALSE(map.exists(1));

  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  EXPECT_FALSE(map.exists(1));
  map.set(1, 1);
  EXPECT_EQ(1, map.size());
  EXPECT_FALSE(map.empty());
  EXPECT_EQ(1, map.get(1));
  EXPECT_TRUE(map.exists(1));
  map.set(1, 2);
  EXPECT_EQ(1, map.size());
  EXPECT_FALSE(map.empty());
  EXPECT_EQ(2, map.get(1));
  EXPECT_TRUE(map.exists(1));

  EXPECT_FALSE(map.exists(2));
  map.set(2, 1);
  EXPECT_TRUE(map.exists(2));
  EXPECT_EQ(2, map.size());
  EXPECT_FALSE(map.empty());
  EXPECT_EQ(1, map.get(2));
  map.set(2, 2);
  EXPECT_EQ(2, map.size());
  EXPECT_FALSE(map.empty());
  EXPECT_EQ(2, map.get(2));
  EXPECT_TRUE(map.exists(2));
  map.erase(2);
  EXPECT_EQ(1, map.size());
  EXPECT_FALSE(map.empty());
  EXPECT_FALSE(map.exists(2));
  map.erase(1);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  EXPECT_FALSE(map.exists(1));
}


TEST(EvictingCacheMap, PruneTest) {
  EvictingCacheMap<int, int> map(0);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  map.prune(1000000);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  map.prune(100);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  map.prune(99);
  EXPECT_EQ(1, map.size());
  EXPECT_FALSE(map.empty());
  for (int i = 0; i < 99; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  EXPECT_TRUE(map.exists(99));
  EXPECT_EQ(99, map.get(99));

  map.prune(100);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  map.prune(90);
  EXPECT_EQ(10, map.size());
  EXPECT_FALSE(map.empty());
  for (int i = 0; i < 90; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  for (int i = 90; i < 100; i++) {
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }
}

TEST(EvictingCacheMap, PruneHookTest) {
  EvictingCacheMap<int, int> map(0);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  int sum = 0;
  auto pruneCb = [&](int&& k, int&& v) {
    EXPECT_EQ(k, v);
    sum += k;
  };

  map.setPruneHook(pruneCb);

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  map.prune(1000000);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  EXPECT_EQ((99 * 100) / 2, sum);
  sum = 0;

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  map.prune(100);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  EXPECT_EQ((99 * 100) / 2, sum);
  sum = 0;

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  map.prune(99);
  EXPECT_EQ(1, map.size());
  EXPECT_FALSE(map.empty());
  for (int i = 0; i < 99; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  EXPECT_TRUE(map.exists(99));
  EXPECT_EQ(99, map.get(99));

  EXPECT_EQ((98 * 99) / 2, sum);
  sum = 0;

  map.prune(100);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  EXPECT_EQ(99, sum);
  sum = 0;

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  map.prune(90);
  EXPECT_EQ(10, map.size());
  EXPECT_FALSE(map.empty());
  for (int i = 0; i < 90; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  for (int i = 90; i < 100; i++) {
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }
  EXPECT_EQ((89 * 90) / 2, sum);
  sum = 0;
}

TEST(EvictingCacheMap, SetMaxSize) {
  EvictingCacheMap<int, int> map(100, 20);
  for (int i = 0; i < 90; i++) {
    map.set(i, i);
    EXPECT_TRUE(map.exists(i));
  }

  EXPECT_EQ(90, map.size());
  map.setMaxSize(50);
  EXPECT_EQ(map.size(), 50);

  for (int i = 0; i < 90; i++) {
    map.set(i, i);
    EXPECT_TRUE(map.exists(i));
  }
  EXPECT_EQ(40, map.size());
  map.setMaxSize(0);
  EXPECT_EQ(40, map.size());
  map.setMaxSize(10);
  EXPECT_EQ(10, map.size());
}

TEST(EvictingCacheMap, SetClearSize) {
  EvictingCacheMap<int, int> map(100, 20);
  for (int i = 0; i < 90; i++) {
    map.set(i, i);
    EXPECT_TRUE(map.exists(i));
  }

  EXPECT_EQ(90, map.size());
  map.setClearSize(40);
  map.setMaxSize(50);
  EXPECT_EQ(map.size(), 50);

  for (int i = 0; i < 90; i++) {
    map.set(i, i);
    EXPECT_TRUE(map.exists(i));
  }
  EXPECT_EQ(20, map.size());
  map.setMaxSize(0);
  EXPECT_EQ(20, map.size());
  map.setMaxSize(10);
  EXPECT_EQ(0, map.size());
}

TEST(EvictingCacheMap, DestructorInvocationTest) {
  struct SumInt {
    SumInt(int val, int* ref) : val(val), ref(ref) { }
    ~SumInt() {
      *ref += val;
    }
    int val;
    int* ref;
  };

  EvictingCacheMap<int, SumInt> map(0);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  int sum;

  for (int i = 0; i < 100; i++) {
    map.set(i, SumInt(i, &sum));
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i).val);
  }

  sum = 0;
  map.prune(1000000);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  EXPECT_EQ((99 * 100) / 2, sum);

  for (int i = 0; i < 100; i++) {
    map.set(i, SumInt(i, &sum));
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i).val);
  }

  sum = 0;
  map.prune(100);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  EXPECT_EQ((99 * 100) / 2, sum);

  for (int i = 0; i < 100; i++) {
    map.set(i, SumInt(i, &sum));
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i).val);
  }

  sum = 0;
  map.prune(99);
  EXPECT_EQ(1, map.size());
  EXPECT_FALSE(map.empty());
  for (int i = 0; i < 99; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  EXPECT_TRUE(map.exists(99));
  EXPECT_EQ(99, map.get(99).val);

  EXPECT_EQ((98 * 99) / 2, sum);

  sum = 0;
  map.prune(100);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  EXPECT_EQ(99, sum);
  for (int i = 0; i < 100; i++) {
    map.set(i, SumInt(i, &sum));
    EXPECT_EQ(i + 1, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i).val);
  }

  sum = 0;
  map.prune(90);
  EXPECT_EQ(10, map.size());
  EXPECT_FALSE(map.empty());
  for (int i = 0; i < 90; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  for (int i = 90; i < 100; i++) {
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i).val);
  }
  EXPECT_EQ((89 * 90) / 2, sum);
  sum = 0;
}

TEST(EvictingCacheMap, LruSanityTest) {
  EvictingCacheMap<int, int> map(10);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_GE(10, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  EXPECT_EQ(10, map.size());
  EXPECT_FALSE(map.empty());
  for (int i = 0; i < 90; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  for (int i = 90; i < 100; i++) {
    EXPECT_TRUE(map.exists(i));
  }
}

TEST(EvictingCacheMap, LruPromotionTest) {
  EvictingCacheMap<int, int> map(10);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_GE(10, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
    for (int j = 0; j < std::min(i + 1, 9); j++) {
      EXPECT_TRUE(map.exists(j));
      EXPECT_EQ(j, map.get(j));
    }
  }

  EXPECT_EQ(10, map.size());
  EXPECT_FALSE(map.empty());
  for (int i = 0; i < 9; i++) {
    EXPECT_TRUE(map.exists(i));
  }
  EXPECT_TRUE(map.exists(99));
  for (int i = 10; i < 99; i++) {
    EXPECT_FALSE(map.exists(i));
  }
}

TEST(EvictingCacheMap, LruNoPromotionTest) {
  EvictingCacheMap<int, int> map(10);
  EXPECT_EQ(0, map.size());
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < 100; i++) {
    EXPECT_FALSE(map.exists(i));
  }

  for (int i = 0; i < 100; i++) {
    map.set(i, i);
    EXPECT_GE(10, map.size());
    EXPECT_FALSE(map.empty());
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
    for (int j = 0; j < std::min(i + 1, 9); j++) {
      if (map.exists(j)) {
        EXPECT_EQ(j, map.getWithoutPromotion(j));
      }
    }
  }

  EXPECT_EQ(10, map.size());
  EXPECT_FALSE(map.empty());
  for (int i = 0; i < 90; i++) {
    EXPECT_FALSE(map.exists(i));
  }
  for (int i = 90; i < 100; i++) {
    EXPECT_TRUE(map.exists(i));
  }
}

TEST(EvictingCacheMap, IteratorSanityTest) {
  const int nItems = 1000;
  EvictingCacheMap<int, int> map(nItems);
  EXPECT_TRUE(map.begin() == map.end());
  for (int i = 0; i < nItems; i++) {
    EXPECT_FALSE(map.exists(i));
    map.set(i, i * 2);
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i * 2, map.get(i));
  }

  std::set<int> seen;
  for (auto& it : map) {
    EXPECT_EQ(0, seen.count(it.first));
    seen.insert(it.first);
    EXPECT_EQ(it.first * 2, it.second);
  }
  EXPECT_EQ(nItems, seen.size());
}

TEST(EvictingCacheMap, FindTest) {
  const int nItems = 1000;
  EvictingCacheMap<int, int> map(nItems);
  for (int i = 0; i < nItems; i++) {
    map.set(i * 2, i * 2);
    EXPECT_TRUE(map.exists(i * 2));
    EXPECT_EQ(i * 2, map.get(i * 2));
  }
  for (int i = 0; i < nItems * 2; i++) {
    if (i % 2 == 0) {
      auto it = map.find(i);
      EXPECT_FALSE(it == map.end());
      EXPECT_EQ(i, it->first);
      EXPECT_EQ(i, it->second);
    } else {
      EXPECT_TRUE( map.find(i) == map.end());
    }
  }
  for (int i = nItems * 2 - 1; i >= 0; i--) {
    if (i % 2 == 0) {
      auto it = map.find(i);
      EXPECT_FALSE(it == map.end());
      EXPECT_EQ(i, it->first);
      EXPECT_EQ(i, it->second);
    } else {
      EXPECT_TRUE(map.find(i) == map.end());
    }
  }
  EXPECT_EQ(0, map.begin()->first);
}

TEST(EvictingCacheMap, FindWithoutPromotionTest) {
  const int nItems = 1000;
  EvictingCacheMap<int, int> map(nItems);
  for (int i = 0; i < nItems; i++) {
    map.set(i * 2, i * 2);
    EXPECT_TRUE(map.exists(i * 2));
    EXPECT_EQ(i * 2, map.get(i * 2));
  }
  for (int i = nItems * 2 - 1; i >= 0; i--) {
    if (i % 2 == 0) {
      auto it = map.findWithoutPromotion(i);
      EXPECT_FALSE(it == map.end());
      EXPECT_EQ(i, it->first);
      EXPECT_EQ(i, it->second);
    } else {
      EXPECT_TRUE(map.findWithoutPromotion(i) == map.end());
    }
  }
  EXPECT_EQ((nItems - 1) * 2, map.begin()->first);
}

TEST(EvictingCacheMap, IteratorOrderingTest) {
  const int nItems = 1000;
  EvictingCacheMap<int, int> map(nItems);
  for (int i = 0; i < nItems; i++) {
    map.set(i, i);
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  int expected = nItems - 1;
  for (auto it = map.begin(); it != map.end(); ++it) {
    EXPECT_EQ(expected, it->first);
    expected--;
  }

  expected = 0;
  for (auto it = map.rbegin(); it != map.rend(); ++it) {
    EXPECT_EQ(expected, it->first);
    expected++;
  }

  {
    auto it = map.end();
    expected = 0;
    EXPECT_TRUE(it != map.begin());
    do {
      --it;
      EXPECT_EQ(expected, it->first);
      expected++;
    } while (it != map.begin());
    EXPECT_EQ(nItems, expected);
  }

  {
    auto it = map.rend();
    expected = nItems - 1;
    do {
      --it;
      EXPECT_EQ(expected, it->first);
      expected--;
    } while (it != map.rbegin());
    EXPECT_EQ(-1, expected);
  }
}

TEST(EvictingCacheMap, MoveTest) {
  const int nItems = 1000;
  EvictingCacheMap<int, int> map(nItems);
  for (int i = 0; i < nItems; i++) {
    map.set(i, i);
    EXPECT_TRUE(map.exists(i));
    EXPECT_EQ(i, map.get(i));
  }

  EvictingCacheMap<int, int> map2 = std::move(map);
  EXPECT_TRUE(map.empty());
  for (int i = 0; i < nItems; i++) {
    EXPECT_TRUE(map2.exists(i));
    EXPECT_EQ(i, map2.get(i));
  }
}
