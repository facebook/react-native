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
#include <folly/ConstexprMath.h>
#include <glog/logging.h>
#include <limits>
#include <type_traits>

template <typename ValueT>
constexpr ValueT UBSafeAdd(ValueT a, ValueT b) {
  using UnsignedT = typename std::make_unsigned<ValueT>::type;
  return static_cast<ValueT>(
      static_cast<UnsignedT>(a) + static_cast<UnsignedT>(b));
}

template <typename ValueT>
constexpr ValueT UBSafeSub(ValueT a, ValueT b) {
  using UnsignedT = typename std::make_unsigned<ValueT>::type;
  return static_cast<ValueT>(
      static_cast<UnsignedT>(a) - static_cast<UnsignedT>(b));
}

template <typename ValueT, typename Op>
void Run(size_t iterations, ValueT kMin, ValueT kMax, Op&& op) {
  auto kMid = (kMin + kMax) / 2;

  for (size_t round = 0; round < iterations; round++) {
    for (ValueT a = kMin; a < kMin + 100; a++) {
      for (ValueT b = kMin; b < kMin + 100; b++) {
        auto a1 = a, b1 = b;
        folly::makeUnpredictable(a1);
        folly::makeUnpredictable(b1);
        ValueT c = op(a1, b1);
        folly::doNotOptimizeAway(c);
      }
    }
    for (ValueT a = kMin; a < kMin + 100; a++) {
      for (ValueT b = kMid - 50; b < kMid + 50; b++) {
        auto a1 = a, b1 = b;
        folly::makeUnpredictable(a1);
        folly::makeUnpredictable(b1);
        ValueT c = op(a1, b1);
        folly::doNotOptimizeAway(c);
      }
    }
    for (ValueT a = kMin; a < kMin + 100; a++) {
      for (ValueT b = kMax - 100; b < kMax; b++) {
        auto a1 = a, b1 = b;
        folly::makeUnpredictable(a1);
        folly::makeUnpredictable(b1);
        ValueT c = op(a1, b1);
        folly::doNotOptimizeAway(c);
      }
    }
    for (ValueT a = kMid - 50; a < kMid + 50; a++) {
      for (ValueT b = kMin; b < kMin + 100; b++) {
        auto a1 = a, b1 = b;
        folly::makeUnpredictable(a1);
        folly::makeUnpredictable(b1);
        ValueT c = op(a1, b1);
        folly::doNotOptimizeAway(c);
      }
    }
    for (ValueT a = kMid - 50; a < kMid + 50; a++) {
      for (ValueT b = kMid - 50; b < kMid + 50; b++) {
        auto a1 = a, b1 = b;
        folly::makeUnpredictable(a1);
        folly::makeUnpredictable(b1);
        ValueT c = op(a1, b1);
        folly::doNotOptimizeAway(c);
      }
    }
    for (ValueT a = kMid - 50; a < kMid + 50; a++) {
      for (ValueT b = kMax - 100; b < kMax; b++) {
        auto a1 = a, b1 = b;
        folly::makeUnpredictable(a1);
        folly::makeUnpredictable(b1);
        ValueT c = op(a1, b1);
        folly::doNotOptimizeAway(c);
      }
    }
    for (ValueT a = kMax - 100; a < kMax; a++) {
      for (ValueT b = kMin; b < kMin + 100; b++) {
        auto a1 = a, b1 = b;
        folly::makeUnpredictable(a1);
        folly::makeUnpredictable(b1);
        ValueT c = op(a1, b1);
        folly::doNotOptimizeAway(c);
      }
    }
    for (ValueT a = kMax - 100; a < kMax; a++) {
      for (ValueT b = kMid - 50; b < kMid + 50; b++) {
        auto a1 = a, b1 = b;
        folly::makeUnpredictable(a1);
        folly::makeUnpredictable(b1);
        ValueT c = op(a1, b1);
        folly::doNotOptimizeAway(c);
      }
    }
    for (ValueT a = kMax - 100; a < kMax; a++) {
      for (ValueT b = kMax - 100; b < kMax; b++) {
        auto a1 = a, b1 = b;
        folly::makeUnpredictable(a1);
        folly::makeUnpredictable(b1);
        ValueT c = op(a1, b1);
        folly::doNotOptimizeAway(c);
      }
    }
  }
}

template <typename ValueT>
void Add(size_t iterations, ValueT kMin, ValueT kMax) {
  Run<ValueT>(iterations, kMin, kMax, [](ValueT a, ValueT b) {
    return UBSafeAdd(a, b);
  });
}

template <typename ValueT>
void NoOverflowAdd(size_t iterations, ValueT kMin, ValueT kMax) {
  Run<ValueT>(iterations, kMin, kMax, [](ValueT a, ValueT b) {
    return folly::constexpr_add_overflow_clamped(a, b);
  });
}

template <typename ValueT>
void Sub(size_t iterations, ValueT kMin, ValueT kMax) {
  Run<ValueT>(iterations, kMin, kMax, [](ValueT a, ValueT b) {
    return UBSafeSub(a, b);
  });
}

template <typename ValueT>
void NoOverflowSub(size_t iterations, ValueT kMin, ValueT kMax) {
  Run<ValueT>(iterations, kMin, kMax, [](ValueT a, ValueT b) {
    return folly::constexpr_sub_overflow_clamped(a, b);
  });
}

#define GENERATE_BENCHMARKS_FOR_TYPE(ValueT) \
  BENCHMARK_NAMED_PARAM(                     \
      Add,                                   \
      ValueT,                                \
      std::numeric_limits<ValueT>::min(),    \
      std::numeric_limits<ValueT>::max())    \
  BENCHMARK_RELATIVE_NAMED_PARAM(            \
      NoOverflowAdd,                         \
      ValueT,                                \
      std::numeric_limits<ValueT>::min(),    \
      std::numeric_limits<ValueT>::max())    \
  BENCHMARK_NAMED_PARAM(                     \
      Sub,                                   \
      ValueT,                                \
      std::numeric_limits<ValueT>::min(),    \
      std::numeric_limits<ValueT>::max())    \
  BENCHMARK_RELATIVE_NAMED_PARAM(            \
      NoOverflowSub,                         \
      ValueT,                                \
      std::numeric_limits<ValueT>::min(),    \
      std::numeric_limits<ValueT>::max())

GENERATE_BENCHMARKS_FOR_TYPE(int8_t)
BENCHMARK_DRAW_LINE();
GENERATE_BENCHMARKS_FOR_TYPE(uint8_t)
BENCHMARK_DRAW_LINE();
GENERATE_BENCHMARKS_FOR_TYPE(int16_t)
BENCHMARK_DRAW_LINE();
GENERATE_BENCHMARKS_FOR_TYPE(uint16_t)
BENCHMARK_DRAW_LINE();
GENERATE_BENCHMARKS_FOR_TYPE(int32_t)
BENCHMARK_DRAW_LINE();
GENERATE_BENCHMARKS_FOR_TYPE(uint32_t)
BENCHMARK_DRAW_LINE();
GENERATE_BENCHMARKS_FOR_TYPE(int64_t)
BENCHMARK_DRAW_LINE();
GENERATE_BENCHMARKS_FOR_TYPE(uint64_t)

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
