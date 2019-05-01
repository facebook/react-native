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
/*
 * Author: Eric Niebler <eniebler@fb.com>
 */

#pragma once

#include <cassert>
#include <cstdint>
#include <exception>
#include <iosfwd>
#include <memory>
#include <new>
#include <type_traits>
#include <typeinfo>
#include <utility>

#include <folly/CPortability.h>
#include <folly/Demangle.h>
#include <folly/ExceptionString.h>
#include <folly/FBString.h>
#include <folly/Portability.h>
#include <folly/Traits.h>
#include <folly/Utility.h>
#include <folly/lang/Assume.h>

#ifdef __GNUC__
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wpragmas"
#pragma GCC diagnostic ignored "-Wpotentially-evaluated-expression"
// GCC gets confused about lambda scopes and issues shadow-local warnings for
// parameters in totally different functions.
FOLLY_GCC_DISABLE_NEW_SHADOW_WARNINGS
#endif

#define FOLLY_EXCEPTION_WRAPPER_H_INCLUDED

namespace folly {

#define FOLLY_REQUIRES_DEF(...) \
  _t<std::enable_if<static_cast<bool>(__VA_ARGS__), long>>

#define FOLLY_REQUIRES(...) FOLLY_REQUIRES_DEF(__VA_ARGS__) = __LINE__

namespace exception_wrapper_detail {

template <template <class> class T, class... As>
using AllOf = StrictConjunction<T<As>...>;

template <bool If, class T>
using AddConstIf = _t<std::conditional<If, const T, T>>;

template <class Fn, class A>
FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN auto fold(Fn&&, A&& a) {
  return static_cast<A&&>(a);
}

template <class Fn, class A, class B, class... Bs>
FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN auto
fold(Fn&& fn, A&& a, B&& b, Bs&&... bs) {
  return fold(
      // This looks like a use of fn after a move of fn, but in reality, this is
      // just a cast and not a move. That's because regardless of which fold
      // overload is selected, fn gets bound to a &&. Had fold taken fn by value
      // there would indeed be a problem here.
      static_cast<Fn&&>(fn),
      static_cast<Fn&&>(fn)(static_cast<A&&>(a), static_cast<B&&>(b)),
      static_cast<Bs&&>(bs)...);
}

} // namespace exception_wrapper_detail

//! Throwing exceptions can be a convenient way to handle errors. Storing
//! exceptions in an `exception_ptr` makes it easy to handle exceptions in a
//! different thread or at a later time. `exception_ptr` can also be used in a
//! very generic result/exception wrapper.
//!
//! However, there are some issues with throwing exceptions and
//! `std::exception_ptr`. These issues revolve around `throw` being expensive,
//! particularly in a multithreaded environment (see
//! ExceptionWrapperBenchmark.cpp).
//!
//! Imagine we have a library that has an API which returns a result/exception
//! wrapper. Let's consider some approaches for implementing this wrapper.
//! First, we could store a `std::exception`. This approach loses the derived
//! exception type, which can make exception handling more difficult for users
//! that prefer rethrowing the exception. We could use a `folly::dynamic` for
//! every possible type of exception. This is not very flexible - adding new
//! types of exceptions requires a change to the result/exception wrapper. We
//! could use an `exception_ptr`. However, constructing an `exception_ptr` as
//! well as accessing the error requires a call to throw. That means that there
//! will be two calls to throw in order to process the exception. For
//! performance sensitive applications, this may be unacceptable.
//!
//! `exception_wrapper` is designed to handle exception management for both
//! convenience and high performance use cases. `make_exception_wrapper` is
//! templated on derived type, allowing us to rethrow the exception properly for
//! users that prefer convenience. These explicitly named exception types can
//! therefore be handled without any peformance penalty. `exception_wrapper` is
//! also flexible enough to accept any type. If a caught exception is not of an
//! explicitly named type, then `std::exception_ptr` is used to preserve the
//! exception state. For performance sensitive applications, the accessor
//! methods can test or extract a pointer to a specific exception type with very
//! little overhead.
//!
//! \par Example usage:
//! \par
//! \code
//! exception_wrapper globalExceptionWrapper;
//!
//! // Thread1
//! void doSomethingCrazy() {
//!   int rc = doSomethingCrazyWithLameReturnCodes();
//!   if (rc == NAILED_IT) {
//!     globalExceptionWrapper = exception_wrapper();
//!   } else if (rc == FACE_PLANT) {
//!     globalExceptionWrapper = make_exception_wrapper<FacePlantException>();
//!   } else if (rc == FAIL_WHALE) {
//!     globalExceptionWrapper = make_exception_wrapper<FailWhaleException>();
//!   }
//! }
//!
//! // Thread2: Exceptions are ok!
//! void processResult() {
//!   try {
//!     globalExceptionWrapper.throw_exception();
//!   } catch (const FacePlantException& e) {
//!     LOG(ERROR) << "FACEPLANT!";
//!   } catch (const FailWhaleException& e) {
//!     LOG(ERROR) << "FAILWHALE!";
//!   }
//! }
//!
//! // Thread2: Exceptions are bad!
//! void processResult() {
//!   globalExceptionWrapper.handle(
//!       [&](FacePlantException& faceplant) {
//!         LOG(ERROR) << "FACEPLANT";
//!       },
//!       [&](FailWhaleException& failwhale) {
//!         LOG(ERROR) << "FAILWHALE!";
//!       },
//!       [](...) {
//!         LOG(FATAL) << "Unrecognized exception";
//!       });
//! }
//! \endcode
class exception_wrapper final {
 private:
  struct FOLLY_EXPORT AnyException : std::exception {
    std::type_info const* typeinfo_;
    template <class T>
    /* implicit */ AnyException(T&& t) noexcept : typeinfo_(&typeid(t)) {}
  };

