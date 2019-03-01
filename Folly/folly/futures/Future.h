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

#include <algorithm>
#include <exception>
#include <functional>
#include <memory>
#include <type_traits>
#include <vector>

#include <folly/Optional.h>
#include <folly/Portability.h>
#include <folly/futures/DrivableExecutor.h>
#include <folly/futures/Promise.h>
#include <folly/Try.h>
#include <folly/futures/FutureException.h>
#include <folly/futures/detail/Types.h>

// boring predeclarations and details
#include <folly/futures/Future-pre.h>

// not-boring helpers, e.g. all in folly::futures, makeFuture variants, etc.
// Needs to be included after Future-pre.h and before Future-inl.h
#include <folly/futures/helpers.h>

namespace folly {

template <class T>
class Future {
 public:
  typedef T value_type;

  // not copyable
  Future(Future const&) = delete;
  Future& operator=(Future const&) = delete;

  // movable
  Future(Future&&) noexcept;
  Future& operator=(Future&&) noexcept;

  /// Construct a Future from a value (perfect forwarding)
  template <class T2 = T, typename =
            typename std::enable_if<
              !isFuture<typename std::decay<T2>::type>::value>::type>
  /* implicit */ Future(T2&& val);

  template <class T2 = T>
  /* implicit */ Future(
      typename std::enable_if<std::is_same<Unit, T2>::value>::type* = nullptr);

  ~Future();

  /** Return the reference to result. Should not be called if !isReady().
    Will rethrow the exception if an exception has been
    captured.
    */
  typename std::add_lvalue_reference<T>::type
  value();
  typename std::add_lvalue_reference<const T>::type
  value() const;

  /// Returns an inactive Future which will call back on the other side of
  /// executor (when it is activated).
  ///
  /// NB remember that Futures activate when they destruct. This is good,
  /// it means that this will work:
  ///
  ///   f.via(e).then(a).then(b);
  ///
  /// a and b will execute in the same context (the far side of e), because
  /// the Future (temporary variable) created by via(e) does not call back
  /// until it destructs, which is after then(a) and then(b) have been wired
  /// up.
  ///
  /// But this is still racy:
  ///
  ///   f = f.via(e).then(a);
  ///   f.then(b);
  // The ref-qualifier allows for `this` to be moved out so we
  // don't get access-after-free situations in chaining.
  // https://akrzemi1.wordpress.com/2014/06/02/ref-qualifiers/
  inline Future<T> via(
      Executor* executor,
      int8_t priority = Executor::MID_PRI) &&;

  /// This variant creates a new future, where the ref-qualifier && version
  /// moves `this` out. This one is less efficient but avoids confusing users
  /// when "return f.via(x);" fails.
  inline Future<T> via(
      Executor* executor,
      int8_t priority = Executor::MID_PRI) &;

  /** True when the result (or exception) is ready. */
  bool isReady() const;

  /// sugar for getTry().hasValue()
  bool hasValue();

  /// sugar for getTry().hasException()
  bool hasException();

  /** A reference to the Try of the value */
  Try<T>& getTry();

  /// Call e->drive() repeatedly until the future is fulfilled. Examples
  /// of DrivableExecutor include EventBase and ManualExecutor. Returns a
  /// reference to the Try of the value.
  Try<T>& getTryVia(DrivableExecutor* e);

  /// If the promise has been fulfilled, return an Optional with the Try<T>.
  /// Otherwise return an empty Optional.
  /// Note that this moves the Try<T> out.
  Optional<Try<T>> poll();

  /// Block until the future is fulfilled. Returns the value (moved out), or
  /// throws the exception. The future must not already have a callback.
  T get();

  /// Block until the future is fulfilled, or until timed out. Returns the
  /// value (moved out), or throws the exception (which might be a TimedOut
  /// exception).
  T get(Duration dur);

  /// Call e->drive() repeatedly until the future is fulfilled. Examples
  /// of DrivableExecutor include EventBase and ManualExecutor. Returns the
  /// value (moved out), or throws the exception.
  T getVia(DrivableExecutor* e);

