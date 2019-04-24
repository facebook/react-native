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

#include <folly/concurrency/ConcurrentHashMap.h>

#include <atomic>
#include <memory>
#include <thread>

#include <folly/hash/Hash.h>
#include <folly/portability/GTest.h>
#include <folly/test/DeterministicSchedule.h>

using namespace folly::test;
using namespace folly;
using namespace std;

DEFINE_int64(seed, 0, "Seed for random number generators");

TEST(ConcurrentHashMap, MapTest) {
  ConcurrentHashMap<uint64_t, uint64_t> foomap(3);
  foomap.max_load_factor(1.05);
  EXPECT_TRUE(foomap.empty());
  EXPECT_EQ(foomap.find(1), foomap.cend());
  auto r = foomap.insert(1, 0);
  EXPECT_TRUE(r.second);
  auto r2 = foomap.insert(1, 0);
  EXPECT_EQ(r.first->second, 0);
  EXPECT_EQ(r.first->first, 1);
  EXPECT_EQ(r2.first->second, 0);
  EXPECT_EQ(r2.first->first, 1);
  EXPECT_EQ(r.first, r2.first);
  EXPECT_TRUE(r.second);
  EXPECT_FALSE(r2.second);
  EXPECT_FALSE(foomap.empty());
  EXPECT_TRUE(foomap.insert(std::make_pair(2, 0)).second);
  EXPECT_TRUE(foomap.insert_or_assign(2, 0).second);
  EXPECT_TRUE(foomap.assign_if_equal(2, 0, 3));
  EXPECT_TRUE(foomap.insert(3, 0).second);
  EXPECT_NE(foomap.find(1), foomap.cend());
  EXPECT_NE(foomap.find(2), foomap.cend());
  EXPECT_EQ(foomap.find(2)->second, 3);
  EXPECT_EQ(foomap[2], 3);
  EXPECT_EQ(foomap[20], 0);
  EXPECT_EQ(foomap.at(20), 0);
  EXPECT_FALSE(foomap.insert(1, 0).second);
  auto l = foomap.find(1);
  foomap.erase(l);
  EXPECT_FALSE(foomap.erase(1));
  EXPECT_EQ(foomap.find(1), foomap.cend());
  auto res = foomap.find(2);
  EXPECT_NE(res, foomap.cend());
  EXPECT_EQ(3, res->second);
  EXPECT_FALSE(foomap.empty());
  foomap.clear();
  EXPECT_TRUE(foomap.empty());
}

TEST(ConcurrentHashMap, MaxSizeTest) {
  ConcurrentHashMap<uint64_t, uint64_t> foomap(2, 16);
  bool insert_failed = false;
  for (int i = 0; i < 32; i++) {
    auto res = foomap.insert(0, 0);
    if (!res.second) {
      insert_failed = true;
    }
  }
  EXPECT_TRUE(insert_failed);
}

TEST(ConcurrentHashMap, MoveTest) {
  ConcurrentHashMap<uint64_t, uint64_t> foomap(2, 16);
  auto other = std::move(foomap);
  auto other2 = std::move(other);
  other = std::move(other2);
}

struct foo {
  static int moved;
  static int copied;
  foo(foo&&) noexcept {
    moved++;
  }
  foo& operator=(foo&&) {
    moved++;
    return *this;
  }
  foo& operator=(const foo&) {
    copied++;
    return *this;
  }
  foo(const foo&) {
    copied++;
  }
  foo() {}
};
int foo::moved{0};
int foo::copied{0};

TEST(ConcurrentHashMap, EmplaceTest) {
  ConcurrentHashMap<uint64_t, foo> foomap(200);
  foo bar; // Make sure to test copy
  foomap.insert(1, bar);
  EXPECT_EQ(foo::moved, 0);
  EXPECT_EQ(foo::copied, 1);
  foo::copied = 0;
  // The difference between emplace and try_emplace:
  // If insertion fails, try_emplace does not move its argument
  foomap.try_emplace(1, foo());
  EXPECT_EQ(foo::moved, 0);
  EXPECT_EQ(foo::copied, 0);
  foomap.emplace(1, foo());
  EXPECT_EQ(foo::moved, 1);
  EXPECT_EQ(foo::copied, 0);
}