  template <class Fn>
  struct arg_type_;
  template <class Fn>
  using arg_type = _t<arg_type_<Fn>>;

  // exception_wrapper is implemented as a simple variant over four
  // different representations:
  //  0. Empty, no exception.
  //  1. An small object stored in-situ.
  //  2. A larger object stored on the heap and referenced with a
  //     std::shared_ptr.
  //  3. A std::exception_ptr, together with either:
  //       a. A pointer to the referenced std::exception object, or
  //       b. A pointer to a std::type_info object for the referenced exception,
  //          or for an unspecified type if the type is unknown.
  // This is accomplished with the help of a union and a pointer to a hand-
  // rolled virtual table. This virtual table contains pointers to functions
  // that know which field of the union is active and do the proper action.
  // The class invariant ensures that the vtable ptr and the union stay in sync.
  struct VTable {
    void (*copy_)(exception_wrapper const*, exception_wrapper*);
    void (*move_)(exception_wrapper*, exception_wrapper*);
    void (*delete_)(exception_wrapper*);
    void (*throw_)(exception_wrapper const*);
    std::type_info const* (*type_)(exception_wrapper const*);
    std::exception const* (*get_exception_)(exception_wrapper const*);
    exception_wrapper (*get_exception_ptr_)(exception_wrapper const*);
  };

  [[noreturn]] static void onNoExceptionError(char const* name);

  template <class Ret, class... Args>
  static Ret noop_(Args...);

  static std::type_info const* uninit_type_(exception_wrapper const*);

  static VTable const uninit_;

  template <class Ex>
  using IsStdException = std::is_base_of<std::exception, _t<std::decay<Ex>>>;
  template <bool B, class T>
  using AddConstIf = exception_wrapper_detail::AddConstIf<B, T>;
  template <class CatchFn>
  using IsCatchAll =
      std::is_same<arg_type<_t<std::decay<CatchFn>>>, AnyException>;

  struct Unknown {};

