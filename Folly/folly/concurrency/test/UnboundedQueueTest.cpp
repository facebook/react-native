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

#include <folly/concurrency/UnboundedQueue.h>
#include <folly/MPMCQueue.h>
#include <folly/ProducerConsumerQueue.h>
#include <folly/portability/GTest.h>

#include <glog/logging.h>

#include <atomic>
#include <thread>

DEFINE_bool(bench, false, "run benchmark");
DEFINE_int32(reps, 10, "number of reps");
DEFINE_int32(ops, 1000000, "number of operations per rep");
DEFINE_int64(capacity, 256 * 1024, "capacity");

template <typename T, bool MayBlock>
using USPSC = folly::USPSCQueue<T, MayBlock>;

template <typename T, bool MayBlock>
using UMPSC = folly::UMPSCQueue<T, MayBlock>;

template <typename T, bool MayBlock>
using USPMC = folly::USPMCQueue<T, MayBlock>;

template <typename T, bool MayBlock>
using UMPMC = folly::UMPMCQueue<T, MayBlock>;

template <template <typename, bool> class Q, bool MayBlock>
void basic_test() {
  Q<int, MayBlock> q;
  ASSERT_TRUE(q.empty());
  ASSERT_EQ(q.size(), 0);
  int v = -1;
  ASSERT_FALSE(q.try_dequeue(v));

  q.enqueue(1);
  ASSERT_FALSE(q.empty());
  ASSERT_EQ(q.size(), 1);

  q.enqueue(2);
  ASSERT_EQ(q.size(), 2);
  ASSERT_FALSE(q.empty());

  ASSERT_TRUE(q.try_dequeue(v));
  ASSERT_EQ(v, 1);
  ASSERT_FALSE(q.empty());
  ASSERT_EQ(q.size(), 1);

  ASSERT_TRUE(q.try_dequeue(v));
  ASSERT_EQ(v, 2);
  ASSERT_TRUE(q.empty());
  ASSERT_EQ(q.size(), 0);
}

TEST(UnboundedQueue, basic) {
  basic_test<USPSC, false>();
  basic_test<UMPSC, false>();
  basic_test<USPMC, false>();
  basic_test<UMPMC, false>();
  basic_test<USPSC, true>();
  basic_test<UMPSC, true>();
  basic_test<USPMC, true>();
  basic_test<UMPMC, true>();
}

template <template <typename, bool> class Q, bool MayBlock>
void timeout_test() {
  Q<int, MayBlock> q;
  int v;
  ASSERT_FALSE(q.try_dequeue_until(
      v, std::chrono::steady_clock::now() + std::chrono::microseconds(1)));
  ASSERT_FALSE(q.try_dequeue_for(v, std::chrono::microseconds(1)));
  q.enqueue(10);
  ASSERT_TRUE(q.try_dequeue_until(
      v, std::chrono::steady_clock::now() + std::chrono::microseconds(1)));
  ASSERT_EQ(v, 10);
}

TEST(UnboundedQueue, timeout) {
  timeout_test<USPSC, false>();
  timeout_test<UMPSC, false>();
  timeout_test<USPMC, false>();
  timeout_test<UMPMC, false>();
  timeout_test<USPSC, true>();
  timeout_test<UMPSC, true>();
  timeout_test<USPMC, true>();
  timeout_test<UMPMC, true>();
}

template <template <typename, bool> class Q, bool MayBlock>
void peek_test() {
  Q<int, MayBlock> q;
  auto res = q.try_peek();
  ASSERT_FALSE(res);
  for (int i = 0; i < 1000; ++i) {
    q.enqueue(i);
  }
  for (int i = 0; i < 700; ++i) {
    int v;
    q.dequeue(v);
  }
  res = q.try_peek();
  ASSERT_TRUE(res);
  ASSERT_EQ(*res, 700);
}

TEST(UnboundedQueue, peek) {
  peek_test<USPSC, false>();
  peek_test<UMPSC, false>();
  peek_test<USPSC, true>();
  peek_test<UMPSC, true>();
}

