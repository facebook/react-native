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

#include <algorithm>
#include <exception>
#include <functional>
#include <memory>
#include <type_traits>
#include <vector>

#include <folly/Optional.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/Try.h>
#include <folly/Unit.h>
#include <folly/Utility.h>
#include <folly/executors/DrivableExecutor.h>
#include <folly/executors/TimedDrivableExecutor.h>
#include <folly/functional/Invoke.h>
#include <folly/futures/Promise.h>
#include <folly/futures/detail/Types.h>
#include <folly/lang/Exception.h>

#if FOLLY_HAS_COROUTINES
#include <experimental/coroutine>
#endif

// boring predeclarations and details
#include <folly/futures/Future-pre.h>

// not-boring helpers, e.g. all in folly::futures, makeFuture variants, etc.
// Needs to be included after Future-pre.h and before Future-inl.h
#include <folly/futures/helpers.h>

namespace folly {

class FOLLY_EXPORT FutureException : public std::logic_error {
 public:
  using std::logic_error::logic_error;
};

class FOLLY_EXPORT FutureInvalid : public FutureException {
 public:
  FutureInvalid() : FutureException("Future invalid") {}
};

/// At most one continuation may be attached to any given Future.
///
/// If a continuation is attached to a future to which another continuation has
/// already been attached, then an instance of FutureAlreadyContinued will be
/// thrown instead.
class FOLLY_EXPORT FutureAlreadyContinued : public FutureException {
 public:
  FutureAlreadyContinued() : FutureException("Future already continued") {}
};

class FOLLY_EXPORT FutureNotReady : public FutureException {
 public:
  FutureNotReady() : FutureException("Future not ready") {}
};

class FOLLY_EXPORT FutureCancellation : public FutureException {
 public:
  FutureCancellation() : FutureException("Future was cancelled") {}
};

class FOLLY_EXPORT FutureTimeout : public FutureException {
 public:
  FutureTimeout() : FutureException("Timed out") {}
};

class FOLLY_EXPORT FuturePredicateDoesNotObtain : public FutureException {
 public:
  FuturePredicateDoesNotObtain()
      : FutureException("Predicate does not obtain") {}
};

class FOLLY_EXPORT FutureNoTimekeeper : public FutureException {
 public:
  FutureNoTimekeeper() : FutureException("No timekeeper available") {}
};

class FOLLY_EXPORT FutureNoExecutor : public FutureException {
 public:
  FutureNoExecutor() : FutureException("No executor provided to via") {}
};

template <class T>
class Future;

template <class T>
class SemiFuture;

template <class T>
class FutureSplitter;

namespace futures {
namespace detail {
template <class T>
class FutureBase {
 public:
  typedef T value_type;

  /// Construct from a value (perfect forwarding)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  template <
      class T2 = T,
      typename = typename std::enable_if<
          !isFuture<typename std::decay<T2>::type>::value &&
          !isSemiFuture<typename std::decay<T2>::type>::value>::type>
  /* implicit */ FutureBase(T2&& val);

  /// Construct a (logical) FutureBase-of-void.
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  template <class T2 = T>
  /* implicit */ FutureBase(
      typename std::enable_if<std::is_same<Unit, T2>::value>::type*);

  template <
      class... Args,
      typename std::enable_if<std::is_constructible<T, Args&&...>::value, int>::
          type = 0>
  explicit FutureBase(in_place_t, Args&&... args);

  FutureBase(FutureBase<T> const&) = delete;
  FutureBase(SemiFuture<T>&&) noexcept;
  FutureBase(Future<T>&&) noexcept;

  // not copyable
  FutureBase(Future<T> const&) = delete;
  FutureBase(SemiFuture<T> const&) = delete;

  ~FutureBase();

  /// true if this has a shared state;
  /// false if this has been either moved-out or created without a shared state.
  bool valid() const noexcept {
    return core_ != nullptr;
  }

  /// Returns a reference to the result value if it is ready, with a reference
  /// category and const-qualification like those of the future.
  ///
  /// Does not `wait()`; see `get()` for that.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - `isReady() == true` (else throws FutureNotReady)
  ///
  /// Postconditions:
  ///
  /// - If an exception has been captured (i.e., if `hasException() == true`),
  ///   throws that exception.
  /// - This call does not mutate the future's value.
  /// - However calling code may mutate that value (including moving it out by
  ///   move-constructing or move-assigning another value from it), for
  ///   example, via the `&` or the `&&` overloads or via casts.
  T& value() &;
  T const& value() const&;
  T&& value() &&;
  T const&& value() const&&;

  /// Returns a reference to the result's Try if it is ready, with a reference
  /// category and const-qualification like those of the future.
  ///
  /// Does not `wait()`; see `get()` for that.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - `isReady() == true` (else throws FutureNotReady)
  ///
  /// Postconditions:
  ///
  /// - This call does not mutate the future's result.
  /// - However calling code may mutate that result (including moving it out by
  ///   move-constructing or move-assigning another result from it), for
  ///   example, via the `&` or the `&&` overloads or via casts.
  Try<T>& result() &;
  Try<T> const& result() const&;
  Try<T>&& result() &&;
  Try<T> const&& result() const&&;

  /// True when the result (or exception) is ready; see value(), result(), etc.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  bool isReady() const;

  /// True if the result is a value (not an exception) on a future for which
  ///   isReady returns true.
  ///
  /// Equivalent to result().hasValue()
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - `isReady() == true` (else throws FutureNotReady)
  bool hasValue() const;

  /// True if the result is an exception (not a value) on a future for which
  ///   isReady returns true.
  ///
  /// Equivalent to result().hasException()
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - `isReady() == true` (else throws FutureNotReady)
  bool hasException() const;

  /// Returns either an Optional holding the result or an empty Optional
  ///   depending on whether or not (respectively) the promise has been
  ///   fulfilled (i.e., `isReady() == true`).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (note however that this moves-out the result when
  ///   it returns a populated `Try<T>`, which effects any subsequent use of
  ///   that result, e.g., `poll()`, `result()`, `value()`, `get()`, etc.)
  Optional<Try<T>> poll();

  /// This is not the method you're looking for.
  ///
  /// This needs to be public because it's used by make* and when*, and it's
  /// not worth listing all those and their fancy template signatures as
  /// friends. But it's not for public consumption.
  template <class F>
  void setCallback_(F&& func);

  template <class F>
  void setCallback_(F&& func, std::shared_ptr<folly::RequestContext> context);

