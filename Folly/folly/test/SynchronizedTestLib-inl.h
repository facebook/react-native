/*
 * Copyright 2012-present Facebook, Inc.
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

#pragma once

#include <folly/Random.h>
#include <folly/Synchronized.h>
#include <folly/container/Foreach.h>
#include <folly/portability/GTest.h>
#include <glog/logging.h>
#include <algorithm>
#include <condition_variable>
#include <functional>
#include <map>
#include <random>
#include <thread>
#include <vector>

namespace folly {
namespace sync_tests {

inline std::mt19937& getRNG() {
  static const auto seed = folly::randomNumberSeed();
  static std::mt19937 rng(seed);
  return rng;
}

void randomSleep(std::chrono::milliseconds min, std::chrono::milliseconds max) {
  std::uniform_int_distribution<> range(min.count(), max.count());
  std::chrono::milliseconds duration(range(getRNG()));
  /* sleep override */
  std::this_thread::sleep_for(duration);
}

/*
 * Run a functon simultaneously in a number of different threads.
 *
 * The function will be passed the index number of the thread it is running in.
 * This function makes an attempt to synchronize the start of the threads as
 * best as possible.  It waits for all threads to be allocated and started
 * before invoking the function.
 */
template <class Function>
void runParallel(size_t numThreads, const Function& function) {
  std::vector<std::thread> threads;
  threads.reserve(numThreads);

  // Variables used to synchronize all threads to try and start them
  // as close to the same time as possible
  folly::Synchronized<size_t, std::mutex> threadsReady(0);
  std::condition_variable readyCV;
  folly::Synchronized<bool, std::mutex> go(false);
  std::condition_variable goCV;

  auto worker = [&](size_t threadIndex) {
    // Signal that we are ready
    ++(*threadsReady.lock());
    readyCV.notify_one();

    // Wait until we are given the signal to start
    // The purpose of this is to try and make sure all threads start
    // as close to the same time as possible.
    {
      auto lockedGo = go.lock();
      goCV.wait(lockedGo.getUniqueLock(), [&] { return *lockedGo; });
    }

    function(threadIndex);
  };

  // Start all of the threads
  for (size_t threadIndex = 0; threadIndex < numThreads; ++threadIndex) {
    threads.emplace_back([threadIndex, &worker]() { worker(threadIndex); });
  }

  // Wait for all threads to become ready
  {
    auto readyLocked = threadsReady.lock();
    readyCV.wait(readyLocked.getUniqueLock(), [&] {
      return *readyLocked == numThreads;
    });
  }
  // Now signal the threads that they can go
  go = true;
  goCV.notify_all();

  // Wait for all threads to finish
  for (auto& thread : threads) {
    thread.join();
  }
}

// testBasic() version for shared lock types
template <class Mutex>
typename std::enable_if<folly::LockTraits<Mutex>::is_shared>::type
testBasicImpl() {
  folly::Synchronized<std::vector<int>, Mutex> obj;
  const auto& constObj = obj;

  obj.wlock()->resize(1000);

  folly::Synchronized<std::vector<int>, Mutex> obj2{*obj.wlock()};
  EXPECT_EQ(1000, obj2.rlock()->size());

  {
    auto lockedObj = obj.wlock();
    lockedObj->push_back(10);
    EXPECT_EQ(1001, lockedObj->size());
    EXPECT_EQ(10, lockedObj->back());
    EXPECT_EQ(1000, obj2.wlock()->size());
    EXPECT_EQ(1000, obj2.rlock()->size());

    {
      auto unlocker = lockedObj.scopedUnlock();
      EXPECT_EQ(1001, obj.wlock()->size());
    }
  }

  {
    auto lockedObj = obj.rlock();
    EXPECT_EQ(1001, lockedObj->size());
    EXPECT_EQ(1001, obj.rlock()->size());
    {
      auto unlocker = lockedObj.scopedUnlock();
      EXPECT_EQ(1001, obj.wlock()->size());
    }
  }

  obj.wlock()->front() = 2;

  {
    // contextualLock() on a const reference should grab a shared lock
    auto lockedObj = constObj.contextualLock();
    EXPECT_EQ(2, lockedObj->front());
    EXPECT_EQ(2, constObj.rlock()->front());
    EXPECT_EQ(2, obj.rlock()->front());
  }

  EXPECT_EQ(1001, obj.rlock()->size());
  EXPECT_EQ(2, obj.rlock()->front());
  EXPECT_EQ(10, obj.rlock()->back());
  EXPECT_EQ(1000, obj2.rlock()->size());
}

