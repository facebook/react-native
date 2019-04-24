/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/IndexedMemPool.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Semaphore.h>
#include <folly/portability/Unistd.h>
#include <folly/test/DeterministicSchedule.h>

#include <string>
#include <thread>

using namespace folly;
using namespace folly::test;
using namespace testing;

TEST(IndexedMemPool, unique_ptr) {
  typedef IndexedMemPool<size_t> Pool;
  Pool pool(100);

  for (size_t i = 0; i < 100000; ++i) {
    auto ptr = pool.allocElem();
    EXPECT_TRUE(!!ptr);
    *ptr = i;
  }

  std::vector<Pool::UniquePtr> leak;
  while (true) {
    auto ptr = pool.allocElem();
    if (!ptr) {
      // good, we finally ran out
      break;
    }
    leak.emplace_back(std::move(ptr));
    EXPECT_LT(leak.size(), 10000u);
  }
}

TEST(IndexedMemPool, no_starvation) {
  const int count = 1000;
  const uint32_t poolSize = 100;

  typedef DeterministicSchedule Sched;
  Sched sched(Sched::uniform(0));

  typedef IndexedMemPool<int, 8, 8, DeterministicAtomic> Pool;
  Pool pool(poolSize);

  for (auto pass = 0; pass < 10; ++pass) {
    int fd[2];
    EXPECT_EQ(pipe(fd), 0);

    // makes sure we wait for available nodes, rather than fail allocIndex
    sem_t allocSem;
    sem_init(&allocSem, 0, poolSize);

    // this semaphore is only needed for deterministic replay, so that we
    // always block in an Sched:: operation rather than in a read() syscall
    sem_t readSem;
    sem_init(&readSem, 0, 0);

    std::thread produce = Sched::thread([&]() {
      for (auto i = 0; i < count; ++i) {
        Sched::wait(&allocSem);
        uint32_t idx = pool.allocIndex();
        EXPECT_NE(idx, 0u);
        EXPECT_LE(
            idx, poolSize + (pool.NumLocalLists - 1) * pool.LocalListLimit);
        pool[idx] = i;
        EXPECT_EQ(write(fd[1], &idx, sizeof(idx)), sizeof(idx));
        Sched::post(&readSem);
      }
    });

    std::thread consume = Sched::thread([&]() {
      for (auto i = 0; i < count; ++i) {
        uint32_t idx;
        Sched::wait(&readSem);
        EXPECT_EQ(read(fd[0], &idx, sizeof(idx)), sizeof(idx));
        EXPECT_NE(idx, 0);
        EXPECT_GE(idx, 1u);
        EXPECT_LE(
            idx, poolSize + (Pool::NumLocalLists - 1) * Pool::LocalListLimit);
        EXPECT_EQ(pool[idx], i);
        pool.recycleIndex(idx);
        Sched::post(&allocSem);
      }
    });

    Sched::join(produce);
    Sched::join(consume);
    close(fd[0]);
    close(fd[1]);
  }
}

TEST(IndexedMemPool, st_capacity) {
  // only one local list => capacity is exact
  typedef IndexedMemPool<int, 1, 32> Pool;
  Pool pool(10);

  EXPECT_EQ(pool.capacity(), 10u);
  EXPECT_EQ(Pool::maxIndexForCapacity(10), 10u);
  for (auto i = 0; i < 10; ++i) {
    EXPECT_NE(pool.allocIndex(), 0u);
  }
  EXPECT_EQ(pool.allocIndex(), 0u);
}

TEST(IndexedMemPool, mt_capacity) {
  typedef IndexedMemPool<int, 16, 32> Pool;
  Pool pool(1000);

  std::thread threads[10];
  for (auto i = 0; i < 10; ++i) {
    threads[i] = std::thread([&]() {
      for (auto j = 0; j < 100; ++j) {
        uint32_t idx = pool.allocIndex();
        EXPECT_NE(idx, 0u);
      }
    });
  }

  for (auto i = 0; i < 10; ++i) {
    threads[i].join();
  }

  for (auto i = 0; i < 16 * 32; ++i) {
    pool.allocIndex();
  }
  EXPECT_EQ(pool.allocIndex(), 0u);
}

TEST(IndexedMemPool, locate_elem) {
  IndexedMemPool<int> pool(1000);

  for (auto i = 0; i < 1000; ++i) {
    auto idx = pool.allocIndex();
    EXPECT_FALSE(idx == 0);
    int* elem = &pool[idx];
    EXPECT_TRUE(idx == pool.locateElem(elem));
  }

  EXPECT_EQ(pool.locateElem(nullptr), 0);
}

struct NonTrivialStruct {
  static FOLLY_TLS size_t count;

  size_t elem_;

  NonTrivialStruct() {
    elem_ = 0;
    ++count;
  }

  NonTrivialStruct(std::unique_ptr<std::string>&& arg1, size_t arg2) {
    elem_ = arg1->length() + arg2;
    ++count;
  }

  ~NonTrivialStruct() {
    --count;
  }
};

FOLLY_TLS size_t NonTrivialStruct::count;

TEST(IndexedMemPool, eager_recycle) {
  typedef IndexedMemPool<NonTrivialStruct> Pool;
  Pool pool(100);

  EXPECT_EQ(NonTrivialStruct::count, 0);

  for (size_t i = 0; i < 10; ++i) {
    {
      std::unique_ptr<std::string> arg{new std::string{"abc"}};
      auto ptr = pool.allocElem(std::move(arg), 100);
      EXPECT_EQ(NonTrivialStruct::count, 1);
      EXPECT_EQ(ptr->elem_, 103);
      EXPECT_TRUE(!!ptr);
    }
    EXPECT_EQ(NonTrivialStruct::count, 0);
  }
}