  /// Provides a threadsafe back-channel so the consumer's thread can send an
  ///   interrupt-object to the producer's thread.
  ///
  /// If the promise-holder registers an interrupt-handler and consumer thread
  ///   raises an interrupt early enough (details below), the promise-holder
  ///   will typically halt its work, fulfilling the future with an exception
  ///   or some special non-exception value.
  ///
  /// However this interrupt request is voluntary, asynchronous, & advisory:
  ///
  /// - Voluntary: the producer will see the interrupt only if the producer uses
  ///   a `Promise` object and registers an interrupt-handler;
  ///   see `Promise::setInterruptHandler()`.
  /// - Asynchronous: the producer will see the interrupt only if `raise()` is
  ///   called before (or possibly shortly after) the producer is done producing
  ///   its result, which is asynchronous with respect to the call to `raise()`.
  /// - Advisory: the producer's interrupt-handler can do whatever it wants,
  ///   including ignore the interrupt or perform some action other than halting
  ///   its producer-work.
  ///
  /// Guidelines:
  ///
  /// - It is ideal if the promise-holder can both halt its work and fulfill the
  ///   promise early, typically with the same exception that was delivered to
  ///   the promise-holder in the form of an interrupt.
  /// - If the promise-holder does not do this, and if it holds the promise
  ///   alive for a long time, then the whole continuation chain will not be
  ///   invoked and the whole future chain will be kept alive for that long time
  ///   as well.
  /// - It is also ideal if the promise-holder can invalidate the promise.
  /// - The promise-holder must also track whether it has set a result in the
  ///   interrupt handler so that it does not attempt to do so outside the
  ///   interrupt handler, and must track whether it has set a result in its
  ///   normal flow so that it does not attempt to do so in the interrupt
  ///   handler, since setting a result twice is an error. Because the interrupt
  ///   handler can be invoked in some other thread, this tracking may have to
  ///   be done with some form of concurrency control.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - has no visible effect if `raise()` was previously called on `this` or
  ///   any other Future/SemiFuture that uses the same shared state as `this`.
  /// - has no visible effect if the producer never (either in the past or in
  ///   the future) registers an interrupt-handler.
  /// - has no visible effect if the producer fulfills its promise (sets the
  ///   result) before (or possibly also shortly after) receiving the interrupt.
  /// - otherwise the promise-holder's interrupt-handler is called, passing the
  ///   exception (within an `exception_wrapper`).
  ///
  /// The specific thread used to invoke the producer's interrupt-handler (if
  ///   it is called at all) depends on timing:
  ///
  /// - if the interrupt-handler is registered prior to `raise()` (or possibly
  ///   concurrently within the call to `raise()`), the interrupt-handler will
  ///   be executed using this current thread within the call to `raise()`.
  /// - if the interrupt-handler is registered after `raise()` (and possibly
  ///   concurrently within the call to `raise()`), the interrupt-handler will
  ///   be executed using the producer's thread within the call to
  ///   `Promise::setInterruptHandler()`.
  ///
  /// Synchronizes between `raise()` (in the consumer's thread)
  ///   and `Promise::setInterruptHandler()` (in the producer's thread).
  void raise(exception_wrapper interrupt);

  /// Raises the specified exception-interrupt.
  /// See `raise(exception_wrapper)` for details.
  template <class E>
  void raise(E&& exception) {
    raise(make_exception_wrapper<typename std::remove_reference<E>::type>(
        std::forward<E>(exception)));
  }

  /// Raises a FutureCancellation interrupt.
  /// See `raise(exception_wrapper)` for details.
  void cancel() {
    raise(FutureCancellation());
  }

  // Returns this future's executor priority.
  int8_t getPriority() const {
    return getCore().getPriority();
  }

 protected:
  friend class Promise<T>;
  template <class>
  friend class SemiFuture;
  template <class>
  friend class Future;

  using Core = futures::detail::Core<T>;

  // Throws FutureInvalid if there is no shared state object; else returns it
  // by ref.
  //
  // Implementation methods should usually use this instead of `this->core_`.
  // The latter should be used only when you need the possibly-null pointer.
  Core& getCore() {
    return getCoreImpl(*this);
  }
  Core const& getCore() const {
    return getCoreImpl(*this);
  }

  template <typename Self>
  static decltype(auto) getCoreImpl(Self& self) {
    if (!self.core_) {
      throw_exception<FutureInvalid>();
    }
    return *self.core_;
  }

  Try<T>& getCoreTryChecked() {
    return getCoreTryChecked(*this);
  }
  Try<T> const& getCoreTryChecked() const {
    return getCoreTryChecked(*this);
  }

  template <typename Self>
  static decltype(auto) getCoreTryChecked(Self& self) {
    auto& core = self.getCore();
    if (!core.hasResult()) {
      throw_exception<FutureNotReady>();
    }
    return core.getTry();
  }

  // shared core state object
  // usually you should use `getCore()` instead of directly accessing `core_`.
  Core* core_;

  explicit FutureBase(Core* obj) : core_(obj) {}

  explicit FutureBase(futures::detail::EmptyConstruct) noexcept;

  void detach();

  void throwIfInvalid() const;
  void throwIfContinued() const;

  void assign(FutureBase<T>&& other) noexcept;

  Executor* getExecutor() const {
    return getCore().getExecutor();
  }

  // Sets the Executor within the Core state object of `this`.
  // Must be called either before attaching a callback or after the callback
  // has already been invoked, but not concurrently with anything which might
  // trigger invocation of the callback.
  void setExecutor(Executor* x, int8_t priority = Executor::MID_PRI) {
    getCore().setExecutor(x, priority);
  }

  void setExecutor(
      Executor::KeepAlive<> x,
      int8_t priority = Executor::MID_PRI) {
    getCore().setExecutor(std::move(x), priority);
  }

  // Variant: returns a value
  // e.g. f.thenTry([](Try<T> t){ return t.value(); });
  template <typename F, typename R>
  typename std::enable_if<!R::ReturnsFuture::value, typename R::Return>::type
  thenImplementation(F&& func, R);

  // Variant: returns a Future
  // e.g. f.thenTry([](Try<T> t){ return makeFuture<T>(t); });
  template <typename F, typename R>
  typename std::enable_if<R::ReturnsFuture::value, typename R::Return>::type
  thenImplementation(F&& func, R);

