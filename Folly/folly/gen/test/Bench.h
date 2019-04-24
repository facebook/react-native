/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/Benchmark.h>

#define BENCH_GEN_IMPL(gen, prefix)             \
  static bool FB_ANONYMOUS_VARIABLE(benchGen) = \
      (::folly::addBenchmark(                   \
           __FILE__,                            \
           prefix FB_STRINGIZE(gen),            \
           [](unsigned iters) {                 \
             const unsigned num = iters;        \
             while (iters--) {                  \
               folly::doNotOptimizeAway(gen);   \
             }                                  \
             return num;                        \
           }),                                  \
       true)
#define BENCH_GEN(gen) BENCH_GEN_IMPL(gen, "")
#define BENCH_GEN_REL(gen) BENCH_GEN_IMPL(gen, "%")
