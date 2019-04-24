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
#include <cassert>
#include <exception>
#include <iostream>
#include <numeric>
#include <vector>

#include <folly/experimental/pushmi/examples/reduce.h>

using namespace pushmi::aliases;

auto inline_bulk_target() {
  return [](auto init,
            auto selector,
            auto input,
            auto&& func,
            auto sb,
            auto se,
            auto out) {
    try {
      auto acc = init(input);
      for (decltype(sb) idx{sb}; idx != se; ++idx) {
        func(acc, idx);
      }
      auto result = selector(std::move(acc));
      mi::set_value(out, std::move(result));
    } catch (...) {
      mi::set_error(out, std::current_exception());
    }
  };
}

int main() {
  std::vector<int> vec(10);
  std::fill(vec.begin(), vec.end(), 4);

  auto fortyTwo = mi::reduce(
      inline_bulk_target(), vec.begin(), vec.end(), 2, std::plus<>{});

  assert(std::accumulate(vec.begin(), vec.end(), 2) == fortyTwo);

  std::cout << fortyTwo << std::endl;

  std::cout << "OK" << std::endl;
}