  template <typename E>
  SemiFuture<T> withinImplementation(Duration dur, E e, Timekeeper* tk) &&;
};
template <class T>
void convertFuture(SemiFuture<T>&& sf, Future<T>& f);

class DeferredExecutor;

template <typename T>
DeferredExecutor* getDeferredExecutor(SemiFuture<T>& future);

template <typename T>
folly::Executor::KeepAlive<DeferredExecutor> stealDeferredExecutor(
    SemiFuture<T>& future);
} // namespace detail
} // namespace futures

/// The interface (along with Future) for the consumer-side of a
///   producer/consumer pair.
///
/// Future vs. SemiFuture:
///
/// - The consumer-side should generally start with a SemiFuture, not a Future.
/// - Example, when a library creates and returns a future, it should usually
///   return a `SemiFuture`, not a Future.
/// - Reason: so the thread policy for continuations (`.thenValue`, etc.) can be
///   specified by the library's caller (using `.via()`).
/// - A SemiFuture is converted to a Future using `.via()`.
/// - Use `makePromiseContract()` when creating both a Promise and an associated
///   SemiFuture/Future.
///
/// When practical, prefer SemiFuture/Future's nonblocking style/pattern:
///
/// - the nonblocking style uses continuations, e.g., `.thenValue`, etc.; the
///   continuations are deferred until the result is available.
/// - the blocking style blocks until complete, e.g., `.wait()`, `.get()`, etc.
/// - the two styles cannot be mixed within the same future; use one or the
///   other.
///
/// SemiFuture/Future also provide a back-channel so an interrupt can
///   be sent from consumer to producer; see SemiFuture/Future's `raise()`
///   and Promise's `setInterruptHandler()`.
///
/// The consumer-side SemiFuture/Future objects should generally be accessed
///   via a single thread. That thread is referred to as the 'consumer thread.'
template <class T>
class SemiFuture : private futures::detail::FutureBase<T> {
 private:
  using Base = futures::detail::FutureBase<T>;
  using DeferredExecutor = futures::detail::DeferredExecutor;
  using TimePoint = std::chrono::system_clock::time_point;

 public:
  ~SemiFuture();

  /// Creates/returns an invalid SemiFuture, that is, one with no shared state.
  ///
  /// Postcondition:
  ///
  /// - `RESULT.valid() == false`
  static SemiFuture<T> makeEmpty();

  /// Type of the value that the producer, when successful, produces.
  using typename Base::value_type;

  /// Construct a SemiFuture from a value (perfect forwarding)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  /// - `hasException() == false`
  /// - `value()`, `get()`, `result()` will return the forwarded `T`
  template <
      class T2 = T,
      typename = typename std::enable_if<
          !isFuture<typename std::decay<T2>::type>::value &&
          !isSemiFuture<typename std::decay<T2>::type>::value>::type>
  /* implicit */ SemiFuture(T2&& val) : Base(std::forward<T2>(val)) {}

  /// Construct a (logical) SemiFuture-of-void.
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  template <class T2 = T>
  /* implicit */ SemiFuture(
      typename std::enable_if<std::is_same<Unit, T2>::value>::type* p = nullptr)
      : Base(p) {}

  /// Construct a SemiFuture from a `T` constructed from `args`
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  /// - `hasException() == false`
  /// - `value()`, `get()`, `result()` will return the newly constructed `T`
  template <
      class... Args,
      typename std::enable_if<std::is_constructible<T, Args&&...>::value, int>::
          type = 0>
  explicit SemiFuture(in_place_t, Args&&... args)
      : Base(in_place, std::forward<Args>(args)...) {}

  SemiFuture(SemiFuture<T> const&) = delete;
  // movable
  SemiFuture(SemiFuture<T>&&) noexcept;
  // safe move-constructabilty from Future
  /* implicit */ SemiFuture(Future<T>&&) noexcept;

  using Base::cancel;
  using Base::getPriority;
  using Base::hasException;
  using Base::hasValue;
  using Base::isReady;
  using Base::poll;
  using Base::raise;
  using Base::result;
  using Base::setCallback_;
  using Base::valid;
  using Base::value;

  SemiFuture& operator=(SemiFuture const&) = delete;
  SemiFuture& operator=(SemiFuture&&) noexcept;
  SemiFuture& operator=(Future<T>&&) noexcept;

  /// Blocks until the promise is fulfilled, either by value (which is returned)
  ///   or exception (which is thrown).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - must not have a continuation, e.g., via `.thenValue()` or similar
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  T get() &&;

  [[deprecated("must be rvalue-qualified, e.g., std::move(future).get()")]] T
  get() & = delete;

  /// Blocks until the semifuture is fulfilled, or until `dur` elapses. Returns
  /// the value (moved-out), or throws the exception (which might be a
  /// FutureTimeout exception).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  T get(Duration dur) &&;

  [[deprecated("must be rvalue-qualified, e.g., std::move(future).get(dur)")]] T
  get(Duration dur) & = delete;

  /// Blocks until the future is fulfilled. Returns the Try of the result
  ///   (moved-out).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  Try<T> getTry() &&;

  /// Blocks until the future is fulfilled, or until `dur` elapses.
  /// Returns the Try of the result (moved-out), or throws FutureTimeout
  /// exception.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  Try<T> getTry(Duration dur) &&;

  /// Blocks the caller's thread until this Future `isReady()`, i.e., until the
  ///   asynchronous producer has stored a result or exception.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `&RESULT == this`
  SemiFuture<T>& wait() &;

  /// Blocks the caller's thread until this Future `isReady()`, i.e., until the
  ///   asynchronous producer has stored a result or exception.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (but the calling code can trivially move-out `*this`
  ///   by assigning or constructing the result into a distinct object).
  /// - `&RESULT == this`
  /// - `isReady() == true`
  SemiFuture<T>&& wait() &&;

  /// Blocks until the future is fulfilled, or `dur` elapses.
  /// Returns true if the future was fulfilled.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  bool wait(Duration dur) &&;

  /// Returns a Future which will call back on the other side of executor.
  Future<T> via(Executor* executor, int8_t priority = Executor::MID_PRI) &&;

  Future<T> via(
      Executor::KeepAlive<> executor,
      int8_t priority = Executor::MID_PRI) &&;

  /// Defer work to run on the consumer of the future.
  /// Function must take a Try as a parameter.
  /// This work will be run either on an executor that the caller sets on the
  /// SemiFuture, or inline with the call to .get().
  ///
  /// NB: This is a custom method because boost-blocking executors is a
  /// special-case for work deferral in folly. With more general boost-blocking
  /// support all executors would boost block and we would simply use some form
  /// of driveable executor here.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <typename F>
  SemiFuture<typename futures::detail::tryCallableResult<T, F>::value_type>
  defer(F&& func) &&;

  template <typename R, typename... Args>
  auto defer(R (&func)(Args...)) && {
    return std::move(*this).defer(&func);
  }

  /// Defer for functions taking a T rather than a Try<T>.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <typename F>
  SemiFuture<typename futures::detail::valueCallableResult<T, F>::value_type>
  deferValue(F&& func) &&;

  template <typename R, typename... Args>
  auto deferValue(R (&func)(Args...)) && {
    return std::move(*this).deferValue(&func);
  }

  /// Set an error continuation for this SemiFuture where the continuation can
  /// be called with a known exception type and returns a `T`, `Future<T>`, or
  /// `SemiFuture<T>`.
  ///
  /// Example:
  ///
  /// ```
  /// makeSemiFuture()
  ///   .defer([] {
  ///     throw std::runtime_error("oh no!");
  ///     return 42;
  ///   })
  ///   .deferError<std::runtime_error>([] (auto const& e) {
  ///     LOG(INFO) << "std::runtime_error: " << e.what();
  ///     return -1; // or makeFuture<int>(-1) or makeSemiFuture<int>(-1)
  ///   });
  /// ```
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <class ExceptionType, class F>
  SemiFuture<T> deferError(F&& func) &&;