  /// Unwraps the case of a Future<Future<T>> instance, and returns a simple
  /// Future<T> instance.
  template <class F = T>
  typename std::enable_if<isFuture<F>::value,
                          Future<typename isFuture<T>::Inner>>::type
  unwrap();

  /** When this Future has completed, execute func which is a function that
    takes one of:
      (const) Try<T>&&
      (const) Try<T>&
      (const) Try<T>
      (const) T&&
      (const) T&
      (const) T
      (void)

    Func shall return either another Future or a value.

    A Future for the return type of func is returned.

    Future<string> f2 = f1.then([](Try<T>&&) { return string("foo"); });

    The Future given to the functor is ready, and the functor may call
    value(), which may rethrow if this has captured an exception. If func
    throws, the exception will be captured in the Future that is returned.
    */
  // gcc 4.8 requires that we cast function reference types to function pointer
  // types. Fore more details see the comment on FunctionReferenceToPointer
  // in Future-pre.h.
  // gcc versions 4.9 and above (as well as clang) do not require this hack.
  // For those, the FF tenplate parameter can be removed and occurences of FF
  // replaced with F.
  template <
      typename F,
      typename FF = typename detail::FunctionReferenceToPointer<F>::type,
      typename R = detail::callableResult<T, FF>>
  typename R::Return then(F&& func) {
    typedef typename R::Arg Arguments;
    return thenImplementation<FF, R>(std::forward<FF>(func), Arguments());
  }

  /// Variant where func is an member function
  ///
  ///   struct Worker { R doWork(Try<T>); }
  ///
  ///   Worker *w;
  ///   Future<R> f2 = f1.then(&Worker::doWork, w);
  ///
  /// This is just sugar for
  ///
  ///   f1.then(std::bind(&Worker::doWork, w));
  template <typename R, typename Caller, typename... Args>
  Future<typename isFuture<R>::Inner>
  then(R(Caller::*func)(Args...), Caller *instance);

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
  template <class Executor, class Arg, class... Args>
  auto then(Executor* x, Arg&& arg, Args&&... args)
    -> decltype(this->then(std::forward<Arg>(arg),
                           std::forward<Args>(args)...));

  /// Convenience method for ignoring the value and creating a Future<Unit>.
  /// Exceptions still propagate.
  Future<Unit> then();

  /// Set an error callback for this Future. The callback should take a single
  /// argument of the type that you want to catch, and should return a value of
  /// the same type as this Future, or a Future of that type (see overload
  /// below). For instance,
  ///
  /// makeFuture()
  ///   .then([] {
  ///     throw std::runtime_error("oh no!");
  ///     return 42;
  ///   })
  ///   .onError([] (std::runtime_error& e) {
  ///     LOG(INFO) << "std::runtime_error: " << e.what();
  ///     return -1; // or makeFuture<int>(-1)
  ///   });
  template <class F>
  typename std::enable_if<
    !detail::callableWith<F, exception_wrapper>::value &&
    !detail::Extract<F>::ReturnsFuture::value,
    Future<T>>::type
  onError(F&& func);

  /// Overload of onError where the error callback returns a Future<T>
  template <class F>
  typename std::enable_if<
    !detail::callableWith<F, exception_wrapper>::value &&
    detail::Extract<F>::ReturnsFuture::value,
    Future<T>>::type
  onError(F&& func);

  /// Overload of onError that takes exception_wrapper and returns Future<T>
  template <class F>
  typename std::enable_if<
    detail::callableWith<F, exception_wrapper>::value &&
    detail::Extract<F>::ReturnsFuture::value,
    Future<T>>::type
  onError(F&& func);

  /// Overload of onError that takes exception_wrapper and returns T
  template <class F>
  typename std::enable_if<
    detail::callableWith<F, exception_wrapper>::value &&
    !detail::Extract<F>::ReturnsFuture::value,
    Future<T>>::type
  onError(F&& func);

