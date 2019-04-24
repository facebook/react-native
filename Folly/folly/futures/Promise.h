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

#include <functional>

#include <folly/Portability.h>
#include <folly/Try.h>
#include <folly/futures/detail/Core.h>
#include <folly/lang/Exception.h>

namespace folly {

class FOLLY_EXPORT PromiseException : public std::logic_error {
 public:
  using std::logic_error::logic_error;
};

class FOLLY_EXPORT PromiseInvalid : public PromiseException {
 public:
  PromiseInvalid() : PromiseException("Promise invalid") {}
};

class FOLLY_EXPORT PromiseAlreadySatisfied : public PromiseException {
 public:
  PromiseAlreadySatisfied() : PromiseException("Promise already satisfied") {}
};

class FOLLY_EXPORT FutureAlreadyRetrieved : public PromiseException {
 public:
  FutureAlreadyRetrieved() : PromiseException("Future already retrieved") {}
};

class FOLLY_EXPORT BrokenPromise : public PromiseException {
 public:
  explicit BrokenPromise(const std::string& type)
      : PromiseException("Broken promise for type name `" + type + '`') {}

  explicit BrokenPromise(const char* type) : BrokenPromise(std::string(type)) {}
};

// forward declaration
template <class T>
class SemiFuture;
template <class T>
class Future;

namespace futures {
namespace detail {
template <class T>
class FutureBase;
struct EmptyConstruct {};
template <typename T, typename F>
class CoreCallbackState;
} // namespace detail
} // namespace futures

/// Promises and futures provide a potentially nonblocking mechanism
///   to execute a producer/consumer operation concurrently, with
///   threading/pools controlled via an executor. There are multiple potential
///   patterns for using promises and futures including some that block the
///   caller, though that is discouraged; it should be used only when necessary.
///
/// One typical pattern uses a series of calls to set up a small, limited
///   program that...
///
/// - ...performs the desired operations (based on a lambda)...
/// - ...on an asynchronously provided input (an exception or a value)...
/// - ...lazily, when that input is ready (without blocking the caller)...
/// - ...using appropriate execution resources (determined by the executor)...
/// - ...then after constructing the 'program,' launches the asynchronous
///   producer.
///
/// That usage pattern looks roughly like this:
///
///   auto [p, f] = makePromiseContract(executor);
///   g = std::move(f).then([](MyValue&& x) {
///       ...executor runs this code if/when a MyValue is ready...
///     });
///   ...launch the async producer that eventually calls p.setResult()...
///
/// This is just one of many potential usage patterns. It has the desired
/// property of being nonblocking to the caller. Of course the `.then()`
/// code is deferred until the produced value (or exception) is ready,
/// but no code actually blocks pending completion of other operations.
///
/// The promise/future mechanism is limited to a single object of some arbitrary
/// type. It also supports a (logically) void result, i.e., in cases where the
/// continuation/consumer (the `.then()` code if using the above pattern) is not
/// expecting a value because the 'producer' is running for its side-effects.
///
/// The primary data movement is from producer to consumer, however Promise and
/// Future also provide a mechanism where the consumer can send an interruption
/// message to the producer. The meaning and response to that interruption
/// message is controlled by the promise; see `Promise::setInterruptHandler()`.
///
/// Neither Promise nor Future is thread-safe. All internal interactions
/// between a promise and its associated future are thread-safe, provided that
/// callers otherwise honor the promise's contract and the future's contract.
///
/// Logically there are up to three threads (though in practice there are often
/// fewer - one thread might take on more than one role):
///
/// - Set-up thread: thread used to construct the Promise, and often also to
///   set up the SemiFuture/Future.
/// - Producer thread: thread that produces the result.
/// - Consumer thread: thread in which the continuation is invoked (a
///   continuation is a callback provided to `.then` or to a variant).
///
/// For description purposes, the term 'shared state' is used to describe the
///   logical state shared by the promise and the future. This 'third object'
///   represents things like whether the result has been fulfilled, the value or
///   exception in that result, and the data needed to handle interruption
///   requests.
///
/// A promise can be in various logical states:
///
/// - valid vs. invalid (has vs. does not have a shared state, respectfully).
/// - fulfilled vs. unfulfilled (an invalid promise is always fulfilled; a valid
///   promise is fulfilled if the shared-state has a result).
///
/// A promise `p` may optionally have an associated future. This future, if it
///   exists, may be either a SemiFuture or a Future, and is defined as the
///   future (if any) that holds the same shared state as promise `p`.
///   The associated future is initially the future returned from
///   `p.getFuture()` or `p.getSemiFuture()`, but various operations
///   may transfer the shared state from one future to another.
template <class T>
class Promise {
 public:
  /// Returns an invalid promise.
  ///
  /// Postconditions:
  ///
  /// - `RESULT.valid() == false`
  /// - `RESULT.isFulfilled() == true`
  static Promise<T> makeEmpty() noexcept;

  /// Constructs a valid but unfulfilled promise.
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (it will have a shared state)
  /// - `isFulfilled() == false` (its shared state won't have a result)
  Promise();

