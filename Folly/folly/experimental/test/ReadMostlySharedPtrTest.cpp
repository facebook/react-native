/*
 * Copyright 2015-present Facebook, Inc.
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
/* -*- Mode: C++; tab-width: 2; c-basic-offset: 2; indent-tabs-mode: nil -*- */

#include <atomic>
#include <condition_variable>
#include <mutex>
#include <thread>

#include <folly/Memory.h>
#include <folly/experimental/ReadMostlySharedPtr.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>

using folly::ReadMostlyMainPtr;
using folly::ReadMostlyMainPtrDeleter;
using folly::ReadMostlySharedPtr;
using folly::ReadMostlyWeakPtr;

// send SIGALRM to test process after this many seconds
const unsigned int TEST_TIMEOUT = 10;

class ReadMostlySharedPtrTest : public ::testing::Test {
 public:
  ReadMostlySharedPtrTest() {
    alarm(TEST_TIMEOUT);
  }
};

struct TestObject {
  int value;
  std::atomic<int>& counter;

  TestObject(int value_, std::atomic<int>& counter_)
      : value(value_), counter(counter_) {
    ++counter;
  }

  ~TestObject() {
    assert(counter.load() > 0);
    --counter;
  }
};

// One side calls requestAndWait(), the other side calls waitForRequest(),
// does something and calls completed().
class Coordinator {
 public:
  void requestAndWait() {
    requestBaton_.post();
    completeBaton_.wait();
  }

  void waitForRequest() {
    requestBaton_.wait();
  }

  void completed() {
    completeBaton_.post();
  }

 private:
  folly::Baton<> requestBaton_;
  folly::Baton<> completeBaton_;
};

TEST_F(ReadMostlySharedPtrTest, BasicStores) {
  ReadMostlyMainPtr<TestObject> ptr;

  // Store 1.
  std::atomic<int> cnt1{0};
  ptr.reset(std::make_unique<TestObject>(1, cnt1));
  EXPECT_EQ(1, cnt1.load());

  // Store 2, check that 1 is destroyed.
  std::atomic<int> cnt2{0};
  ptr.reset(std::make_unique<TestObject>(2, cnt2));
  EXPECT_EQ(1, cnt2.load());
  EXPECT_EQ(0, cnt1.load());

  // Store nullptr, check that 2 is destroyed.
  ptr.reset(nullptr);
  EXPECT_EQ(0, cnt2.load());
}

TEST_F(ReadMostlySharedPtrTest, BasicLoads) {
  std::atomic<int> cnt2{0};
  ReadMostlySharedPtr<TestObject> x;

  {
    ReadMostlyMainPtr<TestObject> ptr;

    // Check that ptr is initially nullptr.
    EXPECT_EQ(ptr.get(), nullptr);

    std::atomic<int> cnt1{0};
    ptr.reset(std::make_unique<TestObject>(1, cnt1));
    EXPECT_EQ(1, cnt1.load());

    x = ptr;
    EXPECT_EQ(1, x->value);

    ptr.reset(std::make_unique<TestObject>(2, cnt2));
    EXPECT_EQ(1, cnt2.load());
    EXPECT_EQ(1, cnt1.load());

    x = ptr;
    EXPECT_EQ(2, x->value);
    EXPECT_EQ(0, cnt1.load());

    ptr.reset(nullptr);
    EXPECT_EQ(1, cnt2.load());
  }

  EXPECT_EQ(1, cnt2.load());

  x.reset();
  EXPECT_EQ(0, cnt2.load());
}

TEST_F(ReadMostlySharedPtrTest, LoadsFromThreads) {
  std::atomic<int> cnt{0};

  {
    ReadMostlyMainPtr<TestObject> ptr;
    Coordinator loads[7];

    std::thread t1([&] {
      loads[0].waitForRequest();
      EXPECT_EQ(ptr.getShared(), nullptr);
      loads[0].completed();

      loads[3].waitForRequest();
      EXPECT_EQ(2, ptr.getShared()->value);
      loads[3].completed();

      loads[4].waitForRequest();
      EXPECT_EQ(4, ptr.getShared()->value);
      loads[4].completed();

      loads[5].waitForRequest();
      EXPECT_EQ(5, ptr.getShared()->value);
      loads[5].completed();
    });

    std::thread t2([&] {
      loads[1].waitForRequest();
      EXPECT_EQ(1, ptr.getShared()->value);
      loads[1].completed();

      loads[2].waitForRequest();
      EXPECT_EQ(2, ptr.getShared()->value);
      loads[2].completed();

      loads[6].waitForRequest();
      EXPECT_EQ(5, ptr.getShared()->value);
      loads[6].completed();
    });

    loads[0].requestAndWait();

    ptr.reset(std::make_unique<TestObject>(1, cnt));
    loads[1].requestAndWait();

    ptr.reset(std::make_unique<TestObject>(2, cnt));
    loads[2].requestAndWait();
    loads[3].requestAndWait();

    ptr.reset(std::make_unique<TestObject>(3, cnt));
    ptr.reset(std::make_unique<TestObject>(4, cnt));
    loads[4].requestAndWait();

    ptr.reset(std::make_unique<TestObject>(5, cnt));
    loads[5].requestAndWait();
    loads[6].requestAndWait();

    EXPECT_EQ(1, cnt.load());

    t1.join();
    t2.join();
  }

  EXPECT_EQ(0, cnt.load());
}