// testBasic() version for non-shared lock types
template <class Mutex>
typename std::enable_if<!folly::LockTraits<Mutex>::is_shared>::type
testBasicImpl() {
  folly::Synchronized<std::vector<int>, Mutex> obj;
  const auto& constObj = obj;

  obj.lock()->resize(1000);

  folly::Synchronized<std::vector<int>, Mutex> obj2{*obj.lock()};
  EXPECT_EQ(1000, obj2.lock()->size());

  {
    auto lockedObj = obj.lock();
    lockedObj->push_back(10);
    EXPECT_EQ(1001, lockedObj->size());
    EXPECT_EQ(10, lockedObj->back());
    EXPECT_EQ(1000, obj2.lock()->size());

    {
      auto unlocker = lockedObj.scopedUnlock();
      EXPECT_EQ(1001, obj.lock()->size());
    }
  }
  {
    auto lockedObj = constObj.lock();
    EXPECT_EQ(1001, lockedObj->size());
    EXPECT_EQ(10, lockedObj->back());
    EXPECT_EQ(1000, obj2.lock()->size());
  }

  obj.lock()->front() = 2;

  EXPECT_EQ(1001, obj.lock()->size());
  EXPECT_EQ(2, obj.lock()->front());
  EXPECT_EQ(2, obj.contextualLock()->front());
  EXPECT_EQ(10, obj.lock()->back());
  EXPECT_EQ(1000, obj2.lock()->size());
}

template <class Mutex>
void testBasic() {
  testBasicImpl<Mutex>();
}

// testWithLock() version for shared lock types
template <class Mutex>
typename std::enable_if<folly::LockTraits<Mutex>::is_shared>::type
testWithLock() {
  folly::Synchronized<std::vector<int>, Mutex> obj;
  const auto& constObj = obj;

  // Test withWLock() and withRLock()
  obj.withWLock([](std::vector<int>& lockedObj) {
    lockedObj.resize(1000);
    lockedObj.push_back(10);
    lockedObj.push_back(11);
  });
  obj.withWLock([](const std::vector<int>& lockedObj) {
    EXPECT_EQ(1002, lockedObj.size());
  });
  obj.withRLock([](const std::vector<int>& lockedObj) {
    EXPECT_EQ(1002, lockedObj.size());
    EXPECT_EQ(11, lockedObj.back());
  });
  constObj.withRLock([](const std::vector<int>& lockedObj) {
    EXPECT_EQ(1002, lockedObj.size());
  });

#if __cpp_generic_lambdas >= 201304
  obj.withWLock([](auto& lockedObj) { lockedObj.push_back(12); });
  obj.withWLock(
      [](const auto& lockedObj) { EXPECT_EQ(1003, lockedObj.size()); });
  obj.withRLock([](const auto& lockedObj) {
    EXPECT_EQ(1003, lockedObj.size());
    EXPECT_EQ(12, lockedObj.back());
  });
  constObj.withRLock(
      [](const auto& lockedObj) { EXPECT_EQ(1003, lockedObj.size()); });
  obj.withWLock([](auto& lockedObj) { lockedObj.pop_back(); });
#endif

  // Test withWLockPtr() and withRLockPtr()
  using SynchType = folly::Synchronized<std::vector<int>, Mutex>;
#if __cpp_generic_lambdas >= 201304
  obj.withWLockPtr([](auto&& lockedObj) { lockedObj->push_back(13); });
  obj.withRLockPtr([](auto&& lockedObj) {
    EXPECT_EQ(1003, lockedObj->size());
    EXPECT_EQ(13, lockedObj->back());
  });
  constObj.withRLockPtr([](auto&& lockedObj) {
    EXPECT_EQ(1003, lockedObj->size());
    EXPECT_EQ(13, lockedObj->back());
  });
  obj.withWLockPtr([&](auto&& lockedObj) {
    lockedObj->push_back(14);
    {
      auto unlocker = lockedObj.scopedUnlock();
      obj.wlock()->push_back(15);
    }
    EXPECT_EQ(15, lockedObj->back());
  });
#else
  obj.withWLockPtr([](typename SynchType::LockedPtr&& lockedObj) {
    lockedObj->push_back(13);
    lockedObj->push_back(14);
    lockedObj->push_back(15);
  });
#endif

  obj.withWLockPtr([](typename SynchType::LockedPtr&& lockedObj) {
    lockedObj->push_back(16);
    EXPECT_EQ(1006, lockedObj->size());
  });
  obj.withRLockPtr([](typename SynchType::ConstLockedPtr&& lockedObj) {
    EXPECT_EQ(1006, lockedObj->size());
    EXPECT_EQ(16, lockedObj->back());
  });
  constObj.withRLockPtr([](typename SynchType::ConstLockedPtr&& lockedObj) {
    EXPECT_EQ(1006, lockedObj->size());
    EXPECT_EQ(16, lockedObj->back());
  });
}