  // Sadly, with the gcc-4.9 platform, std::logic_error and std::runtime_error
  // do not fit here. They also don't have noexcept copy-ctors, so the internal
  // storage wouldn't be used anyway. For the gcc-5 platform, both logic_error
  // and runtime_error can be safely stored internally.
  struct Buffer {
    using Storage =
        _t<std::aligned_storage<2 * sizeof(void*), alignof(std::exception)>>;
    Storage buff_;

    Buffer() : buff_{} {}

    template <class Ex, typename... As>
    Buffer(in_place_type_t<Ex>, As&&... as_);
    template <class Ex>
    Ex& as() noexcept;
    template <class Ex>
    Ex const& as() const noexcept;
  };

  struct ThrownTag {};
  struct InSituTag {};
  struct OnHeapTag {};

  template <class T>
  using PlacementOf = _t<std::conditional<
      !IsStdException<T>::value,
      ThrownTag,
      _t<std::conditional<
          sizeof(T) <= sizeof(Buffer::Storage) &&
              alignof(T) <= alignof(Buffer::Storage) &&
              noexcept(T(std::declval<T&&>())) &&
              noexcept(T(std::declval<T const&>())),
          InSituTag,
          OnHeapTag>>>>;

  static std::exception const* as_exception_or_null_(std::exception const& ex);
  static std::exception const* as_exception_or_null_(AnyException);

  struct ExceptionPtr {
    std::exception_ptr ptr_;
    std::uintptr_t exception_or_type_; // odd for type_info
    static_assert(
        1 < alignof(std::exception) && 1 < alignof(std::type_info),
        "Surprise! std::exception and std::type_info don't have alignment "
        "greater than one. as_int_ below will not work!");

    static std::uintptr_t as_int_(
        std::exception_ptr const& ptr,
        std::exception const& e) noexcept;
    static std::uintptr_t as_int_(
        std::exception_ptr const& ptr,
        AnyException e) noexcept;
    bool has_exception_() const;
    std::exception const* as_exception_() const;
    std::type_info const* as_type_() const;
    static void copy_(exception_wrapper const* from, exception_wrapper* to);
    static void move_(exception_wrapper* from, exception_wrapper* to);
    static void delete_(exception_wrapper* that);
    [[noreturn]] static void throw_(exception_wrapper const* that);
    static std::type_info const* type_(exception_wrapper const* that);
    static std::exception const* get_exception_(exception_wrapper const* that);
    static exception_wrapper get_exception_ptr_(exception_wrapper const* that);
    static VTable const ops_;
  };

  template <class Ex>
  struct InPlace {
    static_assert(IsStdException<Ex>::value, "only deriving std::exception");
    static void copy_(exception_wrapper const* from, exception_wrapper* to);
    static void move_(exception_wrapper* from, exception_wrapper* to);
    static void delete_(exception_wrapper* that);
    [[noreturn]] static void throw_(exception_wrapper const* that);
    static std::type_info const* type_(exception_wrapper const*);
    static std::exception const* get_exception_(exception_wrapper const* that);
    static exception_wrapper get_exception_ptr_(exception_wrapper const* that);
    static constexpr VTable const ops_{copy_,
                                       move_,
                                       delete_,
                                       throw_,
                                       type_,
                                       get_exception_,
                                       get_exception_ptr_};
  };

  struct SharedPtr {
    struct Base {
      std::type_info const* info_;
      Base() = default;
      explicit Base(std::type_info const& info) : info_(&info) {}
      virtual ~Base() {}
      virtual void throw_() const = 0;
      virtual std::exception const* get_exception_() const noexcept = 0;
      virtual exception_wrapper get_exception_ptr_() const noexcept = 0;
    };
    template <class Ex>
    struct Impl final : public Base {
      static_assert(IsStdException<Ex>::value, "only deriving std::exception");
      Ex ex_;
      Impl() = default;
      // clang-format off
      template <typename... As>
      explicit Impl(As&&... as)
          : Base{typeid(Ex)}, ex_(std::forward<As>(as)...) {}
      [[noreturn]] void throw_() const override;
      // clang-format on
      std::exception const* get_exception_() const noexcept override;
      exception_wrapper get_exception_ptr_() const noexcept override;
    };
    std::shared_ptr<Base> ptr_;

