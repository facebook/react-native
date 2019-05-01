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
#include <folly/futures/Future.h>
#include <folly/futures/Promise.h>
#include <cstdint>

namespace folly {
namespace python {
namespace test {

folly::Future<uint64_t> future_getValueX5(uint64_t val) {
  folly::Promise<uint64_t> p;
  auto f = p.getFuture();
  p.setWith([val] {
    if (val == 0) {
      throw std::invalid_argument("0 is not allowed");
    }
    return val * 5;
  });
  return f;
}

folly::Function<uint64_t()> getValueX5Fibers(uint64_t val) {
  return [val]() {
    if (val == 0) {
      throw std::invalid_argument("0 is not allowed");
    }
    return val * 5;
  };
}

} // namespace test
} // namespace python
} // namespace folly
