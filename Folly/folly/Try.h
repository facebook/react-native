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

#include <folly/ExceptionWrapper.h>
#include <folly/Likely.h>
#include <folly/Memory.h>
#include <folly/Portability.h>
#include <folly/Unit.h>
#include <folly/Utility.h>
#include <folly/functional/Invoke.h>
#include <folly/lang/Exception.h>
#include <exception>
#include <stdexcept>
#include <type_traits>
#include <utility>

namespace folly {

class FOLLY_EXPORT TryException : public std::logic_error {
 public:
  using std::logic_error::logic_error;
};

class FOLLY_EXPORT UsingUninitializedTry : public TryException {
 public:
  UsingUninitializedTry() : TryException("Using uninitialized try") {}
};

/*
 * Try<T> is a wrapper that contains either an instance of T, an exception, or
 * nothing. Exceptions are stored as exception_wrappers so that the user can
 * minimize rethrows if so desired.
 *
 * To represent success or a captured exception, use Try<Unit>.
 */
template <class T>
class Try {
  static_assert(
      !std::is_reference<T>::value,
      "Try may not be used with reference types");

  enum class Contains {
    VALUE,
    EXCEPTION,
    NOTHING,
  };

 public:
  /*
   * The value type for the Try
   */
  typedef T element_type;

  /*
   * Construct an empty Try
   */
  Try() noexcept : contains_(Contains::NOTHING) {}

  /*
   * Construct a Try with a value by copy
   *
   * @param v The value to copy in
   */
  explicit Try(const T& v) noexcept(
      std::is_nothrow_copy_constructible<T>::value)
      : contains_(Contains::VALUE), value_(v) {}

  /*
   * Construct a Try with a value by move
   *
   * @param v The value to move in
   */
  explicit Try(T&& v) noexcept(std::is_nothrow_move_constructible<T>::value)
      : contains_(Contains::VALUE), value_(std::move(v)) {}

  template <typename... Args>
  explicit Try(in_place_t, Args&&... args) noexcept(
      std::is_nothrow_constructible<T, Args&&...>::value)
      : contains_(Contains::VALUE), value_(static_cast<Args&&>(args)...) {}

  /// Implicit conversion from Try<void> to Try<Unit>
  template <class T2 = T>
  /* implicit */
  Try(typename std::enable_if<std::is_same<Unit, T2>::value, Try<void> const&>::
          type t) noexcept;

  /*
   * Construct a Try with an exception_wrapper
   *
   * @param e The exception_wrapper
   */
  explicit Try(exception_wrapper e) noexcept
      : contains_(Contains::EXCEPTION), e_(std::move(e)) {}

  // Move constructor
  Try(Try<T>&& t) noexcept(std::is_nothrow_move_constructible<T>::value);
  // Move assigner
  Try& operator=(Try<T>&& t) noexcept(
      std::is_nothrow_move_constructible<T>::value);

  // Copy constructor
  Try(const Try& t) noexcept(std::is_nothrow_copy_constructible<T>::value);
  // Copy assigner
  Try& operator=(const Try& t) noexcept(
      std::is_nothrow_copy_constructible<T>::value);

  ~Try();

  /*
   * In-place construct the value in the Try object.
   *
   * Destroys any previous value prior to constructing the new value.
   * Leaves *this in an empty state if the construction of T throws.
   *
   * @returns reference to the newly constructed value.
   */
  template <typename... Args>
  T& emplace(Args&&... args) noexcept(
      std::is_nothrow_constructible<T, Args&&...>::value);

  /*
   * In-place construct an exception in the Try object.
   *
   * Destroys any previous value prior to constructing the new value.
   * Leaves *this in an empty state if the construction of the exception_wrapper
   * throws.
   *
   * Any arguments passed to emplaceException() are forwarded on to the
   * exception_wrapper constructor.
   *
   * @returns reference to the newly constructed exception_wrapper.
   */
  template <typename... Args>
  exception_wrapper& emplaceException(Args&&... args) noexcept(
      std::is_nothrow_constructible<exception_wrapper, Args&&...>::value);

