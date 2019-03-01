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

#include <folly/Format.h>
#include <folly/MPMCQueue.h>
#include <folly/Memory.h>
#include <folly/portability/GTest.h>
#include <folly/portability/SysResource.h>
#include <folly/portability/SysTime.h>
#include <folly/portability/Unistd.h>
#include <folly/stop_watch.h>
#include <folly/test/DeterministicSchedule.h>

#include <boost/intrusive_ptr.hpp>
#include <boost/thread/barrier.hpp>
#include <functional>
#include <memory>
#include <thread>
#include <utility>

FOLLY_ASSUME_FBVECTOR_COMPATIBLE_1(boost::intrusive_ptr);

using namespace folly;
using namespace detail;
using namespace test;
using std::chrono::time_point;
using std::chrono::steady_clock;
using std::chrono::seconds;
using std::chrono::milliseconds;
using std::string;
using std::unique_ptr;
using std::vector;

typedef DeterministicSchedule DSched;

template <template<typename> class Atom>
void run_mt_sequencer_thread(
    int numThreads,
    int numOps,
    uint32_t init,
    TurnSequencer<Atom>& seq,
    Atom<uint32_t>& spinThreshold,
    int& prev,
    int i) {
  for (int op = i; op < numOps; op += numThreads) {
    seq.waitForTurn(init + op, spinThreshold, (op % 32) == 0);
    EXPECT_EQ(prev, op - 1);
    prev = op;
    seq.completeTurn(init + op);
  }
}

template <template<typename> class Atom>
void run_mt_sequencer_test(int numThreads, int numOps, uint32_t init) {
  TurnSequencer<Atom> seq(init);
  Atom<uint32_t> spinThreshold(0);

  int prev = -1;
  vector<std::thread> threads(numThreads);
  for (int i = 0; i < numThreads; ++i) {
    threads[i] = DSched::thread(std::bind(run_mt_sequencer_thread<Atom>,
          numThreads, numOps, init, std::ref(seq), std::ref(spinThreshold),
          std::ref(prev), i));
  }

  for (auto& thr : threads) {
    DSched::join(thr);
  }

  EXPECT_EQ(prev, numOps - 1);
}

TEST(MPMCQueue, sequencer) {
  run_mt_sequencer_test<std::atomic>(1, 100, 0);
  run_mt_sequencer_test<std::atomic>(2, 100000, -100);
  run_mt_sequencer_test<std::atomic>(100, 10000, -100);
}

TEST(MPMCQueue, sequencer_emulated_futex) {
  run_mt_sequencer_test<EmulatedFutexAtomic>(1, 100, 0);
  run_mt_sequencer_test<EmulatedFutexAtomic>(2, 100000, -100);
  run_mt_sequencer_test<EmulatedFutexAtomic>(100, 10000, -100);
}

TEST(MPMCQueue, sequencer_deterministic) {
  DSched sched(DSched::uniform(0));
  run_mt_sequencer_test<DeterministicAtomic>(1, 100, -50);
  run_mt_sequencer_test<DeterministicAtomic>(2, 10000, (1 << 29) - 100);
  run_mt_sequencer_test<DeterministicAtomic>(10, 1000, -100);
}

template <bool Dynamic = false, typename T>
void runElementTypeTest(T&& src) {
  MPMCQueue<T, std::atomic, Dynamic> cq(10);
  cq.blockingWrite(std::forward<T>(src));
  T dest;
  cq.blockingRead(dest);
  EXPECT_TRUE(cq.write(std::move(dest)));
  EXPECT_TRUE(cq.read(dest));
  auto soon1 = std::chrono::system_clock::now() + std::chrono::seconds(1);
  EXPECT_TRUE(cq.tryWriteUntil(soon1, std::move(dest)));
  EXPECT_TRUE(cq.read(dest));
  auto soon2 = std::chrono::steady_clock::now() + std::chrono::seconds(1);
  EXPECT_TRUE(cq.tryWriteUntil(soon2, std::move(dest)));
  EXPECT_TRUE(cq.read(dest));
}

struct RefCounted {
  static FOLLY_TLS int active_instances;

  mutable std::atomic<int> rc;

  RefCounted() : rc(0) {
    ++active_instances;
  }

  ~RefCounted() {
    --active_instances;
  }
};
FOLLY_TLS int RefCounted::active_instances;

void intrusive_ptr_add_ref(RefCounted const* p) {
  p->rc++;
}

void intrusive_ptr_release(RefCounted const* p) {
  if (--(p->rc) == 0) {
    delete p;
  }
}

TEST(MPMCQueue, lots_of_element_types) {
  runElementTypeTest(10);
  runElementTypeTest(string("abc"));
  runElementTypeTest(std::make_pair(10, string("def")));
  runElementTypeTest(vector<string>{{"abc"}});
  runElementTypeTest(std::make_shared<char>('a'));
  runElementTypeTest(folly::make_unique<char>('a'));
  runElementTypeTest(boost::intrusive_ptr<RefCounted>(new RefCounted));
  EXPECT_EQ(RefCounted::active_instances, 0);
}

TEST(MPMCQueue, lots_of_element_types_dynamic) {
  runElementTypeTest<true>(10);
  runElementTypeTest<true>(string("abc"));
  runElementTypeTest<true>(std::make_pair(10, string("def")));
  runElementTypeTest<true>(vector<string>{{"abc"}});
  runElementTypeTest<true>(std::make_shared<char>('a'));
  runElementTypeTest<true>(folly::make_unique<char>('a'));
  runElementTypeTest<true>(boost::intrusive_ptr<RefCounted>(new RefCounted));
  EXPECT_EQ(RefCounted::active_instances, 0);
}