// testWithLock() version for non-shared lock types
template <class Mutex>
typename std::enable_if<!folly::LockTraits<Mutex>::is_shared>::type
testWithLock() {
  folly::Synchronized<std::vector<int>, Mutex> obj;

  // Test withLock()
  obj.withLock([](std::vector<int>& lockedObj) {
    lockedObj.resize(1000);
    lockedObj.push_back(10);
    lockedObj.push_back(11);
  });
  obj.withLock([](const std::vector<int>& lockedObj) {
    EXPECT_EQ(1002, lockedObj.size());
  });

#if __cpp_generic_lambdas >= 201304
  obj.withLock([](auto& lockedObj) { lockedObj.push_back(12); });
  obj.withLock(
      [](const auto& lockedObj) { EXPECT_EQ(1003, lockedObj.size()); });
  obj.withLock([](auto& lockedObj) { lockedObj.pop_back(); });
#endif

  // Test withLockPtr()
  using SynchType = folly::Synchronized<std::vector<int>, Mutex>;
#if __cpp_generic_lambdas >= 201304
  obj.withLockPtr([](auto&& lockedObj) { lockedObj->push_back(13); });
  obj.withLockPtr([](auto&& lockedObj) {
    EXPECT_EQ(1003, lockedObj->size());
    EXPECT_EQ(13, lockedObj->back());
  });
  obj.withLockPtr([&](auto&& lockedObj) {
    lockedObj->push_back(14);
    {
      auto unlocker = lockedObj.scopedUnlock();
      obj.lock()->push_back(15);
    }
    EXPECT_EQ(1005, lockedObj->size());
    EXPECT_EQ(15, lockedObj->back());
  });
#else
  obj.withLockPtr([](typename SynchType::LockedPtr&& lockedObj) {
    lockedObj->push_back(13);
    lockedObj->push_back(14);
    lockedObj->push_back(15);
  });
#endif

  obj.withLockPtr([](typename SynchType::LockedPtr&& lockedObj) {
    lockedObj->push_back(16);
    EXPECT_EQ(1006, lockedObj->size());
  });
  const auto& constObj = obj;
  constObj.withLockPtr([](typename SynchType::ConstLockedPtr&& lockedObj) {
    EXPECT_EQ(1006, lockedObj->size());
    EXPECT_EQ(16, lockedObj->back());
  });
}

template <class Mutex>
void testUnlockCommon() {
  folly::Synchronized<int, Mutex> value{7};
  const auto& cv = value;

  {
    auto lv = value.contextualLock();
    EXPECT_EQ(7, *lv);
    *lv = 5;
    lv.unlock();
    EXPECT_TRUE(lv.isNull());
    EXPECT_FALSE(lv);

    auto rlv = cv.contextualLock();
    EXPECT_EQ(5, *rlv);
    rlv.unlock();
    EXPECT_TRUE(rlv.isNull());
    EXPECT_FALSE(rlv);

    auto rlv2 = cv.contextualRLock();
    EXPECT_EQ(5, *rlv2);
    rlv2.unlock();

    lv = value.contextualLock();
    EXPECT_EQ(5, *lv);
    *lv = 9;
  }

  EXPECT_EQ(9, *value.contextualRLock());
}