TEST(ConcurrentHashMap, MapResizeTest) {
  ConcurrentHashMap<uint64_t, uint64_t> foomap(2);
  EXPECT_EQ(foomap.find(1), foomap.cend());
  EXPECT_TRUE(foomap.insert(1, 0).second);
  EXPECT_TRUE(foomap.insert(2, 0).second);
  EXPECT_TRUE(foomap.insert(3, 0).second);
  EXPECT_TRUE(foomap.insert(4, 0).second);
  foomap.reserve(512);
  EXPECT_NE(foomap.find(1), foomap.cend());
  EXPECT_NE(foomap.find(2), foomap.cend());
  EXPECT_FALSE(foomap.insert(1, 0).second);
  EXPECT_TRUE(foomap.erase(1));
  EXPECT_EQ(foomap.find(1), foomap.cend());
  auto res = foomap.find(2);
  EXPECT_NE(res, foomap.cend());
  if (res != foomap.cend()) {
    EXPECT_EQ(0, res->second);
  }
}

// Ensure we can insert objects without copy constructors.
TEST(ConcurrentHashMap, MapNoCopiesTest) {
  struct Uncopyable {
    int i_;
    Uncopyable(int i) {
      i_ = i;
    }
    Uncopyable(const Uncopyable& that) = delete;
    bool operator==(const Uncopyable& o) const {
      return i_ == o.i_;
    }
  };
  struct Hasher {
    size_t operator()(const Uncopyable&) const {
      return 0;
    }
  };
  ConcurrentHashMap<Uncopyable, Uncopyable, Hasher> foomap(2);
  EXPECT_TRUE(foomap.try_emplace(1, 1).second);
  EXPECT_TRUE(foomap.try_emplace(2, 2).second);
  auto res = foomap.find(2);
  EXPECT_NE(res, foomap.cend());

  EXPECT_TRUE(foomap.try_emplace(3, 3).second);

  auto res2 = foomap.find(2);
  EXPECT_NE(res2, foomap.cend());
  EXPECT_EQ(&(res->second), &(res2->second));
}

TEST(ConcurrentHashMap, MapMovableKeysTest) {
  struct Movable {
    int i_;
    Movable(int i) {
      i_ = i;
    }
    Movable(const Movable&) = delete;
    Movable(Movable&& o) {
      i_ = o.i_;
      o.i_ = 0;
    }
    bool operator==(const Movable& o) const {
      return i_ == o.i_;
    }
  };
  struct Hasher {
    size_t operator()(const Movable&) const {
      return 0;
    }
  };
  ConcurrentHashMap<Movable, Movable, Hasher> foomap(2);
  EXPECT_TRUE(foomap.insert(std::make_pair(Movable(10), Movable(1))).second);
  EXPECT_TRUE(foomap.assign(Movable(10), Movable(2)));
  EXPECT_TRUE(foomap.insert(Movable(11), Movable(1)).second);
  EXPECT_TRUE(foomap.emplace(Movable(12), Movable(1)).second);
  EXPECT_TRUE(foomap.insert_or_assign(Movable(10), Movable(3)).second);
  EXPECT_TRUE(foomap.assign_if_equal(Movable(10), Movable(3), Movable(4)));
  EXPECT_FALSE(foomap.try_emplace(Movable(10), Movable(3)).second);
  EXPECT_TRUE(foomap.try_emplace(Movable(13), Movable(3)).second);
}

TEST(ConcurrentHashMap, MapUpdateTest) {
  ConcurrentHashMap<uint64_t, uint64_t> foomap(2);
  EXPECT_TRUE(foomap.insert(1, 10).second);
  EXPECT_TRUE(bool(foomap.assign(1, 11)));
  auto res = foomap.find(1);
  EXPECT_NE(res, foomap.cend());
  EXPECT_EQ(11, res->second);
}