  template <class ExceptionType, class R, class... Args>
  SemiFuture<T> deferError(R (&func)(Args...)) && {
    return std::move(*this).template deferError<ExceptionType>(&func);
  }

  /// Set an error continuation for this SemiFuture where the continuation can
  /// be called with `exception_wrapper&&` and returns a `T`, `Future<T>`, or
  /// `SemiFuture<T>`.
  ///
  /// Example:
  ///
  ///   makeSemiFuture()
  ///     .defer([] {
  ///       throw std::runtime_error("oh no!");
  ///       return 42;
  ///     })
  ///     .deferError([] (exception_wrapper&& e) {
  ///       LOG(INFO) << e.what();
  ///       return -1; // or makeFuture<int>(-1) or makeSemiFuture<int>(-1)
  ///     });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <class F>
  SemiFuture<T> deferError(F&& func) &&;

  template <class R, class... Args>
  SemiFuture<T> deferError(R (&func)(Args...)) && {
    return std::move(*this).deferError(&func);
  }

  SemiFuture<T> within(Duration dur, Timekeeper* tk = nullptr) && {
    return std::move(*this).within(dur, FutureTimeout(), tk);
  }

  template <class E>
  SemiFuture<T> within(Duration dur, E e, Timekeeper* tk = nullptr) && {
    return this->isReady() ? std::move(*this)
                           : std::move(*this).withinImplementation(dur, e, tk);
  }

  /// Delay the completion of this SemiFuture for at least this duration from
  /// now. The optional Timekeeper is as with futures::sleep().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  SemiFuture<T> delayed(Duration dur, Timekeeper* tk = nullptr) &&;

  /// Returns a future that completes inline, as if the future had no executor.
  /// Intended for porting legacy code without behavioral change, and for rare
  /// cases where this is really the intended behavior.
  /// Future is unsafe in the sense that the executor it completes on is
  /// non-deterministic in the standard case.
  /// For new code, or to update code that temporarily uses this, please
  /// use via and pass a meaningful executor.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  Future<T> toUnsafeFuture() &&;

#if FOLLY_HAS_COROUTINES
  class promise_type {
   public:
    SemiFuture get_return_object() {
      return promise_.getSemiFuture();
    }

    std::experimental::suspend_never initial_suspend() {
      return {};
    }

    std::experimental::suspend_never final_suspend() {
      return {};
    }

    void return_value(const T& value) {
      promise_.setValue(value);
    }

    void return_value(T& value) {
      promise_.setValue(std::move(value));
    }

    void unhandled_exception() {
      try {
        std::rethrow_exception(std::current_exception());
      } catch (std::exception& e) {
        promise_.setException(exception_wrapper(std::current_exception(), e));
      } catch (...) {
        promise_.setException(exception_wrapper(std::current_exception()));
      }
    }

   private:
    folly::Promise<T> promise_;
  };

  template <typename Awaitable>
  static SemiFuture fromAwaitable(Awaitable&& awaitable) {
    return [](Awaitable awaitable) -> SemiFuture {
      co_return co_await std::forward<Awaitable>(awaitable);
    }(std::forward<Awaitable>(awaitable));
  }

  // Customise the co_viaIfAsync() operator so that SemiFuture<T> can be
  // directly awaited within a folly::coro::Task coroutine.
  friend Future<T> co_viaIfAsync(
      folly::Executor* executor,
      SemiFuture<T>&& future) noexcept {
    return std::move(future).via(executor);
  }

#endif

 private:
  friend class Promise<T>;
  template <class>
  friend class futures::detail::FutureBase;
  template <class>
  friend class SemiFuture;
  template <class>
  friend class Future;
  friend folly::Executor::KeepAlive<DeferredExecutor>
  futures::detail::stealDeferredExecutor<T>(SemiFuture&);
  friend DeferredExecutor* futures::detail::getDeferredExecutor<T>(SemiFuture&);

  using Base::setExecutor;
  using Base::throwIfInvalid;
  using typename Base::Core;

  template <class T2>
  friend SemiFuture<T2> makeSemiFuture(Try<T2>);

  explicit SemiFuture(Core* obj) : Base(obj) {}

  explicit SemiFuture(futures::detail::EmptyConstruct) noexcept
      : Base(futures::detail::EmptyConstruct{}) {}

  // Throws FutureInvalid if !this->core_
  DeferredExecutor* getDeferredExecutor() const;

  // Throws FutureInvalid if !this->core_
  folly::Executor::KeepAlive<DeferredExecutor> stealDeferredExecutor() const;

  /// Blocks until the future is fulfilled, or `dur` elapses.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `&RESULT == this`
  /// - `isReady()` will be indeterminate - may or may not be true
  SemiFuture<T>& wait(Duration dur) &;

  static void releaseDeferredExecutor(Core* core);
};

template <class T>
std::pair<Promise<T>, SemiFuture<T>> makePromiseContract() {
  auto p = Promise<T>();
  auto f = p.getSemiFuture();
  return std::make_pair(std::move(p), std::move(f));
}

/// The interface (along with SemiFuture) for the consumer-side of a
///   producer/consumer pair.
///
/// Future vs. SemiFuture:
///
/// - The consumer-side should generally start with a SemiFuture, not a Future.
/// - Example, when a library creates and returns a future, it should usually
///   return a `SemiFuture`, not a Future.
/// - Reason: so the thread policy for continuations (`.thenValue`, etc.) can be
///   specified by the library's caller (using `.via()`).
/// - A SemiFuture is converted to a Future using `.via()`.
/// - Use `makePromiseContract()` when creating both a Promise and an associated
///   SemiFuture/Future.
///
/// When practical, prefer SemiFuture/Future's nonblocking style/pattern:
///
/// - the nonblocking style uses continuations, e.g., `.thenValue`, etc.; the
///   continuations are deferred until the result is available.
/// - the blocking style blocks until complete, e.g., `.wait()`, `.get()`, etc.
/// - the two styles cannot be mixed within the same future; use one or the
///   other.
///
/// SemiFuture/Future also provide a back-channel so an interrupt can
///   be sent from consumer to producer; see SemiFuture/Future's `raise()`
///   and Promise's `setInterruptHandler()`.
///
/// The consumer-side SemiFuture/Future objects should generally be accessed
///   via a single thread. That thread is referred to as the 'consumer thread.'
template <class T>
class Future : private futures::detail::FutureBase<T> {
 private:
  using Base = futures::detail::FutureBase<T>;

 public:
  /// Type of the value that the producer, when successful, produces.
  using typename Base::value_type;

  /// Construct a Future from a value (perfect forwarding)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  /// - `value()`, `get()`, `result()` will return the forwarded `T`
  template <
      class T2 = T,
      typename = typename std::enable_if<
          !isFuture<typename std::decay<T2>::type>::value &&
          !isSemiFuture<typename std::decay<T2>::type>::value>::type>
  /* implicit */ Future(T2&& val) : Base(std::forward<T2>(val)) {}

