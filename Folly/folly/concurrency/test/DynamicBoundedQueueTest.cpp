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

#include <folly/concurrency/DynamicBoundedQueue.h>
#include <folly/MPMCQueue.h>
#include <folly/ProducerConsumerQueue.h>
#include <folly/portability/GTest.h>

#include <glog/logging.h>

#include <atomic>
#include <thread>

DEFINE_bool(bench, false, "run benchmark");
DEFINE_int32(reps, 10, "number of reps");
DEFINE_int32(ops, 1000000, "number of operations per rep");
DEFINE_int64(capacity, 1000000, "capacity");

template <typename T, bool MayBlock, typename WeightFn>
using DSPSC = folly::DSPSCQueue<T, MayBlock, 8, 7, WeightFn>;

template <typename T, bool MayBlock, typename WeightFn>
using DMPSC = folly::DMPSCQueue<T, MayBlock, 8, 7, WeightFn>;

template <typename T, bool MayBlock, typename WeightFn>
using DSPMC = folly::DSPMCQueue<T, MayBlock, 8, 7, WeightFn>;

template <typename T, bool MayBlock, typename WeightFn>
using DMPMC = folly::DMPMCQueue<T, MayBlock, 8, 7, WeightFn>;

template <template <typename, bool, typename> class Q, bool MayBlock>
void basic_test() {
  auto dur = std::chrono::microseconds(100);
  auto deadline = std::chrono::steady_clock::now() + dur;

  struct CustomWeightFn {
    uint64_t operator()(int val) {
      return val * 100;
    }
  };

  Q<int, MayBlock, CustomWeightFn> q(10000);

  ASSERT_TRUE(q.empty());
  ASSERT_EQ(q.size(), 0);
  int v;
  ASSERT_FALSE(q.try_dequeue(v));

  q.enqueue(1);
  ASSERT_TRUE(q.try_enqueue(2));
  ASSERT_TRUE(q.try_enqueue_until(3, deadline));
  ASSERT_TRUE(q.try_enqueue_for(4, dur));

  ASSERT_EQ(q.size(), 4);
  ASSERT_EQ(q.weight(), 1000);
  ASSERT_FALSE(q.empty());

  q.dequeue(v);
  ASSERT_EQ(v, 1);
  ASSERT_TRUE(q.try_dequeue(v));
  ASSERT_EQ(v, 2);
  ASSERT_TRUE(q.try_dequeue_until(v, deadline));
  ASSERT_EQ(v, 3);
  ASSERT_TRUE(q.try_dequeue_for(v, dur));
  ASSERT_EQ(v, 4);

  ASSERT_TRUE(q.empty());
  ASSERT_EQ(q.size(), 0);
  ASSERT_EQ(q.weight(), 0);
}

TEST(DynamicBoundedQueue, basic) {
  basic_test<DSPSC, false>();
  basic_test<DMPSC, false>();
  basic_test<DSPMC, false>();
  basic_test<DMPMC, false>();
  basic_test<DSPSC, true>();
  basic_test<DMPSC, true>();
  basic_test<DSPMC, true>();
  basic_test<DMPMC, true>();
}

template <template <typename, bool, typename> class Q, bool MayBlock>
void move_test() {
  struct Foo {
    int v_;
    explicit Foo(int v) noexcept : v_(v) {}
    Foo(const Foo&) = delete;
    Foo& operator=(const Foo&) = delete;
    Foo(Foo&& other) noexcept : v_(other.v_) {}
    Foo& operator=(Foo&& other) noexcept {
      v_ = other.v_;
      return *this;
    }
  };

  struct CustomWeightFn {
    uint64_t operator()(Foo&&) {
      return 10;
    }
  };

  auto dur = std::chrono::microseconds(100);
  auto deadline = std::chrono::steady_clock::now() + dur;

  Q<Foo, MayBlock, CustomWeightFn> q(100);
  Foo v(1);
  q.enqueue(std::move(v));
  ASSERT_TRUE(q.try_enqueue(std::move(v)));
  ASSERT_TRUE(q.try_enqueue_until(std::move(v), deadline));
  ASSERT_TRUE(q.try_enqueue_for(std::move(v), dur));

  ASSERT_EQ(q.size(), 4);
  ASSERT_EQ(q.weight(), 40);
}

TEST(DynamicBoundedQueue, move) {
  move_test<DSPSC, false>();
  move_test<DMPSC, false>();
  move_test<DSPMC, false>();
  move_test<DMPMC, false>();
  move_test<DSPSC, true>();
  move_test<DMPSC, true>();
  move_test<DSPMC, true>();
  move_test<DMPMC, true>();
}