TEST(MPMCQueue, single_thread_enqdeq) {
  // Non-dynamic version only.
  // False positive for dynamic version. Capacity can be temporarily
  // higher than specified.
  MPMCQueue<int> cq(10);

  for (int pass = 0; pass < 10; ++pass) {
    for (int i = 0; i < 10; ++i) {
      EXPECT_TRUE(cq.write(i));
    }
    EXPECT_FALSE(cq.write(-1));
    EXPECT_FALSE(cq.isEmpty());
    EXPECT_EQ(cq.size(), 10);

    for (int i = 0; i < 5; ++i) {
      int dest = -1;
      EXPECT_TRUE(cq.read(dest));
      EXPECT_EQ(dest, i);
    }
    for (int i = 5; i < 10; ++i) {
      int dest = -1;
      cq.blockingRead(dest);
      EXPECT_EQ(dest, i);
    }
    int dest = -1;
    EXPECT_FALSE(cq.read(dest));
    EXPECT_EQ(dest, -1);

    EXPECT_TRUE(cq.isEmpty());
    EXPECT_EQ(cq.size(), 0);
  }
}

TEST(MPMCQueue, tryenq_capacity_test) {
  // Non-dynamic version only.
  // False positive for dynamic version. Capacity can be temporarily
  // higher than specified.
  for (size_t cap = 1; cap < 100; ++cap) {
    MPMCQueue<int> cq(cap);
    for (size_t i = 0; i < cap; ++i) {
      EXPECT_TRUE(cq.write(i));
    }
    EXPECT_FALSE(cq.write(100));
  }
}

TEST(MPMCQueue, enq_capacity_test) {
  // Non-dynamic version only.
  // False positive for dynamic version. Capacity can be temporarily
  // higher than specified.
  for (auto cap : { 1, 100, 10000 }) {
    MPMCQueue<int> cq(cap);
    for (int i = 0; i < cap; ++i) {
      cq.blockingWrite(i);
    }
    int t = 0;
    int when;
    auto thr = std::thread([&]{
      cq.blockingWrite(100);
      when = t;
    });
    usleep(2000);
    t = 1;
    int dummy;
    cq.blockingRead(dummy);
    thr.join();
    EXPECT_EQ(when, 1);
  }
}

template <template<typename> class Atom, bool Dynamic = false>
void runTryEnqDeqThread(
    int numThreads,
    int n, /*numOps*/
    MPMCQueue<int, Atom, Dynamic>& cq,
    std::atomic<uint64_t>& sum,
    int t) {
  uint64_t threadSum = 0;
  int src = t;
  // received doesn't reflect any actual values, we just start with
  // t and increment by numThreads to get the rounding of termination
  // correct if numThreads doesn't evenly divide numOps
  int received = t;
  while (src < n || received < n) {
    if (src < n && cq.write(src)) {
      src += numThreads;
    }

    int dst;
    if (received < n && cq.read(dst)) {
      received += numThreads;
      threadSum += dst;
    }
  }
  sum += threadSum;
}

template <template<typename> class Atom, bool Dynamic = false>
void runTryEnqDeqTest(int numThreads, int numOps) {
  // write and read aren't linearizable, so we don't have
  // hard guarantees on their individual behavior.  We can still test
  // correctness in aggregate
  MPMCQueue<int,Atom, Dynamic> cq(numThreads);

  uint64_t n = numOps;
  vector<std::thread> threads(numThreads);
  std::atomic<uint64_t> sum(0);
  for (int t = 0; t < numThreads; ++t) {
    threads[t] = DSched::thread(std::bind(runTryEnqDeqThread<Atom, Dynamic>,
          numThreads, n, std::ref(cq), std::ref(sum), t));
  }
  for (auto& t : threads) {
    DSched::join(t);
  }
  EXPECT_TRUE(cq.isEmpty());
  EXPECT_EQ(n * (n - 1) / 2 - sum, 0);
}

TEST(MPMCQueue, mt_try_enq_deq) {
  int nts[] = { 1, 3, 100 };

  int n = 100000;
  for (int nt : nts) {
    runTryEnqDeqTest<std::atomic>(nt, n);
  }
}

TEST(MPMCQueue, mt_try_enq_deq_dynamic) {
  int nts[] = { 1, 3, 100 };

  int n = 100000;
  for (int nt : nts) {
    runTryEnqDeqTest<std::atomic, /* Dynamic = */ true>(nt, n);
  }
}

TEST(MPMCQueue, mt_try_enq_deq_emulated_futex) {
  int nts[] = { 1, 3, 100 };

  int n = 100000;
  for (int nt : nts) {
    runTryEnqDeqTest<EmulatedFutexAtomic>(nt, n);
  }
}

TEST(MPMCQueue, mt_try_enq_deq_emulated_futex_dynamic) {
  int nts[] = { 1, 3, 100 };

  int n = 100000;
  for (int nt : nts) {
    runTryEnqDeqTest<EmulatedFutexAtomic, /* Dynamic = */ true>(nt, n);
  }
}

TEST(MPMCQueue, mt_try_enq_deq_deterministic) {
  int nts[] = { 3, 10 };

  long seed = 0;
  LOG(INFO) << "using seed " << seed;

  int n = 1000;
  for (int nt : nts) {
    {
      DSched sched(DSched::uniform(seed));
      runTryEnqDeqTest<DeterministicAtomic>(nt, n);
    }
    {
      DSched sched(DSched::uniformSubset(seed, 2));
      runTryEnqDeqTest<DeterministicAtomic>(nt, n);
    }
    {
      DSched sched(DSched::uniform(seed));
      runTryEnqDeqTest<DeterministicAtomic, /*Dynamic = */ true>(nt, n);
    }
    {
      DSched sched(DSched::uniformSubset(seed, 2));
      runTryEnqDeqTest<DeterministicAtomic, /*Dynamic = */ true>(nt, n);
    }
  }
}