  /// Construct a (logical) Future-of-void.
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  template <class T2 = T>
  /* implicit */ Future(
      typename std::enable_if<std::is_same<Unit, T2>::value>::type* p = nullptr)
      : Base(p) {}

  /// Construct a Future from a `T` constructed from `args`
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  /// - `hasException() == false`
  /// - `value()`, `get()`, `result()` will return the newly constructed `T`
  template <
      class... Args,
      typename std::enable_if<std::is_constructible<T, Args&&...>::value, int>::
          type = 0>
  explicit Future(in_place_t, Args&&... args)
      : Base(in_place, std::forward<Args>(args)...) {}

  Future(Future<T> const&) = delete;
  // movable
  Future(Future<T>&&) noexcept;

  // converting move
  template <
      class T2,
      typename std::enable_if<
          !std::is_same<T, typename std::decay<T2>::type>::value &&
              std::is_constructible<T, T2&&>::value &&
              std::is_convertible<T2&&, T>::value,
          int>::type = 0>
  /* implicit */ Future(Future<T2>&&);
  template <
      class T2,
      typename std::enable_if<
          !std::is_same<T, typename std::decay<T2>::type>::value &&
              std::is_constructible<T, T2&&>::value &&
              !std::is_convertible<T2&&, T>::value,
          int>::type = 0>
  explicit Future(Future<T2>&&);
  template <
      class T2,
      typename std::enable_if<
          !std::is_same<T, typename std::decay<T2>::type>::value &&
              std::is_constructible<T, T2&&>::value,
          int>::type = 0>
  Future& operator=(Future<T2>&&);

  using Base::cancel;
  using Base::getPriority;
  using Base::hasException;
  using Base::hasValue;
  using Base::isReady;
  using Base::poll;
  using Base::raise;
  using Base::result;
  using Base::setCallback_;
  using Base::valid;
  using Base::value;

  /// Creates/returns an invalid Future, that is, one with no shared state.
  ///
  /// Postcondition:
  ///
  /// - `RESULT.valid() == false`
  static Future<T> makeEmpty();

  // not copyable
  Future& operator=(Future const&) = delete;

  // movable
  Future& operator=(Future&&) noexcept;

  /// Call e->drive() repeatedly until the future is fulfilled.
  ///
  /// Examples of DrivableExecutor include EventBase and ManualExecutor.
  ///
  /// Returns the fulfilled value (moved-out) or throws the fulfilled exception.
  T getVia(DrivableExecutor* e);

  /// Call e->drive() repeatedly until the future is fulfilled, or `dur`
  /// elapses.
  ///
  /// Returns the fulfilled value (moved-out), throws the fulfilled exception,
  /// or on timeout throws FutureTimeout.
  T getVia(TimedDrivableExecutor* e, Duration dur);

  /// Call e->drive() repeatedly until the future is fulfilled. Examples
  /// of DrivableExecutor include EventBase and ManualExecutor. Returns a
  /// reference to the Try of the value.
  Try<T>& getTryVia(DrivableExecutor* e);

  /// getTryVia but will wait only until `dur` elapses. Returns the
  /// Try of the value (moved-out) or may throw a FutureTimeout exception.
  Try<T>& getTryVia(TimedDrivableExecutor* e, Duration dur);

  /// Unwraps the case of a Future<Future<T>> instance, and returns a simple
  /// Future<T> instance.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F = T>
  typename std::
      enable_if<isFuture<F>::value, Future<typename isFuture<T>::Inner>>::type
      unwrap() &&;

  /// Returns a Future which will call back on the other side of executor.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  Future<T> via(Executor* executor, int8_t priority = Executor::MID_PRI) &&;

  Future<T> via(
      Executor::KeepAlive<> executor,
      int8_t priority = Executor::MID_PRI) &&;

  /// Returns a Future which will call back on the other side of executor.
  ///
  /// When practical, use the rvalue-qualified overload instead - it's faster.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `RESULT.valid() == true`
  /// - when `this` gets fulfilled, it automatically fulfills RESULT
  Future<T> via(Executor* executor, int8_t priority = Executor::MID_PRI) &;

  Future<T> via(
      Executor::KeepAlive<> executor,
      int8_t priority = Executor::MID_PRI) &;

  /// When this Future has completed, execute func which is a function that
  /// can be called with either `T&&` or `Try<T>&&`.
  ///
  /// Func shall return either another Future or a value.
  ///
  /// A Future for the return type of func is returned.
  ///
  ///   Future<string> f2 = f1.thenTry([](Try<T>&&) { return string("foo"); });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  /// NOTE: All three of these variations are deprecated and deprecation
  /// attributes will be added in the near future. Please prefer thenValue,
  /// thenTry or thenError rather than then and onError as they avoid ambiguity
  /// when using polymorphic lambdas.
  template <typename F, typename R = futures::detail::callableResult<T, F>>
  [[deprecated("use thenValue instead")]] typename std::enable_if<
      !is_invocable<F>::value && is_invocable<F, T&&>::value,
      typename R::Return>::type
  then(F&& func) && {
    return std::move(*this).thenValue(std::forward<F>(func));
  }

  template <typename F, typename R = futures::detail::callableResult<T, F>>
  [[deprecated("use thenTry instead")]] typename std::enable_if<
      !is_invocable<F, T&&>::value && !is_invocable<F>::value,
      typename R::Return>::type
  then(F&& func) && {
    return std::move(*this).thenTry(std::forward<F>(func));
  }

  template <typename F, typename R = futures::detail::callableResult<T, F>>
  [[deprecated("use thenValue(auto&&) or thenValue(folly::Unit) instead")]]
  typename std::enable_if<is_invocable<F>::value, typename R::Return>::type
  then(F&& func) && {
    return this->thenImplementation(std::forward<F>(func), R{});
  }

  // clang-format off
  template <typename F, typename R = futures::detail::callableResult<T, F>>
  [[deprecated(
    "must be rvalue-qualified, e.g., std::move(future).thenValue(...)")]]
  typename R::Return then(F&& func) & = delete;
  // clang-format on

  /// Variant where func is an member function
  ///
  ///   struct Worker { R doWork(Try<T>); }
  ///
  ///   Worker *w;
  ///   Future<R> f2 = f1.thenTry(&Worker::doWork, w);
  ///
  /// This is just sugar for
  ///
  ///   f1.thenTry(std::bind(&Worker::doWork, w));
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <typename R, typename Caller, typename... Args>
  Future<typename isFuture<R>::Inner> then(
      R (Caller::*func)(Args...),
      Caller* instance) &&;