template <template <typename, bool, typename> class Q, bool MayBlock>
void capacity_test() {
  struct CustomWeightFn {
    uint64_t operator()(int val) {
      return val;
    }
  };

  Q<int, MayBlock, CustomWeightFn> q(1000);
  ASSERT_EQ(q.weight(), 0);
  int v;
  q.enqueue(100);
  ASSERT_EQ(q.weight(), 100);
  q.enqueue(300);
  ASSERT_EQ(q.weight(), 400);
  ASSERT_FALSE(q.try_enqueue(1200));
  q.reset_capacity(2000); // reset capacityy to 2000
  ASSERT_TRUE(q.try_enqueue(1200));
  ASSERT_EQ(q.weight(), 1600);
  ASSERT_EQ(q.size(), 3);
  q.reset_capacity(1000); // reset capacity back to 1000
  ASSERT_FALSE(q.try_enqueue(100));
  q.dequeue(v);
  ASSERT_EQ(v, 100);
  ASSERT_EQ(q.weight(), 1500);
  q.dequeue(v);
  ASSERT_EQ(v, 300);
  ASSERT_EQ(q.weight(), 1200);
}

TEST(DynamicBoundedQueue, capacity) {
  capacity_test<DSPSC, false>();
  capacity_test<DMPSC, false>();
  capacity_test<DSPMC, false>();
  capacity_test<DMPMC, false>();
  capacity_test<DSPSC, true>();
  capacity_test<DMPSC, true>();
  capacity_test<DSPMC, true>();
  capacity_test<DMPMC, true>();
}

template <typename ProdFunc, typename ConsFunc, typename EndFunc>
inline uint64_t run_once(
    int nprod,
    int ncons,
    const ProdFunc& prodFn,
    const ConsFunc& consFn,
    const EndFunc& endFn) {
  std::atomic<bool> start{false};
  std::atomic<int> ready{0};

  /* producers */
  std::vector<std::thread> prodThr(nprod);
  for (int tid = 0; tid < nprod; ++tid) {
    prodThr[tid] = std::thread([&, tid] {
      ++ready;
      while (!start.load()) {
        /* spin */;
      }
      prodFn(tid);
    });
  }

  /* consumers */
  std::vector<std::thread> consThr(ncons);
  for (int tid = 0; tid < ncons; ++tid) {
    consThr[tid] = std::thread([&, tid] {
      ++ready;
      while (!start.load()) {
        /* spin */;
      }
      consFn(tid);
    });
  }

  /* wait for all producers and consumers to be ready */
  while (ready.load() < (nprod + ncons)) {
    /* spin */;
  }

  /* begin time measurement */
  auto tbegin = std::chrono::steady_clock::now();
  start.store(true);

  /* wait for completion */
  for (int i = 0; i < nprod; ++i) {
    prodThr[i].join();
  }
  for (int i = 0; i < ncons; ++i) {
    consThr[i].join();
  }

  /* end time measurement */
  auto tend = std::chrono::steady_clock::now();
  endFn();
  return std::chrono::duration_cast<std::chrono::nanoseconds>(tend - tbegin)
      .count();
}

template <bool SingleProducer, bool SingleConsumer, bool MayBlock>
void enq_deq_test(const int nprod, const int ncons) {
  if (SingleProducer) {
    ASSERT_EQ(nprod, 1);
  }
  if (SingleConsumer) {
    ASSERT_EQ(ncons, 1);
  }

  int ops = 1000;
  folly::DynamicBoundedQueue<int, SingleProducer, SingleConsumer, MayBlock, 2>
      q(10);
  std::atomic<uint64_t> sum(0);

  auto prod = [&](int tid) {
    for (int i = tid; i < ops; i += nprod) {
      if ((i % 3) == 0) {
        while (!q.try_enqueue(i)) {
          /* keep trying */;
        }
      } else if ((i % 3) == 1) {
        auto dur = std::chrono::microseconds(100);
        while (!q.try_enqueue_for(i, dur)) {
          /* keep trying */;
        }
      } else {
        q.enqueue(i);
      }
    }
  };

  auto cons = [&](int tid) {
    uint64_t mysum = 0;
    for (int i = tid; i < ops; i += ncons) {
      int v;
      if ((i % 3) == 0) {
        while (!q.try_dequeue(v)) {
          /* keep trying */;
        }
      } else if ((i % 3) == 1) {
        auto dur = std::chrono::microseconds(100);
        while (!q.try_dequeue_for(v, dur)) {
          /* keep trying */;
        }
      } else {
        q.dequeue(v);
      }
      if (nprod == 1 && ncons == 1) {
        ASSERT_EQ(v, i);
      }
      mysum += v;
    }
    sum.fetch_add(mysum);
  };

  auto endfn = [&] {
    uint64_t expected = ops;
    expected *= ops - 1;
    expected /= 2;
    ASSERT_EQ(sum.load(), expected);
  };
  run_once(nprod, ncons, prod, cons, endfn);
}

