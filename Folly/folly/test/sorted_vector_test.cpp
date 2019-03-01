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

#include <folly/sorted_vector_types.h>

#include <iterator>
#include <list>
#include <memory>

#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>

using folly::sorted_vector_set;
using folly::sorted_vector_map;

namespace {

template <class T>
struct less_invert {
  bool operator()(const T& a, const T& b) const {
    return b < a;
  }
};

template<class Container>
void check_invariant(Container& c) {
  auto it = c.begin();
  auto end = c.end();
  if (it == end)
    return;
  auto prev = it;
  ++it;
  for (; it != end; ++it, ++prev) {
    EXPECT_TRUE(c.value_comp()(*prev, *it));
  }
}

struct OneAtATimePolicy {
  template<class Container>
  void increase_capacity(Container& c) {
    if (c.size() == c.capacity()) {
      c.reserve(c.size() + 1);
    }
  }
};

struct CountCopyCtor {
  explicit CountCopyCtor() : val_(0) {}

  explicit CountCopyCtor(int val) : val_(val), count_(0) {}

  CountCopyCtor(const CountCopyCtor& c)
    : val_(c.val_)
    , count_(c.count_ + 1)
  {}

  bool operator<(const CountCopyCtor& o) const {
    return val_ < o.val_;
  }

  int val_;
  int count_;
};

}

TEST(SortedVectorTypes, SimpleSetTest) {
  sorted_vector_set<int> s;
  EXPECT_TRUE(s.empty());
  for (int i = 0; i < 1000; ++i) {
    s.insert(rand() % 100000);
  }
  EXPECT_FALSE(s.empty());
  check_invariant(s);

  sorted_vector_set<int> s2;
  s2.insert(s.begin(), s.end());
  check_invariant(s2);
  EXPECT_TRUE(s == s2);

  auto it = s2.lower_bound(32);
  if (*it == 32) {
    s2.erase(it);
    it = s2.lower_bound(32);
  }
  check_invariant(s2);
  auto oldSz = s2.size();
  s2.insert(it, 32);
  EXPECT_TRUE(s2.size() == oldSz + 1);
  check_invariant(s2);

  const sorted_vector_set<int>& cs2 = s2;
  auto range = cs2.equal_range(32);
  auto lbound = cs2.lower_bound(32);
  auto ubound = cs2.upper_bound(32);
  EXPECT_TRUE(range.first == lbound);
  EXPECT_TRUE(range.second == ubound);
  EXPECT_TRUE(range.first != cs2.end());
  EXPECT_TRUE(range.second != cs2.end());
  EXPECT_TRUE(cs2.count(32) == 1);
  EXPECT_FALSE(cs2.find(32) == cs2.end());

  // Bad insert hint.
  s2.insert(s2.begin() + 3, 33);
  EXPECT_TRUE(s2.find(33) != s2.begin());
  EXPECT_TRUE(s2.find(33) != s2.end());
  check_invariant(s2);
  s2.erase(33);
  check_invariant(s2);

  it = s2.find(32);
  EXPECT_FALSE(it == s2.end());
  s2.erase(it);
  EXPECT_TRUE(s2.size() == oldSz);
  check_invariant(s2);

  sorted_vector_set<int> cpy(s);
  check_invariant(cpy);
  EXPECT_TRUE(cpy == s);
  sorted_vector_set<int> cpy2(s);
  cpy2.insert(100001);
  EXPECT_TRUE(cpy2 != cpy);
  EXPECT_TRUE(cpy2 != s);
  check_invariant(cpy2);
  EXPECT_TRUE(cpy2.count(100001) == 1);
  s.swap(cpy2);
  check_invariant(cpy2);
  check_invariant(s);
  EXPECT_TRUE(s != cpy);
  EXPECT_TRUE(s != cpy2);
  EXPECT_TRUE(cpy2 == cpy);
}