  /*
   * Get a mutable reference to the contained value. If the Try contains an
   * exception it will be rethrown.
   *
   * @returns mutable reference to the contained value
   */
  T& value() &;
  /*
   * Get a rvalue reference to the contained value. If the Try contains an
   * exception it will be rethrown.
   *
   * @returns rvalue reference to the contained value
   */
  T&& value() &&;
  /*
   * Get a const reference to the contained value. If the Try contains an
   * exception it will be rethrown.
   *
   * @returns const reference to the contained value
   */
  const T& value() const&;
  /*
   * Get a const rvalue reference to the contained value. If the Try contains an
   * exception it will be rethrown.
   *
   * @returns const rvalue reference to the contained value
   */
  const T&& value() const&&;

  /*
   * If the Try contains an exception, rethrow it. Otherwise do nothing.
   */
  void throwIfFailed() const;

  /*
   * Const dereference operator. If the Try contains an exception it will be
   * rethrown.
   *
   * @returns const reference to the contained value
   */
  const T& operator*() const& {
    return value();
  }
  /*
   * Dereference operator. If the Try contains an exception it will be rethrown.
   *
   * @returns mutable reference to the contained value
   */
  T& operator*() & {
    return value();
  }
  /*
   * Mutable rvalue dereference operator.  If the Try contains an exception it
   * will be rethrown.
   *
   * @returns rvalue reference to the contained value
   */
  T&& operator*() && {
    return std::move(value());
  }
  /*
   * Const rvalue dereference operator.  If the Try contains an exception it
   * will be rethrown.
   *
   * @returns rvalue reference to the contained value
   */
  const T&& operator*() const&& {
    return std::move(value());
  }

  /*
   * Const arrow operator. If the Try contains an exception it will be
   * rethrown.
   *
   * @returns const reference to the contained value
   */
  const T* operator->() const {
    return &value();
  }
  /*
   * Arrow operator. If the Try contains an exception it will be rethrown.
   *
   * @returns mutable reference to the contained value
   */
  T* operator->() {
    return &value();
  }

  /*
   * @returns True if the Try contains a value, false otherwise
   */
  bool hasValue() const {
    return contains_ == Contains::VALUE;
  }
  /*
   * @returns True if the Try contains an exception, false otherwise
   */
  bool hasException() const {
    return contains_ == Contains::EXCEPTION;
  }

  /*
   * @returns True if the Try contains an exception of type Ex, false otherwise
   */
  template <class Ex>
  bool hasException() const {
    return hasException() && e_.is_compatible_with<Ex>();
  }

  exception_wrapper& exception() & {
    if (!hasException()) {
      throw_exception<TryException>("Try does not contain an exception");
    }
    return e_;
  }

  exception_wrapper&& exception() && {
    if (!hasException()) {
      throw_exception<TryException>("Try does not contain an exception");
    }
    return std::move(e_);
  }

  const exception_wrapper& exception() const& {
    if (!hasException()) {
      throw_exception<TryException>("Try does not contain an exception");
    }
    return e_;
  }

  const exception_wrapper&& exception() const&& {
    if (!hasException()) {
      throw_exception<TryException>("Try does not contain an exception");
    }
    return std::move(e_);
  }

  /*
   * @returns a pointer to the `std::exception` held by `*this`, if one is held;
   *          otherwise, returns `nullptr`.
   */
  std::exception* tryGetExceptionObject() {
    return hasException() ? e_.get_exception() : nullptr;
  }
  std::exception const* tryGetExceptionObject() const {
    return hasException() ? e_.get_exception() : nullptr;
  }

  /*
   * @returns a pointer to the `Ex` held by `*this`, if it holds an object whose
   *          type `From` permits `std::is_convertible<From*, Ex*>`; otherwise,
   *          returns `nullptr`.
   */
  template <class E>
  E* tryGetExceptionObject() {
    return hasException() ? e_.get_exception<E>() : nullptr;
  }
  template <class E>
  E const* tryGetExceptionObject() const {
    return hasException() ? e_.get_exception<E>() : nullptr;
  }

  /*
   * If the Try contains an exception and it is of type Ex, execute func(Ex)
   *
   * @param func a function that takes a single parameter of type const Ex&
   *
   * @returns True if the Try held an Ex and func was executed, false otherwise
   */
  template <class Ex, class F>
  bool withException(F func) {
    if (!hasException()) {
      return false;
    }
    return e_.with_exception<Ex>(std::move(func));
  }
  template <class Ex, class F>
  bool withException(F func) const {
    if (!hasException()) {
      return false;
    }
    return e_.with_exception<Ex>(std::move(func));
  }