// testUnlock() version for shared lock types
template <class Mutex>
typename std::enable_if<folly::LockTraits<Mutex>::is_shared>::type
testUnlock() {
  folly::Synchronized<int, Mutex> value{10};
  {
    auto lv = value.wlock();
    EXPECT_EQ(10, *lv);
    *lv = 5;
    lv.unlock();
    EXPECT_FALSE(lv);
    EXPECT_TRUE(lv.isNull());

    auto rlv = value.rlock();
    EXPECT_EQ(5, *rlv);
    rlv.unlock();
    EXPECT_FALSE(rlv);
    EXPECT_TRUE(rlv.isNull());

    auto lv2 = value.wlock();
    EXPECT_EQ(5, *lv2);
    *lv2 = 7;

    lv = std::move(lv2);
    EXPECT_FALSE(lv2);
    EXPECT_TRUE(lv2.isNull());
    EXPECT_FALSE(lv.isNull());
    EXPECT_EQ(7, *lv);
  }

  testUnlockCommon<Mutex>();
}

// testUnlock() version for non-shared lock types
template <class Mutex>
typename std::enable_if<!folly::LockTraits<Mutex>::is_shared>::type
testUnlock() {
  folly::Synchronized<int, Mutex> value{10};
  {
    auto lv = value.lock();
    EXPECT_EQ(10, *lv);
    *lv = 5;
    lv.unlock();
    EXPECT_TRUE(lv.isNull());
    EXPECT_FALSE(lv);

    auto lv2 = value.lock();
    EXPECT_EQ(5, *lv2);
    *lv2 = 6;
    lv2.unlock();
    EXPECT_TRUE(lv2.isNull());
    EXPECT_FALSE(lv2);

    lv = value.lock();
    EXPECT_EQ(6, *lv);
    *lv = 7;

    lv2 = std::move(lv);
    EXPECT_TRUE(lv.isNull());
    EXPECT_FALSE(lv);
    EXPECT_FALSE(lv2.isNull());
    EXPECT_EQ(7, *lv2);
  }

  testUnlockCommon<Mutex>();
}

// Testing the deprecated SYNCHRONIZED and SYNCHRONIZED_CONST APIs
template <class Mutex>
void testDeprecated() {
  folly::Synchronized<std::vector<int>, Mutex> obj;

  obj->resize(1000);

  auto obj2 = obj;
  EXPECT_EQ(1000, obj2->size());

  SYNCHRONIZED(obj) {
    obj.push_back(10);
    EXPECT_EQ(1001, obj.size());
    EXPECT_EQ(10, obj.back());
    EXPECT_EQ(1000, obj2->size());
  }

  SYNCHRONIZED_CONST(obj) {
    EXPECT_EQ(1001, obj.size());
  }

  SYNCHRONIZED(lockedObj, *&obj) {
    lockedObj.front() = 2;
  }

  EXPECT_EQ(1001, obj->size());
  EXPECT_EQ(10, obj->back());
  EXPECT_EQ(1000, obj2->size());

  EXPECT_EQ(FB_ARG_2_OR_1(1, 2), 2);
  EXPECT_EQ(FB_ARG_2_OR_1(1), 1);
}

template <class Mutex>
void testConcurrency() {
  folly::Synchronized<std::vector<int>, Mutex> v;
  static const size_t numThreads = 100;
  // Note: I initially tried using itersPerThread = 1000,
  // which works fine for most lock types, but std::shared_timed_mutex
  // appears to be extraordinarily slow.  It could take around 30 seconds
  // to run this test with 1000 iterations per thread using shared_timed_mutex.
  static const size_t itersPerThread = 100;

  auto pushNumbers = [&](size_t threadIdx) {
    // Test lock()
    for (size_t n = 0; n < itersPerThread; ++n) {
      v.contextualLock()->push_back((itersPerThread * threadIdx) + n);
      std::this_thread::yield();
    }
  };
  runParallel(numThreads, pushNumbers);

  std::vector<int> result;
  v.swap(result);

  EXPECT_EQ(numThreads * itersPerThread, result.size());
  sort(result.begin(), result.end());

  for (size_t i = 0; i < itersPerThread * numThreads; ++i) {
    EXPECT_EQ(i, result[i]);
  }
}