TEST(DynamicBoundedQueue, enq_deq) {
  /* SPSC */
  enq_deq_test<true, true, false>(1, 1);
  enq_deq_test<true, true, true>(1, 1);
  /* MPSC */
  enq_deq_test<false, true, false>(1, 1);
  enq_deq_test<false, true, true>(1, 1);
  enq_deq_test<false, true, false>(2, 1);
  enq_deq_test<false, true, true>(2, 1);
  enq_deq_test<false, true, false>(10, 1);
  enq_deq_test<false, true, true>(10, 1);
  /* SPMC */
  enq_deq_test<true, false, false>(1, 1);
  enq_deq_test<true, false, true>(1, 1);
  enq_deq_test<true, false, false>(1, 2);
  enq_deq_test<true, false, true>(1, 2);
  enq_deq_test<true, false, false>(1, 10);
  enq_deq_test<true, false, true>(1, 10);
  /* MPMC */
  enq_deq_test<false, false, false>(1, 1);
  enq_deq_test<false, false, true>(1, 1);
  enq_deq_test<false, false, false>(2, 1);
  enq_deq_test<false, false, true>(2, 1);
  enq_deq_test<false, false, false>(10, 1);
  enq_deq_test<false, false, true>(10, 1);
  enq_deq_test<false, false, false>(1, 2);
  enq_deq_test<false, false, true>(1, 2);
  enq_deq_test<false, false, false>(1, 10);
  enq_deq_test<false, false, true>(1, 10);
  enq_deq_test<false, false, false>(2, 2);
  enq_deq_test<false, false, true>(2, 2);
  enq_deq_test<false, false, false>(10, 10);
  enq_deq_test<false, false, true>(10, 10);
}

template <typename RepFunc>
uint64_t runBench(const std::string& name, int ops, const RepFunc& repFn) {
  int reps = FLAGS_reps;
  uint64_t min = UINTMAX_MAX;
  uint64_t max = 0;
  uint64_t sum = 0;

  repFn(); // sometimes first run is outlier
  for (int r = 0; r < reps; ++r) {
    uint64_t dur = repFn();
    sum += dur;
    min = std::min(min, dur);
    max = std::max(max, dur);
    // if each rep takes too long run at least 2 reps
    const uint64_t minute = 60000000000ULL;
    if (sum > minute && r >= 1) {
      reps = r + 1;
      break;
    }
  }

  const std::string unit = " ns";
  uint64_t avg = sum / reps;
  uint64_t res = min;
  std::cout << name;
  std::cout << "   " << std::setw(4) << max / ops << unit;
  std::cout << "   " << std::setw(4) << avg / ops << unit;
  std::cout << "   " << std::setw(4) << res / ops << unit;
  std::cout << std::endl;
  return res;
}

template <template <typename, bool, typename> class Q, typename T, int Op>
uint64_t bench(const int nprod, const int ncons, const std::string& name) {
  int ops = FLAGS_ops;
  auto repFn = [&] {
    Q<T, Op == 3 || Op == 4 || Op == 5, folly::DefaultWeightFn<T>> q(
        FLAGS_capacity);
    std::atomic<uint64_t> sum(0);
    auto prod = [&](int tid) {
      for (int i = tid; i < ops; i += nprod) {
        if (Op == 0 || Op == 3) {
          while (!q.try_enqueue(i)) {
            /* keep trying */;
          }
        } else if (Op == 1 || Op == 4) {
          while (!q.try_enqueue_for(i, std::chrono::microseconds(1000))) {
            /* keep trying */;
          }
        } else {
          q.enqueue(i);
        }
      }
    };
    auto cons = [&](int tid) {
      uint64_t mysum = 0;
      T v = -1;
      for (int i = tid; i < ops; i += ncons) {
        if (Op == 0 || Op == 3) {
          while (!q.try_dequeue(v)) {
            /* keep trying */;
          }
        } else if (Op == 1 || Op == 4) {
          while (!q.try_dequeue_for(v, std::chrono::microseconds(1000))) {
            /* keep trying */;
          }
        } else {
          q.dequeue(v);
        }
        if (nprod == 1 && ncons == 1) {
          DCHECK_EQ(int(v), i);
        }
        mysum += v;
      }
      sum.fetch_add(mysum);
    };
    auto endfn = [&] {
      uint64_t expected = ops;
      expected *= ops - 1;
      expected /= 2;
      ASSERT_EQ(sum.load(), expected);
    };
    return run_once(nprod, ncons, prod, cons, endfn);
  };
  return runBench(name, ops, repFn);
}

/* For performance comparison */
template <typename T>
class MPMC {
  folly::MPMCQueue<T> q_;

 public:
  explicit MPMC(uint64_t capacity) : q_(capacity) {}

  void enqueue(const T& v) {
    q_.blockingWrite(v);
  }

  void enqueue(T&& v) {
    q_.blockingWrite(std::move(v));
  }

  bool try_enqueue(const T& v) {
    return q_.write(v);
  }

  bool try_enqueue(const T&& v) {
    return q_.write(std::move(v));
  }

  template <typename Rep, typename Period>
  bool try_enqueue_for(
      const T& v,
      const std::chrono::duration<Rep, Period>& duration) {
    return q_.tryWriteUntil(std::chrono::steady_clock::now() + duration, v);
  }

  void dequeue(T& item) {
    q_.blockingRead(item);
  }

  bool try_dequeue(T& item) {
    return q_.read(item);
  }

  template <typename Rep, typename Period>
  bool try_dequeue_for(
      T& item,
      const std::chrono::duration<Rep, Period>& duration) {
    return q_.tryReadUntil(std::chrono::steady_clock::now() + duration, item);
  }
};

template <typename T, bool, typename>
using FMPMC = MPMC<T>;

template <typename T>
class PCQ {
  folly::ProducerConsumerQueue<T> q_;

 public:
  explicit PCQ(uint64_t capacity) : q_(capacity) {}

  void enqueue(const T&) {
    ASSERT_TRUE(false);
  }