  /*
   * If the Try contains an exception and it is of type compatible with Ex as
   * deduced from the first parameter of func, execute func(Ex)
   *
   * @param func a function that takes a single parameter of type const Ex&
   *
   * @returns True if the Try held an Ex and func was executed, false otherwise
   */
  template <class F>
  bool withException(F func) {
    if (!hasException()) {
      return false;
    }
    return e_.with_exception(std::move(func));
  }
  template <class F>
  bool withException(F func) const {
    if (!hasException()) {
      return false;
    }
    return e_.with_exception(std::move(func));
  }

  template <bool isTry, typename R>
  typename std::enable_if<isTry, R>::type get() {
    return std::forward<R>(*this);
  }

  template <bool isTry, typename R>
  typename std::enable_if<!isTry, R>::type get() {
    return std::forward<R>(value());
  }

 private:
  void destroy() noexcept;

  Contains contains_;
  union {
    T value_;
    exception_wrapper e_;
  };
};

/*
 * Specialization of Try for void value type. Encapsulates either success or an
 * exception.
 */
template <>
class Try<void> {
 public:
  /*
   * The value type for the Try
   */
  typedef void element_type;

  // Construct a Try holding a successful and void result
  Try() noexcept : hasValue_(true) {}

  /*
   * Construct a Try with an exception_wrapper
   *
   * @param e The exception_wrapper
   */
  explicit Try(exception_wrapper e) noexcept
      : hasValue_(false), e_(std::move(e)) {}

  // Copy assigner
  inline Try& operator=(const Try<void>& t) noexcept;

  // Copy constructor
  Try(const Try<void>& t) noexcept : hasValue_(t.hasValue_) {
    if (t.hasException()) {
      new (&e_) exception_wrapper(t.e_);
    }
  }

  ~Try() {
    if (hasException()) {
      e_.~exception_wrapper();
    }
  }

  /*
   * In-place construct a 'void' value into this Try object.
   *
   * This has the effect of clearing any existing exception stored in the
   * Try object.
   */
  void emplace() noexcept {
    if (hasException()) {
      e_.~exception_wrapper();
      hasValue_ = true;
    }
  }

  /*
   * In-place construct an exception in the Try object.
   *
   * Destroys any previous value prior to constructing the new value.
   * Leaves *this in an empty state if the construction of the exception_wrapper
   * throws.
   *
   * Any arguments passed to emplaceException() are forwarded on to the
   * exception_wrapper constructor.
   *
   * @returns reference to the newly constructed exception_wrapper.
   */
  template <typename... Args>
  exception_wrapper& emplaceException(Args&&... args) noexcept(
      std::is_nothrow_constructible<exception_wrapper, Args&&...>::value);

  // If the Try contains an exception, throws it
  void value() const {
    throwIfFailed();
  }
  // Dereference operator. If the Try contains an exception, throws it
  void operator*() const {
    return value();
  }

  // If the Try contains an exception, throws it
  inline void throwIfFailed() const;

  // @returns False if the Try contains an exception, true otherwise
  bool hasValue() const {
    return hasValue_;
  }
  // @returns True if the Try contains an exception, false otherwise
  bool hasException() const {
    return !hasValue_;
  }

  // @returns True if the Try contains an exception of type Ex, false otherwise
  template <class Ex>
  bool hasException() const {
    return hasException() && e_.is_compatible_with<Ex>();
  }

  /*
   * @throws TryException if the Try doesn't contain an exception
   *
   * @returns mutable reference to the exception contained by this Try
   */
  exception_wrapper& exception() & {
    if (!hasException()) {
      throw_exception<TryException>("Try does not contain an exception");
    }
    return e_;
  }

  exception_wrapper&& exception() && {
    if (!hasException()) {
      throw_exception<TryException>("Try does not contain an exception");
    }
    return std::move(e_);
  }

  const exception_wrapper& exception() const& {
    if (!hasException()) {
      throw_exception<TryException>("Try does not contain an exception");
    }
    return e_;
  }

  const exception_wrapper&& exception() const&& {
    if (!hasException()) {
      throw_exception<TryException>("Try does not contain an exception");
    }
    return std::move(e_);
  }

  /*
   * @returns a pointer to the `std::exception` held by `*this`, if one is held;
   *          otherwise, returns `nullptr`.
   */
  std::exception* tryGetExceptionObject() {
    return hasException() ? e_.get_exception() : nullptr;
  }
  std::exception const* tryGetExceptionObject() const {
    return hasException() ? e_.get_exception() : nullptr;
  }

