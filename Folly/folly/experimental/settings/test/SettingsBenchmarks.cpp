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
#include <folly/experimental/settings/Settings.h>
#include <folly/init/Init.h>

/*
============================================================================
folly/experimental/settings/test/SettingsBenchmarks.cpprelative  time/iter
iters/s
============================================================================
settings_get_bench                                           1.73ns  577.36M
============================================================================
*/

FOLLY_SETTING_DEFINE(follytest, benchmarked, int, 100, "desc");

BENCHMARK(settings_get_bench, iters) {
  for (unsigned int i = 0; i < iters; ++i) {
    auto value = *FOLLY_SETTING(follytest, benchmarked);
    folly::doNotOptimizeAway(value);
  }
}

int main(int argc, char** argv) {
  folly::init(&argc, &argv);
  folly::runBenchmarks();

  return 0;
}