TEST(IndexedMemPool, late_recycle) {
  {
    using Pool = IndexedMemPool<
        NonTrivialStruct,
        8,
        8,
        std::atomic,
        IndexedMemPoolTraitsLazyRecycle<NonTrivialStruct>>;
    Pool pool(100);

    EXPECT_EQ(NonTrivialStruct::count, 0);

    for (size_t i = 0; i < 10; ++i) {
      {
        auto ptr = pool.allocElem();
        EXPECT_TRUE(NonTrivialStruct::count > 0);
        EXPECT_TRUE(!!ptr);
        ptr->elem_ = i;
      }
      EXPECT_TRUE(NonTrivialStruct::count > 0);
    }
  }
  EXPECT_EQ(NonTrivialStruct::count, 0);
}

TEST(IndexedMemPool, no_data_races) {
  const int count = 1000;
  const uint32_t poolSize = 100;
  const int nthreads = 10;

  using Pool = IndexedMemPool<int, 8, 8>;
  Pool pool(poolSize);

  std::vector<std::thread> thr(nthreads);
  for (auto i = 0; i < nthreads; ++i) {
    thr[i] = std::thread([&]() {
      for (auto j = 0; j < count; ++j) {
        uint32_t idx = pool.allocIndex();
        EXPECT_NE(idx, 0u);
        EXPECT_LE(
            idx, poolSize + (pool.NumLocalLists - 1) * pool.LocalListLimit);
        pool[idx] = j;
        pool.recycleIndex(idx);
      }
    });
  }
  for (auto& t : thr) {
    t.join();
  }
}

std::atomic<int> cnum{0};
std::atomic<int> dnum{0};

TEST(IndexedMemPool, construction_destruction) {
  struct Foo {
    Foo() {
      cnum.fetch_add(1);
    }
    ~Foo() {
      dnum.fetch_add(1);
    }
  };

  std::atomic<bool> start{false};
  std::atomic<int> started{0};

  using Pool = IndexedMemPool<
      Foo,
      1,
      1,
      std::atomic,
      IndexedMemPoolTraitsLazyRecycle<Foo>>;
  int nthreads = 20;
  int count = 1000;

  {
    Pool pool(2);
    std::vector<std::thread> thr(nthreads);
    for (auto i = 0; i < nthreads; ++i) {
      thr[i] = std::thread([&]() {
        started.fetch_add(1);
        while (!start.load()) {
          ;
        }
        for (auto j = 0; j < count; ++j) {
          uint32_t idx = pool.allocIndex();
          if (idx != 0) {
            pool.recycleIndex(idx);
          }
        }
      });
    }

    while (started.load() < nthreads) {
      ;
    }
    start.store(true);

    for (auto& t : thr) {
      t.join();
    }
  }

  CHECK_EQ(cnum.load(), dnum.load());
}

/// Global Traits mock. It can't be a regular (non-global) mock because we
/// don't have access to the instance.
struct MockTraits {
  static MockTraits* instance;

  MockTraits() {
    instance = this;
  }

  ~MockTraits() {
    instance = nullptr;
  }

  MOCK_METHOD2(onAllocate, void(std::string*, std::string));
  MOCK_METHOD1(onRecycle, void(std::string*));

  struct Forwarder {
    static void initialize(std::string* ptr) {
      new (ptr) std::string();
    }

    static void cleanup(std::string* ptr) {
      using std::string;
      ptr->~string();
    }

    static void onAllocate(std::string* ptr, std::string s) {
      instance->onAllocate(ptr, s);
    }

    static void onRecycle(std::string* ptr) {
      instance->onRecycle(ptr);
    }
  };
};

MockTraits* MockTraits::instance;

using TraitsTestPool =
    IndexedMemPool<std::string, 1, 1, std::atomic, MockTraits::Forwarder>;

void testTraits(TraitsTestPool& pool) {
  MockTraits traits;
  const std::string* elem = nullptr;
  EXPECT_CALL(traits, onAllocate(_, _))
      .WillOnce(Invoke([&](std::string* s, auto) {
        EXPECT_FALSE(pool.isAllocated(pool.locateElem(s)));
        elem = s;
      }));
  std::string* ptr = pool.allocElem("foo").release();
  EXPECT_EQ(ptr, elem);

  elem = nullptr;
  EXPECT_CALL(traits, onRecycle(_)).WillOnce(Invoke([&](std::string* s) {
    EXPECT_FALSE(pool.isAllocated(pool.locateElem(s)));
    elem = s;
  }));
  pool.recycleIndex(pool.locateElem(ptr));
  EXPECT_EQ(ptr, elem);
}

// Test that Traits is used when both local and global lists are empty.
TEST(IndexedMemPool, use_traits_empty) {
  TraitsTestPool pool(10);
  testTraits(pool);
}

// Test that Traits is used when allocating from a local list.
TEST(IndexedMemPool, use_traits_local_list) {
  TraitsTestPool pool(10);
  MockTraits traits;
  EXPECT_CALL(traits, onAllocate(_, _));
  // Allocate and immediately recycle an element to populate the local list.
  pool.allocElem("");
  testTraits(pool);
}

// Test that Traits is used when allocating from a global list.
TEST(IndexedMemPool, use_traits_global_list) {
  TraitsTestPool pool(10);
  MockTraits traits;
  EXPECT_CALL(traits, onAllocate(_, _)).Times(2);
  auto global = pool.allocElem("");
  // Allocate and immediately recycle an element to fill the local list.
  pool.allocElem("");
  // Recycle an element to populate the global list.
  global.reset();
  testTraits(pool);
}

// Test that IndexedMemPool works with incomplete element types.
struct IncompleteTestElement;
using IncompleteTestPool = IndexedMemPool<IncompleteTestElement>;