TEST(UnboundedQueue, cleanup_on_destruction) {
  struct Foo {
    int* p_{nullptr};
    explicit Foo(int* p) : p_(p) {}
    Foo(Foo&& o) noexcept : p_(std::exchange(o.p_, nullptr)) {}
    ~Foo() {
      if (p_) {
        ++(*p_);
      }
    }
    Foo& operator=(Foo&& o) noexcept {
      p_ = std::exchange(o.p_, nullptr);
      return *this;
    }
  };
  int count = 0;
  int num = 3;
  {
    folly::UMPMCQueue<Foo, false> q;
    for (int i = 0; i < num; ++i) {
      Foo foo(&count);
      q.enqueue(std::move(foo));
    }
  }
  EXPECT_EQ(count, num);
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
  folly::UnboundedQueue<int, SingleProducer, SingleConsumer, MayBlock, 4> q;
  std::atomic<uint64_t> sum(0);

  auto prod = [&](int tid) {
    for (int i = tid; i < ops; i += nprod) {
      q.enqueue(i);
    }
  };

  auto cons = [&](int tid) {
    uint64_t mysum = 0;
    for (int i = tid; i < ops; i += ncons) {
      int v = -1;
      int vpeek = -1;

      if (SingleConsumer) {
        while (true) {
          auto res = q.try_peek();
          if (res) {
            vpeek = *res;
            break;
          }
        }
      }
      if ((i % 3) == 0) {
        while (!q.try_dequeue(v)) {
          /* keep trying */;
        }
      } else if ((i % 3) == 1) {
        auto duration = std::chrono::milliseconds(1);
        while (!q.try_dequeue_for(v, duration)) {
          /* keep trying */;
        }
      } else {
        q.dequeue(v);
      }
      if (nprod == 1 && ncons == 1) {
        ASSERT_EQ(v, i);
      }
      if (SingleConsumer) {
        ASSERT_EQ(v, vpeek);
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

TEST(UnboundedQueue, enq_deq) {
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
    // if each rep takes too long run at least 3 reps
    const uint64_t minute = 60000000000UL;
    if (sum > minute && r >= 2) {
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

template <template <typename, bool> class Q, typename T, int Op>
uint64_t bench(const int nprod, const int ncons, const std::string& name) {
  int ops = FLAGS_ops;
  auto repFn = [&] {
    Q<T, Op == 3 || Op == 4 || Op == 5> q;
    std::atomic<uint64_t> sum(0);
    auto prod = [&](int tid) {
      for (int i = tid; i < ops; i += nprod) {
        q.enqueue(i);
      }
    };
    auto cons = [&](int tid) {
      uint64_t mysum = 0;
      for (int i = tid; i < ops; i += ncons) {
        T v;
        if (Op == 0 || Op == 3) {
          while (UNLIKELY(!q.try_dequeue(v))) {
            /* keep trying */;
          }
        } else if (Op == 1 || Op == 4) {
          auto duration = std::chrono::microseconds(1000);
          while (UNLIKELY(!q.try_dequeue_for(v, duration))) {
            /* keep trying */;
          }
        } else {
          ASSERT_TRUE(Op == 2 || Op == 5);
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
  MPMC() : q_(FLAGS_capacity) {}

  template <typename... Args>
  void enqueue(Args&&... args) {
    q_.blockingWrite(std::forward<Args>(args)...);
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
      const std::chrono::duration<Rep, Period>& duration) noexcept {
    auto deadline = std::chrono::steady_clock::now() + duration;
    return q_.tryReadUntil(deadline, item);
  }
};

template <typename T, bool ignore>
using FMPMC = MPMC<T>;

template <typename T>
class PCQ {
  folly::ProducerConsumerQueue<T> q_;

 public:
  PCQ() : q_(FLAGS_capacity) {}

  template <typename... Args>
  void enqueue(Args&&... args) {
    while (!q_.write(std::forward<Args>(args)...)) {
      /* keep trying*/;
    }
  }

  void dequeue(T&) {
    ASSERT_TRUE(false);
  }

  bool try_dequeue(T& item) {
    return q_.read(item);
  }

  template <typename Rep, typename Period>
  bool try_dequeue_for(T&, const std::chrono::duration<Rep, Period>&) noexcept {
    return false;
  }
};

template <typename T, bool ignore>
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
    bench<USPSC, T, 0>(1, 1, "Unbounded SPSC try   spin only  ");
    bench<USPSC, T, 1>(1, 1, "Unbounded SPSC timed spin only  ");
    bench<USPSC, T, 2>(1, 1, "Unbounded SPSC wait  spin only  ");
    bench<USPSC, T, 3>(1, 1, "Unbounded SPSC try   may block  ");
    bench<USPSC, T, 4>(1, 1, "Unbounded SPSC timed may block  ");
    bench<USPSC, T, 5>(1, 1, "Unbounded SPSC wait  may block  ");
    dottedLine();
  }
  if (nc == 1) {
    bench<UMPSC, T, 0>(np, 1, "Unbounded MPSC try   spin only  ");
    bench<UMPSC, T, 1>(np, 1, "Unbounded MPSC timed spin only  ");
    bench<UMPSC, T, 2>(np, 1, "Unbounded MPSC wait  spin only  ");
    bench<UMPSC, T, 3>(np, 1, "Unbounded MPSC try   may block  ");
    bench<UMPSC, T, 4>(np, 1, "Unbounded MPSC timed may block  ");
    bench<UMPSC, T, 5>(np, 1, "Unbounded MPSC wait  may block  ");
    dottedLine();
  }
  if (np == 1) {
    bench<USPMC, T, 0>(1, nc, "Unbounded SPMC try   spin only  ");
    bench<USPMC, T, 1>(1, nc, "Unbounded SPMC timed spin only  ");
    bench<USPMC, T, 2>(1, nc, "Unbounded SPMC wait  spin only  ");
    bench<USPMC, T, 3>(1, nc, "Unbounded SPMC try   may block  ");
    bench<USPMC, T, 4>(1, nc, "Unbounded SPMC timed may block  ");
    bench<USPMC, T, 5>(1, nc, "Unbounded SPMC wait  may block  ");
    dottedLine();
  }
  bench<UMPMC, T, 0>(np, nc, "Unbounded MPMC try   spin only  ");
  bench<UMPMC, T, 1>(np, nc, "Unbounded MPMC timed spin only  ");
  bench<UMPMC, T, 2>(np, nc, "Unbounded MPMC wait  spin only  ");
  bench<UMPMC, T, 3>(np, nc, "Unbounded MPMC try   may block  ");
  bench<UMPMC, T, 4>(np, nc, "Unbounded MPMC timed may block  ");
  bench<UMPMC, T, 5>(np, nc, "Unbounded MPMC wait  may block  ");
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

TEST(UnboundedQueue, bench) {
  if (!FLAGS_bench) {
    return;
  }
  std::cout << "=============================================================="
            << std::endl;
  std::cout << std::setw(2) << FLAGS_reps << " reps of " << std::setw(8)
            << FLAGS_ops << " handoffs\n";
  dottedLine();
  std::cout << "$ numactl -N 1 $dir/unbounded_queue_test --bench\n";
  dottedLine();
  std::cout << "Using capacity " << FLAGS_capacity
            << " for folly::ProducerConsumerQueue and\n"
            << "folly::MPMCQueue\n";
  std::cout << "=============================================================="
            << std::endl;
  std::cout << "Test name                         Max time  Avg time  Min time"
            << std::endl;

  for (int nc : {1, 2, 4, 8, 16, 32}) {
    int np = 1;
    benches(np, nc);
  }

  for (int np : {1, 2, 4, 8, 16, 32}) {
    int nc = 1;
    benches(np, nc);
  }

  for (int np : {2, 4, 8, 16, 32}) {
    for (int nc : {2, 4, 8, 16, 32}) {
      benches(np, nc);
    }
  }
}

/*
==============================================================
10 reps of  1000000 handoffs
..............................................................
$ numactl -N 1 $dir/unbounded_queue_test --bench
..............................................................
Using capacity 262144 for folly::ProducerConsumerQueue and
folly::MPMCQueue
==============================================================
Test name                         Max time  Avg time  Min time
======================  1 prod   1 cons ======================
=== uint32_t =================================================
Unbounded SPSC try   spin only        5 ns      5 ns      5 ns
Unbounded SPSC timed spin only        5 ns      5 ns      5 ns
Unbounded SPSC wait  spin only        6 ns      6 ns      5 ns
Unbounded SPSC try   may block       38 ns     37 ns     35 ns
Unbounded SPSC timed may block       38 ns     36 ns     34 ns
Unbounded SPSC wait  may block       34 ns     34 ns     33 ns
..............................................................
Unbounded MPSC try   spin only       45 ns     43 ns     42 ns
Unbounded MPSC timed spin only       47 ns     43 ns     42 ns
Unbounded MPSC wait  spin only       45 ns     43 ns     41 ns
Unbounded MPSC try   may block       55 ns     52 ns     51 ns
Unbounded MPSC timed may block       54 ns     52 ns     51 ns
Unbounded MPSC wait  may block       51 ns     50 ns     49 ns
..............................................................
Unbounded SPMC try   spin only       18 ns     17 ns     16 ns
Unbounded SPMC timed spin only       23 ns     21 ns     18 ns
Unbounded SPMC wait  spin only       22 ns     19 ns     16 ns
Unbounded SPMC try   may block       30 ns     26 ns     22 ns
Unbounded SPMC timed may block       32 ns     24 ns     20 ns
Unbounded SPMC wait  may block       49 ns     35 ns     29 ns
..............................................................
Unbounded MPMC try   spin only       25 ns     24 ns     24 ns
Unbounded MPMC timed spin only       38 ns     35 ns     30 ns
Unbounded MPMC wait  spin only       41 ns     39 ns     37 ns
Unbounded MPMC try   may block       53 ns     52 ns     51 ns
Unbounded MPMC timed may block       52 ns     51 ns     49 ns
Unbounded MPMC wait  may block       53 ns     51 ns     50 ns
..............................................................
folly::PCQ  read                     16 ns     11 ns      7 ns
..............................................................
folly::MPMC  read                    52 ns     52 ns     51 ns
folly::MPMC  tryReadUntil            96 ns     90 ns     55 ns
folly::MPMC  blockingRead            61 ns     56 ns     50 ns
==============================================================
======================  1 prod   2 cons ======================
=== uint32_t =================================================
Unbounded SPMC try   spin only       76 ns     68 ns     53 ns
Unbounded SPMC timed spin only       79 ns     71 ns     65 ns
Unbounded SPMC wait  spin only       39 ns     35 ns     32 ns
Unbounded SPMC try   may block       83 ns     81 ns     76 ns
Unbounded SPMC timed may block       86 ns     63 ns     23 ns
Unbounded SPMC wait  may block       38 ns     36 ns     34 ns
..............................................................
Unbounded MPMC try   spin only       86 ns     79 ns     64 ns
Unbounded MPMC timed spin only       84 ns     77 ns     74 ns
Unbounded MPMC wait  spin only       36 ns     35 ns     34 ns
Unbounded MPMC try   may block       83 ns     79 ns     75 ns
Unbounded MPMC timed may block       83 ns     76 ns     63 ns
Unbounded MPMC wait  may block       56 ns     48 ns     36 ns
..............................................................
folly::MPMC  read                   103 ns     93 ns     68 ns
folly::MPMC  tryReadUntil           109 ns    102 ns     91 ns
folly::MPMC  blockingRead            61 ns     58 ns     54 ns
==============================================================
======================  1 prod   4 cons ======================
=== uint32_t =================================================
Unbounded SPMC try   spin only      116 ns    109 ns     97 ns
Unbounded SPMC timed spin only      117 ns    111 ns    108 ns
Unbounded SPMC wait  spin only       43 ns     40 ns     37 ns
Unbounded SPMC try   may block      127 ns    113 ns     98 ns
Unbounded SPMC timed may block      116 ns    109 ns     97 ns
Unbounded SPMC wait  may block       45 ns     43 ns     40 ns
..............................................................
Unbounded MPMC try   spin only      121 ns    113 ns    102 ns
Unbounded MPMC timed spin only      118 ns    108 ns     88 ns
Unbounded MPMC wait  spin only       45 ns     41 ns     34 ns
Unbounded MPMC try   may block      117 ns    108 ns     96 ns
Unbounded MPMC timed may block      118 ns    109 ns     99 ns
Unbounded MPMC wait  may block       62 ns     53 ns     43 ns
..............................................................
folly::MPMC  read                   139 ns    130 ns    111 ns
folly::MPMC  tryReadUntil           205 ns    135 ns    115 ns
folly::MPMC  blockingRead           104 ns     74 ns     54 ns
==============================================================
======================  1 prod   8 cons ======================
=== uint32_t =================================================
Unbounded SPMC try   spin only      169 ns    163 ns    157 ns
Unbounded SPMC timed spin only      167 ns    158 ns    133 ns
Unbounded SPMC wait  spin only       44 ns     39 ns     36 ns
Unbounded SPMC try   may block      170 ns    165 ns    156 ns
Unbounded SPMC timed may block      172 ns    163 ns    153 ns
Unbounded SPMC wait  may block       49 ns     40 ns     35 ns
..............................................................
Unbounded MPMC try   spin only      166 ns    158 ns    149 ns
Unbounded MPMC timed spin only      171 ns    161 ns    145 ns
Unbounded MPMC wait  spin only       62 ns     52 ns     42 ns
Unbounded MPMC try   may block      169 ns    161 ns    149 ns
Unbounded MPMC timed may block      170 ns    160 ns    147 ns
Unbounded MPMC wait  may block       70 ns     63 ns     61 ns
..............................................................
folly::MPMC  read                   174 ns    167 ns    159 ns
folly::MPMC  tryReadUntil           349 ns    171 ns    148 ns
folly::MPMC  blockingRead           182 ns    138 ns    115 ns
==============================================================
======================  1 prod  16 cons ======================
=== uint32_t =================================================
Unbounded SPMC try   spin only      219 ns    198 ns    190 ns
Unbounded SPMC timed spin only      202 ns    198 ns    193 ns
Unbounded SPMC wait  spin only       36 ns     36 ns     35 ns
Unbounded SPMC try   may block      202 ns    195 ns    190 ns
Unbounded SPMC timed may block      208 ns    197 ns    190 ns
Unbounded SPMC wait  may block       96 ns     77 ns     64 ns
..............................................................
Unbounded MPMC try   spin only      204 ns    198 ns    194 ns
Unbounded MPMC timed spin only      202 ns    195 ns    190 ns
Unbounded MPMC wait  spin only       61 ns     59 ns     57 ns
Unbounded MPMC try   may block      206 ns    196 ns    191 ns
Unbounded MPMC timed may block      204 ns    198 ns    192 ns
Unbounded MPMC wait  may block      100 ns     88 ns     84 ns
..............................................................
folly::MPMC  read                   210 ns    191 ns    182 ns
folly::MPMC  tryReadUntil           574 ns    248 ns    192 ns
folly::MPMC  blockingRead          1400 ns   1319 ns   1227 ns
==============================================================
======================  1 prod  32 cons ======================
=== uint32_t =================================================
Unbounded SPMC try   spin only      209 ns    205 ns    199 ns
Unbounded SPMC timed spin only      208 ns    205 ns    200 ns
Unbounded SPMC wait  spin only      175 ns     51 ns     33 ns
Unbounded SPMC try   may block      215 ns    203 ns    186 ns
Unbounded SPMC timed may block      453 ns    334 ns    204 ns
Unbounded SPMC wait  may block      110 ns     87 ns     55 ns
..............................................................
Unbounded MPMC try   spin only      328 ns    218 ns    197 ns
Unbounded MPMC timed spin only      217 ns    206 ns    200 ns
Unbounded MPMC wait  spin only      147 ns     85 ns     58 ns
Unbounded MPMC try   may block      310 ns    223 ns    199 ns
Unbounded MPMC timed may block      461 ns    275 ns    196 ns
Unbounded MPMC wait  may block      148 ns    111 ns     78 ns
..............................................................
folly::MPMC  read                   280 ns    215 ns    194 ns
folly::MPMC  tryReadUntil          28740 ns   13508 ns    212 ns
folly::MPMC  blockingRead          1343 ns   1293 ns   1269 ns
==============================================================
======================  1 prod   1 cons ======================
=== uint32_t =================================================
Unbounded SPSC try   spin only        5 ns      5 ns      5 ns
Unbounded SPSC timed spin only        8 ns      6 ns      6 ns
Unbounded SPSC wait  spin only        6 ns      6 ns      5 ns
Unbounded SPSC try   may block       37 ns     36 ns     35 ns
Unbounded SPSC timed may block       37 ns     36 ns     35 ns
Unbounded SPSC wait  may block       35 ns     35 ns     34 ns
..............................................................
Unbounded MPSC try   spin only       43 ns     42 ns     41 ns
Unbounded MPSC timed spin only       45 ns     42 ns     42 ns
Unbounded MPSC wait  spin only       44 ns     43 ns     42 ns
Unbounded MPSC try   may block       55 ns     51 ns     50 ns
Unbounded MPSC timed may block       61 ns     52 ns     50 ns
Unbounded MPSC wait  may block       54 ns     52 ns     50 ns
..............................................................
Unbounded SPMC try   spin only       18 ns     17 ns     17 ns
Unbounded SPMC timed spin only       23 ns     19 ns     17 ns
Unbounded SPMC wait  spin only       20 ns     17 ns     15 ns
Unbounded SPMC try   may block       30 ns     23 ns     19 ns
Unbounded SPMC timed may block       23 ns     19 ns     17 ns
Unbounded SPMC wait  may block       36 ns     31 ns     26 ns
..............................................................
Unbounded MPMC try   spin only       25 ns     23 ns     17 ns
Unbounded MPMC timed spin only       37 ns     34 ns     25 ns
Unbounded MPMC wait  spin only       40 ns     38 ns     36 ns
Unbounded MPMC try   may block       51 ns     49 ns     48 ns
Unbounded MPMC timed may block       53 ns     50 ns     48 ns
Unbounded MPMC wait  may block       53 ns     49 ns     34 ns
..............................................................
folly::PCQ  read                     15 ns     12 ns      7 ns
..............................................................
folly::MPMC  read                    53 ns     51 ns     50 ns
folly::MPMC  tryReadUntil           100 ns     96 ns     90 ns
folly::MPMC  blockingRead            75 ns     59 ns     52 ns
==============================================================
======================  2 prod   1 cons ======================
=== uint32_t =================================================
Unbounded MPSC try   spin only       49 ns     49 ns     46 ns
Unbounded MPSC timed spin only       52 ns     50 ns     49 ns
Unbounded MPSC wait  spin only       53 ns     52 ns     51 ns
Unbounded MPSC try   may block       63 ns     60 ns     57 ns
Unbounded MPSC timed may block       64 ns     61 ns     54 ns
Unbounded MPSC wait  may block       62 ns     59 ns     35 ns
..............................................................
Unbounded MPMC try   spin only       44 ns     41 ns     38 ns
Unbounded MPMC timed spin only       50 ns     49 ns     49 ns
Unbounded MPMC wait  spin only       51 ns     49 ns     49 ns
Unbounded MPMC try   may block       63 ns     60 ns     57 ns
Unbounded MPMC timed may block       62 ns     60 ns     57 ns
Unbounded MPMC wait  may block       62 ns     60 ns     58 ns
..............................................................
folly::MPMC  read                    78 ns     57 ns     52 ns
folly::MPMC  tryReadUntil            78 ns     72 ns     70 ns
folly::MPMC  blockingRead            56 ns     54 ns     52 ns
==============================================================
======================  4 prod   1 cons ======================
=== uint32_t =================================================
Unbounded MPSC try   spin only       48 ns     47 ns     46 ns
Unbounded MPSC timed spin only       47 ns     47 ns     46 ns
Unbounded MPSC wait  spin only       49 ns     47 ns     47 ns
Unbounded MPSC try   may block       61 ns     59 ns     55 ns
Unbounded MPSC timed may block       62 ns     58 ns     46 ns
Unbounded MPSC wait  may block       62 ns     61 ns     59 ns
..............................................................
Unbounded MPMC try   spin only       42 ns     42 ns     40 ns
Unbounded MPMC timed spin only       48 ns     47 ns     45 ns
Unbounded MPMC wait  spin only       48 ns     47 ns     46 ns
Unbounded MPMC try   may block       63 ns     62 ns     61 ns
Unbounded MPMC timed may block       63 ns     61 ns     51 ns
Unbounded MPMC wait  may block       62 ns     61 ns     59 ns
..............................................................
folly::MPMC  read                    56 ns     55 ns     54 ns
folly::MPMC  tryReadUntil           112 ns    106 ns     97 ns
folly::MPMC  blockingRead            47 ns     47 ns     45 ns
==============================================================
======================  8 prod   1 cons ======================
=== uint32_t =================================================
Unbounded MPSC try   spin only       44 ns     43 ns     42 ns
Unbounded MPSC timed spin only       45 ns     44 ns     40 ns
Unbounded MPSC wait  spin only       45 ns     44 ns     41 ns
Unbounded MPSC try   may block       61 ns     60 ns     58 ns
Unbounded MPSC timed may block       61 ns     59 ns     56 ns
Unbounded MPSC wait  may block       61 ns     59 ns     56 ns
..............................................................
Unbounded MPMC try   spin only       43 ns     40 ns     36 ns
Unbounded MPMC timed spin only       45 ns     44 ns     41 ns
Unbounded MPMC wait  spin only       45 ns     43 ns     41 ns
Unbounded MPMC try   may block       62 ns     60 ns     58 ns
Unbounded MPMC timed may block       62 ns     59 ns     56 ns
Unbounded MPMC wait  may block       61 ns     58 ns     54 ns
..............................................................
folly::MPMC  read                   147 ns    119 ns     63 ns
folly::MPMC  tryReadUntil           152 ns    130 ns     97 ns
folly::MPMC  blockingRead           135 ns    101 ns     48 ns
==============================================================
====================== 16 prod   1 cons ======================
=== uint32_t =================================================
Unbounded MPSC try   spin only       47 ns     38 ns     35 ns
Unbounded MPSC timed spin only       36 ns     36 ns     35 ns
Unbounded MPSC wait  spin only       46 ns     37 ns     35 ns
Unbounded MPSC try   may block       58 ns     47 ns     45 ns
Unbounded MPSC timed may block       46 ns     46 ns     45 ns
Unbounded MPSC wait  may block       47 ns     45 ns     45 ns
..............................................................
Unbounded MPMC try   spin only       41 ns     39 ns     35 ns
Unbounded MPMC timed spin only       45 ns     41 ns     38 ns
Unbounded MPMC wait  spin only       43 ns     40 ns     38 ns
Unbounded MPMC try   may block       51 ns     49 ns     47 ns
Unbounded MPMC timed may block       52 ns     49 ns     47 ns
Unbounded MPMC wait  may block       59 ns     50 ns     46 ns
..............................................................
folly::MPMC  read                   924 ns    839 ns    664 ns
folly::MPMC  tryReadUntil           968 ns    865 ns    678 ns
folly::MPMC  blockingRead           929 ns    727 ns    487 ns
==============================================================
====================== 32 prod   1 cons ======================
=== uint32_t =================================================
Unbounded MPSC try   spin only       90 ns     44 ns     36 ns
Unbounded MPSC timed spin only       91 ns     43 ns     35 ns
Unbounded MPSC wait  spin only       92 ns     55 ns     36 ns
Unbounded MPSC try   may block       87 ns     52 ns     45 ns
Unbounded MPSC timed may block       70 ns     48 ns     45 ns
Unbounded MPSC wait  may block      109 ns     60 ns     45 ns
..............................................................
Unbounded MPMC try   spin only       47 ns     42 ns     37 ns
Unbounded MPMC timed spin only       50 ns     46 ns     38 ns
Unbounded MPMC wait  spin only       50 ns     42 ns     36 ns
Unbounded MPMC try   may block      103 ns     59 ns     50 ns
Unbounded MPMC timed may block       56 ns     52 ns     47 ns
Unbounded MPMC wait  may block       59 ns     51 ns     46 ns
..............................................................
folly::MPMC  read                  1029 ns    911 ns    694 ns
folly::MPMC  tryReadUntil          1023 ns    969 ns    907 ns
folly::MPMC  blockingRead          1024 ns    921 ns    790 ns
==============================================================
======================  2 prod   2 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only       83 ns     66 ns     24 ns
Unbounded MPMC timed spin only       84 ns     74 ns     49 ns
Unbounded MPMC wait  spin only       50 ns     49 ns     47 ns
Unbounded MPMC try   may block       86 ns     81 ns     77 ns
Unbounded MPMC timed may block       82 ns     74 ns     59 ns
Unbounded MPMC wait  may block       62 ns     59 ns     56 ns
..............................................................
folly::MPMC  read                    98 ns     85 ns     63 ns
folly::MPMC  tryReadUntil           105 ns     94 ns     83 ns
folly::MPMC  blockingRead            59 ns     56 ns     54 ns
==============================================================
======================  2 prod   4 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      114 ns    105 ns     91 ns
Unbounded MPMC timed spin only      119 ns    107 ns    102 ns
Unbounded MPMC wait  spin only       54 ns     53 ns     52 ns
Unbounded MPMC try   may block      114 ns    106 ns     93 ns
Unbounded MPMC timed may block      111 ns    100 ns     92 ns
Unbounded MPMC wait  may block       70 ns     64 ns     60 ns
..............................................................
folly::MPMC  read                   133 ns    125 ns    120 ns
folly::MPMC  tryReadUntil           130 ns    125 ns    114 ns
folly::MPMC  blockingRead            69 ns     68 ns     66 ns
==============================================================
======================  2 prod   8 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      169 ns    160 ns    152 ns
Unbounded MPMC timed spin only      165 ns    158 ns    149 ns
Unbounded MPMC wait  spin only       59 ns     54 ns     45 ns
Unbounded MPMC try   may block      166 ns    158 ns    131 ns
Unbounded MPMC timed may block      168 ns    163 ns    158 ns
Unbounded MPMC wait  may block       73 ns     66 ns     60 ns
..............................................................
folly::MPMC  read                   170 ns    167 ns    160 ns
folly::MPMC  tryReadUntil           163 ns    154 ns    146 ns
folly::MPMC  blockingRead            82 ns     73 ns     60 ns
==============================================================
======================  2 prod  16 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      207 ns    198 ns    191 ns
Unbounded MPMC timed spin only      211 ns    198 ns    192 ns
Unbounded MPMC wait  spin only       57 ns     55 ns     54 ns
Unbounded MPMC try   may block      197 ns    193 ns    188 ns
Unbounded MPMC timed may block      201 ns    195 ns    188 ns
Unbounded MPMC wait  may block       89 ns     78 ns     70 ns
..............................................................
folly::MPMC  read                   196 ns    189 ns    181 ns
folly::MPMC  tryReadUntil           202 ns    184 ns    173 ns
folly::MPMC  blockingRead           267 ns    100 ns     76 ns
==============================================================
======================  2 prod  32 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      228 ns    207 ns    193 ns
Unbounded MPMC timed spin only      210 ns    205 ns    198 ns
Unbounded MPMC wait  spin only      102 ns     71 ns     56 ns
Unbounded MPMC try   may block      268 ns    211 ns    198 ns
Unbounded MPMC timed may block      226 ns    205 ns    183 ns
Unbounded MPMC wait  may block      502 ns    164 ns     67 ns
..............................................................
folly::MPMC  read                   228 ns    205 ns    195 ns
folly::MPMC  tryReadUntil           207 ns    200 ns    192 ns
folly::MPMC  blockingRead           830 ns    612 ns    192 ns
==============================================================
======================  4 prod   2 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only       87 ns     65 ns     33 ns
Unbounded MPMC timed spin only       79 ns     60 ns     36 ns
Unbounded MPMC wait  spin only       47 ns     46 ns     44 ns
Unbounded MPMC try   may block       87 ns     77 ns     52 ns
Unbounded MPMC timed may block       86 ns     79 ns     57 ns
Unbounded MPMC wait  may block       62 ns     61 ns     60 ns
..............................................................
folly::MPMC  read                   110 ns     95 ns     60 ns
folly::MPMC  tryReadUntil           108 ns    104 ns     96 ns
folly::MPMC  blockingRead            60 ns     57 ns     47 ns
==============================================================
======================  4 prod   4 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      110 ns    100 ns     86 ns
Unbounded MPMC timed spin only      113 ns    104 ns     93 ns
Unbounded MPMC wait  spin only       49 ns     46 ns     45 ns
Unbounded MPMC try   may block      115 ns    105 ns     84 ns
Unbounded MPMC timed may block      119 ns    108 ns     89 ns
Unbounded MPMC wait  may block       63 ns     61 ns     54 ns
..............................................................
folly::MPMC  read                   140 ns    131 ns    113 ns
folly::MPMC  tryReadUntil           132 ns    129 ns    121 ns
folly::MPMC  blockingRead            58 ns     53 ns     48 ns
==============================================================
======================  4 prod   8 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      170 ns    162 ns    151 ns
Unbounded MPMC timed spin only      174 ns    158 ns    139 ns
Unbounded MPMC wait  spin only       51 ns     50 ns     48 ns
Unbounded MPMC try   may block      164 ns    160 ns    154 ns
Unbounded MPMC timed may block      165 ns    158 ns    144 ns
Unbounded MPMC wait  may block       67 ns     62 ns     52 ns
..............................................................
folly::MPMC  read                   174 ns    166 ns    156 ns
folly::MPMC  tryReadUntil           165 ns    160 ns    150 ns
folly::MPMC  blockingRead            58 ns     56 ns     49 ns
==============================================================
======================  4 prod  16 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      200 ns    195 ns    181 ns
Unbounded MPMC timed spin only      200 ns    195 ns    191 ns
Unbounded MPMC wait  spin only       51 ns     49 ns     45 ns
Unbounded MPMC try   may block      198 ns    192 ns    188 ns
Unbounded MPMC timed may block      199 ns    190 ns    182 ns
Unbounded MPMC wait  may block       77 ns     66 ns     60 ns
..............................................................
folly::MPMC  read                   195 ns    186 ns    175 ns
folly::MPMC  tryReadUntil           204 ns    187 ns    167 ns
folly::MPMC  blockingRead            66 ns     60 ns     57 ns
==============================================================
======================  4 prod  32 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      246 ns    210 ns    195 ns
Unbounded MPMC timed spin only      217 ns    207 ns    199 ns
Unbounded MPMC wait  spin only       66 ns     52 ns     46 ns
Unbounded MPMC try   may block      250 ns    207 ns    197 ns
Unbounded MPMC timed may block      208 ns    202 ns    195 ns
Unbounded MPMC wait  may block       80 ns     66 ns     56 ns
..............................................................
folly::MPMC  read                   231 ns    201 ns    190 ns
folly::MPMC  tryReadUntil           202 ns    199 ns    196 ns
folly::MPMC  blockingRead            65 ns     61 ns     57 ns
==============================================================
======================  8 prod   2 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only       50 ns     41 ns     39 ns
Unbounded MPMC timed spin only       73 ns     49 ns     40 ns
Unbounded MPMC wait  spin only       46 ns     43 ns     39 ns
Unbounded MPMC try   may block       81 ns     62 ns     56 ns
Unbounded MPMC timed may block       75 ns     61 ns     53 ns
Unbounded MPMC wait  may block       61 ns     57 ns     50 ns
..............................................................
folly::MPMC  read                   120 ns    102 ns     58 ns
folly::MPMC  tryReadUntil           119 ns    112 ns    103 ns
folly::MPMC  blockingRead            85 ns     71 ns     58 ns
==============================================================
======================  8 prod   4 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      104 ns     87 ns     39 ns
Unbounded MPMC timed spin only      109 ns     89 ns     40 ns
Unbounded MPMC wait  spin only       46 ns     45 ns     43 ns
Unbounded MPMC try   may block      121 ns    101 ns     74 ns
Unbounded MPMC timed may block      116 ns    103 ns     72 ns
Unbounded MPMC wait  may block       62 ns     57 ns     52 ns
..............................................................
folly::MPMC  read                   136 ns    130 ns    118 ns
folly::MPMC  tryReadUntil           132 ns    127 ns    118 ns
folly::MPMC  blockingRead            68 ns     61 ns     51 ns
==============================================================
======================  8 prod   8 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      175 ns    171 ns    162 ns
Unbounded MPMC timed spin only      177 ns    169 ns    159 ns
Unbounded MPMC wait  spin only       49 ns     47 ns     45 ns
Unbounded MPMC try   may block      175 ns    171 ns    156 ns
Unbounded MPMC timed may block      180 ns    170 ns    162 ns
Unbounded MPMC wait  may block       63 ns     62 ns     59 ns
..............................................................
folly::MPMC  read                   177 ns    162 ns    147 ns
folly::MPMC  tryReadUntil           170 ns    162 ns    148 ns
folly::MPMC  blockingRead            57 ns     53 ns     49 ns
==============================================================
======================  8 prod  16 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      203 ns    192 ns    185 ns
Unbounded MPMC timed spin only      199 ns    193 ns    185 ns
Unbounded MPMC wait  spin only       48 ns     46 ns     44 ns
Unbounded MPMC try   may block      204 ns    194 ns    182 ns
Unbounded MPMC timed may block      198 ns    187 ns    171 ns
Unbounded MPMC wait  may block       63 ns     61 ns     57 ns
..............................................................
folly::MPMC  read                   193 ns    185 ns    167 ns
folly::MPMC  tryReadUntil           199 ns    188 ns    164 ns
folly::MPMC  blockingRead            57 ns     52 ns     49 ns
==============================================================
======================  8 prod  32 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      222 ns    208 ns    198 ns
Unbounded MPMC timed spin only      234 ns    212 ns    203 ns
Unbounded MPMC wait  spin only       89 ns     58 ns     45 ns
Unbounded MPMC try   may block      234 ns    207 ns    196 ns
Unbounded MPMC timed may block      205 ns    203 ns    197 ns
Unbounded MPMC wait  may block       65 ns     63 ns     61 ns
..............................................................
folly::MPMC  read                   240 ns    204 ns    194 ns
folly::MPMC  tryReadUntil           205 ns    202 ns    199 ns
folly::MPMC  blockingRead            56 ns     52 ns     49 ns
==============================================================
====================== 16 prod   2 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only       52 ns     40 ns     34 ns
Unbounded MPMC timed spin only       63 ns     47 ns     36 ns
Unbounded MPMC wait  spin only       45 ns     39 ns     36 ns
Unbounded MPMC try   may block       62 ns     51 ns     47 ns
Unbounded MPMC timed may block       77 ns     52 ns     46 ns
Unbounded MPMC wait  may block       63 ns     50 ns     46 ns
..............................................................
folly::MPMC  read                   114 ns    103 ns     77 ns
folly::MPMC  tryReadUntil           116 ns    106 ns     85 ns
folly::MPMC  blockingRead            85 ns     79 ns     63 ns
==============================================================
====================== 16 prod   4 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      106 ns     68 ns     33 ns
Unbounded MPMC timed spin only       88 ns     56 ns     36 ns
Unbounded MPMC wait  spin only       46 ns     39 ns     35 ns
Unbounded MPMC try   may block       95 ns     66 ns     47 ns
Unbounded MPMC timed may block       80 ns     57 ns     46 ns
Unbounded MPMC wait  may block       52 ns     48 ns     45 ns
..............................................................
folly::MPMC  read                   121 ns    113 ns    104 ns
folly::MPMC  tryReadUntil           119 ns    110 ns    101 ns
folly::MPMC  blockingRead            65 ns     62 ns     57 ns
==============================================================
====================== 16 prod   8 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      153 ns    109 ns     46 ns
Unbounded MPMC timed spin only      167 ns    110 ns     36 ns
Unbounded MPMC wait  spin only       43 ns     39 ns     36 ns
Unbounded MPMC try   may block      159 ns    125 ns    100 ns
Unbounded MPMC timed may block      127 ns     82 ns     52 ns
Unbounded MPMC wait  may block       51 ns     50 ns     46 ns
..............................................................
folly::MPMC  read                   149 ns    139 ns    129 ns
folly::MPMC  tryReadUntil           141 ns    134 ns    112 ns
folly::MPMC  blockingRead            59 ns     54 ns     49 ns
==============================================================
====================== 16 prod  16 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      193 ns    169 ns    148 ns
Unbounded MPMC timed spin only      221 ns    175 ns    106 ns
Unbounded MPMC wait  spin only       45 ns     41 ns     37 ns
Unbounded MPMC try   may block      204 ns    171 ns    133 ns
Unbounded MPMC timed may block      184 ns    162 ns    104 ns
Unbounded MPMC wait  may block       61 ns     52 ns     49 ns
..............................................................
folly::MPMC  read                   181 ns    164 ns    157 ns
folly::MPMC  tryReadUntil           185 ns    173 ns    157 ns
folly::MPMC  blockingRead            56 ns     50 ns     45 ns
==============================================================
====================== 16 prod  32 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      255 ns    217 ns    181 ns
Unbounded MPMC timed spin only      225 ns    205 ns    182 ns
Unbounded MPMC wait  spin only      115 ns     57 ns     40 ns
Unbounded MPMC try   may block      215 ns    199 ns    184 ns
Unbounded MPMC timed may block      218 ns    196 ns    179 ns
Unbounded MPMC wait  may block       63 ns     54 ns     47 ns
..............................................................
folly::MPMC  read                   260 ns    205 ns    185 ns
folly::MPMC  tryReadUntil           205 ns    200 ns    192 ns
folly::MPMC  blockingRead            53 ns     48 ns     43 ns
==============================================================
====================== 32 prod   2 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only       95 ns     66 ns     45 ns
Unbounded MPMC timed spin only       95 ns     62 ns     45 ns
Unbounded MPMC wait  spin only       56 ns     44 ns     36 ns
Unbounded MPMC try   may block      123 ns     86 ns     50 ns
Unbounded MPMC timed may block      109 ns     73 ns     47 ns
Unbounded MPMC wait  may block       95 ns     58 ns     47 ns
..............................................................
folly::MPMC  read                   445 ns    380 ns    315 ns
folly::MPMC  tryReadUntil           459 ns    341 ns    153 ns
folly::MPMC  blockingRead           351 ns    286 ns    218 ns
==============================================================
====================== 32 prod   4 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      114 ns     92 ns     59 ns
Unbounded MPMC timed spin only      135 ns     99 ns     47 ns
Unbounded MPMC wait  spin only      139 ns     55 ns     38 ns
Unbounded MPMC try   may block      165 ns    113 ns     72 ns
Unbounded MPMC timed may block      119 ns     94 ns     51 ns
Unbounded MPMC wait  may block       61 ns     52 ns     47 ns
..............................................................
folly::MPMC  read                   127 ns    112 ns     93 ns
folly::MPMC  tryReadUntil           116 ns    107 ns     96 ns
folly::MPMC  blockingRead            67 ns     59 ns     51 ns
==============================================================
====================== 32 prod   8 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      226 ns    140 ns     57 ns
Unbounded MPMC timed spin only      176 ns    126 ns     61 ns
Unbounded MPMC wait  spin only       86 ns     50 ns     39 ns
Unbounded MPMC try   may block      170 ns    131 ns     76 ns
Unbounded MPMC timed may block      201 ns    141 ns    110 ns
Unbounded MPMC wait  may block       94 ns     55 ns     47 ns
..............................................................
folly::MPMC  read                   148 ns    131 ns    120 ns
folly::MPMC  tryReadUntil           132 ns    126 ns    121 ns
folly::MPMC  blockingRead            59 ns     54 ns     51 ns
==============================================================
====================== 32 prod  16 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      209 ns    174 ns    146 ns
Unbounded MPMC timed spin only      214 ns    189 ns    154 ns
Unbounded MPMC wait  spin only      138 ns     51 ns     38 ns
Unbounded MPMC try   may block      247 ns    191 ns    144 ns
Unbounded MPMC timed may block      245 ns    180 ns    123 ns
Unbounded MPMC wait  may block       74 ns     51 ns     46 ns
..............................................................
folly::MPMC  read                   164 ns    148 ns    135 ns
folly::MPMC  tryReadUntil           156 ns    149 ns    140 ns
folly::MPMC  blockingRead            55 ns     50 ns     47 ns
==============================================================
====================== 32 prod  32 cons ======================
=== uint32_t =================================================
Unbounded MPMC try   spin only      255 ns    212 ns    179 ns
Unbounded MPMC timed spin only      391 ns    223 ns    147 ns
Unbounded MPMC wait  spin only       78 ns     44 ns     38 ns
Unbounded MPMC try   may block      516 ns    249 ns    195 ns
Unbounded MPMC timed may block      293 ns    210 ns    171 ns
Unbounded MPMC wait  may block       54 ns     51 ns     48 ns
..............................................................
folly::MPMC  read                   195 ns    183 ns    164 ns
folly::MPMC  tryReadUntil           191 ns    175 ns    159 ns
folly::MPMC  blockingRead            49 ns     45 ns     43 ns
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