TEST(ConcurrentHashMap, MapIterateTest2) {
  ConcurrentHashMap<uint64_t, uint64_t> foomap(2);
  auto begin = foomap.cbegin();
  auto end = foomap.cend();
  EXPECT_EQ(begin, end);
}

TEST(ConcurrentHashMap, MapIterateTest) {
  ConcurrentHashMap<uint64_t, uint64_t> foomap(2);
  EXPECT_EQ(foomap.cbegin(), foomap.cend());
  EXPECT_TRUE(foomap.insert(1, 1).second);
  EXPECT_TRUE(foomap.insert(2, 2).second);
  auto iter = foomap.cbegin();
  EXPECT_NE(iter, foomap.cend());
  EXPECT_EQ(iter->first, 1);
  EXPECT_EQ(iter->second, 1);
  ++iter;
  EXPECT_NE(iter, foomap.cend());
  EXPECT_EQ(iter->first, 2);
  EXPECT_EQ(iter->second, 2);
  ++iter;
  EXPECT_EQ(iter, foomap.cend());

  int count = 0;
  for (auto it = foomap.cbegin(); it != foomap.cend(); ++it) {
    count++;
  }
  EXPECT_EQ(count, 2);
}

TEST(ConcurrentHashMap, MoveIterateAssignIterate) {
  using Map = ConcurrentHashMap<int, int>;
  Map tmp;
  Map map{std::move(tmp)};

  map.insert(0, 0);
  ++map.cbegin();
  ConcurrentHashMap<int, int> other;
  other.insert(0, 0);
  map = std::move(other);
  ++map.cbegin();
}

TEST(ConcurrentHashMap, EraseTest) {
  ConcurrentHashMap<uint64_t, uint64_t> foomap(3);
  foomap.insert(1, 0);
  auto f1 = foomap.find(1);
  EXPECT_EQ(1, foomap.erase(1));
  foomap.erase(f1);
}

TEST(ConcurrentHashMap, CopyIterator) {
  ConcurrentHashMap<int, int> map;
  map.insert(0, 0);
  for (auto cit = map.cbegin(); cit != map.cend(); ++cit) {
    std::pair<int const, int> const ckv{0, 0};
    EXPECT_EQ(*cit, ckv);
  }
}

TEST(ConcurrentHashMap, EraseInIterateTest) {
  ConcurrentHashMap<uint64_t, uint64_t> foomap(3);
  for (uint64_t k = 0; k < 10; ++k) {
    foomap.insert(k, k);
  }
  EXPECT_EQ(10, foomap.size());
  for (auto it = foomap.cbegin(); it != foomap.cend();) {
    if (it->second > 3) {
      it = foomap.erase(it);
    } else {
      ++it;
    }
  }
  EXPECT_EQ(4, foomap.size());
  for (auto it = foomap.cbegin(); it != foomap.cend(); ++it) {
    EXPECT_GE(3, it->second);
  }
}

// TODO: hazptrs must support DeterministicSchedule

#define Atom std::atomic // DeterministicAtomic
#define Mutex std::mutex // DeterministicMutex
#define lib std // DeterministicSchedule
#define join t.join() // DeterministicSchedule::join(t)
// #define Atom DeterministicAtomic
// #define Mutex DeterministicMutex
// #define lib DeterministicSchedule
// #define join DeterministicSchedule::join(t)