    static void copy_(exception_wrapper const* from, exception_wrapper* to);
    static void move_(exception_wrapper* from, exception_wrapper* to);
    static void delete_(exception_wrapper* that);
    [[noreturn]] static void throw_(exception_wrapper const* that);
    static std::type_info const* type_(exception_wrapper const* that);
    static std::exception const* get_exception_(exception_wrapper const* that);
    static exception_wrapper get_exception_ptr_(exception_wrapper const* that);
    static VTable const ops_;
  };

  union {
    Buffer buff_{};
    ExceptionPtr eptr_;
    SharedPtr sptr_;
  };
  VTable const* vptr_{&uninit_};

  template <class Ex, typename... As>
  exception_wrapper(ThrownTag, in_place_type_t<Ex>, As&&... as);

  template <class Ex, typename... As>
  exception_wrapper(OnHeapTag, in_place_type_t<Ex>, As&&... as);

  template <class Ex, typename... As>
  exception_wrapper(InSituTag, in_place_type_t<Ex>, As&&... as);

  template <class T>
  struct IsRegularExceptionType
      : StrictConjunction<
            std::is_copy_constructible<T>,
            Negation<std::is_base_of<exception_wrapper, T>>,
            Negation<std::is_abstract<T>>> {};

  template <class CatchFn, bool IsConst = false>
  struct ExceptionTypeOf;

  template <bool IsConst>
  struct HandleReduce;

  template <bool IsConst>
  struct HandleStdExceptReduce;

  template <class This, class... CatchFns>
  static void handle_(std::false_type, This& this_, CatchFns&... fns);

  template <class This, class... CatchFns>
  static void handle_(std::true_type, This& this_, CatchFns&... fns);

  template <class Ex, class This, class Fn>
  static bool with_exception_(This& this_, Fn fn_);

 public:
  static exception_wrapper from_exception_ptr(
      std::exception_ptr const& eptr) noexcept;

  //! Default-constructs an empty `exception_wrapper`
  //! \post `type() == none()`
  exception_wrapper() noexcept {}

  //! Move-constructs an `exception_wrapper`
  //! \post `*this` contains the value of `that` prior to the move
  //! \post `that.type() == none()`
  exception_wrapper(exception_wrapper&& that) noexcept;

  //! Copy-constructs an `exception_wrapper`
  //! \post `*this` contains a copy of `that`, and `that` is unmodified
  //! \post `type() == that.type()`
  exception_wrapper(exception_wrapper const& that) noexcept;

  //! Move-assigns an `exception_wrapper`
  //! \pre `this != &that`
  //! \post `*this` contains the value of `that` prior to the move
  //! \post `that.type() == none()`
  exception_wrapper& operator=(exception_wrapper&& that) noexcept;

  //! Copy-assigns an `exception_wrapper`
  //! \post `*this` contains a copy of `that`, and `that` is unmodified
  //! \post `type() == that.type()`
  exception_wrapper& operator=(exception_wrapper const& that) noexcept;

  ~exception_wrapper();

  //! \pre `ptr` is empty, or it holds a reference to an exception that is not
  //!     derived from `std::exception`.
  //! \post `!ptr || bool(*this)`
  //! \post `hasThrownException() == true`
  //! \post `type() == unknown()`
  explicit exception_wrapper(std::exception_ptr ptr) noexcept;

  //! \pre `ptr` holds a reference to `ex`.
  //! \post `hasThrownException() == true`
  //! \post `bool(*this)`
  //! \post `type() == typeid(ex)`
  template <class Ex>
  exception_wrapper(std::exception_ptr ptr, Ex& ex) noexcept;

