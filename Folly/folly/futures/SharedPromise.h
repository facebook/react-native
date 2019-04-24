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

#include <folly/Portability.h>
#include <folly/executors/InlineExecutor.h>
#include <folly/futures/Promise.h>
#include <folly/lang/Exception.h>

namespace folly {

/*
 * SharedPromise provides the same interface as Promise, but you can extract
 * multiple Futures from it, i.e. you can call getFuture() as many times as
 * you'd like. When the SharedPromise is fulfilled, all of the Futures are
 * completed. Calls to getFuture() after the SharedPromise is fulfilled return
 * a completed Future. If you find yourself constructing collections of Promises
 * and fulfilling them simultaneously with the same value, consider this
 * utility instead. Likewise, if you find yourself in need of setting multiple
 * callbacks on the same Future (which is indefinitely unsupported), consider
 * refactoring to use SharedPromise to "split" the Future.
 *
 * The ShardPromise must be kept alive manually. Consider FutureSplitter for
 * automatic lifetime management.
 */
template <class T>
class SharedPromise {
 public:
  SharedPromise() = default;
  ~SharedPromise() = default;

  // not copyable
  SharedPromise(SharedPromise const&) = delete;
  SharedPromise& operator=(SharedPromise const&) = delete;

  // movable
  SharedPromise(SharedPromise<T>&&) noexcept;
  SharedPromise& operator=(SharedPromise<T>&&) noexcept;

  /**
   * Return a Future tied to the shared core state. Unlike Promise::getFuture,
   * this can be called an unlimited number of times per SharedPromise.
   */
  SemiFuture<T> getSemiFuture();

  /**
   * Return a Future tied to the shared core state. Unlike Promise::getFuture,
   * this can be called an unlimited number of times per SharedPromise.
   * NOTE: This function is deprecated. Please use getSemiFuture and pass the
   *       appropriate executor to .via on the returned SemiFuture to get a
   *       valid Future where necessary.
   */
  Future<T> getFuture();

  /** Return the number of Futures associated with this SharedPromise */
  size_t size();

  /** Fulfill the SharedPromise with an exception_wrapper */
  void setException(exception_wrapper ew);

  /** Fulfill the SharedPromise with an exception type E, which can be passed to
    make_exception_wrapper(). Useful for originating exceptions. If you
    caught an exception the exception_wrapper form is more appropriate.
    */
  template <class E>
  typename std::enable_if<std::is_base_of<std::exception, E>::value>::type
  setException(E const&);

  /// Set an interrupt handler to handle interrupts. See the documentation for
  /// Future::raise(). Your handler can do whatever it wants, but if you
  /// bother to set one then you probably will want to fulfill the SharedPromise
  /// with an exception (or special value) indicating how the interrupt was
  /// handled.
  void setInterruptHandler(std::function<void(exception_wrapper const&)>);

  /// Sugar to fulfill this SharedPromise<Unit>
  template <class B = T>
  typename std::enable_if<std::is_same<Unit, B>::value, void>::type setValue() {
    setTry(Try<T>(T()));
  }

  /** Set the value (use perfect forwarding for both move and copy) */
  template <class M>
  void setValue(M&& value);

  void setTry(Try<T>&& t);

  /** Fulfill this SharedPromise with the result of a function that takes no
    arguments and returns something implicitly convertible to T.
    Captures exceptions. e.g.

    p.setWith([] { do something that may throw; return a T; });
  */
  template <class F>
  void setWith(F&& func);

  bool isFulfilled();

 private:
  std::mutex mutex_;
  size_t size_{0};
  bool hasValue_{false};
  Try<T> try_;
  std::vector<Promise<T>> promises_;
  std::function<void(exception_wrapper const&)> interruptHandler_;
};

} // namespace folly

#include <folly/futures/Future.h>
#include <folly/futures/SharedPromise-inl.h>
