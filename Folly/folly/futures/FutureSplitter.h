/*
 * Copyright 2017 Facebook, Inc.
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
#include <folly/futures/SharedPromise.h>

namespace folly {

/*
 * FutureSplitter provides a `getFuture()' method which can be called multiple
 * times, returning a new Future each time. These futures are called-back when
 * the original Future passed to the FutureSplitter constructor completes. Calls
 * to `getFuture()' after that time return a completed Future.
 *
 * Note that while the Futures from `getFuture()' depend on the completion of
 * the original Future they do not inherit any other properties such as
 * Executors passed to `via' etc.
 */
template <class T>
class FutureSplitter {
 public:
  /**
   * Default constructor for convenience only. It is an error to call
   * `getFuture()` on a default-constructed FutureSplitter which has not had
   * a correctly-constructed FutureSplitter copy- or move-assigned into it.
   */
  FutureSplitter() = default;

  /**
   * Provide a way to split a Future<T>.
   */
  explicit FutureSplitter(Future<T>&& future)
      : promise_(std::make_shared<SharedPromise<T>>()) {
    future.then([promise = promise_](Try<T> && theTry) {
      promise->setTry(std::move(theTry));
    });
  }

  /**
   * This can be called an unlimited number of times per FutureSplitter.
   */
  Future<T> getFuture() {
    if (UNLIKELY(promise_ == nullptr)) {
      throw NoFutureInSplitter();
    }
    return promise_->getFuture();
  }

 private:
  std::shared_ptr<SharedPromise<T>> promise_;
};

/**
 * Convenience function, allowing us to exploit template argument deduction to
 * improve readability.
 */
template <class T>
FutureSplitter<T> splitFuture(Future<T>&& future) {
  return FutureSplitter<T>{std::move(future)};
}
}