  /// Postconditions:
  ///
  /// - If `valid()` and `!isFulfilled()`, the associated future (if any) will
  ///   be completed with a `BrokenPromise` exception *as if* by
  ///   `setException(...)`.
  /// - If `valid()`, releases, possibly destroying, the shared state.
  ~Promise();

  // not copyable
  Promise(Promise const&) = delete;
  Promise& operator=(Promise const&) = delete;

  /// Move ctor
  ///
  /// Postconditions:
  ///
  /// - `this` will have whatever shared-state was previously held by `other`
  ///   (if any)
  /// - `other.valid()` will be false (`other` will not have any shared state)
  Promise(Promise<T>&& other) noexcept;

  /// Move assignment
  ///
  /// Postconditions:
  ///
  /// - If `valid()` and `!isFulfilled()`, the associated future (if any) will
  ///   be completed with a `BrokenPromise` exception *as if* by
  ///   `setException(...)`.
  /// - If `valid()`, releases, possibly destroying, the original shared state.
  /// - `this` will have whatever shared-state was previously held by `other`
  ///   (if any)
  /// - `other.valid()` will be false (`other` will not have any shared state)
  Promise& operator=(Promise<T>&& other) noexcept;

  /// Return a SemiFuture associated with this Promise, sharing the same shared
  /// state as `this`.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws PromiseInvalid)
  /// - neither getSemiFuture() nor getFuture() may have been called previously
  ///   on `this` Promise (else throws FutureAlreadyRetrieved)
  ///
  /// Postconditions:
  ///
  /// - `RESULT.valid() == true`
  /// - RESULT will share the same shared-state as `this`
  ///
  /// DEPRECATED: use `folly::makePromiseContract()` instead.
  SemiFuture<T> getSemiFuture();

  /// Return a Future associated with this Promise, sharing the same shared
  /// state as `this`.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws PromiseInvalid)
  /// - neither getSemiFuture() nor getFuture() may have been called previously
  ///   on `this` Promise (else throws FutureAlreadyRetrieved)
  ///
  /// Postconditions:
  ///
  /// - `RESULT.valid() == true`
  /// - RESULT will share the same shared-state as `this`
  ///
  /// DEPRECATED: use `folly::makePromiseContract()` instead. If you can't use
  ///   that, use `this->getSemiFuture()` then get a Future by calling `.via()`
  ///   with an appropriate executor.
  Future<T> getFuture();

  /// Fulfill the Promise with an exception_wrapper.
  ///
  /// Sample usage:
  ///
  ///   Promise<MyValue> p = ...
  ///   ...
  ///   auto const ep = std::exception_ptr();
  ///   auto const ew = exception_wrapper::from_exception_ptr(ep);
  ///   p.setException(ew);
  ///
  /// Functionally equivalent to `setTry(Try<T>(std::move(ew)))`
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws PromiseInvalid)
  /// - `isFulfilled() == false` (else throws PromiseAlreadySatisfied)
  ///
  /// Postconditions:
  ///
  /// - `isFulfilled() == true`
  /// - `valid() == true` (unchanged)
  /// - The associated future (if any) will complete with the exception.
  void setException(exception_wrapper ew);

  /// Fulfill the Promise with exception `e` *as if* by
  ///   `setException(make_exception_wrapper<E>(e))`.
  ///
  /// Please see `setException(exception_wrapper)` for semantics/contract.
  template <class E>
  typename std::enable_if<std::is_base_of<std::exception, E>::value>::type
  setException(E const& e);

  /// Sets a handler for the producer to receive a (logical) interruption
  ///   request (exception) sent from the consumer via `future.raise()`.
  ///
  /// Details: The consumer calls `future.raise()` when it wishes to send a
  ///   logical interruption message (an exception), and that exception/message
  ///   is passed to `fn()`. The thread used to call `fn()` depends on timing
  ///   (see Postconditions for threading details).
  ///
  /// Handler `fn()` can do anything you want, but if you bother to set one
  ///   then you probably will want to (more or less immediately) fulfill the
  ///   promise with an exception (or other special value) indicating how the
  ///   interrupt was handled.
  ///
  /// This call silently does nothing if `isFulfilled()`.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws PromiseInvalid)
  /// - `fn` must be copyable and must be invocable with
  ///   `exception_wrapper const&`
  /// - the code within `fn()` must be safe to run either synchronously within
  ///   the `setInterruptHandler()` call or asynchronously within the consumer
  ///   thread's call to `future.raise()`.
  /// - the code within `fn()` must also be safe to run after this promise is
  ///   fulfilled; this may have lifetime/race-case ramifications, e.g., if the
  ///   code of `fn()` might access producer-resources that will be destroyed,
  ///   then the destruction of those producer-resources must be deferred beyond
  ///   the moment when this promise is fulfilled.
  ///
  /// Postconditions:
  ///
  /// - if the consumer calls `future.raise()` early enough (up to a particular
  ///   moment within the `setInterruptHandler()` call), `fn()` will be called
  ///   synchronously (in the current thread, during this call).
  /// - if the consumer calls `future.raise()` after that moment within
  ///   `setInterruptHandler()` but before this promise is fulfilled, `fn()`
  ///   will be called asynchronously (in the consumer's thread, within the call
  ///   to `future.raise()`).
  /// - if the consumer calls `future.raise()` after this promise is fulfilled,
  ///   `fn()` may or may not be called at all, and if it is called, it will be
  ///   called asynchronously (within the consumer's call to `future.raise()`).
  ///
  /// IMPORTANT: `fn()` should return quickly since it could block this call
  ///   to `promise.setInterruptHandler()` and/or a concurrent call to
  ///   `future.raise()`. Those two functions contend on the same lock; those
  ///   calls could block if `fn()` is invoked within one of those while the
  ///   lock is held.
  template <typename F>
  void setInterruptHandler(F&& fn);