TEST(SortedVectorTypes, SimpleMapTest) {
  sorted_vector_map<int,float> m;
  for (int i = 0; i < 1000; ++i) {
    m[i] = i / 1000.0;
  }
  check_invariant(m);

  m[32] = 100.0;
  check_invariant(m);
  EXPECT_TRUE(m.count(32) == 1);
  EXPECT_DOUBLE_EQ(100.0, m.at(32));
  EXPECT_FALSE(m.find(32) == m.end());
  m.erase(32);
  EXPECT_TRUE(m.find(32) == m.end());
  check_invariant(m);
  EXPECT_THROW(m.at(32), std::out_of_range);

  sorted_vector_map<int,float> m2 = m;
  EXPECT_TRUE(m2 == m);
  EXPECT_FALSE(m2 != m);
  auto it = m2.lower_bound(1 << 20);
  EXPECT_TRUE(it == m2.end());
  m2.insert(it, std::make_pair(1 << 20, 10.0f));
  check_invariant(m2);
  EXPECT_TRUE(m2.count(1 << 20) == 1);
  EXPECT_TRUE(m < m2);
  EXPECT_TRUE(m <= m2);

  const sorted_vector_map<int,float>& cm = m;
  auto range = cm.equal_range(42);
  auto lbound = cm.lower_bound(42);
  auto ubound = cm.upper_bound(42);
  EXPECT_TRUE(range.first == lbound);
  EXPECT_TRUE(range.second == ubound);
  EXPECT_FALSE(range.first == cm.end());
  EXPECT_FALSE(range.second == cm.end());
  m.erase(m.lower_bound(42));
  check_invariant(m);

  sorted_vector_map<int,float> m3;
  m3.insert(m2.begin(), m2.end());
  check_invariant(m3);
  EXPECT_TRUE(m3 == m2);
  EXPECT_FALSE(m3 == m);

  EXPECT_TRUE(m != m2);
  EXPECT_TRUE(m2 == m3);
  EXPECT_TRUE(m3 != m);
  m.swap(m3);
  check_invariant(m);
  check_invariant(m2);
  check_invariant(m3);
  EXPECT_TRUE(m3 != m2);
  EXPECT_TRUE(m3 != m);
  EXPECT_TRUE(m == m2);

  // Bad insert hint.
  m.insert(m.begin() + 3, std::make_pair(1 << 15, 1.0f));
  check_invariant(m);
}

TEST(SortedVectorTypes, Sizes) {
  EXPECT_EQ(sizeof(sorted_vector_set<int>),
            sizeof(std::vector<int>));
  EXPECT_EQ(sizeof(sorted_vector_map<int,int>),
            sizeof(std::vector<std::pair<int,int> >));

  typedef sorted_vector_set<int,std::less<int>,
    std::allocator<int>,OneAtATimePolicy> SetT;
  typedef sorted_vector_map<int,int,std::less<int>,
    std::allocator<std::pair<int,int>>,OneAtATimePolicy> MapT;

  EXPECT_EQ(sizeof(SetT), sizeof(std::vector<int>));
  EXPECT_EQ(sizeof(MapT), sizeof(std::vector<std::pair<int,int> >));
}

TEST(SortedVectorTypes, InitializerLists) {
  sorted_vector_set<int> empty_initialized_set{};
  EXPECT_TRUE(empty_initialized_set.empty());

  sorted_vector_set<int> singleton_initialized_set{1};
  EXPECT_EQ(1, singleton_initialized_set.size());
  EXPECT_EQ(1, *singleton_initialized_set.begin());

  sorted_vector_set<int> forward_initialized_set{1, 2};
  sorted_vector_set<int> backward_initialized_set{2, 1};
  EXPECT_EQ(2, forward_initialized_set.size());
  EXPECT_EQ(1, *forward_initialized_set.begin());
  EXPECT_EQ(2, *forward_initialized_set.rbegin());
  EXPECT_TRUE(forward_initialized_set == backward_initialized_set);

  sorted_vector_map<int,int> empty_initialized_map{};
  EXPECT_TRUE(empty_initialized_map.empty());

  sorted_vector_map<int,int> singleton_initialized_map{{1,10}};
  EXPECT_EQ(1, singleton_initialized_map.size());
  EXPECT_EQ(10, singleton_initialized_map[1]);

  sorted_vector_map<int,int> forward_initialized_map{{1,10}, {2,20}};
  sorted_vector_map<int,int> backward_initialized_map{{2,20}, {1,10}};
  EXPECT_EQ(2, forward_initialized_map.size());
  EXPECT_EQ(10, forward_initialized_map[1]);
  EXPECT_EQ(20, forward_initialized_map[2]);
  EXPECT_TRUE(forward_initialized_map == backward_initialized_map);
}