  // clang-format off
  template <typename R, typename Caller, typename... Args>
  [[deprecated(
      "must be rvalue-qualified, e.g., std::move(future).then(...)")]]
  Future<typename isFuture<R>::Inner>
  then(R (Caller::*func)(Args...), Caller* instance) & = delete;
  // clang-format on

  /// Execute the callback via the given Executor. The executor doesn't stick.
  ///
  /// Contrast
  ///
  ///   f.via(x).then(b).then(c)
  ///
  /// with
  ///
  ///   f.then(x, b).then(c)
  ///
  /// In the former both b and c execute via x. In the latter, only b executes
  /// via x, and c executes via the same executor (if any) that f had.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class Arg>
  auto then(Executor* x, Arg&& arg) && {
    auto oldX = this->getExecutor();
    this->setExecutor(x);

    // TODO(T29171940): thenImplementation here is ambiguous
    // as then used to be but that is better than keeping then in the public
    // API.
    using R = futures::detail::callableResult<T, Arg&&>;
    return std::move(*this)
        .thenImplementation(std::forward<Arg>(arg), R{})
        .via(oldX);
  }

  template <class R, class Caller, class... Args>
  auto then(Executor* x, R (Caller::*func)(Args...), Caller* instance) && {
    auto oldX = this->getExecutor();
    this->setExecutor(x);

    return std::move(*this).then(func, instance).via(oldX);
  }

  template <class Arg, class... Args>
  [[deprecated(
      "must be rvalue-qualified, e.g., std::move(future).then(...)")]] auto
  then(Executor* x, Arg&& arg, Args&&... args) & = delete;

  /// When this Future has completed, execute func which is a function that
  /// can be called with `Try<T>&&` (often a lambda with parameter type
  /// `auto&&` or `auto`).
  ///
  /// Func shall return either another Future or a value.
  ///
  /// A Future for the return type of func is returned.
  ///
  ///   Future<string> f2 = std::move(f1).thenTry([](auto&& t) {
  ///     ...
  ///     return string("foo");
  ///   });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <typename F>
  Future<typename futures::detail::tryCallableResult<T, F>::value_type> thenTry(
      F&& func) &&;

  template <typename R, typename... Args>
  auto thenTry(R (&func)(Args...)) && {
    return std::move(*this).thenTry(&func);
  }

  /// When this Future has completed, execute func which is a function that
  /// can be called with `T&&` (often a lambda with parameter type
  /// `auto&&` or `auto`).
  ///
  /// Func shall return either another Future or a value.
  ///
  /// A Future for the return type of func is returned.
  ///
  ///   Future<string> f2 = f1.thenValue([](auto&& v) {
  ///     ...
  ///     return string("foo");
  ///   });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <typename F>
  Future<typename futures::detail::valueCallableResult<T, F>::value_type>
  thenValue(F&& func) &&;

  template <typename R, typename... Args>
  auto thenValue(R (&func)(Args...)) && {
    return std::move(*this).thenValue(&func);
  }

  /// Set an error continuation for this Future where the continuation can
  /// be called with a known exception type and returns a `T`, `Future<T>`, or
  /// `SemiFuture<T>`.
  ///
  /// Example:
  ///
  ///   makeFuture()
  ///     .thenTry([] {
  ///       throw std::runtime_error("oh no!");
  ///       return 42;
  ///     })
  ///     .thenError<std::runtime_error>([] (auto const& e) {
  ///       LOG(INFO) << "std::runtime_error: " << e.what();
  ///       return -1; // or makeFuture<int>(-1) or makeSemiFuture<int>(-1)
  ///     });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <class ExceptionType, class F>
  Future<T> thenError(F&& func) &&;

  template <class ExceptionType, class R, class... Args>
  Future<T> thenError(R (&func)(Args...)) && {
    return std::move(*this).template thenError<ExceptionType>(&func);
  }

  /// Set an error continuation for this Future where the continuation can
  /// be called with `exception_wrapper&&` and returns a `T`, `Future<T>`, or
  /// `SemiFuture<T>`.
  ///
  /// Example:
  ///
  ///   makeFuture()
  ///     .thenTry([] {
  ///       throw std::runtime_error("oh no!");
  ///       return 42;
  ///     })
  ///     .thenError([] (exception_wrapper&& e) {
  ///       LOG(INFO) << e.what();
  ///       return -1; // or makeFuture<int>(-1) or makeSemiFuture<int>(-1)
  ///     });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <class F>
  Future<T> thenError(F&& func) &&;

  template <class R, class... Args>
  Future<T> thenError(R (&func)(Args...)) && {
    return std::move(*this).thenError(&func);
  }

  /// Convenience method for ignoring the value and creating a Future<Unit>.
  /// Exceptions still propagate.
  /// This function is identical to .unit().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  Future<Unit> then() &&;

  // clang-format off
  [[deprecated(
      "must be rvalue-qualified, e.g., std::move(future).thenValue()")]]
  Future<Unit> then() & = delete;
  // clang-format on

  /// Convenience method for ignoring the value and creating a Future<Unit>.
  /// Exceptions still propagate.
  /// This function is identical to parameterless .then().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  Future<Unit> unit() && {
    return std::move(*this).then();
  }

  /// Set an error continuation for this Future. The continuation should take an
  /// argument of the type that you want to catch, and should return a value of
  /// the same type as this Future, or a Future of that type (see overload
  /// below).
  ///
  /// Example:
  ///
  ///   makeFuture()
  ///     .thenValue([] {
  ///       throw std::runtime_error("oh no!");
  ///       return 42;
  ///     })
  ///     .thenError<std::runtime_error>([] (std::runtime_error& e) {
  ///       LOG(INFO) << "std::runtime_error: " << e.what();
  ///       return -1; // or makeFuture<int>(-1)
  ///     });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  typename std::enable_if<
      !is_invocable<F, exception_wrapper>::value &&
          !futures::detail::Extract<F>::ReturnsFuture::value,
      Future<T>>::type
  onError(F&& func) &&;

  /// Overload of onError where the error continuation returns a Future<T>
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  typename std::enable_if<
      !is_invocable<F, exception_wrapper>::value &&
          futures::detail::Extract<F>::ReturnsFuture::value,
      Future<T>>::type
  onError(F&& func) &&;

  /// Overload of onError that takes exception_wrapper and returns Future<T>
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  typename std::enable_if<
      is_invocable<F, exception_wrapper>::value &&
          futures::detail::Extract<F>::ReturnsFuture::value,
      Future<T>>::type
  onError(F&& func) &&;

  /// Overload of onError that takes exception_wrapper and returns T
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  typename std::enable_if<
      is_invocable<F, exception_wrapper>::value &&
          !futures::detail::Extract<F>::ReturnsFuture::value,
      Future<T>>::type
  onError(F&& func) &&;

  // clang-format off
  template <class F>
  [[deprecated("use rvalue-qualified fn, eg, std::move(future).onError(...)")]]
  Future<T> onError(F&& func) & {
    return std::move(*this).onError(std::forward<F>(func));
  }