  /// Fulfills a (logically) void Promise, that is, Promise<Unit>.
  /// (If you want a void-promise, use Promise<Unit>, not Promise<void>.)
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws PromiseInvalid)
  /// - `isFulfilled() == false` (else throws PromiseAlreadySatisfied)
  ///
  /// Postconditions:
  ///
  /// - `isFulfilled() == true`
  /// - `valid() == true` (unchanged)
  template <class B = T>
  typename std::enable_if<std::is_same<Unit, B>::value, void>::type setValue() {
    setTry(Try<T>(T()));
  }

  /// Fulfill the Promise with the specified value using perfect forwarding.
  ///
  /// Functionally equivalent to `setTry(Try<T>(std::forward<M>(value)))`
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws PromiseInvalid)
  /// - `isFulfilled() == false` (else throws PromiseAlreadySatisfied)
  ///
  /// Postconditions:
  ///
  /// - `isFulfilled() == true`
  /// - `valid() == true` (unchanged)
  /// - The associated future will see the value, e.g., in its continuation.
  template <class M>
  void setValue(M&& value);

  /// Fulfill the Promise with the specified Try (value or exception).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws PromiseInvalid)
  /// - `isFulfilled() == false` (else throws PromiseAlreadySatisfied)
  ///
  /// Postconditions:
  ///
  /// - `isFulfilled() == true`
  /// - `valid() == true` (unchanged)
  /// - The associated future will see the result, e.g., in its continuation.
  void setTry(Try<T>&& t);

  /// Fulfill this Promise with the result of a function that takes no
  ///   arguments and returns something implicitly convertible to T.
  ///
  /// Example:
  ///
  ///   p.setWith([] { do something that may throw; return a T; });
  ///
  /// Functionally equivalent to `setTry(makeTryWith(static_cast<F&&>(func)));`
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws PromiseInvalid)
  /// - `isFulfilled() == false` (else throws PromiseAlreadySatisfied)
  ///
  /// Postconditions:
  ///
  /// - `func()` will be run synchronously (in this thread, during this call)
  /// - If `func()` returns, the return value will be captured as if via
  ///   `setValue()`
  /// - If `func()` throws, the exception will be captured as if via
  ///   `setException()`
  /// - `isFulfilled() == true`
  /// - `valid() == true` (unchanged)
  /// - The associated future will see the result, e.g., in its continuation.
  template <class F>
  void setWith(F&& func);

  /// true if this has a shared state;
  ///   false if this has been consumed/moved-out.
  bool valid() const noexcept {
    return core_ != nullptr;
  }

  /// True if either this promise was fulfilled or is invalid.
  ///
  /// - True if `!valid()`
  /// - True if `valid()` and this was fulfilled (a prior call to `setValue()`,
  ///   `setTry()`, `setException()`, or `setWith()`)
  bool isFulfilled() const noexcept;

 private:
  template <class>
  friend class futures::detail::FutureBase;
  template <class>
  friend class SemiFuture;
  template <class>
  friend class Future;
  template <class, class>
  friend class futures::detail::CoreCallbackState;

  // Whether the Future has been retrieved (a one-time operation).
  bool retrieved_;

  using Core = futures::detail::Core<T>;

  // Throws PromiseInvalid if there is no shared state object; else returns it
  // by ref.
  //
  // Implementation methods should usually use this instead of `this->core_`.
  // The latter should be used only when you need the possibly-null pointer.
  Core& getCore() {
    return getCoreImpl(core_);
  }
  Core const& getCore() const {
    return getCoreImpl(core_);
  }

  template <typename CoreT>
  static CoreT& getCoreImpl(CoreT* core) {
    if (!core) {
      throw_exception<PromiseInvalid>();
    }
    return *core;
  }

  // shared core state object
  // usually you should use `getCore()` instead of directly accessing `core_`.
  Core* core_;

  explicit Promise(futures::detail::EmptyConstruct) noexcept;

  void throwIfFulfilled() const;
  void detach();
};

} // namespace folly

#include <folly/futures/Future.h>
#include <folly/futures/Promise-inl.h>
