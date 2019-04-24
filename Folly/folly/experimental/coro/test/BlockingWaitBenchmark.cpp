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

#include <folly/Benchmark.h>
#include <folly/Portability.h>

#if FOLLY_HAS_COROUTINES

#include <folly/experimental/coro/BlockingWait.h>
#include <folly/experimental/coro/Utils.h>

#include <string>

BENCHMARK(blockingWaitRVOInt, iters) {
  for (size_t iter = 0; iter < iters; ++iter) {
    auto result =
        folly::coro::blockingWait(folly::coro::AwaitableReady<int>(42));
    if (result != 42) {
      std::abort();
    }
  }
}

constexpr folly::StringPiece longString =
    "hello coroutines! this is a longer string that "
    "should hopefully inhibit short string optimisations.";

BENCHMARK(blockingWaitRVOStrings, iters) {
  for (size_t iter = 0; iter < iters; ++iter) {
    auto result = folly::coro::blockingWait(
        folly::coro::AwaitableReady<std::string>(longString.str()));
    if (result.size() != longString.size()) {
      std::abort();
    }
  }
}

struct IdentityMatrix {};

struct Matrix {
  /* implicit */ Matrix(IdentityMatrix) noexcept {
    for (int i = 0; i < 4; ++i) {
      for (int j = 0; j < 4; ++j) {
        values_[i][j] = (i == j) ? 1 : 0;
      }
    }
  }

  Matrix(const Matrix&) noexcept = default;
  Matrix& operator=(const Matrix&) noexcept = default;

  std::uint64_t values_[4][4];
};

BENCHMARK(blockingWaitRVO, iters) {
  folly::coro::AwaitableReady<Matrix> identityAwaitable{IdentityMatrix{}};
  for (size_t iter = 0; iter < iters; ++iter) {
    auto result = folly::coro::blockingWait(identityAwaitable);
    if (result.values_[3][3] != 1) {
      std::abort();
    }
  }
}

#endif

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
