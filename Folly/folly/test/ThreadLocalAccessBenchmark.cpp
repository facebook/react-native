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

#include <folly/Benchmark.h>
#include <folly/ThreadLocal.h>
#include <condition_variable>
#include <mutex>
#include <thread>

using namespace folly;

namespace {
class SimpleThreadCachedInt {
  class NewTag;
  ThreadLocal<int, NewTag> val_;

 public:
  void set() {
    *val_ = 0;
  }

  void access() {
    for (const auto& i : val_.accessAllThreads()) {
      (void)i;
    }
  }
};
} // namespace
void runTest(int iters, int numThreads) {
  BenchmarkSuspender susp;

  std::vector<SimpleThreadCachedInt> stci(numThreads);

  std::mutex m, mw;
  std::condition_variable cv, cvw;
  bool running = true;
  int numRunning = 0;

  std::vector<std::thread> threads;
  for (int i = 0; i < numThreads; i++) {
    threads.push_back(std::thread([i,
                                   numThreads,
                                   &stci,
                                   &m,
                                   &mw,
                                   &cv,
                                   &cvw,
                                   &running,
                                   &numRunning]() mutable {
      stci[i].set();

      // notify if all the threads have created the
      // thread local var
      bool notify = false;
      {
        std::lock_guard<std::mutex> lk(m);
        if (++numRunning == numThreads) {
          notify = true;
        }
      }

      if (notify) {
        cv.notify_one();
      }

      // now wait
      {
        std::unique_lock<std::mutex> lk(mw);
        cvw.wait(lk, [&]() { return !running; });
      }
    }));
  }

  // wait for the threads to create the thread locals
  {
    std::unique_lock<std::mutex> lk(m);
    cv.wait(lk, [&]() { return numRunning == numThreads; });
  }

  susp.dismiss();

  // run the test loop
  for (int i = 0; i < iters; i++) {
    stci[i % numThreads].access();
  }

  susp.rehire();

  {
    std::lock_guard<std::mutex> lk(mw);
    running = false;
  }

  cvw.notify_all();

  for (auto& t : threads) {
    t.join();
  }
}

BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(runTest, 1)
BENCHMARK_PARAM(runTest, 128)
BENCHMARK_PARAM(runTest, 256)
BENCHMARK_PARAM(runTest, 512)
BENCHMARK_PARAM(runTest, 1024)
BENCHMARK_PARAM(runTest, 2048)
BENCHMARK_DRAW_LINE();

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();

  return 0;
}