template <class Mutex>
void testAcquireLocked() {
  folly::Synchronized<std::vector<int>, Mutex> v;
  folly::Synchronized<std::map<int, int>, Mutex> m;

  auto dualLockWorker = [&](size_t threadIdx) {
    // Note: this will be less awkward with C++ 17's structured
    // binding functionality, which will make it easier to use the returned
    // std::tuple.
    if (threadIdx & 1) {
      auto ret = acquireLocked(v, m);
      std::get<0>(ret)->push_back(threadIdx);
      (*std::get<1>(ret))[threadIdx] = threadIdx + 1;
    } else {
      auto ret = acquireLocked(m, v);
      std::get<1>(ret)->push_back(threadIdx);
      (*std::get<0>(ret))[threadIdx] = threadIdx + 1;
    }
  };
  static const size_t numThreads = 100;
  runParallel(numThreads, dualLockWorker);

  std::vector<int> result;
  v.swap(result);

  EXPECT_EQ(numThreads, result.size());
  sort(result.begin(), result.end());

  for (size_t i = 0; i < numThreads; ++i) {
    EXPECT_EQ(i, result[i]);
  }
}

template <class Mutex>
void testAcquireLockedWithConst() {
  folly::Synchronized<std::vector<int>, Mutex> v;
  folly::Synchronized<std::map<int, int>, Mutex> m;

  auto dualLockWorker = [&](size_t threadIdx) {
    const auto& cm = m;
    if (threadIdx & 1) {
      auto ret = acquireLocked(v, cm);
      (void)std::get<1>(ret)->size();
      std::get<0>(ret)->push_back(threadIdx);
    } else {
      auto ret = acquireLocked(cm, v);
      (void)std::get<0>(ret)->size();
      std::get<1>(ret)->push_back(threadIdx);
    }
  };
  static const size_t numThreads = 100;
  runParallel(numThreads, dualLockWorker);

  std::vector<int> result;
  v.swap(result);

  EXPECT_EQ(numThreads, result.size());
  sort(result.begin(), result.end());

  for (size_t i = 0; i < numThreads; ++i) {
    EXPECT_EQ(i, result[i]);
  }
}

// Testing the deprecated SYNCHRONIZED_DUAL API
template <class Mutex>
void testDualLocking() {
  folly::Synchronized<std::vector<int>, Mutex> v;
  folly::Synchronized<std::map<int, int>, Mutex> m;

  auto dualLockWorker = [&](size_t threadIdx) {
    if (threadIdx & 1) {
      SYNCHRONIZED_DUAL(lv, v, lm, m) {
        lv.push_back(threadIdx);
        lm[threadIdx] = threadIdx + 1;
      }
    } else {
      SYNCHRONIZED_DUAL(lm, m, lv, v) {
        lv.push_back(threadIdx);
        lm[threadIdx] = threadIdx + 1;
      }
    }
  };
  static const size_t numThreads = 100;
  runParallel(numThreads, dualLockWorker);

  std::vector<int> result;
  v.swap(result);

  EXPECT_EQ(numThreads, result.size());
  sort(result.begin(), result.end());

  for (size_t i = 0; i < numThreads; ++i) {
    EXPECT_EQ(i, result[i]);
  }
}

// Testing the deprecated SYNCHRONIZED_DUAL API
template <class Mutex>
void testDualLockingWithConst() {
  folly::Synchronized<std::vector<int>, Mutex> v;
  folly::Synchronized<std::map<int, int>, Mutex> m;

  auto dualLockWorker = [&](size_t threadIdx) {
    const auto& cm = m;
    if (threadIdx & 1) {
      SYNCHRONIZED_DUAL(lv, v, lm, cm) {
        (void)lm.size();
        lv.push_back(threadIdx);
      }
    } else {
      SYNCHRONIZED_DUAL(lm, cm, lv, v) {
        (void)lm.size();
        lv.push_back(threadIdx);
      }
    }
  };
  static const size_t numThreads = 100;
  runParallel(numThreads, dualLockWorker);

  std::vector<int> result;
  v.swap(result);

  EXPECT_EQ(numThreads, result.size());
  sort(result.begin(), result.end());

  for (size_t i = 0; i < numThreads; ++i) {
    EXPECT_EQ(i, result[i]);
  }
}