TEST(ConcurrentHashMap, UpdateStressTest) {
  DeterministicSchedule sched(DeterministicSchedule::uniform(FLAGS_seed));

  // size must match iters for this test.
  unsigned size = 128 * 128;
  unsigned iters = size;
  ConcurrentHashMap<
      unsigned long,
      unsigned long,
      std::hash<unsigned long>,
      std::equal_to<unsigned long>,
      std::allocator<uint8_t>,
      8,
      Atom,
      Mutex>
      m(2);

  for (uint32_t i = 0; i < size; i++) {
    m.insert(i, i);
  }
  std::vector<std::thread> threads;
  unsigned int num_threads = 32;
  for (uint32_t t = 0; t < num_threads; t++) {
    threads.push_back(lib::thread([&, t]() {
      int offset = (iters * t / num_threads);
      for (uint32_t i = 0; i < iters / num_threads; i++) {
        unsigned long k = folly::hash::jenkins_rev_mix32((i + offset));
        k = k % (iters / num_threads) + offset;
        unsigned long val = 3;
        {
          auto res = m.find(k);
          EXPECT_NE(res, m.cend());
          EXPECT_EQ(k, res->second);
          auto r = m.assign(k, res->second);
          EXPECT_TRUE(r);
        }
        {
          auto res = m.find(k);
          EXPECT_NE(res, m.cend());
          EXPECT_EQ(k, res->second);
        }
        // Another random insertion to force table resizes
        val = size + i + offset;
        EXPECT_TRUE(m.insert(val, val).second);
      }
    }));
  }
  for (auto& t : threads) {
    join;
  }
}

TEST(ConcurrentHashMap, EraseStressTest) {
  DeterministicSchedule sched(DeterministicSchedule::uniform(FLAGS_seed));

  unsigned size = 2;
  unsigned iters = size * 128 * 2;
  ConcurrentHashMap<
      unsigned long,
      unsigned long,
      std::hash<unsigned long>,
      std::equal_to<unsigned long>,
      std::allocator<uint8_t>,
      8,
      Atom,
      Mutex>
      m(2);

  for (uint32_t i = 0; i < size; i++) {
    unsigned long k = folly::hash::jenkins_rev_mix32(i);
    m.insert(k, k);
  }
  std::vector<std::thread> threads;
  unsigned int num_threads = 32;
  for (uint32_t t = 0; t < num_threads; t++) {
    threads.push_back(lib::thread([&, t]() {
      int offset = (iters * t / num_threads);
      for (uint32_t i = 0; i < iters / num_threads; i++) {
        unsigned long k = folly::hash::jenkins_rev_mix32((i + offset));
        auto res = m.insert(k, k).second;
        if (res) {
          res = m.erase(k);
          if (!res) {
            printf("Faulre to erase thread %i val %li\n", t, k);
            exit(0);
          }
          EXPECT_TRUE(res);
        }
        res = m.insert(k, k).second;
        if (res) {
          res = bool(m.assign(k, k));
          if (!res) {
            printf("Thread %i update fail %li res%i\n", t, k, res);
            exit(0);
          }
          EXPECT_TRUE(res);
          auto result = m.find(k);
          if (result == m.cend()) {
            printf("Thread %i lookup fail %li\n", t, k);
            exit(0);
          }
          EXPECT_EQ(k, result->second);
        }
      }
    }));
  }
  for (auto& t : threads) {
    join;
  }
}

TEST(ConcurrentHashMap, IterateStressTest) {
  DeterministicSchedule sched(DeterministicSchedule::uniform(FLAGS_seed));

  unsigned size = 2;
  unsigned iters = size * 128 * 2;
  ConcurrentHashMap<
      unsigned long,
      unsigned long,
      std::hash<unsigned long>,
      std::equal_to<unsigned long>,
      std::allocator<uint8_t>,
      8,
      Atom,
      Mutex>
      m(2);

  for (uint32_t i = 0; i < size; i++) {
    unsigned long k = folly::hash::jenkins_rev_mix32(i);
    m.insert(k, k);
  }
  for (uint32_t i = 0; i < 10; i++) {
    m.insert(i, i);
  }
  std::vector<std::thread> threads;
  unsigned int num_threads = 32;
  for (uint32_t t = 0; t < num_threads; t++) {
    threads.push_back(lib::thread([&, t]() {
      int offset = (iters * t / num_threads);
      for (uint32_t i = 0; i < iters / num_threads; i++) {
        unsigned long k = folly::hash::jenkins_rev_mix32((i + offset));
        auto res = m.insert(k, k).second;
        if (res) {
          res = m.erase(k);
          if (!res) {
            printf("Faulre to erase thread %i val %li\n", t, k);
            exit(0);
          }
          EXPECT_TRUE(res);
        }
        int count = 0;
        for (auto it = m.cbegin(); it != m.cend(); ++it) {
          printf("Item is %li\n", it->first);
          if (it->first < 10) {
            count++;
          }
        }
        EXPECT_EQ(count, 10);
      }
    }));
  }
  for (auto& t : threads) {
    join;
  }
}

