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

#pragma once

#include <folly/experimental/flat_combining/test/FlatCombiningExamples.h>

#include <folly/Benchmark.h>
#include <glog/logging.h>

#include <atomic>
#include <chrono>
#include <thread>

namespace folly {
namespace test {

void doWork(int work) {
  uint64_t a = 0;
  for (int i = work; i > 0; --i) {
    a += i;
  }
  folly::doNotOptimizeAway(a);
}

template <
    typename Example,
    typename Req = bool,
    typename Mutex = std::mutex,
    template <typename> class Atom = std::atomic>
uint64_t fc_test(
    int nthreads,
    int lines,
    int numRecs,
    int work,
    int ops,
    bool combining,
    bool dedicated,
    bool tc,
    bool syncops,
    bool excl = false,
    bool allocAll = false) {
  using FC = FlatCombining<Example, Mutex, Atom, Req>;
  using Rec = typename FC::Rec;

  folly::BenchmarkSuspender susp;

  std::atomic<bool> start{false};
  std::atomic<int> started{0};
  Example ex(lines, dedicated, numRecs);
  std::atomic<uint64_t> total{0};
  bool mutex = false;

  if (allocAll) {
    std::vector<Rec*> v(numRecs);
    for (int i = 0; i < numRecs; ++i) {
      v[i] = ex.allocRec();
    }
    for (int i = numRecs; i > 0; --i) {
      ex.freeRec(v[i - 1]);
    }
  }

  std::vector<std::thread> threads(nthreads);
  for (int tid = 0; tid < nthreads; ++tid) {
    threads[tid] = std::thread([&, tid] {
      started.fetch_add(1);
      Rec* myrec = (combining && tc) ? ex.allocRec() : nullptr;
      uint64_t sum = 0;
      while (!start.load()) {
        ;
      }

      if (!combining) {
        // no combining
        for (int i = tid; i < ops; i += nthreads) {
          sum += ex.fetchAddNoFC(1);
          doWork(work); // unrelated work
        }
      } else if (syncops) {
        // sync combining
        for (int i = tid; i < ops; i += nthreads) {
          sum += ex.fetchAdd(1, myrec);
          doWork(work); // unrelated work
        }
      } else {
        // async combining
        for (int i = tid; i < ops; i += nthreads) {
          ex.add(1, myrec);
          doWork(work); // unrelated work
        }
      }

      if (excl) {
        // test of exclusive access through a lock holder
        {
          std::unique_lock<Mutex> l;
          ex.holdLock(l);
          CHECK(!mutex);
          mutex = true;
          VLOG(2) << tid << " " << ex.getVal() << " ...........";
          using namespace std::chrono_literals;
          /* sleep override */ // for coverage
          std::this_thread::sleep_for(10ms);
          VLOG(2) << tid << " " << ex.getVal() << " ===========";
          CHECK(mutex);
          mutex = false;
        }
        // test of explicit acquisition and release of exclusive access
        ex.acquireExclusive();
        {
          CHECK(!mutex);
          mutex = true;
          VLOG(2) << tid << " " << ex.getVal() << " ...........";
          using namespace std::chrono_literals;
          /* sleep override */ // for coverage
          std::this_thread::sleep_for(10ms);
          VLOG(2) << tid << " " << ex.getVal() << " ===========";
          CHECK(mutex);
          mutex = false;
        }
        ex.releaseExclusive();
      }

      total.fetch_add(sum);
      if (combining && tc) {
        ex.freeRec(myrec);
      }
    });
  }

  while (started.load() < nthreads) {
    ;
  }
  auto tbegin = std::chrono::steady_clock::now();

  // begin time measurement
  susp.dismiss();
  start.store(true);

  for (auto& t : threads) {
    t.join();
  }

  if (!syncops) {
    // complete any pending asynch ops
    ex.drainAll();
  }

  // end time measurement
  uint64_t duration = 0;
  BENCHMARK_SUSPEND {
    auto tend = std::chrono::steady_clock::now();
    CHECK_EQ(ops, ex.getVal());
    if (syncops) {
      uint64_t n = (uint64_t)ops;
      uint64_t expected = n * (n - 1) / 2;
      CHECK_EQ(expected, total);
    }
    duration =
        std::chrono::duration_cast<std::chrono::nanoseconds>(tend - tbegin)
            .count();
  }
  return duration;
}

uint64_t run_test(
    int nthreads,
    int lines,
    int numRecs,
    int work,
    int ops,
    bool combining,
    bool simple,
    bool dedicated,
    bool tc,
    bool syncops,
    bool excl = false,
    bool allocAll = false) {
  using M = std::mutex;
  if (simple) {
    using Example = FcSimpleExample<M>;
    return fc_test<Example, bool, M>(
        nthreads,
        lines,
        numRecs,
        work,
        ops,
        combining,
        dedicated,
        tc,
        syncops,
        excl,
        allocAll);
  } else {
    using Example = FcCustomExample<Req, M>;
    return fc_test<Example, Req, M>(
        nthreads,
        lines,
        numRecs,
        work,
        ops,
        combining,
        dedicated,
        tc,
        syncops,
        excl,
        allocAll);
  }
}

} // namespace test
} // namespace folly