template <class Mutex>
void testTimed() {
  folly::Synchronized<std::vector<int>, Mutex> v;
  folly::Synchronized<uint64_t, Mutex> numTimeouts;

  auto worker = [&](size_t threadIdx) {
    // Test directly using operator-> on the lock result
    v.contextualLock()->push_back(2 * threadIdx);

    // Test using lock with a timeout
    for (;;) {
      auto lv = v.contextualLock(std::chrono::milliseconds(5));
      if (!lv) {
        ++(*numTimeouts.contextualLock());
        continue;
      }

      // Sleep for a random time to ensure we trigger timeouts
      // in other threads
      randomSleep(std::chrono::milliseconds(5), std::chrono::milliseconds(15));
      lv->push_back(2 * threadIdx + 1);
      break;
    }
  };

  static const size_t numThreads = 100;
  runParallel(numThreads, worker);

  std::vector<int> result;
  v.swap(result);

  EXPECT_EQ(2 * numThreads, result.size());
  sort(result.begin(), result.end());

  for (size_t i = 0; i < 2 * numThreads; ++i) {
    EXPECT_EQ(i, result[i]);
  }
  // We generally expect a large number of number timeouts here.
  // I'm not adding a check for it since it's theoretically possible that
  // we might get 0 timeouts depending on the CPU scheduling if our threads
  // don't get to run very often.
  LOG(INFO) << "testTimed: " << *numTimeouts.contextualRLock() << " timeouts";

  // Make sure we can lock with various timeout duration units
  {
    auto lv = v.contextualLock(std::chrono::milliseconds(5));
    EXPECT_TRUE(bool(lv));
    EXPECT_FALSE(lv.isNull());
    auto lv2 = v.contextualLock(std::chrono::microseconds(5));
    // We may or may not acquire lv2 successfully, depending on whether
    // or not this is a recursive mutex type.
  }
  {
    auto lv = v.contextualLock(std::chrono::seconds(1));
    EXPECT_TRUE(bool(lv));
  }
}

template <class Mutex>
void testTimedShared() {
  folly::Synchronized<std::vector<int>, Mutex> v;
  folly::Synchronized<uint64_t, Mutex> numTimeouts;

  auto worker = [&](size_t threadIdx) {
    // Test directly using operator-> on the lock result
    v.wlock()->push_back(threadIdx);

    // Test lock() with a timeout
    for (;;) {
      auto lv = v.rlock(std::chrono::milliseconds(10));
      if (!lv) {
        ++(*numTimeouts.contextualLock());
        continue;
      }

      // Sleep while holding the lock.
      //
      // This will block other threads from acquiring the write lock to add
      // their thread index to v, but it won't block threads that have entered
      // the for loop and are trying to acquire a read lock.
      //
      // For lock types that give preference to readers rather than writers,
      // this will tend to serialize all threads on the wlock() above.
      randomSleep(std::chrono::milliseconds(5), std::chrono::milliseconds(15));
      auto found = std::find(lv->begin(), lv->end(), threadIdx);
      CHECK(found != lv->end());
      break;
    }
  };

  static const size_t numThreads = 100;
  runParallel(numThreads, worker);

  std::vector<int> result;
  v.swap(result);

  EXPECT_EQ(numThreads, result.size());
  sort(result.begin(), result.end());

  for (size_t i = 0; i < numThreads; ++i) {
    EXPECT_EQ(i, result[i]);
  }
  // We generally expect a small number of timeouts here.
  // For locks that give readers preference over writers this should usually
  // be 0.  With locks that give writers preference we do see a small-ish
  // number of read timeouts.
  LOG(INFO) << "testTimedShared: " << *numTimeouts.contextualRLock()
            << " timeouts";
}