TEST(ConcurrentHashMap, insertStressTest) {
  DeterministicSchedule sched(DeterministicSchedule::uniform(FLAGS_seed));

  unsigned size = 2;
  unsigned iters = size * 64 * 4;
  ConcurrentHashMap<
      unsigned long,
      unsigned long,
      std::hash<unsigned long>,
      std::equal_to<unsigned long>,
      std::allocator<uint8_t>,
      8,
      Atom,
      Mutex>
      m(2);

  EXPECT_TRUE(m.insert(0, 0).second);
  EXPECT_FALSE(m.insert(0, 0).second);
  std::vector<std::thread> threads;
  unsigned int num_threads = 32;
  for (uint32_t t = 0; t < num_threads; t++) {
    threads.push_back(lib::thread([&, t]() {
      int offset = (iters * t / num_threads);
      for (uint32_t i = 0; i < iters / num_threads; i++) {
        auto var = offset + i + 1;
        EXPECT_TRUE(m.insert(var, var).second);
        EXPECT_FALSE(m.insert(0, 0).second);
      }
    }));
  }
  for (auto& t : threads) {
    join;
  }
}

TEST(ConcurrentHashMap, assignStressTest) {
  DeterministicSchedule sched(DeterministicSchedule::uniform(FLAGS_seed));

  unsigned size = 2;
  unsigned iters = size * 64 * 4;
  struct big_value {
    uint64_t v1;
    uint64_t v2;
    uint64_t v3;
    uint64_t v4;
    uint64_t v5;
    uint64_t v6;
    uint64_t v7;
    uint64_t v8;
    void set(uint64_t v) {
      v1 = v2 = v3 = v4 = v5 = v6 = v7 = v8 = v;
    }
    void check() const {
      auto v = v1;
      EXPECT_EQ(v, v8);
      EXPECT_EQ(v, v7);
      EXPECT_EQ(v, v6);
      EXPECT_EQ(v, v5);
      EXPECT_EQ(v, v4);
      EXPECT_EQ(v, v3);
      EXPECT_EQ(v, v2);
    }
  };
  ConcurrentHashMap<
      unsigned long,
      big_value,
      std::hash<unsigned long>,
      std::equal_to<unsigned long>,
      std::allocator<uint8_t>,
      8,
      Atom,
      Mutex>
      m(2);

  for (uint32_t i = 0; i < iters; i++) {
    big_value a;
    a.set(i);
    m.insert(i, a);
  }

  std::vector<std::thread> threads;
  unsigned int num_threads = 32;
  for (uint32_t t = 0; t < num_threads; t++) {
    threads.push_back(lib::thread([&]() {
      for (uint32_t i = 0; i < iters; i++) {
        auto res = m.find(i);
        EXPECT_NE(res, m.cend());
        res->second.check();
        big_value b;
        b.set(res->second.v1 + 1);
        m.assign(i, b);
      }
    }));
  }
  for (auto& t : threads) {
    join;
  }
}

TEST(ConcurrentHashMap, RefcountTest) {
  struct badhash {
    size_t operator()(uint64_t) const {
      return 0;
    }
  };
  ConcurrentHashMap<
      uint64_t,
      uint64_t,
      badhash,
      std::equal_to<uint64_t>,
      std::allocator<uint8_t>,
      0>
      foomap(3);
  foomap.insert(0, 0);
  foomap.insert(1, 1);
  foomap.insert(2, 2);
  for (int32_t i = 0; i < 300; ++i) {
    foomap.insert_or_assign(1, i);
  }
}

struct Wrapper {
  explicit Wrapper(bool& del_) : del(del_) {}
  ~Wrapper() {
    del = true;
  }

  bool& del;
};