  //! \pre `typeid(ex) == typeid(typename decay<Ex>::type)`
  //! \post `bool(*this)`
  //! \post `hasThrownException() == false`
  //! \post `type() == typeid(ex)`
  //! \note Exceptions of types derived from `std::exception` can be implicitly
  //!     converted to an `exception_wrapper`.
  template <
      class Ex,
      class Ex_ = _t<std::decay<Ex>>,
      FOLLY_REQUIRES(
          Conjunction<IsStdException<Ex_>, IsRegularExceptionType<Ex_>>::value)>
  /* implicit */ exception_wrapper(Ex&& ex);

  //! \pre `typeid(ex) == typeid(typename decay<Ex>::type)`
  //! \post `bool(*this)`
  //! \post `hasThrownException() == false`
  //! \post `type() == typeid(ex)`
  //! \note Exceptions of types not derived from `std::exception` can still be
  //!     used to construct an `exception_wrapper`, but you must specify
  //!     `folly::in_place` as the first parameter.
  template <
      class Ex,
      class Ex_ = _t<std::decay<Ex>>,
      FOLLY_REQUIRES(IsRegularExceptionType<Ex_>::value)>
  exception_wrapper(in_place_t, Ex&& ex);

  template <
      class Ex,
      typename... As,
      FOLLY_REQUIRES(IsRegularExceptionType<Ex>::value)>
  exception_wrapper(in_place_type_t<Ex>, As&&... as);

  //! Swaps the value of `*this` with the value of `that`
  void swap(exception_wrapper& that) noexcept;

  //! \return `true` if `*this` is holding an exception.
  explicit operator bool() const noexcept;

  //! \return `!bool(*this)`
  bool operator!() const noexcept;

  //! Make this `exception_wrapper` empty
  //! \post `!*this`
  void reset();

  //! \return `true` if this `exception_wrapper` holds a reference to an
  //!     exception that was thrown (i.e., if it was constructed with
  //!     a `std::exception_ptr`, or if `to_exception_ptr()` was called on a
  //!     (non-const) reference to `*this`).
  bool has_exception_ptr() const noexcept;

  //! \return a pointer to the `std::exception` held by `*this`, if it holds
  //!     one; otherwise, returns `nullptr`.
  //! \note This function does not mutate the `exception_wrapper` object.
  //! \note This function never causes an exception to be thrown.
  std::exception* get_exception() noexcept;
  //! \overload
  std::exception const* get_exception() const noexcept;

  //! \returns a pointer to the `Ex` held by `*this`, if it holds an object
  //!     whose type `From` permits `std::is_convertible<From*, Ex*>`;
  //!     otherwise, returns `nullptr`.
  //! \note This function does not mutate the `exception_wrapper` object.
  //! \note This function may cause an exception to be thrown and immediately
  //!     caught internally, affecting runtime performance.
  template <typename Ex>
  Ex* get_exception() noexcept;
  //! \overload
  template <typename Ex>
  Ex const* get_exception() const noexcept;

  //! \return A `std::exception_ptr` that references either the exception held
  //!     by `*this`, or a copy of same.
  //! \note This function may need to throw an exception to complete the action.
  //! \note The non-const overload of this function mutates `*this` to cache the
  //!     computed `std::exception_ptr`; that is, this function may cause
  //!     `has_exception_ptr()` to change from `false` to `true`.
  std::exception_ptr const& to_exception_ptr() noexcept;
  //! \overload
  std::exception_ptr to_exception_ptr() const noexcept;

  //! \return the `typeid` of an unspecified type used by
  //!     `exception_wrapper::type()` to denote an empty `exception_wrapper`.
  static std::type_info const& none() noexcept;
  //! \return the `typeid` of an unspecified type used by
  //!     `exception_wrapper::type()` to denote an `exception_wrapper` that
  //!     holds an exception of unknown type.
  static std::type_info const& unknown() noexcept;

