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

#include <futures.h>
#include <atomic>
#include <functional>
#include <memory>
#include <thread>
#include <utility>

#include <folly/experimental/pushmi/examples/pool.h>

#include <folly/experimental/pushmi/o/transform.h>

using namespace pushmi::aliases;

namespace p1054 {
// A promise refers to a promise and is associated with a future,
// either through type-erasure or through construction of an
// underlying promise with an overload of make_promise_contract().

// make_promise_contract() cannot be written to produce a lazy future.
// the promise has to exist prior to .then() getting a continuation.
// there must be a shared allocation to connect the promise and future.
template <class T, class Executor>
std::pair<
    std::experimental::standard_promise<T>,
    std::experimental::standard_future<T, std::decay_t<Executor>>>
make_promise_contract(const Executor& e) {
  std::experimental::standard_promise<T> promise;
  auto ex = e;
  return {promise, promise.get_future(std::move(ex))};
}

template <class Executor, class Function>
std::experimental::standard_future<
    std::result_of_t<std::decay_t<Function>()>,
    std::decay_t<Executor>>
twoway_execute(Executor&& e, Function&& f) {
  using T = std::result_of_t<std::decay_t<Function>()>;
  auto pc = make_promise_contract<T>(e);
  auto p = std::get<0>(pc);
  auto r = std::get<1>(pc);
  e.execute([p, f]() mutable { p.set_value(f()); });
  return r;
}
} // namespace p1054

namespace p1055 {

template <class Executor, class Function>
auto twoway_execute(Executor&& e, Function&& f) {
  return e | op::transform([f](auto) { return f(); });
}

} // namespace p1055

int main() {
  mi::pool p{std::max(1u, std::thread::hardware_concurrency())};

  std::experimental::static_thread_pool sp{
      std::max(1u, std::thread::hardware_concurrency())};

  p1054::twoway_execute(sp.executor(), []() { return 42; }).get();

  p1055::twoway_execute(p.executor(), []() { return 42; }) | op::get<int>;

  sp.stop();
  sp.wait();
  p.stop();
  p.wait();

  std::cout << "OK" << std::endl;
}