TEST(SortedVectorTypes, CustomCompare) {
  sorted_vector_set<int,less_invert<int> > s;
  for (int i = 0; i < 200; ++i)
    s.insert(i);
  check_invariant(s);

  sorted_vector_map<int,float,less_invert<int> > m;
  for (int i = 0; i < 200; ++i)
    m[i] = 12.0;
  check_invariant(m);
}

TEST(SortedVectorTypes, GrowthPolicy) {
  typedef sorted_vector_set<CountCopyCtor,
                            std::less<CountCopyCtor>,
                            std::allocator<CountCopyCtor>,
                            OneAtATimePolicy>
    SetT;

  SetT a;
  for (int i = 0; i < 20; ++i) {
    a.insert(CountCopyCtor(i));
  }
  check_invariant(a);
  SetT::iterator it = a.begin();
  EXPECT_FALSE(it == a.end());
  if (it != a.end()) {
    EXPECT_EQ(it->val_, 0);
    // 1 copy for the initial insertion, 19 more for reallocs on the
    // additional insertions.
    EXPECT_EQ(it->count_, 20);
  }

  std::list<CountCopyCtor> v;
  for (int i = 0; i < 20; ++i) {
    v.emplace_back(20 + i);
  }
  a.insert(v.begin(), v.end());
  check_invariant(a);

  it = a.begin();
  EXPECT_FALSE(it == a.end());
  if (it != a.end()) {
    EXPECT_EQ(it->val_, 0);
    // Should be only 1 more copy for inserting this above range.
    EXPECT_EQ(it->count_, 21);
  }
}

TEST(SortedVectorTest, EmptyTest) {
  sorted_vector_set<int> emptySet;
  EXPECT_TRUE(emptySet.lower_bound(10) == emptySet.end());
  EXPECT_TRUE(emptySet.find(10) == emptySet.end());

  sorted_vector_map<int,int> emptyMap;
  EXPECT_TRUE(emptyMap.lower_bound(10) == emptyMap.end());
  EXPECT_TRUE(emptyMap.find(10) == emptyMap.end());
  EXPECT_THROW(emptyMap.at(10), std::out_of_range);
}

TEST(SortedVectorTest, MoveTest) {
  sorted_vector_set<std::unique_ptr<int>> s;
  s.insert(std::unique_ptr<int>(new int(5)));
  s.insert(s.end(), std::unique_ptr<int>(new int(10)));
  EXPECT_EQ(s.size(), 2);

  for (const auto& p : s) {
    EXPECT_TRUE(*p == 5 || *p == 10);
  }

  sorted_vector_map<int, std::unique_ptr<int>> m;
  m.insert(std::make_pair(5, std::unique_ptr<int>(new int(5))));
  m.insert(m.end(), std::make_pair(10, std::unique_ptr<int>(new int(10))));

  EXPECT_EQ(*m[5], 5);
  EXPECT_EQ(*m[10], 10);
}

TEST(SortedVectorTest, ShrinkTest) {
  sorted_vector_set<int> s;
  int i = 0;
  // Hopefully your resize policy doubles when capacity is full, or this will
  // hang forever :(
  while (s.capacity() == s.size()) {
    s.insert(i++);
  }
  s.shrink_to_fit();
  // The standard does not actually enforce that this be true, but assume that
  // vector::shrink_to_fit respects the caller.
  EXPECT_EQ(s.capacity(), s.size());
}

TEST(SortedVectorTypes, EraseTest) {
  sorted_vector_set<int> s1;
  s1.insert(1);
  sorted_vector_set<int> s2(s1);
  EXPECT_EQ(0, s1.erase(0));
  EXPECT_EQ(s2, s1);
}

std::vector<int> extractValues(sorted_vector_set<CountCopyCtor> const& in) {
  std::vector<int> ret;
  std::transform(
      in.begin(),
      in.end(),
      std::back_inserter(ret),
      [](const CountCopyCtor& c) { return c.val_; });
  return ret;
}