  /*
   * @returns a pointer to the `Ex` held by `*this`, if it holds an object whose
   *          type `From` permits `std::is_convertible<From*, Ex*>`; otherwise,
   *          returns `nullptr`.
   */
  template <class E>
  E* tryGetExceptionObject() {
    return hasException() ? e_.get_exception<E>() : nullptr;
  }
  template <class E>
  E const* tryGetExceptionObject() const {
    return hasException() ? e_.get_exception<E>() : nullptr;
  }

  /*
   * If the Try contains an exception and it is of type Ex, execute func(Ex)
   *
   * @param func a function that takes a single parameter of type const Ex&
   *
   * @returns True if the Try held an Ex and func was executed, false otherwise
   */
  template <class Ex, class F>
  bool withException(F func) {
    if (!hasException()) {
      return false;
    }
    return e_.with_exception<Ex>(std::move(func));
  }
  template <class Ex, class F>
  bool withException(F func) const {
    if (!hasException()) {
      return false;
    }
    return e_.with_exception<Ex>(std::move(func));
  }

  /*
   * If the Try contains an exception and it is of type compatible with Ex as
   * deduced from the first parameter of func, execute func(Ex)
   *
   * @param func a function that takes a single parameter of type const Ex&
   *
   * @returns True if the Try held an Ex and func was executed, false otherwise
   */
  template <class F>
  bool withException(F func) {
    if (!hasException()) {
      return false;
    }
    return e_.with_exception(std::move(func));
  }
  template <class F>
  bool withException(F func) const {
    if (!hasException()) {
      return false;
    }
    return e_.with_exception(std::move(func));
  }

  template <bool, typename R>
  R get() {
    return std::forward<R>(*this);
  }

 private:
  bool hasValue_;
  union {
    exception_wrapper e_;
  };
};

/*
 * @param f a function to execute and capture the result of (value or exception)
 *
 * @returns Try holding the result of f
 */
template <typename F>
typename std::enable_if<
    !std::is_same<invoke_result_t<F>, void>::value,
    Try<invoke_result_t<F>>>::type
makeTryWith(F&& f);

/*
 * Specialization of makeTryWith for void return
 *
 * @param f a function to execute and capture the result of
 *
 * @returns Try<void> holding the result of f
 */
template <typename F>
typename std::
    enable_if<std::is_same<invoke_result_t<F>, void>::value, Try<void>>::type
    makeTryWith(F&& f);

/*
 * Try to in-place construct a new value from the specified arguments.
 *
 * If T's constructor throws an exception then this is caught and the Try<T>
 * object is initialised to hold that exception.
 *
 * @param args Are passed to T's constructor.
 */
template <typename T, typename... Args>
T* tryEmplace(Try<T>& t, Args&&... args) noexcept;

/*
 * Overload of tryEmplace() for Try<void>.
 */
inline void tryEmplace(Try<void>& t) noexcept;

/*
 * Try to in-place construct a new value from the result of a function.
 *
 * If the function completes successfully then attempts to in-place construct
 * a value of type, T, passing the result of the function as the only parameter.
 *
 * If either the call to the function completes with an exception or the
 * constructor completes with an exception then the exception is caught and
 * stored in the Try object.
 *
 * @returns A pointer to the newly constructed object if it completed
 * successfully, otherwise returns nullptr if the operation completed with
 * an exception.
 */
template <typename T, typename Func>
T* tryEmplaceWith(Try<T>& t, Func&& func) noexcept;

/*
 * Specialization of tryEmplaceWith() for Try<void>.
 *
 * Calls func() and if it doesn't throw an exception then calls t.emplace().
 * If func() throws then captures the exception in t using t.emplaceException().
 *
 * Func must be callable with zero parameters and must return void.
 *
 * @returns true if func() completed without an exception, false if func()
 * threw an exception.
 */
template <typename Func>
bool tryEmplaceWith(Try<void>& t, Func&& func) noexcept;

/**
 * Tuple<Try<Type>...> -> std::tuple<Type...>
 *
 * Unwraps a tuple-like type containing a sequence of Try<Type> instances to
 * std::tuple<Type>
 */
template <typename Tuple>
auto unwrapTryTuple(Tuple&&);

} // namespace folly

#include <folly/Try-inl.h>