  //! Returns the `typeid` of the wrapped exception object. If there is no
  //!     wrapped exception object, returns `exception_wrapper::none()`. If
  //!     this instance wraps an exception of unknown type not derived from
  //!     `std::exception`, returns `exception_wrapper::unknown()`.
  std::type_info const& type() const noexcept;

  //! \return If `get_exception() != nullptr`, `class_name() + ": " +
  //!     get_exception()->what()`; otherwise, `class_name()`.
  folly::fbstring what() const;

  //! \return If `!*this`, the empty string; otherwise, if
  //!     `type() == unknown()`, the string `"<unknown exception>"`; otherwise,
  //!     the result of `type().name()` after demangling.
  folly::fbstring class_name() const;

  //! \tparam Ex The expression type to check for compatibility with.
  //! \return `true` if and only if `*this` wraps an exception that would be
  //!     caught with a `catch(Ex const&)` clause.
  //! \note If `*this` is empty, this function returns `false`.
  template <class Ex>
  bool is_compatible_with() const noexcept;

  //! Throws the wrapped expression.
  //! \pre `bool(*this)`
  [[noreturn]] void throw_exception() const;

  //! Throws the wrapped expression nested into another exception.
  //! \pre `bool(*this)`
  //! \tparam ex Exception in *this will be thrown nested into ex;
  //      see std::throw_with_nested() for details on this semantic.
  template <class Ex>
  [[noreturn]] void throw_with_nested(Ex&& ex) const;

  //! Call `fn` with the wrapped exception (if any), if `fn` can accept it.
  //! \par Example
  //! \code
  //! exception_wrapper ew{std::runtime_error("goodbye cruel world")};
  //!
  //! assert( ew.with_exception([](std::runtime_error& e){/*...*/}) );
  //!
  //! assert( !ew.with_exception([](int& e){/*...*/}) );
  //!
  //! assert( !exception_wrapper{}.with_exception([](int& e){/*...*/}) );
  //! \endcode
  //! \tparam Ex Optionally, the type of the exception that `fn` accepts.
  //! \tparam Fn The type of a monomophic function object.
  //! \param fn A function object to call with the wrapped exception
  //! \return `true` if and only if `fn` was called.
  //! \note Optionally, you may explicitly specify the type of the exception
  //!     that `fn` expects, as in
  //! \code
  //! ew.with_exception<std::runtime_error>([](auto&& e) { /*...*/; });
  //! \endcode
  //! \note The handler may or may not be invoked with an active exception.
  //!     **Do not try to rethrow the exception with `throw;` from within your
  //!     handler -- that is, a throw expression with no operand.** This may
  //!     cause your process to terminate. (It is perfectly ok to throw from
  //!     a handler so long as you specify the exception to throw, as in
  //!     `throw e;`.)
  template <class Ex = void const, class Fn>
  bool with_exception(Fn fn);
  //! \overload
  template <class Ex = void const, class Fn>
  bool with_exception(Fn fn) const;

