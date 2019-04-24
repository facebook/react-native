/*
 * Copyright 2018-present Facebook, Inc.
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
#include <thread>

#include <boost/thread.hpp>
#include <folly/Random.h>
#include <folly/SpinLock.h>
#include <folly/experimental/FlatCombiningPriorityQueue.h>
#include <folly/experimental/RelaxedConcurrentPriorityQueue.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>
#include <folly/test/DeterministicSchedule.h>
#include <glog/logging.h>

using namespace folly;

DEFINE_bool(bench, false, "run benchmark");
DEFINE_int32(reps, 1, "number of reps");
DEFINE_int64(ops, 32, "number of operations per rep");
DEFINE_int64(elems, 64, "number of elements");

static std::vector<int> nthr = {1, 2, 4, 8};
// threads number
static uint32_t nthreads;

template <class PriorityQueue>
void basicOpsTest() {
  int res;
  PriorityQueue pq;

  EXPECT_TRUE(pq.empty());
  EXPECT_EQ(pq.size(), 0);
  pq.push(1);
  pq.push(2);
  pq.push(3);

  EXPECT_FALSE(pq.empty());
  EXPECT_EQ(pq.size(), 3);
  pq.pop(res);
  EXPECT_EQ(res, 3);
  pq.pop(res);
  EXPECT_EQ(res, 2);
  pq.pop(res);
  EXPECT_EQ(res, 1);
  EXPECT_TRUE(pq.empty());
  EXPECT_EQ(pq.size(), 0);

  pq.push(3);
  pq.push(2);
  pq.push(1);

  pq.pop(res);
  EXPECT_EQ(res, 3);
  pq.pop(res);
  EXPECT_EQ(res, 2);
  pq.pop(res);
  EXPECT_EQ(res, 1);
  EXPECT_TRUE(pq.empty());
  EXPECT_EQ(pq.size(), 0);
}

TEST(CPQ, BasicOpsTest) {
  // Spinning
  basicOpsTest<RelaxedConcurrentPriorityQueue<int, false, true>>();
  // Strict
  basicOpsTest<RelaxedConcurrentPriorityQueue<int, false, true, 0>>();
  basicOpsTest<RelaxedConcurrentPriorityQueue<int, false, true, 0, 1>>();
  basicOpsTest<RelaxedConcurrentPriorityQueue<int, false, true, 0, 3>>();
  // Relaxed
  basicOpsTest<RelaxedConcurrentPriorityQueue<int, false, true, 1, 1>>();
  basicOpsTest<RelaxedConcurrentPriorityQueue<int, false, true, 2, 1>>();
  basicOpsTest<RelaxedConcurrentPriorityQueue<int, false, true, 3, 3>>();
  // Blocking
  basicOpsTest<RelaxedConcurrentPriorityQueue<int, true, true>>();
  basicOpsTest<RelaxedConcurrentPriorityQueue<int, true, true, 0>>();
  basicOpsTest<RelaxedConcurrentPriorityQueue<int, true, true, 2>>();
}

/// execute the function for nthreads
template <typename Func>
static uint64_t run_once(const Func& fn) {
  boost::barrier barrier_start{nthreads + 1};
  std::vector<std::thread> threads(nthreads);
  for (uint32_t tid = 0; tid < nthreads; ++tid) {
    threads[tid] = std::thread([&, tid] {
      barrier_start.wait();
      fn(tid);
    });
  }

  barrier_start.wait(); // start the execution
  auto tbegin = std::chrono::steady_clock::now();
  for (auto& t : threads) {
    t.join();
  }

  // end time measurement
  uint64_t duration = 0;
  auto tend = std::chrono::steady_clock::now();
  duration = std::chrono::duration_cast<std::chrono::nanoseconds>(tend - tbegin)
                 .count();
  return duration;
}

template <class PriorityQueue>
void singleThreadTest() {
  PriorityQueue pq;

  folly::Random::DefaultGenerator rng;
  rng.seed(FLAGS_elems);
  uint64_t expect_sum = 0;
  // random push
  for (int i = 0; i < FLAGS_elems; i++) {
    int val = folly::Random::rand32(rng) % FLAGS_elems + 1;
    expect_sum += val;
    pq.push(val);
  }

  int val = 0;
  int counter = 0;
  uint64_t sum = 0;
  while (counter < FLAGS_elems) {
    pq.pop(val);
    sum += val;
    counter++;
  }

  EXPECT_EQ(sum, expect_sum);
}

TEST(CPQ, SingleThrStrictImplTest) {
  // spinning
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, false, false, 0>>();
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, false, false, 0, 1>>();
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, false, false, 0, 8>>();
  // blocking
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, true, false, 0>>();
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, true, false, 0, 1>>();
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, true, false, 0, 8>>();
}

TEST(CPQ, SingleThrRelaxedImplTest) {
  // spinning
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, false, false, 1>>();
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, false, false, 8>>();
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, false, false, 8, 2>>();
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, false, false, 8, 8>>();
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, false, false, 2, 128>>();
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, false, false, 100, 8>>();
  // blocking
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, true, false, 1>>();
  singleThreadTest<RelaxedConcurrentPriorityQueue<int, true, false, 8>>();
}

/// concurrent pop should made the queue empty
/// with executing the eaqual elements pop function
template <class PriorityQueue>
void concurrentPopforSharedBuffer() {
  for (int t : nthr) {
    PriorityQueue pq;

    folly::Random::DefaultGenerator rng;
    rng.seed(FLAGS_elems);
    uint64_t check_sum = 0;
    // random push
    for (int i = 0; i < FLAGS_elems; i++) {
      int val = folly::Random::rand32(rng) % FLAGS_elems + 1;
      pq.push(val);
      check_sum += val;
    }

    std::atomic<uint64_t> pop_sum(0);
    std::atomic<int> to_end(0);

    nthreads = t;
    auto fn = [&](uint32_t tid) {
      int val = tid;
      while (true) {
        int index = to_end.fetch_add(1, std::memory_order_acq_rel);
        if (index < FLAGS_elems) {
          pq.pop(val);
        } else {
          break;
        }
        pop_sum.fetch_add(val, std::memory_order_acq_rel);
      }
    };
    run_once(fn);
    // check the sum of returned values of successful pop
    EXPECT_EQ(pop_sum, check_sum);
  }
}

TEST(CPQ, ConcurrentPopStrictImplTest) {
  // spinning
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, false, false, 0>>();
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, false, false, 0, 1>>();
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, false, false, 0, 128>>();
  // blocking
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, true, false, 0>>();
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, true, false, 0, 1>>();
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, true, false, 0, 128>>();
}

TEST(CPQ, ConcurrentPopRelaxedImplTest) {
  // spinning
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, false, false>>();
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, false, false, 1, 8>>();
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, false, false, 8, 2>>();
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, false, false, 128, 2>>();
  // blocking
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, true, false, 1>>();
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, true, false, 128>>();
  concurrentPopforSharedBuffer<
      RelaxedConcurrentPriorityQueue<int, true, false, 8, 128>>();
}

/// executing fixed number of push, counting the
/// element number & total value.
template <class PriorityQueue>
void concurrentPush() {
  for (int t : nthr) {
    PriorityQueue pq;
    std::atomic<uint64_t> counter_sum(0);
    nthreads = t;

    auto fn = [&](uint32_t tid) {
      folly::Random::DefaultGenerator rng;
      rng.seed(tid);
      uint64_t local_sum = 0;
      for (int i = tid; i < FLAGS_elems; i += nthreads) {
        int val = folly::Random::rand32(rng) % FLAGS_elems + 1;
        local_sum += val;
        pq.push(val);
      }
      counter_sum.fetch_add(local_sum, std::memory_order_acq_rel);
    };
    run_once(fn);

    // check the total number of elements
    uint64_t actual_sum = 0;
    for (int i = 0; i < FLAGS_elems; i++) {
      int res = 0;
      pq.pop(res);
      actual_sum += res;
    }
    EXPECT_EQ(actual_sum, counter_sum);
  }
}

TEST(CPQ, ConcurrentPushStrictImplTest) {
  concurrentPush<RelaxedConcurrentPriorityQueue<int, false, false, 0>>();
  concurrentPush<RelaxedConcurrentPriorityQueue<int, false, false, 0, 8>>();
  concurrentPush<RelaxedConcurrentPriorityQueue<int, false, false, 0, 128>>();
}

TEST(CPQ, ConcurrentPushRelaxedImplTest) {
  concurrentPush<RelaxedConcurrentPriorityQueue<int, false, false>>();
  concurrentPush<RelaxedConcurrentPriorityQueue<int, false, false, 1, 8>>();
  concurrentPush<RelaxedConcurrentPriorityQueue<int, false, false, 2, 128>>();
  concurrentPush<RelaxedConcurrentPriorityQueue<int, false, false, 128, 8>>();
  concurrentPush<RelaxedConcurrentPriorityQueue<int, false, false, 8, 8>>();
}

template <class PriorityQueue>
void concurrentOps(int ops) {
  for (int t : nthr) {
    PriorityQueue pq;
    std::atomic<uint64_t> counter_push(0);
    std::atomic<uint64_t> counter_pop(0);
    nthreads = t;

    boost::barrier rb0{nthreads};
    boost::barrier rb1{nthreads};
    boost::barrier rb2{nthreads};
    std::atomic<int> to_end(0);

    auto fn = [&](uint32_t tid) {
      folly::Random::DefaultGenerator rng;
      rng.seed(tid);
      uint64_t local_push = 0;
      uint64_t local_pop = 0;
      int res;

      /// initialize the queue
      for (int i = tid; i < FLAGS_elems; i += nthreads) {
        int val = folly::Random::rand32(rng) % FLAGS_elems + 1;
        local_push++;
        pq.push(val);
      }
      rb0.wait();

      /// operations
      for (int i = 0; i < ops; i++) {
        if (ops % 2 == 0) {
          int val = folly::Random::rand32(rng) % FLAGS_elems + 1;
          local_push++;
          pq.push(val);
        } else {
          pq.pop(res);
          local_pop++;
        }
      }
      rb1.wait();
      // collecting the ops info for checking purpose
      counter_push.fetch_add(local_push, std::memory_order_seq_cst);
      counter_pop.fetch_add(local_pop, std::memory_order_seq_cst);
      rb2.wait();
      /// clean up work
      uint64_t r = counter_push.load(std::memory_order_seq_cst) -
          counter_pop.load(std::memory_order_seq_cst);
      while (true) {
        uint64_t index = to_end.fetch_add(1, std::memory_order_acq_rel);
        if (index < r) {
          pq.pop(res);
        } else {
          break;
        }
      }
    };
    run_once(fn);
    // the total push and pop ops should be the same
  }
}

template <class PriorityQueue>
void concurrentSizeTest(int ops) {
  for (int t : nthr) {
    PriorityQueue pq;
    nthreads = t;
    EXPECT_TRUE(pq.empty());
    auto fn = [&](uint32_t tid) {
      folly::Random::DefaultGenerator rng;
      rng.seed(tid);
      uint64_t local_push = 0;
      int res;

      /// initialize the queue
      for (int i = tid; i < FLAGS_elems; i += nthreads) {
        int val = folly::Random::rand32(rng) % FLAGS_elems + 1;
        local_push++;
        pq.push(val);
      }

      /// operations
      for (int i = 0; i < ops; i++) {
        int val = folly::Random::rand32(rng) % FLAGS_elems + 1;
        pq.push(val);
        pq.pop(res);
      }
    };
    run_once(fn);
    // the total push and pop ops should be the same
    EXPECT_EQ(pq.size(), FLAGS_elems);
  }
}

static std::vector<int> sizes = {0, 1024};

TEST(CPQ, ConcurrentMixedStrictImplTest) {
  for (auto size : sizes) {
    concurrentOps<RelaxedConcurrentPriorityQueue<int, false, false, 0>>(size);
    concurrentOps<RelaxedConcurrentPriorityQueue<int, false, false, 0, 1>>(
        size);
    concurrentOps<RelaxedConcurrentPriorityQueue<int, false, false, 0, 32>>(
        size);
  }
}

TEST(CPQ, ConcurrentMixedRelaxedImplTest) {
  for (auto size : sizes) {
    concurrentOps<RelaxedConcurrentPriorityQueue<int, false, false>>(size);
    concurrentOps<RelaxedConcurrentPriorityQueue<int, false, false, 1, 32>>(
        size);
    concurrentOps<RelaxedConcurrentPriorityQueue<int, false, false, 32, 1>>(
        size);
    concurrentOps<RelaxedConcurrentPriorityQueue<int, false, false, 8, 8>>(
        size);
    concurrentOps<RelaxedConcurrentPriorityQueue<int, true, false, 8, 8>>(size);
  }
}

TEST(CPQ, StrictImplSizeTest) {
  for (auto size : sizes) {
    concurrentSizeTest<RelaxedConcurrentPriorityQueue<int, false, true, 0>>(
        size);
    concurrentSizeTest<RelaxedConcurrentPriorityQueue<int, true, true, 0>>(
        size);
  }
}

TEST(CPQ, RelaxedImplSizeTest) {
  for (auto size : sizes) {
    concurrentSizeTest<RelaxedConcurrentPriorityQueue<int, false, true>>(size);
    concurrentSizeTest<RelaxedConcurrentPriorityQueue<int, true, true, 2, 8>>(
        size);
    concurrentSizeTest<RelaxedConcurrentPriorityQueue<int, false, true, 8, 2>>(
        size);
  }
}

template <class PriorityQueue>
void multiPusherPopper(int PushThr, int PopThr) {
  int ops = FLAGS_ops;
  uint32_t total_threads = PushThr + PopThr;

  PriorityQueue pq;
  std::atomic<uint64_t> sum_push(0);
  std::atomic<uint64_t> sum_pop(0);

  auto fn_popthr = [&](uint32_t tid) {
    for (int i = tid; i < ops; i += PopThr) {
      int val;
      pq.pop(val);
      sum_pop.fetch_add(val, std::memory_order_acq_rel);
    }
  };

  auto fn_pushthr = [&](uint32_t tid) {
    folly::Random::DefaultGenerator rng_t;
    rng_t.seed(tid);
    for (int i = tid; i < ops; i += PushThr) {
      int val = folly::Random::rand32(rng_t);
      pq.push(val);
      sum_push.fetch_add(val, std::memory_order_acq_rel);
    }
  };
  boost::barrier barrier_start{total_threads + 1};

  std::vector<std::thread> threads_push(PushThr);
  for (int tid = 0; tid < PushThr; ++tid) {
    threads_push[tid] = std::thread([&, tid] {
      barrier_start.wait();
      fn_pushthr(tid);
    });
  }
  std::vector<std::thread> threads_pop(PopThr);
  for (int tid = 0; tid < PopThr; ++tid) {
    threads_pop[tid] = std::thread([&, tid] {
      barrier_start.wait();
      fn_popthr(tid);
    });
  }

  barrier_start.wait(); // start the execution
  // begin time measurement
  for (auto& t : threads_push) {
    t.join();
  }
  for (auto& t : threads_pop) {
    t.join();
  }
  EXPECT_EQ(sum_pop, sum_push);
}

TEST(CPQ, PusherPopperBlockingTest) {
  for (auto i : nthr) {
    for (auto j : nthr) {
      // Original
      multiPusherPopper<RelaxedConcurrentPriorityQueue<int, true, false, 0, 1>>(
          i, j);
      // Relaxed
      multiPusherPopper<RelaxedConcurrentPriorityQueue<int, true, false, 1, 8>>(
          i, j);
      multiPusherPopper<
          RelaxedConcurrentPriorityQueue<int, true, false, 8, 128>>(i, j);
      multiPusherPopper<
          RelaxedConcurrentPriorityQueue<int, true, false, 128, 8>>(i, j);
      multiPusherPopper<RelaxedConcurrentPriorityQueue<int, true, false>>(i, j);
      multiPusherPopper<
          RelaxedConcurrentPriorityQueue<int, true, false, 16, 16>>(i, j);
    }
  }
}

TEST(CPQ, PusherPopperSpinningTest) {
  for (auto i : nthr) {
    for (auto j : nthr) {
      // Original
      multiPusherPopper<
          RelaxedConcurrentPriorityQueue<int, false, false, 0, 1>>(i, j);
      // Relaxed
      multiPusherPopper<
          RelaxedConcurrentPriorityQueue<int, false, false, 1, 8>>(i, j);
      multiPusherPopper<
          RelaxedConcurrentPriorityQueue<int, false, false, 8, 128>>(i, j);
      multiPusherPopper<
          RelaxedConcurrentPriorityQueue<int, false, false, 128, 8>>(i, j);
      multiPusherPopper<RelaxedConcurrentPriorityQueue<int, false, false>>(
          i, j);
      multiPusherPopper<
          RelaxedConcurrentPriorityQueue<int, false, false, 16, 16>>(i, j);
    }
  }
}

template <class PriorityQueue>
void blockingFirst() {
  PriorityQueue pq;
  int nPop = 16;

  boost::barrier b{static_cast<unsigned int>(nPop + 1)};
  std::atomic<int> finished{0};

  std::vector<std::thread> threads_pop(nPop);
  for (int tid = 0; tid < nPop; ++tid) {
    threads_pop[tid] = std::thread([&] {
      int val;
      b.wait();
      pq.pop(val);
      finished.fetch_add(1, std::memory_order_acq_rel);
    });
  }

  b.wait();
  int c = 0;
  // push to Mound one by one
  // the popping threads should wake up one by one
  do {
    pq.push(1);
    c++;
    while (finished.load(std::memory_order_acquire) != c)
      ;
    EXPECT_EQ(finished.load(std::memory_order_acquire), c);
  } while (c < nPop);

  for (auto& t : threads_pop) {
    t.join();
  }
}

template <class PriorityQueue>
void concurrentBlocking() {
  uint32_t nThrs = 16;

  for (int iter = 0; iter < FLAGS_reps * 10; iter++) {
    PriorityQueue pq;
    boost::barrier b{static_cast<unsigned int>(nThrs + nThrs + 1)};
    std::atomic<uint32_t> finished{0};
    std::vector<std::thread> threads_pop(nThrs);
    for (uint32_t tid = 0; tid < nThrs; ++tid) {
      threads_pop[tid] = std::thread([&] {
        b.wait();
        int val;
        pq.pop(val);
        finished.fetch_add(1, std::memory_order_acq_rel);
      });
    }

    std::vector<std::thread> threads_push(nThrs);
    for (uint32_t tid = 0; tid < nThrs; ++tid) {
      threads_push[tid] = std::thread([&, tid] {
        b.wait();
        pq.push(tid);
        while (finished.load(std::memory_order_acquire) != nThrs)
          ;
        EXPECT_EQ(finished.load(std::memory_order_acquire), nThrs);
      });
    }

    b.wait();
    for (auto& t : threads_pop) {
      t.join();
    }
    for (auto& t : threads_push) {
      t.join();
    }
  }
}

TEST(CPQ, PopBlockingTest) {
  // strict
  blockingFirst<RelaxedConcurrentPriorityQueue<int, true, false, 0, 1>>();
  blockingFirst<RelaxedConcurrentPriorityQueue<int, true, false, 0, 16>>();
  // relaxed
  blockingFirst<RelaxedConcurrentPriorityQueue<int, true, false>>();
  blockingFirst<RelaxedConcurrentPriorityQueue<int, true, false, 8, 8>>();
  blockingFirst<RelaxedConcurrentPriorityQueue<int, true, false, 16, 1>>();
  // Spinning
  blockingFirst<RelaxedConcurrentPriorityQueue<int, false, false>>();
  blockingFirst<RelaxedConcurrentPriorityQueue<int, false, false, 8, 8>>();
  blockingFirst<RelaxedConcurrentPriorityQueue<int, false, false, 16, 1>>();
}

TEST(CPQ, MixedBlockingTest) {
  // strict
  concurrentBlocking<RelaxedConcurrentPriorityQueue<int, true, false, 0, 1>>();
  concurrentBlocking<RelaxedConcurrentPriorityQueue<int, true, false, 0, 16>>();
  // relaxed
  concurrentBlocking<RelaxedConcurrentPriorityQueue<int, true, false>>();
  concurrentBlocking<RelaxedConcurrentPriorityQueue<int, true, false, 8, 8>>();
  concurrentBlocking<RelaxedConcurrentPriorityQueue<int, true, false, 16, 1>>();
  // Spinning
  concurrentBlocking<RelaxedConcurrentPriorityQueue<int, false, false>>();
  concurrentBlocking<RelaxedConcurrentPriorityQueue<int, false, false, 8, 8>>();
  concurrentBlocking<
      RelaxedConcurrentPriorityQueue<int, false, false, 16, 1>>();
}

using DSched = folly::test::DeterministicSchedule;
using folly::test::DeterministicAtomic;
using folly::test::DeterministicMutex;

template <class PriorityQueue, template <typename> class Atom = std::atomic>
static void DSchedMixedTest() {
  for (int r = 0; r < FLAGS_reps; r++) {
    // the thread number is  32
    int thr = 8;
    PriorityQueue pq;
    folly::Random::DefaultGenerator rng;
    rng.seed(thr);
    uint64_t pre_sum = 0;
    uint64_t pre_size = 0;
    for (int i = 0; i < FLAGS_elems; i++) {
      int val = folly::Random::rand32(rng) % FLAGS_elems + 1;
      pq.push(val);
      pre_sum += val;
    }
    pre_size = FLAGS_elems;
    Atom<uint64_t> atom_push_sum{0};
    Atom<uint64_t> atom_pop_sum{0};
    std::vector<std::thread> threads(thr);
    for (int tid = 0; tid < thr; ++tid) {
      threads[tid] = DSched::thread([&]() {
        folly::Random::DefaultGenerator tl_rng;
        tl_rng.seed(thr);
        uint64_t pop_sum = 0;
        uint64_t push_sum = 0;
        for (int i = 0; i < FLAGS_ops; i++) {
          int val = folly::Random::rand32(tl_rng) % FLAGS_elems + 1;
          pq.push(val);
          push_sum += val;
          pq.pop(val);
          pop_sum += val;
        }
        atom_push_sum.fetch_add(push_sum, std::memory_order_acq_rel);
        atom_pop_sum.fetch_add(pop_sum, std::memory_order_acq_rel);
      });
    }

    for (auto& t : threads) {
      DSched::join(t);
    }

    // It checks the number of elements remain in Mound
    while (pre_size > 0) {
      pre_size--;
      int val = -1;
      pq.pop(val);
      atom_pop_sum += val;
    }
    // Check the accumulation of popped and pushed priorities
    EXPECT_EQ(atom_pop_sum, pre_sum + atom_push_sum);
  }
}

TEST(CPQ, DSchedMixedStrictTest) {
  DSched sched(DSched::uniform(0));
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          false,
          false,
          0,
          25,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          true,
          false,
          0,
          25,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          false,
          false,
          0,
          1,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          true,
          false,
          0,
          1,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          false,
          false,
          0,
          128,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          true,
          false,
          0,
          128,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
}

TEST(CPQ, DSchedMixedRelaxedTest) {
  DSched sched(DSched::uniform(0));
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          false,
          false,
          16,
          25,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          true,
          false,
          16,
          25,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          false,
          false,
          1,
          16,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          true,
          false,
          1,
          16,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          false,
          false,
          16,
          1,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          true,
          false,
          16,
          1,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          false,
          false,
          16,
          16,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
  DSchedMixedTest<
      RelaxedConcurrentPriorityQueue<
          int,
          true,
          false,
          16,
          16,
          DeterministicMutex,
          DeterministicAtomic>,
      DeterministicAtomic>();
}

template <typename T>
class Queue {
  std::queue<T> q_;

 public:
  void push(const T& val) {
    q_.push(val);
  }
  void pop(T& val) {
    val = q_.front();
    q_.pop();
  }
};

template <typename T>
class GlobalLockPQ {
  std::priority_queue<T> q_;
  std::mutex m_;

 public:
  void push(const T& val) {
    std::lock_guard<std::mutex> g(m_);
    q_.push(val);
  }
  void pop(T& val) {
    while (true) {
      std::lock_guard<std::mutex> g(m_);
      if (q_.empty()) {
        continue;
      }
      val = q_.top();
      q_.pop();
      return;
    }
  }
};

template <class PriorityQueue>
static uint64_t producer_consumer_test(
    std::string name,
    uint32_t PushThr,
    uint32_t PopThr,
    uint64_t initial_size) {
  int ops = 1 << 18;
  int reps = 15;
  if (name.find("RCPQ") != std::string::npos) {
    ops <<= 3;
  }
  uint64_t min = UINTMAX_MAX;
  uint64_t max = 0;
  uint64_t sum = 0;
  uint32_t total_threads = PushThr + PopThr;

  for (int r = 0; r < reps; ++r) {
    uint64_t dur;
    PriorityQueue pq;

    folly::Random::DefaultGenerator rng;
    rng.seed(initial_size);
    // initialize the queue according to initial_size
    for (uint64_t i = 0; i < initial_size; i++) {
      int val = folly::Random::rand32(rng) % ops;
      pq.push(val);
    }

    auto fn_popthr = [&](uint32_t tid) {
      for (int i = tid; i < ops; i += PopThr) {
        int val;
        pq.pop(val);
      }
    };

    auto fn_pushthr = [&](uint32_t tid) {
      folly::Random::DefaultGenerator rng_t;
      rng_t.seed(tid);
      for (int i = tid; i < ops; i += PushThr) {
        int val = folly::Random::rand32(rng_t) % ops;
        pq.push(val);
      }
    };
    boost::barrier barrier_start{total_threads + 1};
    std::vector<std::thread> threads_push(PushThr);
    for (uint32_t tid = 0; tid < PushThr; ++tid) {
      threads_push[tid] = std::thread([&, tid] {
        barrier_start.wait();
        fn_pushthr(tid);
      });
    }
    std::vector<std::thread> threads_pop(PopThr);
    for (uint32_t tid = 0; tid < PopThr; ++tid) {
      threads_pop[tid] = std::thread([&, tid] {
        barrier_start.wait();
        fn_popthr(tid);
      });
    }
    barrier_start.wait(); // start the execution
    // begin time measurement
    auto tbegin = std::chrono::steady_clock::now();
    for (auto& t : threads_push) {
      t.join();
    }
    for (auto& t : threads_pop) {
      t.join();
    }
    // end time measurement
    auto tend = std::chrono::steady_clock::now();
    dur = std::chrono::duration_cast<std::chrono::nanoseconds>(tend - tbegin)
              .count();
    sum += dur;
    min = std::min(min, dur);
    max = std::max(max, dur);
  }
  uint64_t avg = sum / reps;
  std::cout << std::setw(12) << name;
  std::cout << "   " << std::setw(8) << max / ops << " ns";
  std::cout << "   " << std::setw(8) << avg / ops << " ns";
  std::cout << "   " << std::setw(8) << min / ops << " ns";
  std::cout << std::endl;
  return min;
}

template <class PriorityQueue>
static uint64_t throughtput_test(std::string name, uint64_t initial_size) {
  int ops = 1 << 18;
  int reps = 15;
  uint64_t min = UINTMAX_MAX;
  uint64_t max = 0;
  uint64_t sum = 0;

  for (int r = 0; r < reps; ++r) {
    uint64_t dur;
    PriorityQueue pq;

    folly::Random::DefaultGenerator rng;
    rng.seed(initial_size);
    // initialize the queue according to initial_size
    for (uint64_t i = 0; i < initial_size; i++) {
      int val = folly::Random::rand32(rng) % (ops + 1);
      pq.push(val);
    }

    auto fn = [&](uint32_t tid) {
      folly::Random::DefaultGenerator rng_tl;
      rng_tl.seed(tid);
      uint32_t counter = 0;
      for (int i = tid; i < ops; i += nthreads) {
        int val;
        counter++;
        if (counter % 2) {
          val = folly::Random::rand32(rng_tl) % (ops + 1);
          pq.push(val);
        } else {
          pq.pop(val);
        }
      }
    };

    dur = run_once(fn);
    sum += dur;
    min = std::min(min, dur);
    max = std::max(max, dur);
  }

  uint64_t avg = sum / reps;
  std::cout << std::setw(12) << name;
  std::cout << "   " << std::setw(8) << max / ops << " ns";
  std::cout << "   " << std::setw(8) << avg / ops << " ns";
  std::cout << "   " << std::setw(8) << min / ops << " ns";
  std::cout << std::endl;
  return min;
}

template <class PriorityQueue>
static void
accuracy_test(std::string name, uint64_t initial_size, uint32_t top_percent) {
  int avg = 0;
  int reps = 15;
  int valid = initial_size / top_percent;
  if (valid < 1) {
    return;
  }
  int target = initial_size - valid;
  for (int r = 0; r < reps; ++r) {
    PriorityQueue pq;
    std::unordered_set<int> filter;
    folly::Random::DefaultGenerator rng;
    rng.seed(initial_size + r);

    // initialize the queue according to initial_size
    // eliminate repeated priorities
    for (uint64_t i = 0; i < initial_size; i++) {
      int val;
      do {
        val = folly::Random::rand32(rng) % initial_size;
      } while (filter.find(val) != filter.end());
      filter.insert(val);
      pq.push(val);
    }

    int counter = 0;
    int stop = valid;
    for (uint64_t i = 0; i < initial_size; i++) {
      int val;
      pq.pop(val);
      if (val >= target) {
        stop--;
      }
      if (stop > 0 && val < target) {
        counter++;
      }
      if (stop == 0) {
        break;
      }
    }
    avg += counter;
  }
  avg /= reps;
  std::cout << std::setw(16) << name << "  ";
  std::cout << "Lower priority popped: " << avg;
  std::cout << std::endl;
}

using FCPQ = folly::FlatCombiningPriorityQueue<int>;

TEST(CPQ, ThroughtputBench) {
  if (!FLAGS_bench) {
    return;
  }
  std::vector<int> test_sizes = {64, 512, 65536};
  std::vector<int> nthrs = {1, 2, 4, 8, 12, 14, 16, 28, 32, 56};

  std::cout << "Threads have equal chance to push and pop. \n"
            << "The bench caculates the avg execution time for\n"
            << "one operation (push OR pop).\n"
            << "GL : std::priority_queue protected by global lock\n"
            << "FL : flatcombinning priority queue\n"
            << "RCPQ: the relaxed concurrent priority queue\n"
            << std::endl;
  std::cout << "\nTest_name, Max time, Avg time, Min time" << std::endl;
  for (auto s : test_sizes) {
    std::cout << "\n ------ Initial size: " << s << " ------" << std::endl;
    for (int i : nthrs) {
      nthreads = i;
      std::cout << "Thread number: " << i << std::endl;
      throughtput_test<GlobalLockPQ<int>>("GL", s);
      throughtput_test<FCPQ>("FC", s);
      throughtput_test<RelaxedConcurrentPriorityQueue<int>>("RCPQ", s);
    }
  }
}

TEST(CPQ, ProducerConsumerBench) {
  if (!FLAGS_bench) {
    return;
  }
  std::vector<int> test_sizes = {0, 512, 65536};
  std::vector<int> nthrs = {1, 2, 4, 8, 12, 16, 24};

  std::cout << "<Producer, Consumer> pattern \n"
            << "The bench caculates the avg execution time for\n"
            << "push AND pop pair(two operations).\n"
            << "GL : std::priority_queue protected by global lock\n"
            << "FL : flatcombinning priority queue\n"
            << "RCPQ SPN: RCPQ spinning\n"
            << "RCPQ BLK: RCPQ blocking\n"
            << std::endl;
  for (int s : test_sizes) {
    std::cout << "\n ------ Scalability ------" << std::endl;
    for (int m : nthrs) {
      for (int n : nthrs) {
        if (m != n) {
          continue;
        }
        std::cout << "<" << m << " , " << n << "> , size = " << s << ":"
                  << std::endl;
        producer_consumer_test<GlobalLockPQ<int>>("GL", m, n, s);
        producer_consumer_test<FCPQ>("FC", m, n, s);
        producer_consumer_test<
            RelaxedConcurrentPriorityQueue<int, false, false>>(
            "RCPQ SPN", m, n, s);
        producer_consumer_test<
            RelaxedConcurrentPriorityQueue<int, true, false>>(
            "RCPQ BLK", m, n, s);
      }
    }
    std::cout << "\n ------ Unbalanced(Producer<Consumer) ------" << std::endl;
    for (int m : nthrs) {
      for (int n : nthrs) {
        if (m > 4 || n - 4 <= m) {
          continue;
        }
        std::cout << "<" << m << " , " << n << "> , size = " << s << ":"
                  << std::endl;
        producer_consumer_test<GlobalLockPQ<int>>("GL", m, n, s);
        producer_consumer_test<FCPQ>("FC", m, n, s);
        producer_consumer_test<
            RelaxedConcurrentPriorityQueue<int, false, false>>(
            "RCPQ SPN", m, n, s);
        producer_consumer_test<
            RelaxedConcurrentPriorityQueue<int, true, false>>(
            "RCPQ BLK", m, n, s);
      }
    }

    std::cout << "\n ------ Unbalanced(Producer>Consumer) ------" << std::endl;
    for (int m : nthrs) {
      for (int n : nthrs) {
        if (m <= 8 || n > m - 4 || n % 4 != 0) {
          continue;
        }
        std::cout << "<" << m << " , " << n << "> , size = " << s << ":"
                  << std::endl;
        producer_consumer_test<GlobalLockPQ<int>>("GL", m, n, s);
        producer_consumer_test<FCPQ>("FC", m, n, s);
        producer_consumer_test<
            RelaxedConcurrentPriorityQueue<int, false, false>>(
            "RCPQ SPN", m, n, s);
        producer_consumer_test<
            RelaxedConcurrentPriorityQueue<int, true, false>>(
            "RCPQ BLK", m, n, s);
      }
    }
  }
}

TEST(CPQ, Accuracy) {
  if (!FLAGS_bench) {
    return;
  }
  std::vector<int> test_sizes = {512, 65536, 1 << 20};
  std::vector<int> rates = {1000, 100, 10};
  for (auto s : test_sizes) {
    for (auto p : rates) {
      std::cout << "\n------ Size: " << s << "  Get top: " << 100. / p << "%"
                << " (Num: " << s / p << ")"
                << " ------" << std::endl;
      accuracy_test<Queue<int>>("FIFO Q", s, p);
      accuracy_test<RelaxedConcurrentPriorityQueue<int, false, false, 0>>(
          "RCPQ(strict)", s, p);
      accuracy_test<RelaxedConcurrentPriorityQueue<int, false, false, 2>>(
          "RCPQ(batch=2)", s, p);
      accuracy_test<RelaxedConcurrentPriorityQueue<int, false, false, 8>>(
          "RCPQ(batch=8)", s, p);
      accuracy_test<RelaxedConcurrentPriorityQueue<int, false, false, 16>>(
          "RCPQ(batch=16)", s, p);
      accuracy_test<RelaxedConcurrentPriorityQueue<int, false, false, 50>>(
          "RCPQ(batch=50)", s, p);
    }
  }
}

/*
 *  The folly::SpinningLock use CAS directly for try_lock, which is not
efficient in the
 *  experiment. The lock used in the experiment based on the test-test-and-set
lock(Add
 *  check before doing CAS).
 *
Threads have equal chance to push and pop.
The bench caculates the avg execution time for
one operation (push OR pop).
GL : std::priority_queue protected by global lock
FL : flatcombinning priority queue
RCPQ: the relaxed concurrent priority queue

Test_name, Max time, Avg time, Min time

 ------ Initial size: 64 ------
Thread number: 1
          GL         30 ns         29 ns         27 ns
          FC         47 ns         42 ns         40 ns
        RCPQ         85 ns         81 ns         77 ns
Thread number: 2
          GL        377 ns        274 ns        154 ns
          FC        227 ns        187 ns        139 ns
        RCPQ        108 ns        106 ns        102 ns
Thread number: 4
          GL        244 ns        214 ns        191 ns
          FC        212 ns        191 ns        173 ns
        RCPQ         98 ns         95 ns         92 ns
Thread number: 8
          GL        252 ns        221 ns        197 ns
          FC        127 ns        112 ns        102 ns
        RCPQ         78 ns         78 ns         76 ns
Thread number: 12
          GL        251 ns        227 ns        217 ns
          FC        104 ns         96 ns         88 ns
        RCPQ         81 ns         79 ns         77 ns
Thread number: 14
          GL        243 ns        232 ns        224 ns
          FC        103 ns         96 ns         90 ns
        RCPQ         84 ns         82 ns         81 ns
Thread number: 16
          GL        254 ns        239 ns        229 ns
          FC        105 ns         98 ns         92 ns
        RCPQ         88 ns         85 ns         83 ns
Thread number: 28
          GL        265 ns        261 ns        258 ns
          FC        106 ns        100 ns         96 ns
        RCPQ         93 ns         87 ns         68 ns
Thread number: 32
          GL        274 ns        267 ns        261 ns
          FC        110 ns         98 ns         37 ns
        RCPQ         93 ns         80 ns         47 ns
Thread number: 56
          GL        274 ns        263 ns        257 ns
          FC         78 ns         50 ns         24 ns
        RCPQ         85 ns         71 ns         45 ns

 ------ Initial size: 512 ------
Thread number: 1
          GL         36 ns         35 ns         33 ns
          FC         54 ns         49 ns         47 ns
        RCPQ         79 ns         76 ns         72 ns
Thread number: 2
          GL        248 ns        187 ns        151 ns
          FC        228 ns        179 ns        147 ns
        RCPQ         95 ns         92 ns         90 ns
Thread number: 4
          GL        282 ns        260 ns        236 ns
          FC        218 ns        199 ns        174 ns
        RCPQ         85 ns         81 ns         79 ns
Thread number: 8
          GL        306 ns        288 ns        270 ns
          FC        188 ns        114 ns        104 ns
        RCPQ         64 ns         62 ns         59 ns
Thread number: 12
          GL        317 ns        296 ns        280 ns
          FC        105 ns         99 ns         91 ns
        RCPQ         59 ns         57 ns         52 ns
Thread number: 14
          GL        331 ns        305 ns        293 ns
          FC        109 ns         99 ns         92 ns
        RCPQ         64 ns         57 ns         53 ns
Thread number: 16
          GL        316 ns        308 ns        291 ns
          FC        110 ns         99 ns         92 ns
        RCPQ         58 ns         54 ns         52 ns
Thread number: 28
          GL        348 ns        339 ns        333 ns
          FC        109 ns        105 ns        100 ns
        RCPQ         64 ns         62 ns         56 ns
Thread number: 32
          GL        353 ns        347 ns        341 ns
          FC        116 ns        102 ns         39 ns
        RCPQ         62 ns         32 ns          3 ns
Thread number: 56
          GL        360 ns        352 ns        342 ns
          FC        101 ns         58 ns         41 ns
        RCPQ         59 ns         43 ns         26 ns

 ------ Initial size: 65536 ------
Thread number: 1
          GL         64 ns         60 ns         56 ns
          FC         93 ns         72 ns         67 ns
        RCPQ        293 ns        286 ns        281 ns
Thread number: 2
          GL        262 ns        248 ns        231 ns
          FC        318 ns        301 ns        288 ns
        RCPQ        230 ns        216 ns        206 ns
Thread number: 4
          GL        463 ns        452 ns        408 ns
          FC        273 ns        265 ns        257 ns
        RCPQ        141 ns        131 ns        126 ns
Thread number: 8
          GL        582 ns        574 ns        569 ns
          FC        152 ns        139 ns        131 ns
        RCPQ         98 ns         81 ns         72 ns
Thread number: 12
          GL        593 ns        586 ns        576 ns
          FC        126 ns        123 ns        119 ns
        RCPQ         85 ns         72 ns         62 ns
Thread number: 14
          GL        599 ns        595 ns        588 ns
          FC        138 ns        123 ns        119 ns
        RCPQ         79 ns         70 ns         62 ns
Thread number: 16
          GL        599 ns        592 ns        587 ns
          FC        138 ns        123 ns        117 ns
        RCPQ         75 ns         65 ns         56 ns
Thread number: 28
          GL        611 ns        609 ns        608 ns
          FC        147 ns        144 ns        137 ns
        RCPQ         74 ns         70 ns         66 ns
Thread number: 32
          GL        635 ns        630 ns        627 ns
          FC        151 ns        143 ns         76 ns
        RCPQ        199 ns         94 ns         59 ns
Thread number: 56
          GL        637 ns        633 ns        627 ns
          FC        176 ns        103 ns         41 ns
        RCPQ        561 ns        132 ns         46 ns


<Producer, Consumer> pattern
The bench caculates the avg execution time for
push AND pop pair(two operations).
GL : std::priority_queue protected by global lock
FL : flatcombinning priority queue
RCPQ SPN: RCPQ spinning
RCPQ BLK: RCPQ blocking


 ------ Scalability ------
<1 , 1> , size = 0:
          GL        781 ns        735 ns        652 ns
          FC        599 ns        535 ns        462 ns
    RCPQ SPN        178 ns        166 ns        148 ns
    RCPQ BLK        217 ns        201 ns        182 ns
<2 , 2> , size = 0:
          GL        686 ns        665 ns        619 ns
          FC        487 ns        430 ns        398 ns
    RCPQ SPN        281 ns        239 ns        139 ns
    RCPQ BLK        405 ns        367 ns        181 ns
<4 , 4> , size = 0:
          GL       1106 ns       1082 ns       1050 ns
          FC        278 ns        242 ns        208 ns
    RCPQ SPN        114 ns        107 ns        103 ns
    RCPQ BLK        169 ns        158 ns        148 ns
<8 , 8> , size = 0:
          GL       1169 ns       1156 ns       1144 ns
          FC        236 ns        214 ns        197 ns
    RCPQ SPN        121 ns        114 ns        110 ns
    RCPQ BLK        154 ns        150 ns        141 ns
<12 , 12> , size = 0:
          GL       1191 ns       1185 ns       1178 ns
          FC        232 ns        221 ns        201 ns
    RCPQ SPN        802 ns        205 ns        123 ns
    RCPQ BLK        218 ns        161 ns        147 ns
<16 , 16> , size = 0:
          GL       1236 ns       1227 ns       1221 ns
          FC        269 ns        258 ns        243 ns
    RCPQ SPN        826 ns        733 ns        655 ns
    RCPQ BLK        172 ns        149 ns        137 ns
<24 , 24> , size = 0:
          GL       1269 ns       1262 ns       1255 ns
          FC        280 ns        225 ns        171 ns
    RCPQ SPN        931 ns        891 ns        836 ns
    RCPQ BLK        611 ns        445 ns        362 ns

 ------ Unbalanced(Producer<Consumer) ------
<1 , 8> , size = 0:
          GL       1454 ns       1225 ns       1144 ns
          FC       2141 ns       1974 ns       1811 ns
    RCPQ SPN        597 ns        586 ns        573 ns
    RCPQ BLK        663 ns        649 ns        636 ns
<1 , 12> , size = 0:
          GL       1763 ns       1658 ns       1591 ns
          FC       3396 ns       3261 ns       3107 ns
    RCPQ SPN        735 ns        714 ns        651 ns
    RCPQ BLK        773 ns        761 ns        744 ns
<1 , 16> , size = 0:
          GL       2231 ns       2070 ns       1963 ns
          FC       6305 ns       5771 ns       5603 ns
    RCPQ SPN        787 ns        756 ns        694 ns
    RCPQ BLK        828 ns        806 ns        775 ns
<1 , 24> , size = 0:
          GL       3802 ns       3545 ns       3229 ns
          FC      10625 ns      10311 ns      10119 ns
    RCPQ SPN        781 ns        756 ns        739 ns
    RCPQ BLK        892 ns        882 ns        870 ns
<2 , 8> , size = 0:
          GL        873 ns        750 ns        718 ns
          FC        815 ns        712 ns        659 ns
    RCPQ SPN        720 ns        691 ns        673 ns
    RCPQ BLK        738 ns        707 ns        694 ns
<2 , 12> , size = 0:
          GL       1061 ns        968 ns        904 ns
          FC       1410 ns       1227 ns       1190 ns
    RCPQ SPN        862 ns        829 ns        767 ns
    RCPQ BLK        825 ns        804 ns        771 ns
<2 , 16> , size = 0:
          GL       1438 ns       1283 ns       1162 ns
          FC       2095 ns       2012 ns       1909 ns
    RCPQ SPN        763 ns        706 ns        628 ns
    RCPQ BLK        833 ns        804 ns        777 ns
<2 , 24> , size = 0:
          GL       2031 ns       1972 ns       1872 ns
          FC       4298 ns       4191 ns       4107 ns
    RCPQ SPN        762 ns        709 ns        680 ns
    RCPQ BLK        876 ns        859 ns        825 ns
<4 , 12> , size = 0:
          GL        696 ns        649 ns        606 ns
          FC        561 ns        517 ns        480 ns
    RCPQ SPN        759 ns        698 ns        498 ns
    RCPQ BLK        823 ns        803 ns        786 ns
<4 , 16> , size = 0:
          GL        862 ns        800 ns        749 ns
          FC        857 ns        824 ns        781 ns
    RCPQ SPN        730 ns        679 ns        589 ns
    RCPQ BLK        863 ns        824 ns        803 ns
<4 , 24> , size = 0:
          GL       1138 ns       1125 ns       1105 ns
          FC       1635 ns       1576 ns       1540 ns
    RCPQ SPN        756 ns        717 ns        668 ns
    RCPQ BLK        865 ns        839 ns        812 ns

 ------ Unbalanced(Producer>Consumer) ------
<12 , 4> , size = 0:
          GL       1115 ns       1087 ns       1053 ns
          FC        373 ns        355 ns        333 ns
    RCPQ SPN        155 ns        147 ns        142 ns
    RCPQ BLK        202 ns        190 ns        182 ns
<12 , 8> , size = 0:
          GL       1167 ns       1157 ns       1148 ns
          FC        281 ns        256 ns        227 ns
    RCPQ SPN        132 ns        126 ns        120 ns
    RCPQ BLK        175 ns        164 ns        161 ns
<16 , 4> , size = 0:
          GL       1103 ns       1088 ns       1074 ns
          FC        442 ns        380 ns        327 ns
    RCPQ SPN        178 ns        162 ns        150 ns
    RCPQ BLK        217 ns        200 ns        188 ns
<16 , 8> , size = 0:
          GL       1164 ns       1153 ns       1143 ns
          FC        290 ns        268 ns        243 ns
    RCPQ SPN        146 ns        138 ns        134 ns
    RCPQ BLK        184 ns        175 ns        161 ns
<16 , 12> , size = 0:
          GL       1196 ns       1189 ns       1185 ns
          FC        269 ns        260 ns        245 ns
    RCPQ SPN        405 ns        172 ns        129 ns
    RCPQ BLK        172 ns        165 ns        152 ns
<24 , 4> , size = 0:
          GL       1097 ns       1081 ns       1030 ns
          FC        407 ns        369 ns        301 ns
    RCPQ SPN        184 ns        176 ns        164 ns
    RCPQ BLK        220 ns        211 ns        201 ns
<24 , 8> , size = 0:
          GL       1177 ns       1158 ns       1148 ns
          FC        321 ns        297 ns        233 ns
    RCPQ SPN        155 ns        148 ns        139 ns
    RCPQ BLK        204 ns        188 ns        173 ns
<24 , 12> , size = 0:
          GL       1224 ns       1215 ns       1205 ns
          FC        320 ns        287 ns        218 ns
    RCPQ SPN        145 ns        141 ns        135 ns
    RCPQ BLK        176 ns        167 ns        160 ns
<24 , 16> , size = 0:
          GL       1250 ns       1244 ns       1238 ns
          FC        339 ns        257 ns        209 ns
    RCPQ SPN        615 ns        480 ns        359 ns
    RCPQ BLK        185 ns        151 ns        137 ns

[ RUN      ] CPQ.Accuracy
The Accuracy test check how many pops return lower
priority when popping the top X% priorities.
The default batch size is 16.

------ Size: 512  Get top: 1% (Num: 5) ------
          FIFO Q  Lower priority popped: 439
    RCPQ(strict)  Lower priority popped: 0
   RCPQ(batch=2)  Lower priority popped: 1
   RCPQ(batch=8)  Lower priority popped: 10
  RCPQ(batch=16)  Lower priority popped: 13
  RCPQ(batch=50)  Lower priority popped: 11

------ Size: 512  Get top: 10% (Num: 51) ------
          FIFO Q  Lower priority popped: 451
    RCPQ(strict)  Lower priority popped: 0
   RCPQ(batch=2)  Lower priority popped: 15
   RCPQ(batch=8)  Lower priority popped: 73
  RCPQ(batch=16)  Lower priority popped: 147
  RCPQ(batch=50)  Lower priority popped: 201

------ Size: 65536  Get top: 0.1% (Num: 65) ------
          FIFO Q  Lower priority popped: 64917
    RCPQ(strict)  Lower priority popped: 0
   RCPQ(batch=2)  Lower priority popped: 35
   RCPQ(batch=8)  Lower priority popped: 190
  RCPQ(batch=16)  Lower priority popped: 387
  RCPQ(batch=50)  Lower priority popped: 655

------ Size: 65536  Get top: 1% (Num: 655) ------
          FIFO Q  Lower priority popped: 64793
    RCPQ(strict)  Lower priority popped: 0
   RCPQ(batch=2)  Lower priority popped: 122
   RCPQ(batch=8)  Lower priority popped: 516
  RCPQ(batch=16)  Lower priority popped: 1450
  RCPQ(batch=50)  Lower priority popped: 3219

------ Size: 65536  Get top: 10% (Num: 6553) ------
          FIFO Q  Lower priority popped: 58977
    RCPQ(strict)  Lower priority popped: 0
   RCPQ(batch=2)  Lower priority popped: 174
   RCPQ(batch=8)  Lower priority popped: 753
  RCPQ(batch=16)  Lower priority popped: 1436
  RCPQ(batch=50)  Lower priority popped: 3297

------ Size: 1048576  Get top: 0.1% (Num: 1048) ------
          FIFO Q  Lower priority popped: 1046345
    RCPQ(strict)  Lower priority popped: 0
   RCPQ(batch=2)  Lower priority popped: 124
   RCPQ(batch=8)  Lower priority popped: 449
  RCPQ(batch=16)  Lower priority popped: 1111
  RCPQ(batch=50)  Lower priority popped: 3648

------ Size: 1048576  Get top: 1% (Num: 10485) ------
          FIFO Q  Lower priority popped: 1038012
    RCPQ(strict)  Lower priority popped: 0
   RCPQ(batch=2)  Lower priority popped: 297
   RCPQ(batch=8)  Lower priority popped: 1241
  RCPQ(batch=16)  Lower priority popped: 2489
  RCPQ(batch=50)  Lower priority popped: 7764

------ Size: 1048576  Get top: 10% (Num: 104857) ------
          FIFO Q  Lower priority popped: 943706
    RCPQ(strict)  Lower priority popped: 0
   RCPQ(batch=2)  Lower priority popped: 1984
   RCPQ(batch=8)  Lower priority popped: 8150
  RCPQ(batch=16)  Lower priority popped: 15787
  RCPQ(batch=50)  Lower priority popped: 42778

The experiment was running on 1 NUMA node,
which is 14 cores.

rchitecture:        x86_64
CPU op-mode(s):      32-bit, 64-bit
Byte Order:          Little Endian
CPU(s):              56
On-line CPU(s) list: 0-55
Thread(s) per core:  2
Core(s) per socket:  14
Socket(s):           2
NUMA node(s):        2
Vendor ID:           GenuineIntel
CPU family:          6
Model:               79
Model name:          Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz
Stepping:            1
CPU MHz:             2401.000
CPU max MHz:         2401.0000
CPU min MHz:         1200.0000
BogoMIPS:            4788.91
Virtualization:      VT-x
L1d cache:           32K
L1i cache:           32K
L2 cache:            256K
L3 cache:            35840K
NUMA node0 CPU(s):   0-13,28-41
NUMA node1 CPU(s):   14-27,42-55
*/