uint64_t nowMicro() {
  timeval tv;
  gettimeofday(&tv, 0);
  return static_cast<uint64_t>(tv.tv_sec) * 1000000 + tv.tv_usec;
}

template <typename Q>
struct WriteMethodCaller {
  WriteMethodCaller() {}
  virtual ~WriteMethodCaller() = default;
  virtual bool callWrite(Q& q, int i) = 0;
  virtual string methodName() = 0;
};

template <typename Q>
struct BlockingWriteCaller : public WriteMethodCaller<Q> {
  bool callWrite(Q& q, int i) override {
    q.blockingWrite(i);
    return true;
  }
  string methodName() override { return "blockingWrite"; }
};

template <typename Q>
struct WriteIfNotFullCaller : public WriteMethodCaller<Q> {
  bool callWrite(Q& q, int i) override { return q.writeIfNotFull(i); }
  string methodName() override { return "writeIfNotFull"; }
};

template <typename Q>
struct WriteCaller : public WriteMethodCaller<Q> {
  bool callWrite(Q& q, int i) override { return q.write(i); }
  string methodName() override { return "write"; }
};

template <typename Q,
          class Clock = steady_clock,
          class Duration = typename Clock::duration>
struct TryWriteUntilCaller : public WriteMethodCaller<Q> {
  const Duration duration_;
  explicit TryWriteUntilCaller(Duration&& duration) : duration_(duration) {}
  bool callWrite(Q& q, int i) override {
    auto then = Clock::now() + duration_;
    return q.tryWriteUntil(then, i);
  }
  string methodName() override {
    return folly::sformat(
        "tryWriteUntil({}ms)",
        std::chrono::duration_cast<milliseconds>(duration_).count());
  }
};

template <typename Q>
string producerConsumerBench(Q&& queue,
                             string qName,
                             int numProducers,
                             int numConsumers,
                             int numOps,
                             WriteMethodCaller<Q>& writer,
                             bool ignoreContents = false) {
  Q& q = queue;

  struct rusage beginUsage;
  getrusage(RUSAGE_SELF, &beginUsage);

  auto beginMicro = nowMicro();

  uint64_t n = numOps;
  std::atomic<uint64_t> sum(0);
  std::atomic<uint64_t> failed(0);

  vector<std::thread> producers(numProducers);
  for (int t = 0; t < numProducers; ++t) {
    producers[t] = DSched::thread([&,t]{
      for (int i = t; i < numOps; i += numProducers) {
        while (!writer.callWrite(q, i)) {
          ++failed;
        }
      }
    });
  }

  vector<std::thread> consumers(numConsumers);
  for (int t = 0; t < numConsumers; ++t) {
    consumers[t] = DSched::thread([&,t]{
      uint64_t localSum = 0;
      for (int i = t; i < numOps; i += numConsumers) {
        int dest = -1;
        q.blockingRead(dest);
        EXPECT_FALSE(dest == -1);
        localSum += dest;
      }
      sum += localSum;
    });
  }

  for (auto& t : producers) {
    DSched::join(t);
  }
  for (auto& t : consumers) {
    DSched::join(t);
  }
  if (!ignoreContents) {
    EXPECT_EQ(n * (n - 1) / 2 - sum, 0);
  }

  auto endMicro = nowMicro();

  struct rusage endUsage;
  getrusage(RUSAGE_SELF, &endUsage);

  uint64_t nanosPer = (1000 * (endMicro - beginMicro)) / n;
  long csw = endUsage.ru_nvcsw + endUsage.ru_nivcsw -
      (beginUsage.ru_nvcsw + beginUsage.ru_nivcsw);
  uint64_t failures = failed;
  size_t allocated = q.allocatedCapacity();

  return folly::sformat(
      "{}, {} {} producers, {} consumers => {} nanos/handoff, {} csw / {} "
      "handoff, {} failures, {} allocated",
      qName,
      numProducers,
      writer.methodName(),
      numConsumers,
      nanosPer,
      csw,
      n,
      failures,
      allocated);
}