  //! Handle the wrapped expression as if with a series of `catch` clauses,
  //!     propagating the exception if no handler matches.
  //! \par Example
  //! \code
  //! exception_wrapper ew{std::runtime_error("goodbye cruel world")};
  //!
  //! ew.handle(
  //!   [&](std::logic_error const& e) {
  //!      LOG(DFATAL) << "ruh roh";
  //!      ew.throw_exception(); // rethrow the active exception without
  //!                           // slicing it. Will not be caught by other
  //!                           // handlers in this call.
  //!   },
  //!   [&](std::exception const& e) {
  //!      LOG(ERROR) << ew.what();
  //!   });
  //! \endcode
  //! In the above example, any exception _not_ derived from `std::exception`
  //!     will be propagated. To specify a catch-all clause, pass a lambda that
  //!     takes a C-style elipses, as in:
  //! \code
  //! ew.handle(/*...* /, [](...) { /* handle unknown exception */ } )
  //! \endcode
  //! \pre `!*this`
  //! \tparam CatchFns... A pack of unary monomorphic function object types.
  //! \param fns A pack of unary monomorphic function objects to be treated as
  //!     an ordered list of potential exception handlers.
  //! \note The handlers may or may not be invoked with an active exception.
  //!     **Do not try to rethrow the exception with `throw;` from within your
  //!     handler -- that is, a throw expression with no operand.** This may
  //!     cause your process to terminate. (It is perfectly ok to throw from
  //!     a handler so long as you specify the exception to throw, as in
  //!     `throw e;`.)
  template <class... CatchFns>
  void handle(CatchFns... fns);
  //! \overload
  template <class... CatchFns>
  void handle(CatchFns... fns) const;
};

template <class Ex>
constexpr exception_wrapper::VTable exception_wrapper::InPlace<Ex>::ops_;

/**
 * \return An `exception_wrapper` that wraps an instance of type `Ex`
 *     that has been constructed with arguments `std::forward<As>(as)...`.
 */
template <class Ex, typename... As>
exception_wrapper make_exception_wrapper(As&&... as) {
  return exception_wrapper{in_place_type<Ex>, std::forward<As>(as)...};
}

/**
 * Inserts `ew.what()` into the ostream `sout`.
 * \return `sout`
 */
template <class Ch>
std::basic_ostream<Ch>& operator<<(
    std::basic_ostream<Ch>& sout,
    exception_wrapper const& ew) {
  return sout << ew.what();
}

/**
 * Swaps the value of `a` with the value of `b`.
 */
inline void swap(exception_wrapper& a, exception_wrapper& b) noexcept {
  a.swap(b);
}

// For consistency with exceptionStr() functions in ExceptionString.h
fbstring exceptionStr(exception_wrapper const& ew);

namespace detail {
template <typename F>
inline exception_wrapper try_and_catch_(F&& f) {
  return (f(), exception_wrapper());
}

template <typename F, typename Ex, typename... Exs>
inline exception_wrapper try_and_catch_(F&& f) {
  try {
    return try_and_catch_<F, Exs...>(std::forward<F>(f));
  } catch (Ex& ex) {
    return exception_wrapper(std::current_exception(), ex);
  }
}
} // namespace detail

//! `try_and_catch` is a simple replacement for `try {} catch(){}`` that allows
//! you to specify which derived exceptions you would like to catch and store in
//! an `exception_wrapper`.
//!
//! Because we cannot build an equivalent of `std::current_exception()`, we need
//! to catch every derived exception that we are interested in catching.
//!
//! Exceptions should be listed in the reverse order that you would write your
//! catch statements (that is, `std::exception&` should be first).
//!
//! \par Example Usage:
//! \code
//! // This catches my runtime_error and if I call throw_exception() on ew, it
//! // will throw a runtime_error
//! auto ew = folly::try_and_catch<std::exception, std::runtime_error>([=]() {
//!   if (badThingHappens()) {
//!     throw std::runtime_error("ZOMG!");
//!   }
//! });
//!
//! // This will catch the exception and if I call throw_exception() on ew, it
//! // will throw a std::exception
//! auto ew = folly::try_and_catch<std::exception, std::runtime_error>([=]() {
//!   if (badThingHappens()) {
//!     throw std::exception();
//!   }
//! });
//!
//! // This will not catch the exception and it will be thrown.
//! auto ew = folly::try_and_catch<std::runtime_error>([=]() {
//!   if (badThingHappens()) {
//!     throw std::exception();
//!   }
//! });
//! \endcode
template <typename... Exceptions, typename F>
exception_wrapper try_and_catch(F&& fn) {
  return detail::try_and_catch_<F, Exceptions...>(std::forward<F>(fn));
}
} // namespace folly

#include <folly/ExceptionWrapper-inl.h>

#undef FOLLY_REQUIRES
#undef FOLLY_REQUIRES_DEF
#ifdef __GNUC__
#pragma GCC diagnostic pop
#endif