template <typename T, typename S>
std::vector<T> makeVectorOfWrappers(std::vector<S> ss) {
  std::vector<T> ts;
  ts.reserve(ss.size());
  for (auto const& s : ss) {
    ts.emplace_back(s);
  }
  return ts;
}

TEST(SortedVectorTypes, TestSetBulkInsertionSortMerge) {
  auto s = makeVectorOfWrappers<CountCopyCtor, int>({6, 4, 8, 2});

  sorted_vector_set<CountCopyCtor> vset(s.begin(), s.end());
  check_invariant(vset);

  // Add an unsorted range that will have to be merged in.
  s = makeVectorOfWrappers<CountCopyCtor, int>({10, 7, 5, 1});

  vset.insert(s.begin(), s.end());
  check_invariant(vset);
  EXPECT_EQ(vset.rbegin()->count_, 1);

  EXPECT_THAT(
      extractValues(vset),
      testing::ElementsAreArray({1, 2, 4, 5, 6, 7, 8, 10}));
}

TEST(SortedVectorTypes, TestSetBulkInsertionSortMergeDups) {
  auto s = makeVectorOfWrappers<CountCopyCtor, int>({6, 4, 8, 2});

  sorted_vector_set<CountCopyCtor> vset(s.begin(), s.end());
  check_invariant(vset);

  // Add an unsorted range that will have to be merged in.
  s = makeVectorOfWrappers<CountCopyCtor, int>({10, 6, 5, 2});

  vset.insert(s.begin(), s.end());
  check_invariant(vset);
  EXPECT_EQ(vset.rbegin()->count_, 1);
  EXPECT_THAT(
      extractValues(vset), testing::ElementsAreArray({2, 4, 5, 6, 8, 10}));
}

TEST(SortedVectorTypes, TestSetInsertionDupsOneByOne) {
  auto s = makeVectorOfWrappers<CountCopyCtor, int>({6, 4, 8, 2});

  sorted_vector_set<CountCopyCtor> vset(s.begin(), s.end());
  check_invariant(vset);

  // Add an unsorted range that will have to be merged in.
  s = makeVectorOfWrappers<CountCopyCtor, int>({10, 6, 5, 2});

  for (const auto& elem : s) {
    vset.insert(elem);
  }
  check_invariant(vset);
  EXPECT_EQ(vset.rbegin()->count_, 3);
  EXPECT_THAT(
      extractValues(vset), testing::ElementsAreArray({2, 4, 5, 6, 8, 10}));
}

TEST(SortedVectorTypes, TestSetBulkInsertionSortNoMerge) {
  auto s = makeVectorOfWrappers<CountCopyCtor, int>({6, 4, 8, 2});

  sorted_vector_set<CountCopyCtor> vset(s.begin(), s.end());
  check_invariant(vset);

  // Add an unsorted range that will not have to be merged in.
  s = makeVectorOfWrappers<CountCopyCtor, int>({20, 15, 16, 13});

  vset.insert(s.begin(), s.end());
  check_invariant(vset);
  EXPECT_EQ(vset.rbegin()->count_, 1);
  EXPECT_THAT(
      extractValues(vset),
      testing::ElementsAreArray({2, 4, 6, 8, 13, 15, 16, 20}));
}

TEST(SortedVectorTypes, TestSetBulkInsertionNoSortMerge) {
  auto s = makeVectorOfWrappers<CountCopyCtor, int>({6, 4, 8, 2});

  sorted_vector_set<CountCopyCtor> vset(s.begin(), s.end());
  check_invariant(vset);

  // Add a sorted range that will have to be merged in.
  s = makeVectorOfWrappers<CountCopyCtor, int>({1, 3, 5, 9});

  vset.insert(s.begin(), s.end());
  check_invariant(vset);
  EXPECT_EQ(vset.rbegin()->count_, 1);
  EXPECT_THAT(
      extractValues(vset), testing::ElementsAreArray({1, 2, 3, 4, 5, 6, 8, 9}));
}