// Testing the deprecated TIMED_SYNCHRONIZED API
template <class Mutex>
void testTimedSynchronized() {
  folly::Synchronized<std::vector<int>, Mutex> v;
  folly::Synchronized<uint64_t, Mutex> numTimeouts;

  auto worker = [&](size_t threadIdx) {
    // Test operator->
    v->push_back(2 * threadIdx);

    // Aaand test the TIMED_SYNCHRONIZED macro
    for (;;) {
      TIMED_SYNCHRONIZED(5, lv, v) {
        if (lv) {
          // Sleep for a random time to ensure we trigger timeouts
          // in other threads
          randomSleep(
              std::chrono::milliseconds(5), std::chrono::milliseconds(15));
          lv->push_back(2 * threadIdx + 1);
          return;
        }

        ++(*numTimeouts.contextualLock());
      }
    }
  };

  static const size_t numThreads = 100;
  runParallel(numThreads, worker);

  std::vector<int> result;
  v.swap(result);

  EXPECT_EQ(2 * numThreads, result.size());
  sort(result.begin(), result.end());

  for (size_t i = 0; i < 2 * numThreads; ++i) {
    EXPECT_EQ(i, result[i]);
  }
  // We generally expect a large number of number timeouts here.
  // I'm not adding a check for it since it's theoretically possible that
  // we might get 0 timeouts depending on the CPU scheduling if our threads
  // don't get to run very often.
  LOG(INFO) << "testTimedSynchronized: " << *numTimeouts.contextualRLock()
            << " timeouts";
}

// Testing the deprecated TIMED_SYNCHRONIZED_CONST API
template <class Mutex>
void testTimedSynchronizedWithConst() {
  folly::Synchronized<std::vector<int>, Mutex> v;
  folly::Synchronized<uint64_t, Mutex> numTimeouts;

  auto worker = [&](size_t threadIdx) {
    // Test operator->
    v->push_back(threadIdx);

    // Test TIMED_SYNCHRONIZED_CONST
    for (;;) {
      TIMED_SYNCHRONIZED_CONST(10, lv, v) {
        if (lv) {
          // Sleep while holding the lock.
          //
          // This will block other threads from acquiring the write lock to add
          // their thread index to v, but it won't block threads that have
          // entered the for loop and are trying to acquire a read lock.
          //
          // For lock types that give preference to readers rather than writers,
          // this will tend to serialize all threads on the wlock() above.
          randomSleep(
              std::chrono::milliseconds(5), std::chrono::milliseconds(15));
          auto found = std::find(lv->begin(), lv->end(), threadIdx);
          CHECK(found != lv->end());
          return;
        } else {
          ++(*numTimeouts.contextualLock());
        }
      }
    }
  };

  static const size_t numThreads = 100;
  runParallel(numThreads, worker);

  std::vector<int> result;
  v.swap(result);

  EXPECT_EQ(numThreads, result.size());
  sort(result.begin(), result.end());

  for (size_t i = 0; i < numThreads; ++i) {
    EXPECT_EQ(i, result[i]);
  }
  // We generally expect a small number of timeouts here.
  // For locks that give readers preference over writers this should usually
  // be 0.  With locks that give writers preference we do see a small-ish
  // number of read timeouts.
  LOG(INFO) << "testTimedSynchronizedWithConst: "
            << *numTimeouts.contextualRLock() << " timeouts";
}

template <class Mutex>
void testConstCopy() {
  std::vector<int> input = {1, 2, 3};
  const folly::Synchronized<std::vector<int>, Mutex> v(input);

  std::vector<int> result;

  v.copy(&result);
  EXPECT_EQ(input, result);

  result = v.copy();
  EXPECT_EQ(input, result);
}

struct NotCopiableNotMovable {
  NotCopiableNotMovable(int, const char*) {}
  NotCopiableNotMovable(const NotCopiableNotMovable&) = delete;
  NotCopiableNotMovable& operator=(const NotCopiableNotMovable&) = delete;
  NotCopiableNotMovable(NotCopiableNotMovable&&) = delete;
  NotCopiableNotMovable& operator=(NotCopiableNotMovable&&) = delete;
};

template <class Mutex>
void testInPlaceConstruction() {
  // This won't compile without in_place
  folly::Synchronized<NotCopiableNotMovable> a(folly::in_place, 5, "a");
}

template <class Mutex>
void testExchange() {
  std::vector<int> input = {1, 2, 3};
  folly::Synchronized<std::vector<int>, Mutex> v(input);
  std::vector<int> next = {4, 5, 6};
  auto prev = v.exchange(std::move(next));
  EXPECT_EQ((std::vector<int>{{1, 2, 3}}), prev);
  EXPECT_EQ((std::vector<int>{{4, 5, 6}}), v.copy());
}
} // namespace sync_tests
} // namespace folly