template <bool Dynamic = false>
void runMtProdConsDeterministic(long seed) {
  // we use the Bench method, but perf results are meaningless under DSched
  DSched sched(DSched::uniform(seed));

  vector<unique_ptr<WriteMethodCaller<MPMCQueue<int, DeterministicAtomic,
                                                Dynamic>>>> callers;
  callers.emplace_back(make_unique<BlockingWriteCaller<MPMCQueue<int,
                       DeterministicAtomic, Dynamic>>>());
  callers.emplace_back(make_unique<WriteIfNotFullCaller<MPMCQueue<int,
                       DeterministicAtomic, Dynamic>>>());
  callers.emplace_back(make_unique<WriteCaller<MPMCQueue<int,
                       DeterministicAtomic, Dynamic>>>());
  callers.emplace_back(make_unique<TryWriteUntilCaller<MPMCQueue<int,
                       DeterministicAtomic, Dynamic>>>(milliseconds(1)));
  callers.emplace_back(make_unique<TryWriteUntilCaller<MPMCQueue<int,
                       DeterministicAtomic, Dynamic>>>(seconds(2)));
  size_t cap;

  for (const auto& caller : callers) {
    cap = 10;
    LOG(INFO) <<
      producerConsumerBench(
        MPMCQueue<int, DeterministicAtomic, Dynamic>(cap),
        "MPMCQueue<int, DeterministicAtomic, Dynamic>("
          + folly::to<std::string>(cap)+")",
        1,
        1,
        1000,
        *caller);
    cap = 100;
    LOG(INFO) <<
      producerConsumerBench(
        MPMCQueue<int, DeterministicAtomic, Dynamic>(cap),
        "MPMCQueue<int, DeterministicAtomic, Dynamic>("
          + folly::to<std::string>(cap)+")",
        10,
        10,
        1000,
        *caller);
    cap = 10;
    LOG(INFO) <<
      producerConsumerBench(
        MPMCQueue<int, DeterministicAtomic, Dynamic>(cap),
        "MPMCQueue<int, DeterministicAtomic, Dynamic>("
          + folly::to<std::string>(cap)+")",
        1,
        1,
        1000,
        *caller);
    cap = 100;
    LOG(INFO) <<
      producerConsumerBench(
        MPMCQueue<int, DeterministicAtomic, Dynamic>(cap),
        "MPMCQueue<int, DeterministicAtomic, Dynamic>("
          + folly::to<std::string>(cap)+")",
        10,
        10,
        1000,
        *caller);
    cap = 1;
    LOG(INFO) <<
      producerConsumerBench(
        MPMCQueue<int, DeterministicAtomic, Dynamic>(cap),
        "MPMCQueue<int, DeterministicAtomic, Dynamic>("
          + folly::to<std::string>(cap)+")",
        10,
        10,
        1000,
        *caller);
  }
}

void runMtProdConsDeterministicDynamic(
  long seed,
  uint32_t prods,
  uint32_t cons,
  uint32_t numOps,
  size_t cap,
  size_t minCap,
  size_t mult
) {
  // we use the Bench method, but perf results are meaningless under DSched
  DSched sched(DSched::uniform(seed));

  vector<unique_ptr<WriteMethodCaller<MPMCQueue<int, DeterministicAtomic,
                                                true>>>> callers;
  callers.emplace_back(make_unique<BlockingWriteCaller<MPMCQueue<int,
                       DeterministicAtomic, true>>>());
  callers.emplace_back(make_unique<WriteIfNotFullCaller<MPMCQueue<int,
                       DeterministicAtomic, true>>>());
  callers.emplace_back(make_unique<WriteCaller<MPMCQueue<int,
                       DeterministicAtomic, true>>>());
  callers.emplace_back(make_unique<TryWriteUntilCaller<MPMCQueue<int,
                       DeterministicAtomic, true>>>(milliseconds(1)));
  callers.emplace_back(make_unique<TryWriteUntilCaller<MPMCQueue<int,
                       DeterministicAtomic, true>>>(seconds(2)));

  for (const auto& caller : callers) {
    LOG(INFO) <<
      producerConsumerBench(
        MPMCQueue<int, DeterministicAtomic, true>(cap, minCap, mult),
        "MPMCQueue<int, DeterministicAtomic, true>("
          + folly::to<std::string>(cap) + ", "
          + folly::to<std::string>(minCap) + ", "
          + folly::to<std::string>(mult)+")",
        prods,
        cons,
        numOps,
        *caller);
  }
}

TEST(MPMCQueue, mt_prod_cons_deterministic) {
  runMtProdConsDeterministic(0);
}

TEST(MPMCQueue, mt_prod_cons_deterministic_dynamic) {
  runMtProdConsDeterministic<true>(0);
}

template <typename T>
void setFromEnv(T& var, const char* envvar) {
  char* str = std::getenv(envvar);
  if (str) { var = atoi(str); }
}

TEST(MPMCQueue, mt_prod_cons_deterministic_dynamic_with_arguments) {
  long seed = 0;
  uint32_t prods = 10;
  uint32_t cons = 10;
  uint32_t numOps = 1000;
  size_t cap = 10000;
  size_t minCap = 9;
  size_t mult = 3;
  setFromEnv(seed, "SEED");
  setFromEnv(prods, "PRODS");
  setFromEnv(cons, "CONS");
  setFromEnv(numOps, "NUM_OPS");
  setFromEnv(cap, "CAP");
  setFromEnv(minCap, "MIN_CAP");
  setFromEnv(mult, "MULT");
  runMtProdConsDeterministicDynamic(
    seed, prods, cons, numOps, cap, minCap, mult);
}