  /// func is like std::function<void()> and is executed unconditionally, and
  /// the value/exception is passed through to the resulting Future.
  /// func shouldn't throw, but if it does it will be captured and propagated,
  /// and discard any value/exception that this Future has obtained.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  Future<T> ensure(F&& func) &&;
  // clang-format on

  /// Like onError, but for timeouts. example:
  ///
  ///   Future<int> f = makeFuture<int>(42)
  ///     .delayed(long_time)
  ///     .onTimeout(short_time,
  ///       [] { return -1; });
  ///
  /// or perhaps
  ///
  ///   Future<int> f = makeFuture<int>(42)
  ///     .delayed(long_time)
  ///     .onTimeout(short_time,
  ///       [] { return makeFuture<int>(some_exception); });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  Future<T> onTimeout(Duration, F&& func, Timekeeper* = nullptr) &&;

  /// Throw FutureTimeout if this Future does not complete within the given
  /// duration from now. The optional Timekeeper is as with futures::sleep().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  Future<T> within(Duration dur, Timekeeper* tk = nullptr) &&;

  /// Throw the given exception if this Future does not complete within the
  /// given duration from now. The optional Timekeeper is as with
  /// futures::sleep().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class E>
  Future<T> within(Duration dur, E exception, Timekeeper* tk = nullptr) &&;

  /// Delay the completion of this Future for at least this duration from
  /// now. The optional Timekeeper is as with futures::sleep().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  Future<T> delayed(Duration, Timekeeper* = nullptr) &&;

  /// Delay the completion of this Future for at least this duration from
  /// now. The optional Timekeeper is as with futures::sleep().
  /// NOTE: Deprecated
  /// WARNING: Returned future may complete on Timekeeper thread.
  Future<T> delayedUnsafe(Duration, Timekeeper* = nullptr);

  /// Blocks until the future is fulfilled. Returns the value (moved-out), or
  /// throws the exception. The future must not already have a continuation.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  T get() &&;

  [[deprecated("must be rvalue-qualified, e.g., std::move(future).get()")]] T
  get() & = delete;

  /// Blocks until the future is fulfilled, or until `dur` elapses. Returns the
  /// value (moved-out), or throws the exception (which might be a FutureTimeout
  /// exception).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  T get(Duration dur) &&;

  [[deprecated("must be rvalue-qualified, e.g., std::move(future).get(dur)")]] T
  get(Duration dur) & = delete;

  /// A reference to the Try of the value
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - `isReady() == true` (else throws FutureNotReady)
  Try<T>& getTry();

  /// Blocks until this Future is complete.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `&RESULT == this`
  /// - `isReady() == true`
  Future<T>& wait() &;

  /// Blocks until this Future is complete.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (but the calling code can trivially move-out `*this`
  ///   by assigning or constructing the result into a distinct object).
  /// - `&RESULT == this`
  /// - `isReady() == true`
  Future<T>&& wait() &&;

  /// Blocks until this Future is complete, or `dur` elapses.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (so you may call `wait(...)` repeatedly)
  /// - `&RESULT == this`
  /// - `isReady()` will be indeterminate - may or may not be true
  Future<T>& wait(Duration dur) &;

  /// Blocks until this Future is complete or until `dur` passes.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (but the calling code can trivially move-out `*this`
  ///   by assigning or constructing the result into a distinct object).
  /// - `&RESULT == this`
  /// - `isReady()` will be indeterminate - may or may not be true
  Future<T>&& wait(Duration dur) &&;

  /// Call e->drive() repeatedly until the future is fulfilled. Examples
  /// of DrivableExecutor include EventBase and ManualExecutor. Returns a
  /// reference to this Future so that you can chain calls if desired.
  /// value (moved-out), or throws the exception.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (does not move-out `*this`)
  /// - `&RESULT == this`
  Future<T>& waitVia(DrivableExecutor* e) &;