  /// func is like std::function<void()> and is executed unconditionally, and
  /// the value/exception is passed through to the resulting Future.
  /// func shouldn't throw, but if it does it will be captured and propagated,
  /// and discard any value/exception that this Future has obtained.
  template <class F>
  Future<T> ensure(F&& func);

  /// Like onError, but for timeouts. example:
  ///
  ///   Future<int> f = makeFuture<int>(42)
  ///     .delayed(long_time)
  ///     .onTimeout(short_time,
  ///       []() -> int{ return -1; });
  ///
  /// or perhaps
  ///
  ///   Future<int> f = makeFuture<int>(42)
  ///     .delayed(long_time)
  ///     .onTimeout(short_time,
  ///       []() { return makeFuture<int>(some_exception); });
  template <class F>
  Future<T> onTimeout(Duration, F&& func, Timekeeper* = nullptr);

  /// This is not the method you're looking for.
  ///
  /// This needs to be public because it's used by make* and when*, and it's
  /// not worth listing all those and their fancy template signatures as
  /// friends. But it's not for public consumption.
  template <class F>
  void setCallback_(F&& func);

  /// A Future's callback is executed when all three of these conditions have
  /// become true: it has a value (set by the Promise), it has a callback (set
  /// by then), and it is active (active by default).
  ///
  /// Inactive Futures will activate upon destruction.
  FOLLY_DEPRECATED("do not use") Future<T>& activate() & {
    core_->activate();
    return *this;
  }
  FOLLY_DEPRECATED("do not use") Future<T>& deactivate() & {
    core_->deactivate();
    return *this;
  }
  FOLLY_DEPRECATED("do not use") Future<T> activate() && {
    core_->activate();
    return std::move(*this);
  }
  FOLLY_DEPRECATED("do not use") Future<T> deactivate() && {
    core_->deactivate();
    return std::move(*this);
  }

  bool isActive() {
    return core_->isActive();
  }

  template <class E>
  void raise(E&& exception) {
    raise(make_exception_wrapper<typename std::remove_reference<E>::type>(
        std::forward<E>(exception)));
  }

  /// Raise an interrupt. If the promise holder has an interrupt
  /// handler it will be called and potentially stop asynchronous work from
  /// being done. This is advisory only - a promise holder may not set an
  /// interrupt handler, or may do anything including ignore. But, if you know
  /// your future supports this the most likely result is stopping or
  /// preventing the asynchronous operation (if in time), and the promise
  /// holder setting an exception on the future. (That may happen
  /// asynchronously, of course.)
  void raise(exception_wrapper interrupt);

  void cancel() {
    raise(FutureCancellation());
  }

  /// Throw TimedOut if this Future does not complete within the given
  /// duration from now. The optional Timeekeeper is as with futures::sleep().
  Future<T> within(Duration, Timekeeper* = nullptr);

  /// Throw the given exception if this Future does not complete within the
  /// given duration from now. The optional Timeekeeper is as with
  /// futures::sleep().
  template <class E>
  Future<T> within(Duration, E exception, Timekeeper* = nullptr);

  /// Delay the completion of this Future for at least this duration from
  /// now. The optional Timekeeper is as with futures::sleep().
  Future<T> delayed(Duration, Timekeeper* = nullptr);

  /// Block until this Future is complete. Returns a reference to this Future.
  Future<T>& wait() &;

  /// Overload of wait() for rvalue Futures
  Future<T>&& wait() &&;

  /// Block until this Future is complete or until the given Duration passes.
  /// Returns a reference to this Future
  Future<T>& wait(Duration) &;

  /// Overload of wait(Duration) for rvalue Futures
  Future<T>&& wait(Duration) &&;

  /// Call e->drive() repeatedly until the future is fulfilled. Examples
  /// of DrivableExecutor include EventBase and ManualExecutor. Returns a
  /// reference to this Future so that you can chain calls if desired.
  /// value (moved out), or throws the exception.
  Future<T>& waitVia(DrivableExecutor* e) &;