TEST(ConcurrentHashMap, Deletion) {
  bool del{false};

  {
    ConcurrentHashMap<int, std::shared_ptr<Wrapper>> map;

    map.insert(0, std::make_shared<Wrapper>(del));
  }

  folly::hazptr_cleanup();

  EXPECT_TRUE(del);
}

TEST(ConcurrentHashMap, DeletionWithErase) {
  bool del{false};

  {
    ConcurrentHashMap<int, std::shared_ptr<Wrapper>> map;

    map.insert(0, std::make_shared<Wrapper>(del));
    map.erase(0);
  }

  folly::hazptr_cleanup();

  EXPECT_TRUE(del);
}

TEST(ConcurrentHashMap, DeletionWithIterator) {
  bool del{false};

  {
    ConcurrentHashMap<int, std::shared_ptr<Wrapper>> map;

    map.insert(0, std::make_shared<Wrapper>(del));
    auto it = map.find(0);
    map.erase(it);
  }

  folly::hazptr_cleanup();

  EXPECT_TRUE(del);
}

TEST(ConcurrentHashMap, DeletionWithForLoop) {
  bool del{false};

  {
    ConcurrentHashMap<int, std::shared_ptr<Wrapper>> map;

    map.insert(0, std::make_shared<Wrapper>(del));
    for (auto it = map.cbegin(); it != map.cend(); ++it) {
      EXPECT_EQ(it->first, 0);
    }
  }

  folly::hazptr_cleanup();

  EXPECT_TRUE(del);
}

TEST(ConcurrentHashMap, DeletionMultiple) {
  bool del1{false}, del2{false};

  {
    ConcurrentHashMap<int, std::shared_ptr<Wrapper>> map;

    map.insert(0, std::make_shared<Wrapper>(del1));
    map.insert(1, std::make_shared<Wrapper>(del2));
  }

  folly::hazptr_cleanup();

  EXPECT_TRUE(del1);
  EXPECT_TRUE(del2);
}

TEST(ConcurrentHashMap, DeletionAssigned) {
  bool del1{false}, del2{false};

  {
    ConcurrentHashMap<int, std::shared_ptr<Wrapper>> map;

    map.insert(0, std::make_shared<Wrapper>(del1));
    map.insert_or_assign(0, std::make_shared<Wrapper>(del2));
  }

  folly::hazptr_cleanup();

  EXPECT_TRUE(del1);
  EXPECT_TRUE(del2);
}

TEST(ConcurrentHashMap, DeletionMultipleMaps) {
  bool del1{false}, del2{false};

  {
    ConcurrentHashMap<int, std::shared_ptr<Wrapper>> map1;
    ConcurrentHashMap<int, std::shared_ptr<Wrapper>> map2;

    map1.insert(0, std::make_shared<Wrapper>(del1));
    map2.insert(0, std::make_shared<Wrapper>(del2));
  }

  folly::hazptr_cleanup();

  EXPECT_TRUE(del1);
  EXPECT_TRUE(del2);
}

TEST(ConcurrentHashMap, ForEachLoop) {
  ConcurrentHashMap<int, int> map;
  map.insert(1, 2);
  size_t iters = 0;
  for (const auto& kv : map) {
    EXPECT_EQ(kv.first, 1);
    EXPECT_EQ(kv.second, 2);
    ++iters;
  }
  EXPECT_EQ(iters, 1);
}

TEST(ConcurrentHashMap, IteratorMove) {
  using CHM = ConcurrentHashMap<int, int>;
  using Iter = CHM::ConstIterator;
  struct Foo {
    Iter it;
    explicit Foo(Iter&& it_) : it(std::move(it_)) {}
    Foo(Foo&&) = default;
    Foo& operator=(Foo&&) = default;
  };
  CHM map;
  int k = 111;
  int v = 999999;
  map.insert(k, v);
  Foo foo(map.find(k));
  ASSERT_EQ(foo.it->second, v);
  Foo foo2(map.find(0));
  foo2 = std::move(foo);
  ASSERT_EQ(foo2.it->second, v);
}
