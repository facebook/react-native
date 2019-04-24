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

#include <folly/experimental/FlatCombiningPriorityQueue.h>
#include <folly/Benchmark.h>
#include <folly/portability/GTest.h>
#include <glog/logging.h>

#include <condition_variable>
#include <mutex>
#include <queue>

DEFINE_bool(bench, false, "run benchmark");
DEFINE_int32(reps, 10, "number of reps");
DEFINE_int32(ops, 100000, "number of operations per rep");
DEFINE_int32(size, 64, "initial size of the priority queue");
DEFINE_int32(work, 1000, "amount of unrelated work per operation");

void doWork(int work) {
  uint64_t a = 0;
  for (int i = work; i > 0; --i) {
    a += i;
  }
  folly::doNotOptimizeAway(a);
}

/// Baseline implementation represents a conventional single-lock
/// implementation that supports cond var blocking.
template <
    typename T,
    typename PriorityQueue = std::priority_queue<T>,
    typename Mutex = std::mutex>
class BaselinePQ {
 public:
  template <
      typename... PQArgs,
      typename = decltype(PriorityQueue(std::declval<PQArgs>()...))>
  explicit BaselinePQ(size_t maxSize = 0, PQArgs... args)
      : maxSize_(maxSize), pq_(std::forward<PQArgs>(args)...) {}

  bool empty() const {
    std::lock_guard<Mutex> g(m_);
    return pq_.empty();
  }

  size_t size() const {
    std::lock_guard<Mutex> g(m_);
    return pq_.size();
  }

  bool try_push(const T& val) {
    std::lock_guard<Mutex> g(m_);
    if (maxSize_ > 0 && pq_.size() == maxSize_) {
      return false;
    }
    DCHECK(maxSize_ == 0 || pq_.size() < maxSize_);
    try {
      pq_.push(val);
      notempty_.notify_one();
      return true;
    } catch (const std::bad_alloc&) {
      return false;
    }
  }

  bool try_pop(T& val) {
    std::lock_guard<Mutex> g(m_);
    if (!pq_.empty()) {
      val = pq_.top();
      pq_.pop();
      notfull_.notify_one();
      return true;
    }
    return false;
  }

  bool try_peek(T& val) {
    std::lock_guard<Mutex> g(m_);
    if (!pq_.empty()) {
      val = pq_.top();
      return true;
    }
    return false;
  }

 private:
  Mutex m_;
  size_t maxSize_;
  PriorityQueue pq_;
  std::condition_variable notempty_;
  std::condition_variable notfull_;
};

using FCPQ = folly::FlatCombiningPriorityQueue<int>;
using Baseline = BaselinePQ<int>;

#if FOLLY_SANITIZE_THREAD
static std::vector<int> nthr = {1, 2, 3, 4, 6, 8, 12, 16};
#else
static std::vector<int> nthr = {1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64};
#endif
static uint32_t nthreads;