TEST(SortedVectorTypes, TestSetBulkInsertionNoSortNoMerge) {
  auto s = makeVectorOfWrappers<CountCopyCtor, int>({6, 4, 8, 2});

  sorted_vector_set<CountCopyCtor> vset(s.begin(), s.end());
  check_invariant(vset);

  // Add a sorted range that will not have to be merged in.
  s = makeVectorOfWrappers<CountCopyCtor, int>({21, 22, 23, 24});

  vset.insert(s.begin(), s.end());
  check_invariant(vset);
  EXPECT_EQ(vset.rbegin()->count_, 1);
  EXPECT_THAT(
      extractValues(vset),
      testing::ElementsAreArray({2, 4, 6, 8, 21, 22, 23, 24}));
}

TEST(SortedVectorTypes, TestSetBulkInsertionEmptyRange) {
  std::vector<CountCopyCtor> s;
  EXPECT_TRUE(s.empty());

  // insertion of empty range into empty container.
  sorted_vector_set<CountCopyCtor> vset(s.begin(), s.end());
  check_invariant(vset);

  s = makeVectorOfWrappers<CountCopyCtor, int>({6, 4, 8, 2});

  vset.insert(s.begin(), s.end());

  // insertion of empty range into non-empty container.
  s.clear();
  vset.insert(s.begin(), s.end());
  check_invariant(vset);

  EXPECT_THAT(extractValues(vset), testing::ElementsAreArray({2, 4, 6, 8}));
}

// This is a test of compilation - the behavior has already been tested
// extensively above.
TEST(SortedVectorTypes, TestBulkInsertionUncopyableTypes) {
  std::vector<std::pair<int, std::unique_ptr<int>>> s;
  s.emplace_back(1, std::make_unique<int>(0));

  sorted_vector_map<int, std::unique_ptr<int>> vmap(
      std::make_move_iterator(s.begin()), std::make_move_iterator(s.end()));

  s.clear();
  s.emplace_back(3, std::make_unique<int>(0));
  vmap.insert(
      std::make_move_iterator(s.begin()), std::make_move_iterator(s.end()));
}

// A moveable and copyable struct, which we use to make sure that no copy
// operations are performed during bulk insertion if moving is an option.
struct Movable {
  int x_;
  explicit Movable(int x) : x_(x) {}
  Movable(const Movable&) {
    ADD_FAILURE() << "Copy ctor should not be called";
  }
  Movable& operator=(const Movable&) {
    ADD_FAILURE() << "Copy assignment should not be called";
    return *this;
  }

  Movable(Movable&&) = default;
  Movable& operator=(Movable&&) = default;
};

TEST(SortedVectorTypes, TestBulkInsertionMovableTypes) {
  std::vector<std::pair<int, Movable>> s;
  s.emplace_back(3, Movable(2));
  s.emplace_back(1, Movable(0));

  sorted_vector_map<int, Movable> vmap(
      std::make_move_iterator(s.begin()), std::make_move_iterator(s.end()));

  s.clear();
  s.emplace_back(4, Movable(3));
  s.emplace_back(2, Movable(1));
  vmap.insert(
      std::make_move_iterator(s.begin()), std::make_move_iterator(s.end()));
}

TEST(SortedVectorTypes, TestSetCreationFromVector) {
  std::vector<int> vec = {3, 1, -1, 5, 0};
  sorted_vector_set<int> vset(std::move(vec));
  check_invariant(vset);
  EXPECT_THAT(vset, testing::ElementsAreArray({-1, 0, 1, 3, 5}));
}

TEST(SortedVectorTypes, TestMapCreationFromVector) {
  std::vector<std::pair<int, int>> vec = {
      {3, 1}, {1, 5}, {-1, 2}, {5, 3}, {0, 3}};
  sorted_vector_map<int, int> vmap(std::move(vec));
  check_invariant(vmap);
  auto contents = std::vector<std::pair<int, int>>(vmap.begin(), vmap.end());
  auto expected_contents = std::vector<std::pair<int, int>>({
      {-1, 2}, {0, 3}, {1, 5}, {3, 1}, {5, 3},
  });
  EXPECT_EQ(contents, expected_contents);
}
