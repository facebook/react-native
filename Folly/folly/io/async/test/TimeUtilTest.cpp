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
#include <thread>

#include <glog/logging.h>

#include <folly/io/async/test/TimeUtil.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Unistd.h>

using folly::TimePoint;
using namespace std::literals::chrono_literals;
using std::chrono::duration_cast;
using std::chrono::milliseconds;
using std::chrono::nanoseconds;
using std::chrono::steady_clock;

// Define a PrintTo() function for std::chrono::nanoseconds so that these
// will be printed nicely on EXPECT*() failures.
// Define this in std::chrono so that argument-dependent lookup works.
namespace std {
namespace chrono {
static inline void PrintTo(nanoseconds ns, ::std::ostream* os) {
  *os << ns.count() << "ns";
}
} // namespace chrono
} // namespace std

#ifdef __linux__
void runThread(nanoseconds duration, nanoseconds* timeWaiting) {
  TimePoint start;

  // Loop consuming CPU until the duration has expired.
  while (true) {
    TimePoint now;
    if (now.getTimeStart() - start.getTimeStart() > duration) {
      // Time to quit
      // Report how long we spent waiting to be scheduled on the CPU.
      *timeWaiting = (now.getTimeWaiting() - start.getTimeWaiting());
      VLOG(1) << "thread " << start.getTid() << ": elapsed "
              << duration_cast<milliseconds>(
                     now.getTimeStart() - start.getTimeStart())
                     .count()
              << "ms, time waiting: "
              << duration_cast<milliseconds>(*timeWaiting).count() << "ms";
      break;
    }
  }
}

// Test to make sure that TimePoint computes sane values for time
// spent waiting on CPU.
TEST(TimeUtil, getTimeWaiting) {
  TimePoint tp;

  // Run twice as many threads as CPU cores, to ensure that some of
  // them should be waiting sometime.
  auto numThreads = sysconf(_SC_NPROCESSORS_CONF) * 2;

  std::vector<std::thread> threads;
  std::vector<nanoseconds> timeWaiting;
  timeWaiting.resize(numThreads, 0ns);

  auto start = steady_clock::now();
  for (int n = 0; n < numThreads; ++n) {
    threads.emplace_back(runThread, 1s, &timeWaiting[n]);
  }

  for (auto& thread : threads) {
    thread.join();
  }
  auto end = steady_clock::now();

  auto timeSpent = end - start;
  nanoseconds max{0};
  for (int n = 0; n < numThreads; ++n) {
    max = std::max(max, timeWaiting[n]);
    // No thread could possibly have been waiting for longer than
    // the test actually took to run.
    EXPECT_LT(timeWaiting[n], timeSpent);
  }
  // Make sure that at least one thread spent some time waiting
  EXPECT_GE(max, 1ns);
}
#endif