  bool try_enqueue(const T& v) {
    return q_.write(v);
  }

  bool try_enqueue(T&& v) {
    return q_.write(std::move(v));
  }

  template <typename Rep, typename Period>
  bool try_enqueue_for(const T&, const std::chrono::duration<Rep, Period>&) {
    return false;
  }

  void dequeue(T&) {
    ASSERT_TRUE(false);
  }

  bool try_dequeue(T& item) {
    return q_.read(item);
  }

  template <typename Rep, typename Period>
  bool try_dequeue_for(T&, const std::chrono::duration<Rep, Period>&) {
    return false;
  }
};

template <typename T, bool, typename>
using FPCQ = PCQ<T>;

template <size_t M>
struct IntArray {
  int a[M];
  IntArray() {}
  /* implicit */ IntArray(int v) {
    for (size_t i = 0; i < M; ++i) {
      a[i] = v;
    }
  }
  operator int() {
    return a[0];
  }
};

void dottedLine() {
  std::cout << ".............................................................."
            << std::endl;
}

template <typename T>
void type_benches(const int np, const int nc, const std::string& name) {
  std::cout << name
            << "===========================================" << std::endl;
  if (np == 1 && nc == 1) {
    bench<DSPSC, T, 0>(1, 1, "DSPSC try   spin only           ");
    bench<DSPSC, T, 1>(1, 1, "DSPSC timed spin only           ");
    bench<DSPSC, T, 2>(1, 1, "DSPSC wait  spin only           ");
    bench<DSPSC, T, 3>(1, 1, "DSPSC try   may block           ");
    bench<DSPSC, T, 4>(1, 1, "DSPSC timed may block           ");
    bench<DSPSC, T, 5>(1, 1, "DSPSC wait  may block           ");
    dottedLine();
  }
  if (nc == 1) {
    bench<DMPSC, T, 0>(np, 1, "DMPSC try   spin only           ");
    bench<DMPSC, T, 1>(np, 1, "DMPSC timed spin only           ");
    bench<DMPSC, T, 2>(np, 1, "DMPSC wait  spin only           ");
    bench<DMPSC, T, 3>(np, 1, "DMPSC try   may block           ");
    bench<DMPSC, T, 4>(np, 1, "DMPSC timed may block           ");
    bench<DMPSC, T, 5>(np, 1, "DMPSC wait  may block           ");
    dottedLine();
  }
  if (np == 1) {
    bench<DSPMC, T, 0>(1, nc, "DSPMC try   spin only           ");
    bench<DSPMC, T, 1>(1, nc, "DSPMC timed spin only           ");
    bench<DSPMC, T, 2>(1, nc, "DSPMC wait  spin only           ");
    bench<DSPMC, T, 3>(1, nc, "DSPMC try   may block           ");
    bench<DSPMC, T, 4>(1, nc, "DSPMC timed may block           ");
    bench<DSPMC, T, 5>(1, nc, "DSPMC wait  may block           ");
    dottedLine();
  }
  bench<DMPMC, T, 0>(np, nc, "DMPMC try   spin only           ");
  bench<DMPMC, T, 1>(np, nc, "DMPMC timed spin only           ");
  bench<DMPMC, T, 2>(np, nc, "DMPMC wait  spin only           ");
  bench<DMPMC, T, 3>(np, nc, "DMPMC try   may block           ");
  bench<DMPMC, T, 4>(np, nc, "DMPMC timed may block           ");
  bench<DMPMC, T, 5>(np, nc, "DMPMC wait  may block           ");
  dottedLine();
  if (np == 1 && nc == 1) {
    bench<FPCQ, T, 0>(1, 1, "folly::PCQ  read                ");
    dottedLine();
  }
  bench<FMPMC, T, 3>(np, nc, "folly::MPMC  read               ");
  bench<FMPMC, T, 4>(np, nc, "folly::MPMC  tryReadUntil       ");
  bench<FMPMC, T, 5>(np, nc, "folly::MPMC  blockingRead       ");
  std::cout << "=============================================================="
            << std::endl;
}

void benches(const int np, const int nc) {
  std::cout << "====================== " << std::setw(2) << np << " prod"
            << "  " << std::setw(2) << nc << " cons"
            << " ======================" << std::endl;
  type_benches<uint32_t>(np, nc, "=== uint32_t ======");
  // Benchmarks for other element sizes can be added as follows:
  //   type_benches<IntArray<4>>(np, nc, "=== IntArray<4> ===");
}

TEST(DynamicBoundedQueue, bench) {
  if (!FLAGS_bench) {
    return;
  }
  std::cout << "=============================================================="
            << std::endl;
  std::cout << std::setw(2) << FLAGS_reps << " reps of " << std::setw(8)
            << FLAGS_ops << " handoffs\n";
  dottedLine();
  std::cout << "Using capacity " << FLAGS_capacity << " for all queues\n";
  std::cout << "=============================================================="
            << std::endl;
  std::cout << "Test name                         Max time  Avg time  Min time"
            << std::endl;

  for (int np : {1, 8, 32}) {
    for (int nc : {1, 8, 32}) {
      benches(np, nc);
    }
  }
}