template <typename PriorityQueue, typename Func>
static uint64_t run_once(PriorityQueue& pq, const Func& fn) {
  int ops = FLAGS_ops;
  int size = FLAGS_size;
  std::atomic<bool> start{false};
  std::atomic<uint32_t> started{0};

  for (int i = 0; i < size; ++i) {
    CHECK(pq.try_push(i * (ops / size)));
  }

  std::vector<std::thread> threads(nthreads);
  for (uint32_t tid = 0; tid < nthreads; ++tid) {
    threads[tid] = std::thread([&, tid] {
      started.fetch_add(1);
      while (!start.load()) {
        /* nothing */;
      }
      fn(tid);
    });
  }

  while (started.load() < nthreads) {
    /* nothing */;
  }
  auto tbegin = std::chrono::steady_clock::now();

  // begin time measurement
  start.store(true);

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

TEST(FCPriQueue, basic) {
  FCPQ pq;
  CHECK(pq.empty());
  CHECK_EQ(pq.size(), 0);
  int v;
  CHECK(!pq.try_pop(v));
  // try_pop() returns an Optional
  EXPECT_FALSE(bool(pq.try_pop()));

  CHECK(pq.try_push(1));
  CHECK(pq.try_push(2));
  CHECK(!pq.empty());
  CHECK_EQ(pq.size(), 2);

  pq.peek(v);
  CHECK_EQ(v, 2); // higher value has higher priority
  CHECK(pq.try_peek(v));
  CHECK_EQ(v, 2);
  CHECK(!pq.empty());
  CHECK_EQ(pq.size(), 2);

  CHECK(pq.try_pop(v));
  CHECK_EQ(v, 2);
  CHECK(!pq.empty());
  CHECK_EQ(pq.size(), 1);

  CHECK(pq.try_pop(v));
  CHECK_EQ(v, 1);
  CHECK(pq.empty());
  CHECK_EQ(pq.size(), 0);

  CHECK(pq.try_push(1));
  CHECK(pq.try_push(2));

  // check successful try_pop()
  EXPECT_EQ(*pq.try_pop(), 2);
  CHECK(!pq.empty());
  CHECK_EQ(pq.size(), 1);

  EXPECT_EQ(*pq.try_pop(), 1);
  CHECK(pq.empty());
  CHECK_EQ(pq.size(), 0);
}

TEST(FCPriQueue, bounded) {
  FCPQ pq(1);
  CHECK(pq.try_push(1));
  CHECK(!pq.try_push(1));
  CHECK_EQ(pq.size(), 1);
  CHECK(!pq.empty());
  int v;
  CHECK(pq.try_pop(v));
  CHECK_EQ(v, 1);
  CHECK_EQ(pq.size(), 0);
  CHECK(pq.empty());
}

TEST(FCPriQueue, timeout) {
  FCPQ pq(1);
  int v;
  CHECK(!pq.try_peek(v));
  CHECK(!pq.try_pop(v));
  pq.push(10);
  CHECK(!pq.try_push(20));

  auto dur = std::chrono::microseconds(1000);
  EXPECT_EQ(*pq.try_pop(), 10);
  CHECK(pq.empty());
  // check try_***_for
  EXPECT_FALSE(bool(pq.try_pop_for(dur)));
  EXPECT_FALSE(bool(pq.try_peek_for(dur)));
  CHECK(pq.try_push_for(10, dur));
  CHECK(!pq.try_push_for(20, dur));
  EXPECT_EQ(*pq.try_peek_for(dur), 10);
  EXPECT_EQ(*pq.try_pop_for(dur), 10);

  CHECK(pq.empty());
  // check try_***_until
  EXPECT_FALSE(bool(pq.try_pop_until(std::chrono::steady_clock::now() + dur)));

  EXPECT_FALSE(bool(pq.try_peek_until(std::chrono::steady_clock::now() + dur)));
  CHECK(pq.try_push_until(10, std::chrono::steady_clock::now() + dur));
  CHECK(!pq.try_push_until(20, std::chrono::steady_clock::now() + dur));
  EXPECT_EQ(*pq.try_peek_until(std::chrono::steady_clock::now() + dur), 10);
  EXPECT_EQ(*pq.try_pop_until(std::chrono::steady_clock::now() + dur), 10);
  CHECK(pq.empty());
}

TEST(FCPriQueue, push_pop) {
  int ops = 1000;
  int work = 0;
  std::chrono::steady_clock::time_point when =
      std::chrono::steady_clock::now() + std::chrono::hours(24);
  for (auto n : nthr) {
    nthreads = n;
    FCPQ pq(10000);
    auto fn = [&](uint32_t tid) {
      for (int i = tid; i < ops; i += nthreads) {
        CHECK(pq.try_push(i));
        CHECK(pq.try_push_until(i, when));
        pq.push(i);
        doWork(work);
        int v;
        CHECK(pq.try_pop(v));
        EXPECT_NE(pq.try_pop_until(when), folly::none);
        pq.pop(v);
        doWork(work);
      }
    };
    run_once(pq, fn);
  }
}

enum Exp {
  NoFC,
  FCNonBlock,
  FCBlock,
  FCTimed,
};

static uint64_t test(std::string name, Exp exp, uint64_t base) {
  int ops = FLAGS_ops;
  int work = FLAGS_work;

  uint64_t min = UINTMAX_MAX;
  uint64_t max = 0;
  uint64_t sum = 0;

  for (int r = 0; r < FLAGS_reps; ++r) {
    uint64_t dur;
    switch (exp) {
      case NoFC: {
        Baseline pq;
        auto fn = [&](uint32_t tid) {
          for (int i = tid; i < ops; i += nthreads) {
            CHECK(pq.try_push(i));
            doWork(work);
            int v;
            CHECK(pq.try_pop(v));
            doWork(work);
          }
        };
        dur = run_once(pq, fn);
        break;
      }
      case FCNonBlock: {
        FCPQ pq;
        auto fn = [&](uint32_t tid) {
          for (int i = tid; i < ops; i += nthreads) {
            CHECK(pq.try_push(i));
            doWork(work);
            int v;
            CHECK(pq.try_pop(v));
            doWork(work);
          }
        };
        dur = run_once(pq, fn);
        break;
      }
      case FCBlock: {
        FCPQ pq;
        auto fn = [&](uint32_t tid) {
          for (int i = tid; i < ops; i += nthreads) {
            pq.push(i);
            doWork(work);
            int v;
            pq.pop(v);
            doWork(work);
          }
        };
        dur = run_once(pq, fn);
        break;
      }
      case FCTimed: {
        FCPQ pq;
        auto fn = [&](uint32_t tid) {
          std::chrono::steady_clock::time_point when =
              std::chrono::steady_clock::now() + std::chrono::hours(24);
          for (int i = tid; i < ops; i += nthreads) {
            CHECK(pq.try_push_until(i, when));
            doWork(work);
            EXPECT_NE(pq.try_pop_until(when), folly::none);
            doWork(work);
          }
        };
        dur = run_once(pq, fn);
        break;
      }
      default:
        CHECK(false);
    }

    sum += dur;
    min = std::min(min, dur);
    max = std::max(max, dur);
  }

  uint64_t avg = sum / FLAGS_reps;
  uint64_t res = min;
  std::cout << name;
  std::cout << "   " << std::setw(4) << max / FLAGS_ops << " ns";
  std::cout << "   " << std::setw(4) << avg / FLAGS_ops << " ns";
  std::cout << "   " << std::setw(4) << res / FLAGS_ops << " ns";
  if (base) {
    std::cout << " " << std::setw(3) << 100 * base / res << "%";
  }
  std::cout << std::endl;
  return res;
}

TEST(FCPriQueue, bench) {
  if (!FLAGS_bench) {
    return;
  }

  std::cout << "Test_name, Max time, Avg time, Min time, % base min / min"
            << std::endl;
  for (int i : nthr) {
    nthreads = i;
    std::cout << "\n------------------------------------ Number of threads = "
              << i << std::endl;
    uint64_t base = test("baseline                    ", NoFC, 0);
    test("baseline - dup              ", NoFC, base);
    std::cout << "---- fc -------------------------------" << std::endl;
    test("fc non-blocking             ", FCNonBlock, base);
    test("fc non-blocking - dup       ", FCNonBlock, base);
    test("fc timed                    ", FCTimed, base);
    test("fc timed - dup              ", FCTimed, base);
    test("fc blocking                 ", FCBlock, base);
    test("fc blocking - dup           ", FCBlock, base);
  }
}

/*
$ numactl -N 1 folly/experimental/test/fc_pri_queue_test --bench

[ RUN      ] FCPriQueue.bench
Test_name, Max time, Avg time, Min time, % base min / min

------------------------------------ Number of threads = 1
baseline                        815 ns    793 ns    789 ns
baseline - dup                  886 ns    827 ns    789 ns  99%
---- fc -------------------------------
fc non-blocking                 881 ns    819 ns    789 ns  99%
fc non-blocking - dup           833 ns    801 ns    786 ns 100%
fc timed                        863 ns    801 ns    781 ns 100%
fc timed - dup                  830 ns    793 ns    782 ns 100%
fc blocking                    1043 ns    820 ns    789 ns  99%
fc blocking - dup               801 ns    793 ns    789 ns 100%

------------------------------------ Number of threads = 2
baseline                        579 ns    557 ns    540 ns
baseline - dup                  905 ns    621 ns    538 ns 100%
---- fc -------------------------------
fc non-blocking                 824 ns    642 ns    568 ns  95%
fc non-blocking - dup           737 ns    645 ns    591 ns  91%
fc timed                        654 ns    590 ns    542 ns  99%
fc timed - dup                  666 ns    586 ns    534 ns 101%
fc blocking                     622 ns    599 ns    575 ns  93%
fc blocking - dup               677 ns    618 ns    570 ns  94%

------------------------------------ Number of threads = 3
baseline                        740 ns    717 ns    699 ns
baseline - dup                  742 ns    716 ns    697 ns 100%
---- fc -------------------------------
fc non-blocking                 730 ns    689 ns    645 ns 108%
fc non-blocking - dup           719 ns    695 ns    639 ns 109%
fc timed                        695 ns    650 ns    597 ns 117%
fc timed - dup                  694 ns    654 ns    624 ns 112%
fc blocking                     711 ns    687 ns    669 ns 104%
fc blocking - dup               716 ns    695 ns    624 ns 112%

------------------------------------ Number of threads = 4
baseline                        777 ns    766 ns    750 ns
baseline - dup                  778 ns    752 ns    731 ns 102%
---- fc -------------------------------
fc non-blocking                 653 ns    615 ns    589 ns 127%
fc non-blocking - dup           611 ns    593 ns    563 ns 133%
fc timed                        597 ns    577 ns    569 ns 131%
fc timed - dup                  618 ns    575 ns    546 ns 137%
fc blocking                     603 ns    590 ns    552 ns 135%
fc blocking - dup               614 ns    590 ns    556 ns 134%

------------------------------------ Number of threads = 6
baseline                        925 ns    900 ns    869 ns
baseline - dup                  930 ns    895 ns    866 ns 100%
---- fc -------------------------------
fc non-blocking                 568 ns    530 ns    481 ns 180%
fc non-blocking - dup           557 ns    521 ns    488 ns 177%
fc timed                        516 ns    496 ns    463 ns 187%
fc timed - dup                  517 ns    500 ns    474 ns 183%
fc blocking                     559 ns    513 ns    450 ns 193%
fc blocking - dup               564 ns    528 ns    466 ns 186%

------------------------------------ Number of threads = 8
baseline                        999 ns    981 ns    962 ns
baseline - dup                  998 ns    984 ns    965 ns  99%
---- fc -------------------------------
fc non-blocking                 491 ns    386 ns    317 ns 303%
fc non-blocking - dup           433 ns    344 ns    298 ns 322%
fc timed                        445 ns    348 ns    294 ns 327%
fc timed - dup                  446 ns    357 ns    292 ns 328%
fc blocking                     505 ns    389 ns    318 ns 302%
fc blocking - dup               416 ns    333 ns    293 ns 328%

------------------------------------ Number of threads = 12
baseline                       1092 ns   1080 ns   1072 ns
baseline - dup                 1085 ns   1074 ns   1065 ns 100%
---- fc -------------------------------
fc non-blocking                 360 ns    283 ns    258 ns 415%
fc non-blocking - dup           340 ns    278 ns    250 ns 427%
fc timed                        271 ns    260 ns    249 ns 429%
fc timed - dup                  397 ns    283 ns    253 ns 423%
fc blocking                     331 ns    279 ns    258 ns 415%
fc blocking - dup               358 ns    280 ns    259 ns 412%

------------------------------------ Number of threads = 16
baseline                       1120 ns   1115 ns   1103 ns
baseline - dup                 1122 ns   1118 ns   1114 ns  99%
---- fc -------------------------------
fc non-blocking                 339 ns    297 ns    246 ns 448%
fc non-blocking - dup           353 ns    301 ns    264 ns 417%
fc timed                        326 ns    287 ns    247 ns 445%
fc timed - dup                  338 ns    294 ns    259 ns 425%
fc blocking                     329 ns    288 ns    247 ns 445%
fc blocking - dup               375 ns    308 ns    265 ns 415%

------------------------------------ Number of threads = 24
baseline                       1073 ns   1068 ns   1064 ns
baseline - dup                 1075 ns   1071 ns   1069 ns  99%
---- fc -------------------------------
fc non-blocking                 439 ns    342 ns    278 ns 382%
fc non-blocking - dup           389 ns    318 ns    291 ns 364%
fc timed                        368 ns    324 ns    266 ns 398%
fc timed - dup                  412 ns    328 ns    302 ns 352%
fc blocking                     425 ns    345 ns    275 ns 386%
fc blocking - dup               429 ns    340 ns    269 ns 395%

------------------------------------ Number of threads = 32
baseline                       1001 ns    990 ns    981 ns
baseline - dup                 1002 ns    992 ns    983 ns  99%
---- fc -------------------------------
fc non-blocking                 404 ns    342 ns    273 ns 359%
fc non-blocking - dup           395 ns    316 ns    259 ns 378%
fc timed                        379 ns    330 ns    258 ns 380%
fc timed - dup                  392 ns    335 ns    274 ns 357%
fc blocking                     423 ns    340 ns    277 ns 353%
fc blocking - dup               445 ns    359 ns    275 ns 356%

------------------------------------ Number of threads = 48
baseline                        978 ns    975 ns    971 ns
baseline - dup                  977 ns    974 ns    972 ns  99%
---- fc -------------------------------
fc non-blocking                 424 ns    327 ns    258 ns 375%
fc non-blocking - dup           378 ns    317 ns    256 ns 379%
fc timed                        368 ns    311 ns    277 ns 350%
fc timed - dup                  385 ns    310 ns    251 ns 385%
fc blocking                     422 ns    313 ns    255 ns 380%
fc blocking - dup               406 ns    314 ns    258 ns 376%

------------------------------------ Number of threads = 64
baseline                        993 ns    981 ns    974 ns
baseline - dup                  984 ns    979 ns    975 ns  99%
---- fc -------------------------------
fc non-blocking                 353 ns    301 ns    266 ns 365%
fc non-blocking - dup           339 ns    301 ns    271 ns 358%
fc timed                        399 ns    321 ns    259 ns 375%
fc timed - dup                  381 ns    300 ns    263 ns 369%
fc blocking                     390 ns    301 ns    251 ns 387%
fc blocking - dup               345 ns    289 ns    259 ns 374%
[       OK ] FCPriQueue.bench (112424 ms)

$ lscpu
Architecture:          x86_64
CPU op-mode(s):        32-bit, 64-bit
Byte Order:            Little Endian
CPU(s):                32
On-line CPU(s) list:   0-31
Thread(s) per core:    2
Core(s) per socket:    8
Socket(s):             2
NUMA node(s):          2
Vendor ID:             GenuineIntel
CPU family:            6
Model:                 45
Model name:            Intel(R) Xeon(R) CPU E5-2660 0 @ 2.20GHz
Stepping:              6
CPU MHz:               2200.000
CPU max MHz:           2200.0000
CPU min MHz:           1200.0000
BogoMIPS:              4399.87
Virtualization:        VT-x
L1d cache:             32K
L1i cache:             32K
L2 cache:              256K
L3 cache:              20480K
NUMA node0 CPU(s):     0-7,16-23
NUMA node1 CPU(s):     8-15,24-31
Flags:                 fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca
                       cmov pat pse36 clflush dts acpi mmx fxsr sse sse2 ss ht
                       tm pbe syscall nx pdpe1gb rdtscp lm constant_tsc
                       arch_perfmon pebs bts rep_good nopl xtopology nonstop_tsc
                       aperfmperf eagerfpu pni pclmulqdq dtes64 monitor ds_cpl
                       vmx smx est tm2 ssse3 cx16 xtpr pdcm pcid dca sse4_1
                       sse4_2 x2apic popcnt tsc_deadline_timer aes xsave avx
                       lahf_lm epb tpr_shadow vnmi flexpriority ept vpid
                       xsaveopt dtherm arat pln pts

 */
