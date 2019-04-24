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
#include <futures_static_thread_pool.h>
#include <atomic>
#include <functional>
#include <memory>
#include <thread>
#include <utility>

#include <folly/experimental/pushmi/examples/pool.h>

#include <folly/experimental/pushmi/o/just.h>
#include <folly/experimental/pushmi/o/transform.h>
#include <folly/experimental/pushmi/o/via.h>
#include <folly/experimental/pushmi/strand.h>

using namespace pushmi::aliases;

struct inline_executor {
 public:
  friend bool operator==(
      const inline_executor&,
      const inline_executor&) noexcept {
    return true;
  }
  friend bool operator!=(
      const inline_executor&,
      const inline_executor&) noexcept {
    return false;
  }
  template <class Function>
  void execute(Function f) const noexcept {
    f();
  }
  constexpr bool query(std::experimental::execution::oneway_t) {
    return true;
  }
  constexpr bool query(std::experimental::execution::twoway_t) {
    return false;
  }
  constexpr bool query(std::experimental::execution::single_t) {
    return true;
  }
};

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

template <class Executor, class Function, class Future>
std::experimental::standard_future<
    std::result_of_t<
        Function(std::decay_t<typename std::decay_t<Future>::value_type>&&)>,
    std::decay_t<Executor>>
then_execute(Executor&& e, Function&& f, Future&& pred) {
  using V = std::decay_t<typename std::decay_t<Future>::value_type>;
  using T = std::result_of_t<Function(V &&)>;
  auto pc = make_promise_contract<T>(e);
  auto p = std::get<0>(pc);
  auto r = std::get<1>(pc);
  ((Future &&) pred).then([e, p, f](V v) mutable {
    e.execute([p, f, v]() mutable { p.set_value(f(v)); });
    return 0;
  });
  return r;
}

} // namespace p1054

namespace p1055 {

template <class Executor, class Function, class Future>
auto then_execute(Executor&& e, Function&& f, Future&& pred) {
  return pred | op::via(mi::strands(e)) |
      op::transform([f](auto v) { return f(v); });
}

} // namespace p1055

int main() {
  mi::pool p{std::max(1u, std::thread::hardware_concurrency())};

  std::experimental::futures_static_thread_pool sp{
      std::max(1u, std::thread::hardware_concurrency())};

  auto pc = p1054::make_promise_contract<int>(inline_executor{});
  auto& pr = std::get<0>(pc);
  auto& r = std::get<1>(pc);
  auto f = p1054::then_execute(
      sp.executor(), [](int v) { return v * 2; }, std::move(r));
  pr.set_value(42);
  f.get();

  p1055::then_execute(p.executor(), [](int v) { return v * 2; }, op::just(21)) |
      op::get<int>;

  sp.stop();
  sp.wait();
  p.stop();
  p.wait();

  std::cout << "OK" << std::endl;
}