  /// Overload of waitVia() for rvalue Futures
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (but the calling code can trivially move-out `*this`
  ///   by assigning or constructing the result into a distinct object).
  /// - `&RESULT == this`
  Future<T>&& waitVia(DrivableExecutor* e) &&;

  /// As waitVia but may return early after dur passes.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (does not move-out `*this`)
  /// - `&RESULT == this`
  Future<T>& waitVia(TimedDrivableExecutor* e, Duration dur) &;

  /// Overload of waitVia() for rvalue Futures
  /// As waitVia but may return early after dur passes.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (but the calling code can trivially move-out `*this`
  ///   by assigning or constructing the result into a distinct object).
  /// - `&RESULT == this`
  Future<T>&& waitVia(TimedDrivableExecutor* e, Duration dur) &&;

  /// If the value in this Future is equal to the given Future, when they have
  /// both completed, the value of the resulting Future<bool> will be true. It
  /// will be false otherwise (including when one or both Futures have an
  /// exception)
  Future<bool> willEqual(Future<T>&);

  /// predicate behaves like std::function<bool(T const&)>
  /// If the predicate does not obtain with the value, the result
  /// is a folly::FuturePredicateDoesNotObtain exception
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  Future<T> filter(F&& predicate) &&;

  /// Like reduce, but works on a Future<std::vector<T / Try<T>>>, for example
  /// the result of collect or collectAll
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class I, class F>
  Future<I> reduce(I&& initial, F&& func) &&;

  /// Create a Future chain from a sequence of continuations. i.e.
  ///
  ///   f.then(a).then(b).then(c)
  ///
  /// where f is a Future<A> and the result of the chain is a Future<D>
  /// becomes
  ///
  ///   std::move(f).thenMulti(a, b, c);
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class Callback, class... Callbacks>
  auto thenMulti(Callback&& fn, Callbacks&&... fns) && {
    // thenMulti with two callbacks is just then(a).thenMulti(b, ...)

    // TODO(T29171940): Switch to thenImplementation here. It is ambiguous
    // as then used to be but that is better than keeping then in the public
    // API.
    using R = futures::detail::callableResult<T, decltype(fn)>;
    return std::move(*this)
        .thenImplementation(std::forward<Callback>(fn), R{})
        .thenMulti(std::forward<Callbacks>(fns)...);
  }

  /// Create a Future chain from a sequence of callbacks.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class Callback>
  auto thenMulti(Callback&& fn) && {
    // thenMulti with one callback is just a then

    // TODO(T29171940): Switch to thenImplementation here. It is ambiguous
    // as then used to be but that is better than keeping then in the public
    // API.
    using R = futures::detail::callableResult<T, decltype(fn)>;
    return std::move(*this).thenImplementation(std::forward<Callback>(fn), R{});
  }

  template <class Callback>
  auto thenMulti(Callback&& fn) & {
    return std::move(*this).thenMulti(std::forward<Callback>(fn));
  }

  /// Create a Future chain from a sequence of callbacks. i.e.
  ///
  ///   f.via(executor).then(a).then(b).then(c).via(oldExecutor)
  ///
  /// where f is a Future<A> and the result of the chain is a Future<D>
  /// becomes
  ///
  ///   std::move(f).thenMultiWithExecutor(executor, a, b, c);
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class Callback, class... Callbacks>
  auto
  thenMultiWithExecutor(Executor* x, Callback&& fn, Callbacks&&... fns) && {
    // thenMultiExecutor with two callbacks is
    // via(x).then(a).thenMulti(b, ...).via(oldX)
    auto oldX = this->getExecutor();
    this->setExecutor(x);
    // TODO(T29171940): Switch to thenImplementation here. It is ambiguous
    // as then used to be but that is better than keeping then in the public
    // API.
    using R = futures::detail::callableResult<T, decltype(fn)>;
    return std::move(*this)
        .thenImplementation(std::forward<Callback>(fn), R{})
        .thenMulti(std::forward<Callbacks>(fns)...)
        .via(oldX);
  }

  template <class Callback>
  auto thenMultiWithExecutor(Executor* x, Callback&& fn) && {
    // thenMulti with one callback is just a then with an executor
    return std::move(*this).then(x, std::forward<Callback>(fn));
  }

  /// Moves-out `*this`, creating/returning a corresponding SemiFuture.
  /// Result will behave like `*this` except result won't have an Executor.
  ///
  /// Postconditions:
  ///
  /// - `RESULT.valid() ==` the original value of `this->valid()`
  /// - RESULT will not have an Executor regardless of whether `*this` had one
  SemiFuture<T> semi() && {
    return SemiFuture<T>{std::move(*this)};
  }

#if FOLLY_HAS_COROUTINES

  // Overload needed to customise behaviour of awaiting a Future<T>
  // inside a folly::coro::Task coroutine.
  friend Future<T> co_viaIfAsync(
      folly::Executor* executor,
      Future<T>&& future) noexcept {
    return std::move(future).via(executor);
  }

#endif

 protected:
  friend class Promise<T>;
  template <class>
  friend class futures::detail::FutureBase;
  template <class>
  friend class Future;
  template <class>
  friend class SemiFuture;
  template <class>
  friend class FutureSplitter;

  using Base::setExecutor;
  using Base::throwIfContinued;
  using Base::throwIfInvalid;
  using typename Base::Core;

  explicit Future(Core* obj) : Base(obj) {}

  explicit Future(futures::detail::EmptyConstruct) noexcept
      : Base(futures::detail::EmptyConstruct{}) {}

  template <class T2>
  friend Future<T2> makeFuture(Try<T2>);

  /// Repeat the given future (i.e., the computation it contains) n times.
  ///
  /// thunk behaves like std::function<Future<T2>(void)>
  template <class F>
  friend Future<Unit> times(int n, F&& thunk);

  /// Carry out the computation contained in the given future if
  /// the predicate holds.
  ///
  /// thunk behaves like std::function<Future<T2>(void)>
  template <class F>
  friend Future<Unit> when(bool p, F&& thunk);

  /// Carry out the computation contained in the given future if
  /// while the predicate continues to hold.
  ///
  /// thunk behaves like std::function<Future<T2>(void)>
  ///
  /// predicate behaves like std::function<bool(void)>
  template <class P, class F>
  friend Future<Unit> whileDo(P&& predicate, F&& thunk);

  template <class FT>
  friend void futures::detail::convertFuture(
      SemiFuture<FT>&& sf,
      Future<FT>& f);
};

/// A Timekeeper handles the details of keeping time and fulfilling delay
/// promises. The returned Future<Unit> will either complete after the
/// elapsed time, or in the event of some kind of exceptional error may hold
/// an exception. These Futures respond to cancellation. If you use a lot of
/// Delays and many of them ultimately are unneeded (as would be the case for
/// Delays that are used to trigger timeouts of async operations), then you
/// can and should cancel them to reclaim resources.
///
/// Users will typically get one of these via Future::sleep(Duration dur) or
/// use them implicitly behind the scenes by passing a timeout to some Future
/// operation.
///
/// Although we don't formally alias Delay = Future<Unit>,
/// that's an appropriate term for it. People will probably also call these
/// Timeouts, and that's ok I guess, but that term is so overloaded I thought
/// it made sense to introduce a cleaner term.
///
/// Remember that Duration is a std::chrono duration (millisecond resolution
/// at the time of writing). When writing code that uses specific durations,
/// prefer using the explicit std::chrono type, e.g. std::chrono::milliseconds
/// over Duration. This makes the code more legible and means you won't be
/// unpleasantly surprised if we redefine Duration to microseconds, or
/// something.
///
///   timekeeper.after(std::chrono::duration_cast<Duration>(someNanoseconds))
class Timekeeper {
 public:
  virtual ~Timekeeper() = default;

  /// Returns a future that will complete after the given duration with the
  /// elapsed time. Exceptional errors can happen but they must be
  /// exceptional. Use the steady (monotonic) clock.
  ///
  /// The consumer thread may cancel this Future to reclaim resources.
  ///
  /// This future probably completes on the timer thread. You should almost
  /// certainly follow it with a via() call or the accuracy of other timers
  /// will suffer.
  virtual Future<Unit> after(Duration dur) = 0;

  /// Returns a future that will complete at the requested time.
  ///
  /// You may cancel this Future to reclaim resources.
  ///
  /// NB This is sugar for `after(when - now)`, so while you are welcome to
  /// use a std::chrono::system_clock::time_point it will not track changes to
  /// the system clock but rather execute that many milliseconds in the future
  /// according to the steady clock.
  template <class Clock>
  Future<Unit> at(std::chrono::time_point<Clock> when);
};

template <class T>
std::pair<Promise<T>, Future<T>> makePromiseContract(Executor* e) {
  auto p = Promise<T>();
  auto f = p.getSemiFuture().via(e);
  return std::make_pair(std::move(p), std::move(f));
}

} // namespace folly

#if FOLLY_HAS_COROUTINES

namespace folly {
namespace detail {

template <typename T>
class FutureAwaitable {
 public:
  explicit FutureAwaitable(folly::Future<T>&& future) noexcept
      : future_(std::move(future)) {}

  bool await_ready() const {
    return future_.isReady();
  }

  T await_resume() {
    return std::move(result_).value();
  }

  void await_suspend(std::experimental::coroutine_handle<> h) {
    future_.setCallback_([this, h](Try<T>&& result) mutable {
      result_ = std::move(result);
      h.resume();
    });
  }

 private:
  folly::Try<T> result_;
  folly::Future<T> future_;
};

} // namespace detail

template <typename T>
inline detail::FutureAwaitable<T>
/* implicit */ operator co_await(Future<T>&& future) noexcept {
  return detail::FutureAwaitable<T>(std::move(future));
}
} // namespace folly
#endif

#include <folly/futures/Future-inl.h>
