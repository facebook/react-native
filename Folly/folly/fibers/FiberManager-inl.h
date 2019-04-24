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

#include <folly/functional/Invoke.h>
#include <folly/futures/Promise.h>

namespace folly {
namespace fibers {

template <typename F>
auto FiberManager::addTaskFuture(F&& func)
    -> folly::Future<typename folly::lift_unit<invoke_result_t<F>>::type> {
  using T = invoke_result_t<F>;
  using FutureT = typename folly::lift_unit<T>::type;

  folly::Promise<FutureT> p;
  auto f = p.getFuture();
  addTaskFinally(
      [func = std::forward<F>(func)]() mutable { return func(); },
      [p = std::move(p)](folly::Try<T>&& t) mutable {
        p.setTry(std::move(t));
      });
  return f;
}

template <typename F>
auto FiberManager::addTaskRemoteFuture(F&& func)
    -> folly::Future<typename folly::lift_unit<invoke_result_t<F>>::type> {
  folly::Promise<typename folly::lift_unit<invoke_result_t<F>>::type> p;
  auto f = p.getFuture();
  addTaskRemote(
      [p = std::move(p), func = std::forward<F>(func), this]() mutable {
        auto t = folly::makeTryWith(std::forward<F>(func));
        runInMainContext([&]() { p.setTry(std::move(t)); });
      });
  return f;
}
} // namespace fibers
} // namespace folly
