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
#include <algorithm>
#include <cassert>
#include <iostream>
#include <vector>

#include <folly/experimental/pushmi/examples/no_fail.h>
#include <folly/experimental/pushmi/o/empty.h>
#include <folly/experimental/pushmi/o/error.h>
#include <folly/experimental/pushmi/o/just.h>
#include <folly/experimental/pushmi/o/switch_on_error.h>
#include <folly/experimental/pushmi/o/transform.h>

using namespace pushmi::aliases;

// concat not yet implemented
template <class T, class E = std::exception_ptr>
auto concat = [](auto in) {
  return mi::make_single_sender([in](auto out) mutable {
    ::pushmi::submit(in, mi::make_receiver(out, [](auto out, auto v) {
                       ::pushmi::submit(v, mi::any_receiver<E, T>(out));
                     }));
  });
};

int main() {
  auto stop_abort = mi::on_error([](auto) noexcept {});
  // support all error value types

  op::error(std::exception_ptr{}) | op::submit(stop_abort);

  op::error(std::errc::argument_list_too_long) | op::submit(stop_abort);

  // transform an error

  op::error(std::errc::argument_list_too_long) | op::switch_on_error([
  ](auto) noexcept { return op::error(std::exception_ptr{}); }) |
      op::submit(stop_abort);

  // use default value if an error occurs

  op::just(42) |
      op::switch_on_error([](auto) noexcept { return op::just(0); }) |
      op::submit();

  // suppress if an error occurs

  op::error(std::errc::argument_list_too_long) |
      op::switch_on_error([](auto) noexcept { return op::empty(); }) |
      op::submit();

  // abort if an error occurs

  op::just(42) | op::no_fail() | op::submit();

  // transform value to error_

  op::just(42) | op::transform([](auto v) {
    using r_t = mi::any_single_sender<std::exception_ptr, int>;
    if (v < 40) {
      return r_t{op::error<int>(std::exception_ptr{})};
    } else {
      return r_t{op::just(v)};
    }
  }) | concat<int> |
      op::submit();

  // retry on error

  // http.get(ex) |
  //   op::timeout(ex, 1s) |
  //   op::switch_on_error([](auto e) noexcept { return op::timer(ex, 1s); }) |
  //   op::repeat() |
  //   op::timeout(ex, 10s) |
  //   op::submit();

  std::cout << "OK" << std::endl;
}