#define PC_BENCH(q, np, nc, ...) \
    producerConsumerBench(q, #q, (np), (nc), __VA_ARGS__)

template <bool Dynamic = false>
void runMtProdCons() {
  int n = 100000;
  setFromEnv(n, "NUM_OPS");
  vector<unique_ptr<WriteMethodCaller<MPMCQueue<int, std::atomic, Dynamic>>>>
    callers;
  callers.emplace_back(make_unique<BlockingWriteCaller<MPMCQueue<int,
                       std::atomic, Dynamic>>>());
  callers.emplace_back(make_unique<WriteIfNotFullCaller<MPMCQueue<int,
                       std::atomic, Dynamic>>>());
  callers.emplace_back(make_unique<WriteCaller<MPMCQueue<int, std::atomic,
                       Dynamic>>>());
  callers.emplace_back(make_unique<TryWriteUntilCaller<MPMCQueue<int,
                       std::atomic, Dynamic>>>(milliseconds(1)));
  callers.emplace_back(make_unique<TryWriteUntilCaller<MPMCQueue<int,
                       std::atomic, Dynamic>>>(seconds(2)));
  for (const auto& caller : callers) {
    LOG(INFO) << PC_BENCH((MPMCQueue<int, std::atomic, Dynamic>(10)),
                          1, 1, n, *caller);
    LOG(INFO) << PC_BENCH((MPMCQueue<int, std::atomic, Dynamic>(10)),
                          10, 1, n, *caller);
    LOG(INFO) << PC_BENCH((MPMCQueue<int, std::atomic, Dynamic>(10)),
                          1, 10, n, *caller);
    LOG(INFO) << PC_BENCH((MPMCQueue<int, std::atomic, Dynamic>(10)),
                          10, 10, n, *caller);
    LOG(INFO) << PC_BENCH((MPMCQueue<int, std::atomic, Dynamic>(10000)),
                          1, 1, n, *caller);
    LOG(INFO) << PC_BENCH((MPMCQueue<int, std::atomic, Dynamic>(10000)),
                          10, 1, n, *caller);
    LOG(INFO) << PC_BENCH((MPMCQueue<int, std::atomic, Dynamic>(10000)),
                          1, 10, n, *caller);
    LOG(INFO) << PC_BENCH((MPMCQueue<int, std::atomic, Dynamic>(10000)),
                          10, 10, n, *caller);
    LOG(INFO) << PC_BENCH((MPMCQueue<int, std::atomic, Dynamic>(100000)),
                          32, 100, n, *caller);
  }
}

TEST(MPMCQueue, mt_prod_cons) {
  runMtProdCons();
}

TEST(MPMCQueue, mt_prod_cons_dynamic) {
  runMtProdCons</* Dynamic = */ true>();
}

template <bool Dynamic = false>
void runMtProdConsEmulatedFutex() {
  int n = 100000;
  vector<unique_ptr<WriteMethodCaller<MPMCQueue<int, EmulatedFutexAtomic,
                                                Dynamic>>>> callers;
  callers.emplace_back(make_unique<BlockingWriteCaller<MPMCQueue<int,
                       EmulatedFutexAtomic, Dynamic>>>());
  callers.emplace_back(make_unique<WriteIfNotFullCaller<MPMCQueue<int,
                       EmulatedFutexAtomic, Dynamic>>>());
  callers.emplace_back(make_unique<WriteCaller<MPMCQueue<int,
                       EmulatedFutexAtomic, Dynamic>>>());
  callers.emplace_back(make_unique<TryWriteUntilCaller<MPMCQueue<int,
                       EmulatedFutexAtomic, Dynamic>>>(milliseconds(1)));
  callers.emplace_back(make_unique<TryWriteUntilCaller<MPMCQueue<int,
                       EmulatedFutexAtomic, Dynamic>>>(seconds(2)));
  for (const auto& caller : callers) {
    LOG(INFO) << PC_BENCH(
      (MPMCQueue<int, EmulatedFutexAtomic, Dynamic>(10)), 1, 1, n, *caller);
    LOG(INFO) << PC_BENCH(
      (MPMCQueue<int, EmulatedFutexAtomic, Dynamic>(10)), 10, 1, n, *caller);
    LOG(INFO) << PC_BENCH(
      (MPMCQueue<int, EmulatedFutexAtomic, Dynamic>(10)), 1, 10, n, *caller);
    LOG(INFO) << PC_BENCH(
      (MPMCQueue<int, EmulatedFutexAtomic, Dynamic>(10)), 10, 10, n, *caller);
    LOG(INFO) << PC_BENCH(
      (MPMCQueue<int, EmulatedFutexAtomic, Dynamic>(10000)), 1, 1, n, *caller);
    LOG(INFO) << PC_BENCH(
      (MPMCQueue<int, EmulatedFutexAtomic, Dynamic>(10000)), 10, 1, n, *caller);
    LOG(INFO) << PC_BENCH(
      (MPMCQueue<int, EmulatedFutexAtomic, Dynamic>(10000)), 1, 10, n, *caller);
    LOG(INFO) << PC_BENCH((MPMCQueue<int, EmulatedFutexAtomic, Dynamic>
                           (10000)), 10, 10, n, *caller);
    LOG(INFO) << PC_BENCH((MPMCQueue<int, EmulatedFutexAtomic, Dynamic>
                           (100000)), 32, 100, n, *caller);
  }
}

TEST(MPMCQueue, mt_prod_cons_emulated_futex) {
  runMtProdConsEmulatedFutex();
}

TEST(MPMCQueue, mt_prod_cons_emulated_futex_dynamic) {
  runMtProdConsEmulatedFutex</* Dynamic = */ true>();
}

template <template <typename> class Atom, bool Dynamic = false>
void runNeverFailThread(int numThreads,
                        int n, /*numOps*/
                        MPMCQueue<int, Atom, Dynamic>& cq,
                        std::atomic<uint64_t>& sum,
                        int t) {
  uint64_t threadSum = 0;
  for (int i = t; i < n; i += numThreads) {
    // enq + deq
    EXPECT_TRUE(cq.writeIfNotFull(i));

    int dest = -1;
    EXPECT_TRUE(cq.readIfNotEmpty(dest));
    EXPECT_TRUE(dest >= 0);
    threadSum += dest;
  }
  sum += threadSum;
}

template <template <typename> class Atom, bool Dynamic = false>
uint64_t runNeverFailTest(int numThreads, int numOps) {
  // always #enq >= #deq
  MPMCQueue<int, Atom, Dynamic> cq(numThreads);

  uint64_t n = numOps;
  auto beginMicro = nowMicro();

  vector<std::thread> threads(numThreads);
  std::atomic<uint64_t> sum(0);
  for (int t = 0; t < numThreads; ++t) {
    threads[t] = DSched::thread(std::bind(runNeverFailThread<Atom, Dynamic>,
                                          numThreads,
                                          n,
                                          std::ref(cq),
                                          std::ref(sum),
                                          t));
  }
  for (auto& t : threads) {
    DSched::join(t);
  }
  EXPECT_TRUE(cq.isEmpty());
  EXPECT_EQ(n * (n - 1) / 2 - sum, 0);

  return nowMicro() - beginMicro;
}

template <template<typename> class Atom, bool Dynamic = false>
void runMtNeverFail(std::vector<int>& nts, int n) {
  for (int nt : nts) {
    uint64_t elapsed = runNeverFailTest<Atom, Dynamic>(nt, n);
    LOG(INFO) << (elapsed * 1000.0) / (n * 2) << " nanos per op with " << nt
              << " threads";
  }
}

// All the never_fail tests are for the non-dynamic version only.
// False positive for dynamic version. Some writeIfNotFull() and
// tryWriteUntil() operations may fail in transient conditions related
// to expansion.

TEST(MPMCQueue, mt_never_fail) {
  std::vector<int> nts {1, 3, 100};
  int n = 100000;
  runMtNeverFail<std::atomic>(nts, n);
}

TEST(MPMCQueue, mt_never_fail_emulated_futex) {
  std::vector<int> nts {1, 3, 100};
  int n = 100000;
  runMtNeverFail<EmulatedFutexAtomic>(nts, n);
}

template<bool Dynamic = false>
void runMtNeverFailDeterministic(std::vector<int>& nts, int n, long seed) {
  LOG(INFO) << "using seed " << seed;
  for (int nt : nts) {
    {
      DSched sched(DSched::uniform(seed));
      runNeverFailTest<DeterministicAtomic, Dynamic>(nt, n);
    }
    {
      DSched sched(DSched::uniformSubset(seed, 2));
      runNeverFailTest<DeterministicAtomic, Dynamic>(nt, n);
    }
  }
}

TEST(MPMCQueue, mt_never_fail_deterministic) {
  std::vector<int> nts {3, 10};
  long seed = 0; // nowMicro() % 10000;
  int n = 1000;
  runMtNeverFailDeterministic(nts, n, seed);
}

template <class Clock, template <typename> class Atom, bool Dynamic>
void runNeverFailUntilThread(int numThreads,
                             int n, /*numOps*/
                             MPMCQueue<int, Atom, Dynamic>& cq,
                             std::atomic<uint64_t>& sum,
                             int t) {
  uint64_t threadSum = 0;
  for (int i = t; i < n; i += numThreads) {
    // enq + deq
    auto soon = Clock::now() + std::chrono::seconds(1);
    EXPECT_TRUE(cq.tryWriteUntil(soon, i));

    int dest = -1;
    EXPECT_TRUE(cq.readIfNotEmpty(dest));
    EXPECT_TRUE(dest >= 0);
    threadSum += dest;
  }
  sum += threadSum;
}

template <class Clock, template <typename> class Atom, bool Dynamic = false>
uint64_t runNeverFailTest(int numThreads, int numOps) {
  // always #enq >= #deq
  MPMCQueue<int, Atom, Dynamic> cq(numThreads);

  uint64_t n = numOps;
  auto beginMicro = nowMicro();

  vector<std::thread> threads(numThreads);
  std::atomic<uint64_t> sum(0);
  for (int t = 0; t < numThreads; ++t) {
    threads[t] = DSched::thread(std::bind(
                                  runNeverFailUntilThread<Clock, Atom, Dynamic>,
                                  numThreads,
                                  n,
                                  std::ref(cq),
                                  std::ref(sum),
                                  t));
  }
  for (auto& t : threads) {
    DSched::join(t);
  }
  EXPECT_TRUE(cq.isEmpty());
  EXPECT_EQ(n * (n - 1) / 2 - sum, 0);

  return nowMicro() - beginMicro;
}

template <bool Dynamic = false>
void runMtNeverFailUntilSystem(std::vector<int>& nts, int n) {
  for (int nt : nts) {
    uint64_t elapsed =
      runNeverFailTest<std::chrono::system_clock, std::atomic, Dynamic>(nt, n);
    LOG(INFO) << (elapsed * 1000.0) / (n * 2) << " nanos per op with " << nt
              << " threads";
  }
}

TEST(MPMCQueue, mt_never_fail_until_system) {
  std::vector<int> nts {1, 3, 100};
  int n = 100000;
  runMtNeverFailUntilSystem(nts, n);
}

template <bool Dynamic = false>
void runMtNeverFailUntilSteady(std::vector<int>& nts, int n) {
  for (int nt : nts) {
    uint64_t elapsed =
      runNeverFailTest<std::chrono::steady_clock, std::atomic, Dynamic>(nt, n);
    LOG(INFO) << (elapsed * 1000.0) / (n * 2) << " nanos per op with " << nt
              << " threads";
  }
}

TEST(MPMCQueue, mt_never_fail_until_steady) {
  std::vector<int> nts {1, 3, 100};
  int n = 100000;
  runMtNeverFailUntilSteady(nts, n);
}

enum LifecycleEvent {
  NOTHING = -1,
  DEFAULT_CONSTRUCTOR,
  COPY_CONSTRUCTOR,
  MOVE_CONSTRUCTOR,
  TWO_ARG_CONSTRUCTOR,
  COPY_OPERATOR,
  MOVE_OPERATOR,
  DESTRUCTOR,
  MAX_LIFECYCLE_EVENT
};

static FOLLY_TLS int lc_counts[MAX_LIFECYCLE_EVENT];
static FOLLY_TLS int lc_prev[MAX_LIFECYCLE_EVENT];

static int lc_outstanding() {
  return lc_counts[DEFAULT_CONSTRUCTOR] + lc_counts[COPY_CONSTRUCTOR] +
      lc_counts[MOVE_CONSTRUCTOR] + lc_counts[TWO_ARG_CONSTRUCTOR] -
      lc_counts[DESTRUCTOR];
}

static void lc_snap() {
  for (int i = 0; i < MAX_LIFECYCLE_EVENT; ++i) {
    lc_prev[i] = lc_counts[i];
  }
}

#define LIFECYCLE_STEP(...) lc_step(__LINE__, __VA_ARGS__)

static void lc_step(int lineno, int what = NOTHING, int what2 = NOTHING) {
  for (int i = 0; i < MAX_LIFECYCLE_EVENT; ++i) {
    int delta = i == what || i == what2 ? 1 : 0;
    EXPECT_EQ(lc_counts[i] - lc_prev[i], delta)
        << "lc_counts[" << i << "] - lc_prev[" << i << "] was "
        << (lc_counts[i] - lc_prev[i]) << ", expected " << delta
        << ", from line " << lineno;
  }
  lc_snap();
}

template <typename R>
struct Lifecycle {
  typedef R IsRelocatable;

  bool constructed;

  Lifecycle() noexcept : constructed(true) {
    ++lc_counts[DEFAULT_CONSTRUCTOR];
  }

  explicit Lifecycle(int /* n */, char const* /* s */) noexcept
      : constructed(true) {
    ++lc_counts[TWO_ARG_CONSTRUCTOR];
  }

  Lifecycle(const Lifecycle& /* rhs */) noexcept : constructed(true) {
    ++lc_counts[COPY_CONSTRUCTOR];
  }

  Lifecycle(Lifecycle&& /* rhs */) noexcept : constructed(true) {
    ++lc_counts[MOVE_CONSTRUCTOR];
  }

  Lifecycle& operator=(const Lifecycle& /* rhs */) noexcept {
    ++lc_counts[COPY_OPERATOR];
    return *this;
  }

  Lifecycle& operator=(Lifecycle&& /* rhs */) noexcept {
    ++lc_counts[MOVE_OPERATOR];
    return *this;
  }

  ~Lifecycle() noexcept {
    ++lc_counts[DESTRUCTOR];
    assert(lc_outstanding() >= 0);
    assert(constructed);
    constructed = false;
  }
};

template <typename R>
void runPerfectForwardingTest() {
  lc_snap();
  EXPECT_EQ(lc_outstanding(), 0);

  {
    // Non-dynamic only. False positive for dynamic.
    MPMCQueue<Lifecycle<R>, std::atomic> queue(50);
    LIFECYCLE_STEP(NOTHING);

    for (int pass = 0; pass < 10; ++pass) {
      for (int i = 0; i < 10; ++i) {
        queue.blockingWrite();
        LIFECYCLE_STEP(DEFAULT_CONSTRUCTOR);

        queue.blockingWrite(1, "one");
        LIFECYCLE_STEP(TWO_ARG_CONSTRUCTOR);

        {
          Lifecycle<R> src;
          LIFECYCLE_STEP(DEFAULT_CONSTRUCTOR);
          queue.blockingWrite(std::move(src));
          LIFECYCLE_STEP(MOVE_CONSTRUCTOR);
        }
        LIFECYCLE_STEP(DESTRUCTOR);

        {
          Lifecycle<R> src;
          LIFECYCLE_STEP(DEFAULT_CONSTRUCTOR);
          queue.blockingWrite(src);
          LIFECYCLE_STEP(COPY_CONSTRUCTOR);
        }
        LIFECYCLE_STEP(DESTRUCTOR);

        EXPECT_TRUE(queue.write());
        LIFECYCLE_STEP(DEFAULT_CONSTRUCTOR);
      }

      EXPECT_EQ(queue.size(), 50);
      EXPECT_FALSE(queue.write(2, "two"));
      LIFECYCLE_STEP(NOTHING);

      for (int i = 0; i < 50; ++i) {
        {
          Lifecycle<R> node;
          LIFECYCLE_STEP(DEFAULT_CONSTRUCTOR);

          queue.blockingRead(node);
          if (R::value) {
            // relocatable, moved via memcpy
            LIFECYCLE_STEP(DESTRUCTOR);
          } else {
            LIFECYCLE_STEP(DESTRUCTOR, MOVE_OPERATOR);
          }
        }
        LIFECYCLE_STEP(DESTRUCTOR);
      }

      EXPECT_EQ(queue.size(), 0);
    }

    // put one element back before destruction
    {
      Lifecycle<R> src(3, "three");
      LIFECYCLE_STEP(TWO_ARG_CONSTRUCTOR);
      queue.write(std::move(src));
      LIFECYCLE_STEP(MOVE_CONSTRUCTOR);
    }
    LIFECYCLE_STEP(DESTRUCTOR); // destroy src
  }
  LIFECYCLE_STEP(DESTRUCTOR); // destroy queue

  EXPECT_EQ(lc_outstanding(), 0);
}

TEST(MPMCQueue, perfect_forwarding) {
  runPerfectForwardingTest<std::false_type>();
}

TEST(MPMCQueue, perfect_forwarding_relocatable) {
  runPerfectForwardingTest<std::true_type>();
}

template <bool Dynamic = false>
void run_queue_moving() {
  lc_snap();
  EXPECT_EQ(lc_outstanding(), 0);

  {
    MPMCQueue<Lifecycle<std::false_type>, std::atomic, Dynamic> a(50);
    LIFECYCLE_STEP(NOTHING);

    a.blockingWrite();
    LIFECYCLE_STEP(DEFAULT_CONSTRUCTOR);

    // move constructor
    MPMCQueue<Lifecycle<std::false_type>, std::atomic, Dynamic> b
      = std::move(a);
    LIFECYCLE_STEP(NOTHING);
    EXPECT_EQ(a.capacity(), 0);
    EXPECT_EQ(a.size(), 0);
    EXPECT_EQ(b.capacity(), 50);
    EXPECT_EQ(b.size(), 1);

    b.blockingWrite();
    LIFECYCLE_STEP(DEFAULT_CONSTRUCTOR);

    // move operator
    MPMCQueue<Lifecycle<std::false_type>, std::atomic, Dynamic> c;
    LIFECYCLE_STEP(NOTHING);
    c = std::move(b);
    LIFECYCLE_STEP(NOTHING);
    EXPECT_EQ(c.capacity(), 50);
    EXPECT_EQ(c.size(), 2);

    {
      Lifecycle<std::false_type> dst;
      LIFECYCLE_STEP(DEFAULT_CONSTRUCTOR);
      c.blockingRead(dst);
      LIFECYCLE_STEP(DESTRUCTOR, MOVE_OPERATOR);

      {
        // swap
        MPMCQueue<Lifecycle<std::false_type>, std::atomic, Dynamic> d(10);
        LIFECYCLE_STEP(NOTHING);
        std::swap(c, d);
        LIFECYCLE_STEP(NOTHING);
        EXPECT_EQ(c.capacity(), 10);
        EXPECT_TRUE(c.isEmpty());
        EXPECT_EQ(d.capacity(), 50);
        EXPECT_EQ(d.size(), 1);

        d.blockingRead(dst);
        LIFECYCLE_STEP(DESTRUCTOR, MOVE_OPERATOR);

        c.blockingWrite(dst);
        LIFECYCLE_STEP(COPY_CONSTRUCTOR);

        d.blockingWrite(std::move(dst));
        LIFECYCLE_STEP(MOVE_CONSTRUCTOR);
      } // d goes out of scope
      LIFECYCLE_STEP(DESTRUCTOR);
    } // dst goes out of scope
    LIFECYCLE_STEP(DESTRUCTOR);
  } // c goes out of scope
  LIFECYCLE_STEP(DESTRUCTOR);
}

TEST(MPMCQueue, queue_moving) {
  run_queue_moving();
}

TEST(MPMCQueue, queue_moving_dynamic) {
  run_queue_moving<true>();
}

TEST(MPMCQueue, explicit_zero_capacity_fail) {
  ASSERT_THROW(MPMCQueue<int> cq(0), std::invalid_argument);

  using DynamicMPMCQueueInt = MPMCQueue<int, std::atomic, true>;
  ASSERT_THROW(DynamicMPMCQueueInt cq(0), std::invalid_argument);
}

template <bool Dynamic>
void testTryReadUntil() {
  MPMCQueue<int, std::atomic, Dynamic> q{1};

  const auto wait = std::chrono::milliseconds(100);
  stop_watch<> watch;
  bool rets[2];
  int vals[2];
  std::vector<std::thread> threads;
  boost::barrier b{3};
  for (int i = 0; i < 2; i++) {
    threads.emplace_back([&, i] {
      b.wait();
      rets[i] = q.tryReadUntil(watch.getCheckpoint() + wait, vals[i]);
    });
  }

  b.wait();
  EXPECT_TRUE(q.write(42));

  for (int i = 0; i < 2; i++) {
    threads[i].join();
  }

  for (int i = 0; i < 2; i++) {
    int other = (i + 1) % 2;
    if (rets[i]) {
      EXPECT_EQ(42, vals[i]);
      EXPECT_FALSE(rets[other]);
    }
  }

  EXPECT_TRUE(watch.elapsed(wait));
}

template <bool Dynamic>
void testTryWriteUntil() {
  MPMCQueue<int, std::atomic, Dynamic> q{1};
  EXPECT_TRUE(q.write(42));

  const auto wait = std::chrono::milliseconds(100);
  stop_watch<> watch;
  bool rets[2];
  std::vector<std::thread> threads;
  boost::barrier b{3};
  for (int i = 0; i < 2; i++) {
    threads.emplace_back([&, i] {
      b.wait();
      rets[i] = q.tryWriteUntil(watch.getCheckpoint() + wait, i);
    });
  }

  b.wait();
  int x;
  EXPECT_TRUE(q.read(x));
  EXPECT_EQ(42, x);

  for (int i = 0; i < 2; i++) {
    threads[i].join();
  }
  EXPECT_TRUE(q.read(x));

  for (int i = 0; i < 2; i++) {
    int other = (i + 1) % 2;
    if (rets[i]) {
      EXPECT_EQ(i, x);
      EXPECT_FALSE(rets[other]);
    }
  }

  EXPECT_TRUE(watch.elapsed(wait));
}

TEST(MPMCQueue, try_read_until) {
  testTryReadUntil<false>();
}

TEST(MPMCQueue, try_read_until_dynamic) {
  testTryReadUntil<true>();
}

TEST(MPMCQueue, try_write_until) {
  testTryWriteUntil<false>();
}

TEST(MPMCQueue, try_write_until_dynamic) {
  testTryWriteUntil<true>();
}

template <bool Dynamic>
void testTimeout(MPMCQueue<int, std::atomic, Dynamic>& q) {
  CHECK(q.write(1));
  /* The following must not block forever */
  q.tryWriteUntil(
      std::chrono::system_clock::now() + std::chrono::microseconds(10000), 2);
}

TEST(MPMCQueue, try_write_until_timeout) {
  folly::MPMCQueue<int, std::atomic, false> queue(1);
  testTimeout<false>(queue);
}

TEST(MPMCQueue, must_fail_try_write_until_dynamic) {
  folly::MPMCQueue<int, std::atomic, true> queue(200, 1, 2);
  testTimeout<true>(queue);
}