  /// Overload of waitVia() for rvalue Futures
  Future<T>&& waitVia(DrivableExecutor* e) &&;

  /// If the value in this Future is equal to the given Future, when they have
  /// both completed, the value of the resulting Future<bool> will be true. It
  /// will be false otherwise (including when one or both Futures have an
  /// exception)
  Future<bool> willEqual(Future<T>&);

  /// predicate behaves like std::function<bool(T const&)>
  /// If the predicate does not obtain with the value, the result
  /// is a folly::PredicateDoesNotObtain exception
  template <class F>
  Future<T> filter(F&& predicate);

  /// Like reduce, but works on a Future<std::vector<T / Try<T>>>, for example
  /// the result of collect or collectAll
  template <class I, class F>
  Future<I> reduce(I&& initial, F&& func);

  /// Create a Future chain from a sequence of callbacks. i.e.
  ///
  ///   f.then(a).then(b).then(c)
  ///
  /// where f is a Future<A> and the result of the chain is a Future<D>
  /// becomes
  ///
  ///   f.thenMulti(a, b, c);
  template <class Callback, class... Callbacks>
  auto thenMulti(Callback&& fn, Callbacks&&... fns)
    -> decltype(this->then(std::forward<Callback>(fn)).
                      thenMulti(std::forward<Callbacks>(fns)...));

  // Nothing to see here, just thenMulti's base case
  template <class Callback>
  auto thenMulti(Callback&& fn)
    -> decltype(this->then(std::forward<Callback>(fn)));

  /// Create a Future chain from a sequence of callbacks. i.e.
  ///
  ///   f.via(executor).then(a).then(b).then(c).via(oldExecutor)
  ///
  /// where f is a Future<A> and the result of the chain is a Future<D>
  /// becomes
  ///
  ///   f.thenMultiWithExecutor(executor, a, b, c);
  template <class Callback, class... Callbacks>
  auto thenMultiWithExecutor(Executor* x, Callback&& fn, Callbacks&&... fns)
    -> decltype(this->then(std::forward<Callback>(fn)).
                      thenMulti(std::forward<Callbacks>(fns)...));

  // Nothing to see here, just thenMultiWithExecutor's base case
  template <class Callback>
  auto thenMultiWithExecutor(Executor* x, Callback&& fn)
    -> decltype(this->then(std::forward<Callback>(fn)));

  /// Discard a result, but propagate an exception.
  Future<Unit> unit() {
    return then([]{ return Unit{}; });
  }

 protected:
  typedef detail::Core<T>* corePtr;

  // shared core state object
  corePtr core_;

  explicit
  Future(corePtr obj) : core_(obj) {}

  void detach();

  void throwIfInvalid() const;

  friend class Promise<T>;
  template <class> friend class Future;

  template <class T2>
  friend Future<T2> makeFuture(Try<T2>&&);

  /// Repeat the given future (i.e., the computation it contains)
  /// n times.
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

  // Variant: returns a value
  // e.g. f.then([](Try<T> t){ return t.value(); });
  template <typename F, typename R, bool isTry, typename... Args>
  typename std::enable_if<!R::ReturnsFuture::value, typename R::Return>::type
  thenImplementation(F&& func, detail::argResult<isTry, F, Args...>);

  // Variant: returns a Future
  // e.g. f.then([](Try<T> t){ return makeFuture<T>(t); });
  template <typename F, typename R, bool isTry, typename... Args>
  typename std::enable_if<R::ReturnsFuture::value, typename R::Return>::type
  thenImplementation(F&& func, detail::argResult<isTry, F, Args...>);

  Executor* getExecutor() { return core_->getExecutor(); }
  void setExecutor(Executor* x, int8_t priority = Executor::MID_PRI) {
    core_->setExecutor(x, priority);
  }
};

} // folly

#include <folly/futures/Future-inl.h>