/*
$ numactl -N 1 dynamic_bounded_queue_test --bench --capacity=1000000
==============================================================
10 reps of  1000000 handoffs
..............................................................
Using capacity 1000000 for all queues
==============================================================
Test name                         Max time  Avg time  Min time
======================  1 prod   1 cons ======================
=== uint32_t =================================================
DSPSC try   spin only                 7 ns      7 ns      7 ns
DSPSC timed spin only                 9 ns      9 ns      9 ns
DSPSC wait  spin only                 7 ns      7 ns      7 ns
DSPSC try   may block                39 ns     36 ns     33 ns
DSPSC timed may block                39 ns     38 ns     37 ns
DSPSC wait  may block                37 ns     34 ns     33 ns
..............................................................
DMPSC try   spin only                54 ns     53 ns     52 ns
DMPSC timed spin only                53 ns     52 ns     51 ns
DMPSC wait  spin only                53 ns     52 ns     51 ns
DMPSC try   may block                67 ns     65 ns     64 ns
DMPSC timed may block                64 ns     62 ns     60 ns
DMPSC wait  may block                64 ns     62 ns     60 ns
..............................................................
DSPMC try   spin only                25 ns     24 ns     23 ns
DSPMC timed spin only                24 ns     23 ns     23 ns
DSPMC wait  spin only                22 ns     21 ns     21 ns
DSPMC try   may block                30 ns     26 ns     21 ns
DSPMC timed may block                25 ns     24 ns     24 ns
DSPMC wait  may block                22 ns     22 ns     21 ns
..............................................................
DMPMC try   spin only                48 ns     45 ns     39 ns
DMPMC timed spin only                31 ns     30 ns     24 ns
DMPMC wait  spin only                49 ns     47 ns     43 ns
DMPMC try   may block                63 ns     62 ns     61 ns
DMPMC timed may block                64 ns     60 ns     46 ns
DMPMC wait  may block                61 ns     60 ns     58 ns
..............................................................
folly::PCQ  read                      8 ns      7 ns      7 ns
..............................................................
folly::MPMC  read                    53 ns     51 ns     49 ns
folly::MPMC  tryReadUntil           112 ns    106 ns    103 ns
folly::MPMC  blockingRead            50 ns     47 ns     46 ns
==============================================================
======================  1 prod   8 cons ======================
=== uint32_t =================================================
DSPMC try   spin only               166 ns    159 ns    153 ns
DSPMC timed spin only               169 ns    163 ns    156 ns
DSPMC wait  spin only                60 ns     57 ns     54 ns
DSPMC try   may block               170 ns    163 ns    153 ns
DSPMC timed may block               165 ns    157 ns    150 ns
DSPMC wait  may block                94 ns     78 ns     52 ns
..............................................................
DMPMC try   spin only               170 ns    161 ns    149 ns
DMPMC timed spin only               167 ns    158 ns    149 ns
DMPMC wait  spin only                93 ns     80 ns     51 ns
DMPMC try   may block               164 ns    161 ns    154 ns
DMPMC timed may block               163 ns    156 ns    145 ns
DMPMC wait  may block               117 ns    102 ns     87 ns
..............................................................
folly::MPMC  read                   176 ns    168 ns    159 ns
folly::MPMC  tryReadUntil          1846 ns    900 ns    521 ns
folly::MPMC  blockingRead           219 ns    193 ns    178 ns
==============================================================
======================  1 prod  32 cons ======================
=== uint32_t =================================================
DSPMC try   spin only               224 ns    213 ns    204 ns
DSPMC timed spin only               215 ns    209 ns    199 ns
DSPMC wait  spin only               334 ns    114 ns     52 ns
DSPMC try   may block               240 ns    215 ns    202 ns
DSPMC timed may block               245 ns    221 ns    200 ns
DSPMC wait  may block               215 ns    151 ns     98 ns
..............................................................
DMPMC try   spin only               348 ns    252 ns    204 ns
DMPMC timed spin only               379 ns    244 ns    198 ns
DMPMC wait  spin only               173 ns    116 ns     89 ns
DMPMC try   may block               362 ns    231 ns    173 ns
DMPMC timed may block               282 ns    236 ns    206 ns
DMPMC wait  may block               252 ns    172 ns    134 ns
..............................................................
folly::MPMC  read                   540 ns    290 ns    186 ns
folly::MPMC  tryReadUntil          24946 ns   24280 ns   23113 ns
folly::MPMC  blockingRead          1345 ns   1297 ns   1265 ns
==============================================================
======================  8 prod   1 cons ======================
=== uint32_t =================================================
DMPSC try   spin only                68 ns     64 ns     60 ns
DMPSC timed spin only                69 ns     66 ns     61 ns
DMPSC wait  spin only                67 ns     65 ns     62 ns
DMPSC try   may block                77 ns     73 ns     67 ns
DMPSC timed may block                75 ns     74 ns     68 ns
DMPSC wait  may block                76 ns     73 ns     69 ns
..............................................................
DMPMC try   spin only                76 ns     66 ns     60 ns
DMPMC timed spin only                77 ns     68 ns     63 ns
DMPMC wait  spin only                68 ns     65 ns     63 ns
DMPMC try   may block                76 ns     72 ns     64 ns
DMPMC timed may block                82 ns     74 ns     67 ns
DMPMC wait  may block                77 ns     72 ns     68 ns
..............................................................
folly::MPMC  read                   170 ns    166 ns    161 ns
folly::MPMC  tryReadUntil           184 ns    179 ns    173 ns
folly::MPMC  blockingRead            79 ns     73 ns     53 ns
==============================================================
======================  8 prod   8 cons ======================
=== uint32_t =================================================
DMPMC try   spin only               181 ns    169 ns    133 ns
DMPMC timed spin only               179 ns    168 ns    148 ns
DMPMC wait  spin only                77 ns     76 ns     71 ns
DMPMC try   may block               180 ns    179 ns    176 ns
DMPMC timed may block               174 ns    166 ns    153 ns
DMPMC wait  may block                79 ns     78 ns     75 ns
..............................................................
folly::MPMC  read                   219 ns    206 ns    183 ns
folly::MPMC  tryReadUntil           262 ns    244 ns    213 ns
folly::MPMC  blockingRead            61 ns     58 ns     54 ns
==============================================================
======================  8 prod  32 cons ======================
=== uint32_t =================================================
DMPMC try   spin only               265 ns    217 ns    203 ns
DMPMC timed spin only               236 ns    215 ns    202 ns
DMPMC wait  spin only                93 ns     83 ns     77 ns
DMPMC try   may block               325 ns    234 ns    200 ns
DMPMC timed may block               206 ns    202 ns    193 ns
DMPMC wait  may block               139 ns     93 ns     76 ns
..............................................................
folly::MPMC  read                   259 ns    214 ns    201 ns
folly::MPMC  tryReadUntil           281 ns    274 ns    267 ns
folly::MPMC  blockingRead            62 ns     59 ns     57 ns
==============================================================
====================== 32 prod   1 cons ======================
=== uint32_t =================================================
DMPSC try   spin only                95 ns     57 ns     45 ns
DMPSC timed spin only                94 ns     52 ns     46 ns
DMPSC wait  spin only               104 ns     54 ns     43 ns
DMPSC try   may block                59 ns     54 ns     51 ns
DMPSC timed may block                86 ns     58 ns     52 ns
DMPSC wait  may block                76 ns     57 ns     53 ns
..............................................................
DMPMC try   spin only                68 ns     64 ns     60 ns
DMPMC timed spin only               137 ns     73 ns     61 ns
DMPMC wait  spin only                86 ns     65 ns     58 ns
DMPMC try   may block                89 ns     71 ns     65 ns
DMPMC timed may block                82 ns     69 ns     65 ns
DMPMC wait  may block                84 ns     71 ns     66 ns
..............................................................
folly::MPMC  read                   222 ns    203 ns    192 ns
folly::MPMC  tryReadUntil           239 ns    232 ns    191 ns
folly::MPMC  blockingRead            78 ns     68 ns     64 ns
==============================================================
====================== 32 prod   8 cons ======================
=== uint32_t =================================================
DMPMC try   spin only               183 ns    138 ns    107 ns
DMPMC timed spin only               237 ns    158 ns     98 ns
DMPMC wait  spin only                87 ns     70 ns     58 ns
DMPMC try   may block               169 ns    132 ns     92 ns
DMPMC timed may block               172 ns    133 ns     79 ns
DMPMC wait  may block               166 ns     89 ns     66 ns
..............................................................
folly::MPMC  read                   221 ns    194 ns    183 ns
folly::MPMC  tryReadUntil           258 ns    244 ns    230 ns
folly::MPMC  blockingRead            60 ns     54 ns     47 ns
==============================================================
====================== 32 prod  32 cons ======================
=== uint32_t =================================================
DMPMC try   spin only               419 ns    252 ns    181 ns
DMPMC timed spin only               252 ns    212 ns    179 ns
DMPMC wait  spin only               153 ns     79 ns     62 ns
DMPMC try   may block               302 ns    236 ns    182 ns
DMPMC timed may block               266 ns    213 ns    170 ns
DMPMC wait  may block               262 ns    120 ns     64 ns
..............................................................
folly::MPMC  read                   269 ns    245 ns    199 ns
folly::MPMC  tryReadUntil           257 ns    245 ns    235 ns
folly::MPMC  blockingRead            53 ns     48 ns     45 ns
==============================================================

$ numactl -N 1 dynamic_bounded_queue_test --bench --capacity=1000
==============================================================
10 reps of  1000000 handoffs
..............................................................
Using capacity 1000 for all queues
==============================================================
Test name                         Max time  Avg time  Min time
======================  1 prod   1 cons ======================
=== uint32_t =================================================
DSPSC try   spin only                 7 ns      7 ns      7 ns
DSPSC timed spin only                 9 ns      9 ns      9 ns
DSPSC wait  spin only                 7 ns      7 ns      7 ns
DSPSC try   may block                34 ns     33 ns     31 ns
DSPSC timed may block                34 ns     34 ns     33 ns
DSPSC wait  may block                30 ns     30 ns     29 ns
..............................................................
DMPSC try   spin only                60 ns     57 ns     55 ns
DMPSC timed spin only                55 ns     52 ns     51 ns
DMPSC wait  spin only                57 ns     54 ns     52 ns
DMPSC try   may block                66 ns     62 ns     39 ns
DMPSC timed may block                67 ns     64 ns     62 ns
DMPSC wait  may block                67 ns     65 ns     64 ns
..............................................................
DSPMC try   spin only                27 ns     25 ns     24 ns
DSPMC timed spin only                25 ns     25 ns     24 ns
DSPMC wait  spin only                23 ns     23 ns     22 ns
DSPMC try   may block                31 ns     26 ns     24 ns
DSPMC timed may block                33 ns     30 ns     30 ns
DSPMC wait  may block                37 ns     29 ns     28 ns
..............................................................
DMPMC try   spin only                55 ns     53 ns     51 ns
DMPMC timed spin only                36 ns     31 ns     26 ns
DMPMC wait  spin only                54 ns     53 ns     51 ns
DMPMC try   may block                68 ns     64 ns     51 ns
DMPMC timed may block                66 ns     63 ns     60 ns
DMPMC wait  may block                68 ns     63 ns     60 ns
..............................................................
folly::PCQ  read                     15 ns     13 ns     11 ns
..............................................................
folly::MPMC  read                    60 ns     56 ns     51 ns
folly::MPMC  tryReadUntil           134 ns    112 ns    102 ns
folly::MPMC  blockingRead            57 ns     51 ns     48 ns
==============================================================
======================  1 prod   8 cons ======================
=== uint32_t =================================================
DSPMC try   spin only               169 ns    162 ns    151 ns
DSPMC timed spin only               178 ns    166 ns    149 ns
DSPMC wait  spin only                59 ns     55 ns     54 ns
DSPMC try   may block               173 ns    163 ns    153 ns
DSPMC timed may block               171 ns    166 ns    156 ns
DSPMC wait  may block                71 ns     57 ns     51 ns
..............................................................
DMPMC try   spin only               172 ns    164 ns    158 ns
DMPMC timed spin only               173 ns    164 ns    156 ns
DMPMC wait  spin only                77 ns     62 ns     53 ns
DMPMC try   may block               181 ns    163 ns    152 ns
DMPMC timed may block               174 ns    165 ns    151 ns
DMPMC wait  may block                91 ns     72 ns     52 ns
..............................................................
folly::MPMC  read                   178 ns    167 ns    161 ns
folly::MPMC  tryReadUntil           991 ns    676 ns    423 ns
folly::MPMC  blockingRead           154 ns    129 ns     96 ns
==============================================================
======================  1 prod  32 cons ======================
=== uint32_t =================================================
DSPMC try   spin only               462 ns    288 ns    201 ns
DSPMC timed spin only               514 ns    283 ns    201 ns
DSPMC wait  spin only               100 ns     60 ns     45 ns
DSPMC try   may block               531 ns    318 ns    203 ns
DSPMC timed may block              1379 ns    891 ns    460 ns
DSPMC wait  may block               148 ns    111 ns     82 ns
..............................................................
DMPMC try   spin only               404 ns    312 ns    205 ns
DMPMC timed spin only               337 ns    253 ns    219 ns
DMPMC wait  spin only               130 ns     97 ns     72 ns
DMPMC try   may block               532 ns    265 ns    201 ns
DMPMC timed may block               846 ns    606 ns    412 ns
DMPMC wait  may block               158 ns    112 ns     87 ns
..............................................................
folly::MPMC  read                   880 ns    419 ns    284 ns
folly::MPMC  tryReadUntil          23432 ns   23184 ns   23007 ns
folly::MPMC  blockingRead          1353 ns   1308 ns   1279 ns
==============================================================
======================  8 prod   1 cons ======================
=== uint32_t =================================================
DMPSC try   spin only                67 ns     63 ns     51 ns
DMPSC timed spin only                69 ns     65 ns     63 ns
DMPSC wait  spin only                67 ns     65 ns     61 ns
DMPSC try   may block                73 ns     69 ns     63 ns
DMPSC timed may block                72 ns     69 ns     64 ns
DMPSC wait  may block                71 ns     70 ns     68 ns
..............................................................
DMPMC try   spin only                70 ns     64 ns     59 ns
DMPMC timed spin only                76 ns     66 ns     53 ns
DMPMC wait  spin only                68 ns     66 ns     64 ns
DMPMC try   may block                71 ns     68 ns     66 ns
DMPMC timed may block                72 ns     70 ns     67 ns
DMPMC wait  may block                73 ns     70 ns     67 ns
..............................................................
folly::MPMC  read                   193 ns    167 ns    153 ns
folly::MPMC  tryReadUntil           497 ns    415 ns    348 ns
folly::MPMC  blockingRead           163 ns    134 ns    115 ns
==============================================================
======================  8 prod   8 cons ======================
=== uint32_t =================================================
DMPMC try   spin only               216 ns    203 ns    196 ns
DMPMC timed spin only               199 ns    186 ns    178 ns
DMPMC wait  spin only                63 ns     60 ns     58 ns
DMPMC try   may block               212 ns    198 ns    183 ns
DMPMC timed may block               180 ns    170 ns    162 ns
DMPMC wait  may block                72 ns     68 ns     65 ns
..............................................................
folly::MPMC  read                   225 ns    201 ns    188 ns
folly::MPMC  tryReadUntil           255 ns    248 ns    232 ns
folly::MPMC  blockingRead            52 ns     48 ns     42 ns
==============================================================
======================  8 prod  32 cons ======================
=== uint32_t =================================================
DMPMC try   spin only               360 ns    302 ns    195 ns
DMPMC timed spin only               350 ns    272 ns    218 ns
DMPMC wait  spin only                92 ns     72 ns     61 ns
DMPMC try   may block               352 ns    263 ns    223 ns
DMPMC timed may block               218 ns    213 ns    209 ns
DMPMC wait  may block                98 ns     77 ns     70 ns
..............................................................
folly::MPMC  read                   611 ns    461 ns    339 ns
folly::MPMC  tryReadUntil           270 ns    260 ns    253 ns
folly::MPMC  blockingRead            89 ns     84 ns     80 ns
==============================================================
====================== 32 prod   1 cons ======================
=== uint32_t =================================================
DMPSC try   spin only               389 ns    248 ns    149 ns
DMPSC timed spin only               356 ns    235 ns    120 ns
DMPSC wait  spin only               343 ns    242 ns    125 ns
DMPSC try   may block               412 ns    294 ns    168 ns
DMPSC timed may block               332 ns    271 ns    189 ns
DMPSC wait  may block               280 ns    252 ns    199 ns
..............................................................
DMPMC try   spin only               393 ns    269 ns    105 ns
DMPMC timed spin only               328 ns    240 ns    112 ns
DMPMC wait  spin only               502 ns    266 ns    107 ns
DMPMC try   may block               514 ns    346 ns    192 ns
DMPMC timed may block               339 ns    318 ns    278 ns
DMPMC wait  may block               319 ns    307 ns    292 ns
..............................................................
folly::MPMC  read                   948 ns    517 ns    232 ns
folly::MPMC  tryReadUntil          9649 ns   7567 ns   4140 ns
folly::MPMC  blockingRead          1365 ns   1316 ns   1131 ns
==============================================================
====================== 32 prod   8 cons ======================
=== uint32_t =================================================
DMPMC try   spin only               436 ns    257 ns    115 ns
DMPMC timed spin only               402 ns    272 ns    121 ns
DMPMC wait  spin only               136 ns     78 ns     55 ns
DMPMC try   may block               454 ns    227 ns     78 ns
DMPMC timed may block               155 ns    137 ns    116 ns
DMPMC wait  may block                62 ns     59 ns     57 ns
..............................................................
folly::MPMC  read                   677 ns    497 ns    336 ns
folly::MPMC  tryReadUntil           268 ns    262 ns    258 ns
folly::MPMC  blockingRead            87 ns     85 ns     82 ns
==============================================================
====================== 32 prod  32 cons ======================
=== uint32_t =================================================
DMPMC try   spin only               786 ns    381 ns    142 ns
DMPMC timed spin only               795 ns    346 ns    126 ns
DMPMC wait  spin only               334 ns    107 ns     55 ns
DMPMC try   may block               535 ns    317 ns    144 ns
DMPMC timed may block               197 ns    192 ns    183 ns
DMPMC wait  may block               189 ns     75 ns     60 ns
..............................................................
folly::MPMC  read                  1110 ns    919 ns    732 ns
folly::MPMC  tryReadUntil           214 ns    210 ns    206 ns
folly::MPMC  blockingRead            53 ns     52 ns     51 ns
==============================================================

$ lscpu
Architecture:        x86_64
CPU op-mode(s):      32-bit, 64-bit
Byte Order:          Little Endian
CPU(s):              32
On-line CPU(s) list: 0-31
Thread(s) per core:  2
Core(s) per socket:  8
Socket(s):           2
NUMA node(s):        2
Vendor ID:           GenuineIntel
CPU family:          6
Model:               45
Model name:          Intel(R) Xeon(R) CPU E5-2660 0 @ 2.20GHz
Stepping:            6
CPU MHz:             2200.000
CPU max MHz:         2200.0000
CPU min MHz:         1200.0000
BogoMIPS:            4399.92
Virtualization:      VT-x
L1d cache:           32K
L1i cache:           32K
L2 cache:            256K
L3 cache:            20480K
NUMA node0 CPU(s):   0-7,16-23
NUMA node1 CPU(s):   8-15,24-31

Flags:               fpu vme de pse tsc msr pae mce cx8 apic sep mtrr
                     pge mca cmov pat pse36 clflush dts acpi mmx fxsr
                     sse sse2 ss ht tm pbe syscall nx pdpe1gb rdtscp
                     lm constant_tsc arch_perfmon pebs bts rep_good
                     nopl xtopology nonstop_tsc aperfmperf eagerfpu
                     pni pclmulqdq dtes64 monitor ds_cpl vmx smx est
                     tm2 ssse3 cx16 xtpr pdcm pcid dca sse4_1 sse4_2
                     x2apic popcnt tsc_deadline_timer aes xsave avx
                     lahf_lm epb tpr_shadow vnmi flexpriority ept vpid
                     xsaveopt dtherm arat pln pts
 */