TEST_F(ReadMostlySharedPtrTest, Ctor) {
  std::atomic<int> cnt1{0};
  {
    ReadMostlyMainPtr<TestObject> ptr(std::make_unique<TestObject>(1, cnt1));

    EXPECT_EQ(1, ptr.getShared()->value);
  }

  EXPECT_EQ(0, cnt1.load());
}

TEST_F(ReadMostlySharedPtrTest, ClearingCache) {
  std::atomic<int> cnt1{0};
  std::atomic<int> cnt2{0};

  ReadMostlyMainPtr<TestObject> ptr;

  // Store 1.
  ptr.reset(std::make_unique<TestObject>(1, cnt1));

  Coordinator c;

  std::thread t([&] {
    // Cache the pointer for this thread.
    ptr.getShared();
    c.requestAndWait();
  });

  // Wait for the thread to cache pointer.
  c.waitForRequest();
  EXPECT_EQ(1, cnt1.load());

  // Store 2 and check that 1 is destroyed.
  ptr.reset(std::make_unique<TestObject>(2, cnt2));
  EXPECT_EQ(0, cnt1.load());

  // Unblock thread.
  c.completed();
  t.join();
}

size_t useGlobalCalls = 0;

class TestRefCount {
 public:
  ~TestRefCount() noexcept {
    DCHECK_EQ(count_.load(), 0);
  }

  int64_t operator++() noexcept {
    auto ret = ++count_;
    DCHECK_GT(ret, 0);
    return ret;
  }

  int64_t operator--() noexcept {
    auto ret = --count_;
    DCHECK_GE(ret, 0);
    return ret;
  }

  int64_t operator*() noexcept {
    return count_.load();
  }

  void useGlobal() {
    ++useGlobalCalls;
  }

  template <typename Container>
  static void useGlobal(const Container&) {
    ++useGlobalCalls;
  }

 private:
  std::atomic<int64_t> count_{1};
};

TEST_F(ReadMostlySharedPtrTest, ReadMostlyMainPtrDeleter) {
  EXPECT_EQ(0, useGlobalCalls);
  {
    ReadMostlyMainPtr<int, TestRefCount> ptr1(std::make_shared<int>(42));
    ReadMostlyMainPtr<int, TestRefCount> ptr2(std::make_shared<int>(42));
  }

  EXPECT_EQ(4, useGlobalCalls);

  useGlobalCalls = 0;
  {
    ReadMostlyMainPtr<int, TestRefCount> ptr1(std::make_shared<int>(42));
    ReadMostlyMainPtr<int, TestRefCount> ptr2(std::make_shared<int>(42));

    ReadMostlyMainPtrDeleter<TestRefCount> deleter;
    deleter.add(std::move(ptr1));
    deleter.add(std::move(ptr2));
  }

  EXPECT_EQ(1, useGlobalCalls);
}

TEST_F(ReadMostlySharedPtrTest, nullptr) {
  {
    ReadMostlyMainPtr<int, TestRefCount> nptr;
    EXPECT_TRUE(nptr == nullptr);
    EXPECT_TRUE(nullptr == nptr);
    EXPECT_EQ(nptr, nullptr);
    EXPECT_EQ(nullptr, nptr);
    EXPECT_FALSE(nptr);
    EXPECT_TRUE(!nptr);

    ReadMostlyMainPtr<int, TestRefCount> ptr(std::make_shared<int>(42));
    EXPECT_FALSE(ptr == nullptr);
    EXPECT_FALSE(nullptr == ptr);
    EXPECT_NE(ptr, nullptr);
    EXPECT_NE(nullptr, ptr);
    EXPECT_FALSE(!ptr);
    EXPECT_TRUE(ptr);
  }
  {
    ReadMostlySharedPtr<int, TestRefCount> nptr;
    EXPECT_TRUE(nptr == nullptr);
    EXPECT_TRUE(nullptr == nptr);
    EXPECT_EQ(nptr, nullptr);
    EXPECT_EQ(nullptr, nptr);
    EXPECT_FALSE(nptr);
    EXPECT_TRUE(!nptr);

    ReadMostlyMainPtr<int, TestRefCount> ptr(std::make_shared<int>(42));
    EXPECT_FALSE(ptr == nullptr);
    EXPECT_FALSE(nullptr == ptr);
    EXPECT_NE(ptr, nullptr);
    EXPECT_NE(nullptr, ptr);
    EXPECT_FALSE(!ptr);
    EXPECT_TRUE(ptr);
  }
}

TEST_F(ReadMostlySharedPtrTest, getStdShared) {
  const ReadMostlyMainPtr<int> rmmp1(std::make_shared<int>(42));

  ReadMostlyMainPtr<int> rmmp2;
  rmmp2.reset(rmmp1.getStdShared());

  const ReadMostlySharedPtr<int> rmsp1 = rmmp1.getShared();
  ReadMostlySharedPtr<int> rmsp2(rmsp1);

  // No conditions to check; we just wanted to ensure this compiles.
  SUCCEED();
}
