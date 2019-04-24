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
#include <folly/Benchmark.h>
#include <folly/io/async/EventBase.h>
#include <folly/portability/GFlags.h>

using namespace folly;

class CountedLoopCallback : public EventBase::LoopCallback {
 public:
  CountedLoopCallback(EventBase* eventBase, unsigned int count)
      : eventBase_(eventBase), count_(count) {}

  void runLoopCallback() noexcept override {
    --count_;
    if (count_ > 0) {
      eventBase_->runInLoop(this);
    }
  }

 private:
  EventBase* eventBase_;
  unsigned int count_;
};

BENCHMARK(timeMeasurementsOn, n) {
  EventBase eventBase;

  while (n--) {
    CountedLoopCallback c(&eventBase, 10);
    eventBase.runInLoop(&c);
    eventBase.loop();
  }
}

BENCHMARK_RELATIVE(timeMeasurementsOff, n) {
  EventBase eventBase(/* enableTimeMeasurement */ false);

  while (n--) {
    CountedLoopCallback c(&eventBase, 10);
    eventBase.runInLoop(&c);
    eventBase.loop();
  }
}

/**
 * --bm_min_iters=1000000
 *
 * ============================================================================
 * folly/io/async/test/EventBaseBenchmark.cpp      relative  time/iter  iters/s
 * ============================================================================
 * timeMeasurementsOn                                           1.25us  798.33K
 * timeMeasurementsOff                              214.47%   584.04ns    1.71M
 * ============================================================================
 */

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  runBenchmarks();
}
