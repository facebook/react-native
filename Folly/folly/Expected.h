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

/**
 * Like folly::Optional, but can store a value *or* and error.
 *
 * @author Eric Niebler (eniebler@fb.com)
 */

#pragma once

#include <cstddef>
#include <initializer_list>
#include <new>
#include <stdexcept>
#include <type_traits>
#include <utility>

#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/Preprocessor.h>
#include <folly/Traits.h> // for construct_in_place_t
#include <folly/Unit.h>

#define FOLLY_EXPECTED_ID(X) FB_CONCATENATE(FB_CONCATENATE(Folly, X), __LINE__)

#define FOLLY_REQUIRES_IMPL(...)                                            \
  bool FOLLY_EXPECTED_ID(Requires) = false,                                 \
       typename std::enable_if<                                             \
           (FOLLY_EXPECTED_ID(Requires) || static_cast<bool>(__VA_ARGS__)), \
           int>::type = 0

#define FOLLY_REQUIRES_TRAILING(...) , FOLLY_REQUIRES_IMPL(__VA_ARGS__)

#define FOLLY_REQUIRES(...) template <FOLLY_REQUIRES_IMPL(__VA_ARGS__)>

/**
 * gcc-4.7 warns about use of uninitialized memory around the use of storage_
 * even though this is explicitly initialized at each point.
 */
#if defined(__GNUC__) && !defined(__clang__)
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wuninitialized"
#pragma GCC diagnostic ignored "-Wpragmas"
#pragma GCC diagnostic ignored "-Wmaybe-uninitialized"
#endif // __GNUC__

namespace folly {

/**
 * Forward declarations
 */
template <class Error>
class Unexpected;

template <class Error>
constexpr Unexpected<typename std::decay<Error>::type> makeUnexpected(Error&&);

template <class Value, class Error>
class Expected;

template <class Error, class Value>
constexpr Expected<typename std::decay<Value>::type, Error> makeExpected(
    Value&&);

/**
 * Alias for an Expected type's assiciated value_type
 */
template <class Expected>
using ExpectedValueType =
    typename std::remove_reference<Expected>::type::value_type;

/**
 * Alias for an Expected type's assiciated error_type
 */
template <class Expected>
using ExpectedErrorType =
    typename std::remove_reference<Expected>::type::error_type;

// Details...
namespace expected_detail {
#ifdef _MSC_VER
// MSVC 2015 can't handle the StrictConjunction, so we have
// to use std::conjunction instead.
template <template <class...> class Trait, class... Ts>
using StrictAllOf = std::conjunction<Trait<Ts>...>;
#else
template <template <class...> class Trait, class... Ts>
using StrictAllOf = StrictConjunction<Trait<Ts>...>;
#endif

template <class T>
using IsCopyable = StrictConjunction<
    std::is_copy_constructible<T>,
    std::is_copy_assignable<T>>;

template <class T>
using IsMovable = StrictConjunction<
    std::is_move_constructible<T>,
    std::is_move_assignable<T>>;

template <class T>
using IsNothrowCopyable = StrictConjunction<
    std::is_nothrow_copy_constructible<T>,
    std::is_nothrow_copy_assignable<T>>;

template <class T>
using IsNothrowMovable = StrictConjunction<
    std::is_nothrow_move_constructible<T>,
    std::is_nothrow_move_assignable<T>>;

template <class From, class To>
using IsConvertible = StrictConjunction<
    std::is_constructible<To, From>,
    std::is_assignable<To&, From>>;

template <class T, class U>
auto doEmplaceAssign(int, T& t, U&& u) -> decltype(void(t = (U &&)u)) {
  t = (U &&)u;
}

template <class T, class U>
auto doEmplaceAssign(long, T& t, U&& u) -> decltype(void(T((U &&)u))) {
  t.~T();
  ::new ((void*)std::addressof(t)) T((U &&)u);
}

template <class T, class... Us>
auto doEmplaceAssign(int, T& t, Us&&... us)
    -> decltype(void(t = T((Us &&)us...))) {
  t = T((Us &&)us...);
}

template <class T, class... Us>
auto doEmplaceAssign(long, T& t, Us&&... us)
    -> decltype(void(T((Us &&)us...))) {
  t.~T();
  ::new ((void*)std::addressof(t)) T((Us &&)us...);
}

struct EmptyTag {};
struct ValueTag {};
struct ErrorTag {};
enum class Which : unsigned char { eEmpty, eValue, eError };
enum class StorageType { ePODStruct, ePODUnion, eUnion };

template <class Value, class Error>
constexpr StorageType getStorageType() {
  return StrictAllOf<IsTriviallyCopyable, Value, Error>::value
      ? (sizeof(std::pair<Value, Error>) <= sizeof(void * [2]) &&
                 StrictAllOf<std::is_trivial, Value, Error>::value
             ? StorageType::ePODStruct
             : StorageType::ePODUnion)
      : StorageType::eUnion;
}

template <
    class Value,
    class Error,
    StorageType = expected_detail::getStorageType<Value, Error>()> // ePODUnion
struct ExpectedStorage {
  using value_type = Value;
  using error_type = Error;
  union {
    Value value_;
    Error error_;
    char ch_;
  };
  Which which_;

  template <class E = Error, class = decltype(E{})>
  constexpr ExpectedStorage() noexcept(noexcept(E{}))
      : error_{}, which_(Which::eError) {}
  explicit constexpr ExpectedStorage(EmptyTag) noexcept
      : ch_{}, which_(Which::eEmpty) {}
  template <class... Vs>
  explicit constexpr ExpectedStorage(ValueTag, Vs&&... vs) noexcept(
      noexcept(Value(static_cast<Vs&&>(vs)...)))
      : value_(static_cast<Vs&&>(vs)...), which_(Which::eValue) {}
  template <class... Es>
  explicit constexpr ExpectedStorage(ErrorTag, Es&&... es) noexcept(
      noexcept(Error(static_cast<Es&&>(es)...)))
      : error_(static_cast<Es&&>(es)...), which_(Which::eError) {}
  void clear() noexcept {}
  static constexpr bool uninitializedByException() noexcept {
    // Although which_ may temporarily be eEmpty during construction, it
    // is always either eValue or eError for a fully-constructed Expected.
    return false;
  }
  template <class... Vs>
  void assignValue(Vs&&... vs) {
    expected_detail::doEmplaceAssign(0, value_, static_cast<Vs&&>(vs)...);
    which_ = Which::eValue;
  }
  template <class... Es>
  void assignError(Es&&... es) {
    expected_detail::doEmplaceAssign(0, error_, static_cast<Es&&>(es)...);
    which_ = Which::eError;
  }
  template <class Other>
  void assign(Other&& that) {
    switch (that.which_) {
      case Which::eValue:
        this->assignValue(static_cast<Other&&>(that).value());
        break;
      case Which::eError:
        this->assignError(static_cast<Other&&>(that).error());
        break;
      default:
        this->clear();
        break;
    }
  }
  Value& value() & {
    return value_;
  }
  const Value& value() const& {
    return value_;
  }
  Value&& value() && {
    return std::move(value_);
  }
  Error& error() & {
    return error_;
  }
  const Error& error() const& {
    return error_;
  }
  Error&& error() && {
    return std::move(error_);
  }
};

template <class Value, class Error>
struct ExpectedUnion {
  union {
    Value value_;
    Error error_;
    char ch_{};
  };
  Which which_ = Which::eEmpty;

  explicit constexpr ExpectedUnion(EmptyTag) noexcept {}
  template <class... Vs>
  explicit constexpr ExpectedUnion(ValueTag, Vs&&... vs) noexcept(
      noexcept(Value(static_cast<Vs&&>(vs)...)))
      : value_(static_cast<Vs&&>(vs)...), which_(Which::eValue) {}
  template <class... Es>
  explicit constexpr ExpectedUnion(ErrorTag, Es&&... es) noexcept(
      noexcept(Error(static_cast<Es&&>(es)...)))
      : error_(static_cast<Es&&>(es)...), which_(Which::eError) {}
  ExpectedUnion(const ExpectedUnion&) {}
  ExpectedUnion(ExpectedUnion&&) noexcept {}
  ExpectedUnion& operator=(const ExpectedUnion&) {
    return *this;
  }
  ExpectedUnion& operator=(ExpectedUnion&&) noexcept {
    return *this;
  }
  ~ExpectedUnion() {}
  Value& value() & {
    return value_;
  }
  const Value& value() const& {
    return value_;
  }
  Value&& value() && {
    return std::move(value_);
  }
  Error& error() & {
    return error_;
  }
  const Error& error() const& {
    return error_;
  }
  Error&& error() && {
    return std::move(error_);
  }
};

template <class Derived, bool, bool Noexcept>
struct CopyConstructible {
  constexpr CopyConstructible() = default;
  CopyConstructible(const CopyConstructible& that) noexcept(Noexcept) {
    static_cast<Derived*>(this)->assign(static_cast<const Derived&>(that));
  }
  constexpr CopyConstructible(CopyConstructible&&) = default;
  CopyConstructible& operator=(const CopyConstructible&) = default;
  CopyConstructible& operator=(CopyConstructible&&) = default;
};

template <class Derived, bool Noexcept>
struct CopyConstructible<Derived, false, Noexcept> {
  constexpr CopyConstructible() = default;
  CopyConstructible(const CopyConstructible&) = delete;
  constexpr CopyConstructible(CopyConstructible&&) = default;
  CopyConstructible& operator=(const CopyConstructible&) = default;
  CopyConstructible& operator=(CopyConstructible&&) = default;
};

template <class Derived, bool, bool Noexcept>
struct MoveConstructible {
  constexpr MoveConstructible() = default;
  constexpr MoveConstructible(const MoveConstructible&) = default;
  MoveConstructible(MoveConstructible&& that) noexcept(Noexcept) {
    static_cast<Derived*>(this)->assign(std::move(static_cast<Derived&>(that)));
  }
  MoveConstructible& operator=(const MoveConstructible&) = default;
  MoveConstructible& operator=(MoveConstructible&&) = default;
};

template <class Derived, bool Noexcept>
struct MoveConstructible<Derived, false, Noexcept> {
  constexpr MoveConstructible() = default;
  constexpr MoveConstructible(const MoveConstructible&) = default;
  MoveConstructible(MoveConstructible&&) = delete;
  MoveConstructible& operator=(const MoveConstructible&) = default;
  MoveConstructible& operator=(MoveConstructible&&) = default;
};

template <class Derived, bool, bool Noexcept>
struct CopyAssignable {
  constexpr CopyAssignable() = default;
  constexpr CopyAssignable(const CopyAssignable&) = default;
  constexpr CopyAssignable(CopyAssignable&&) = default;
  CopyAssignable& operator=(const CopyAssignable& that) noexcept(Noexcept) {
    static_cast<Derived*>(this)->assign(static_cast<const Derived&>(that));
    return *this;
  }
  CopyAssignable& operator=(CopyAssignable&&) = default;
};

template <class Derived, bool Noexcept>
struct CopyAssignable<Derived, false, Noexcept> {
  constexpr CopyAssignable() = default;
  constexpr CopyAssignable(const CopyAssignable&) = default;
  constexpr CopyAssignable(CopyAssignable&&) = default;
  CopyAssignable& operator=(const CopyAssignable&) = delete;
  CopyAssignable& operator=(CopyAssignable&&) = default;
};

template <class Derived, bool, bool Noexcept>
struct MoveAssignable {
  constexpr MoveAssignable() = default;
  constexpr MoveAssignable(const MoveAssignable&) = default;
  constexpr MoveAssignable(MoveAssignable&&) = default;
  MoveAssignable& operator=(const MoveAssignable&) = default;
  MoveAssignable& operator=(MoveAssignable&& that) noexcept(Noexcept) {
    static_cast<Derived*>(this)->assign(std::move(static_cast<Derived&>(that)));
    return *this;
  }
};

template <class Derived, bool Noexcept>
struct MoveAssignable<Derived, false, Noexcept> {
  constexpr MoveAssignable() = default;
  constexpr MoveAssignable(const MoveAssignable&) = default;
  constexpr MoveAssignable(MoveAssignable&&) = default;
  MoveAssignable& operator=(const MoveAssignable&) = default;
  MoveAssignable& operator=(MoveAssignable&& that) = delete;
};

template <class Value, class Error>
struct ExpectedStorage<Value, Error, StorageType::eUnion>
    : ExpectedUnion<Value, Error>,
      CopyConstructible<
          ExpectedStorage<Value, Error, StorageType::eUnion>,
          StrictAllOf<std::is_copy_constructible, Value, Error>::value,
          StrictAllOf<std::is_nothrow_copy_constructible, Value, Error>::value>,
      MoveConstructible<
          ExpectedStorage<Value, Error, StorageType::eUnion>,
          StrictAllOf<std::is_move_constructible, Value, Error>::value,
          StrictAllOf<std::is_nothrow_move_constructible, Value, Error>::value>,
      CopyAssignable<
          ExpectedStorage<Value, Error, StorageType::eUnion>,
          StrictAllOf<IsCopyable, Value, Error>::value,
          StrictAllOf<IsNothrowCopyable, Value, Error>::value>,
      MoveAssignable<
          ExpectedStorage<Value, Error, StorageType::eUnion>,
          StrictAllOf<IsMovable, Value, Error>::value,
          StrictAllOf<IsNothrowMovable, Value, Error>::value> {
  using value_type = Value;
  using error_type = Error;
  using Base = ExpectedUnion<Value, Error>;
  template <class E = Error, class = decltype(E{})>
  constexpr ExpectedStorage() noexcept(noexcept(E{})) : Base{ErrorTag{}} {}
  ExpectedStorage(const ExpectedStorage&) = default;
  ExpectedStorage(ExpectedStorage&&) = default;
  ExpectedStorage& operator=(const ExpectedStorage&) = default;
  ExpectedStorage& operator=(ExpectedStorage&&) = default;
  using ExpectedUnion<Value, Error>::ExpectedUnion;
  ~ExpectedStorage() {
    clear();
  }
  void clear() noexcept {
    switch (this->which_) {
      case Which::eValue:
        this->value().~Value();
        break;
      case Which::eError:
        this->error().~Error();
        break;
      default:
        break;
    }
    this->which_ = Which::eEmpty;
  }
  bool uninitializedByException() const noexcept {
    return this->which_ == Which::eEmpty;
  }
  template <class... Vs>
  void assignValue(Vs&&... vs) {
    if (this->which_ == Which::eValue) {
      expected_detail::doEmplaceAssign(
          0, this->value(), static_cast<Vs&&>(vs)...);
    } else {
      this->clear();
      ::new ((void*)std::addressof(this->value()))
          Value(static_cast<Vs&&>(vs)...);
      this->which_ = Which::eValue;
    }
  }
  template <class... Es>
  void assignError(Es&&... es) {
    if (this->which_ == Which::eError) {
      expected_detail::doEmplaceAssign(
          0, this->error(), static_cast<Es&&>(es)...);
    } else {
      this->clear();
      ::new ((void*)std::addressof(this->error()))
          Error(static_cast<Es&&>(es)...);
      this->which_ = Which::eError;
    }
  }
  bool isSelfAssign(const ExpectedStorage* that) const {
    return this == that;
  }
  constexpr bool isSelfAssign(const void*) const {
    return false;
  }
  template <class Other>
  void assign(Other&& that) {
    if (isSelfAssign(&that))
      return;
    switch (that.which_) {
      case Which::eValue:
        this->assignValue(static_cast<Other&&>(that).value());
        break;
      case Which::eError:
        this->assignError(static_cast<Other&&>(that).error());
        break;
      default:
        this->clear();
        break;
    }
  }
};

// For small (pointer-sized) trivial types, a struct is faster than a union.
template <class Value, class Error>
struct ExpectedStorage<Value, Error, StorageType::ePODStruct> {
  using value_type = Value;
  using error_type = Error;
  Which which_;
  Error error_;
  Value value_;

  constexpr ExpectedStorage() noexcept
      : which_(Which::eError), error_{}, value_{} {}
  explicit constexpr ExpectedStorage(EmptyTag) noexcept
      : which_(Which::eEmpty), error_{}, value_{} {}
  template <class... Vs>
  explicit constexpr ExpectedStorage(ValueTag, Vs&&... vs) noexcept(
      noexcept(Value(static_cast<Vs&&>(vs)...)))
      : which_(Which::eValue), error_{}, value_(static_cast<Vs&&>(vs)...) {}
  template <class... Es>
  explicit constexpr ExpectedStorage(ErrorTag, Es&&... es) noexcept(
      noexcept(Error(static_cast<Es&&>(es)...)))
      : which_(Which::eError), error_(static_cast<Es&&>(es)...), value_{} {}
  void clear() noexcept {}
  constexpr static bool uninitializedByException() noexcept {
    return false;
  }
  template <class... Vs>
  void assignValue(Vs&&... vs) {
    expected_detail::doEmplaceAssign(0, value_, static_cast<Vs&&>(vs)...);
    which_ = Which::eValue;
  }
  template <class... Es>
  void assignError(Es&&... es) {
    expected_detail::doEmplaceAssign(0, error_, static_cast<Es&&>(es)...);
    which_ = Which::eError;
  }
  template <class Other>
  void assign(Other&& that) {
    switch (that.which_) {
      case Which::eValue:
        this->assignValue(static_cast<Other&&>(that).value());
        break;
      case Which::eError:
        this->assignError(static_cast<Other&&>(that).error());
        break;
      default:
        this->clear();
        break;
    }
  }
  Value& value() & {
    return value_;
  }
  const Value& value() const& {
    return value_;
  }
  Value&& value() && {
    return std::move(value_);
  }
  Error& error() & {
    return error_;
  }
  const Error& error() const& {
    return error_;
  }
  Error&& error() && {
    return std::move(error_);
  }
};

namespace expected_detail_ExpectedHelper {
// Tricky hack so that Expected::then can handle lambdas that return void
template <class T>
inline T&& operator,(T&& t, Unit) noexcept {
  return static_cast<T&&>(t);
}

struct ExpectedHelper {
  template <class Error, class T>
  static constexpr Expected<T, Error> return_(T t) {
    return folly::makeExpected<Error>(t);
  }
  template <
      class Error,
      class T,
      class U FOLLY_REQUIRES_TRAILING(
          expected_detail::IsConvertible<U&&, Error>::value)>
  static constexpr Expected<T, Error> return_(Expected<T, U> t) {
    return t;
  }

  template <class This>
  static typename std::decay<This>::type then_(This&& ex) {
    return static_cast<This&&>(ex);
  }

  FOLLY_PUSH_WARNING
  // Don't warn about not using the overloaded comma operator.
  FOLLY_MSVC_DISABLE_WARNING(4913)
  template <
      class This,
      class Fn,
      class... Fns,
      class E = ExpectedErrorType<This>,
      class T = ExpectedHelper>
  static auto then_(This&& ex, Fn&& fn, Fns&&... fns) -> decltype(T::then_(
      T::template return_<E>(
          (std::declval<Fn>()(std::declval<This>().value()), unit)),
      std::declval<Fns>()...)) {
    if (LIKELY(ex.which_ == expected_detail::Which::eValue))
      return T::then_(
          T::template return_<E>(
              // Uses the comma operator defined above IFF the lambda
              // returns non-void.
              (static_cast<Fn&&>(fn)(static_cast<This&&>(ex).value()), unit)),
          static_cast<Fns&&>(fns)...);
    return makeUnexpected(static_cast<This&&>(ex).error());
  }

  template <
      class This,
      class Yes,
      class No,
      class Ret = decltype(std::declval<Yes>()(std::declval<This>().value())),
      class Err = decltype(std::declval<No>()(std::declval<This>().error()))
          FOLLY_REQUIRES_TRAILING(!std::is_void<Err>::value)>
  static Ret thenOrThrow_(This&& ex, Yes&& yes, No&& no) {
    if (LIKELY(ex.which_ == expected_detail::Which::eValue))
      return Ret(static_cast<Yes&&>(yes)(static_cast<This&&>(ex).value()));
    throw static_cast<No&&>(no)(static_cast<This&&>(ex).error());
  }

  template <
      class This,
      class Yes,
      class No,
      class Ret = decltype(std::declval<Yes>()(std::declval<This>().value())),
      class Err = decltype(std::declval<No>()(std::declval<This&>().error()))
          FOLLY_REQUIRES_TRAILING(std::is_void<Err>::value)>
  static Ret thenOrThrow_(This&& ex, Yes&& yes, No&& no) {
    if (LIKELY(ex.which_ == expected_detail::Which::eValue))
      return Ret(static_cast<Yes&&>(yes)(static_cast<This&&>(ex).value()));
    static_cast<No&&>(no)(ex.error());
    throw typename Unexpected<ExpectedErrorType<This>>::MakeBadExpectedAccess()(
        static_cast<This&&>(ex).error());
  }
  FOLLY_POP_WARNING
};
}
/* using override */ using expected_detail_ExpectedHelper::ExpectedHelper;

struct UnexpectedTag {};

} // namespace expected_detail

using unexpected_t =
    expected_detail::UnexpectedTag (&)(expected_detail::UnexpectedTag);

inline expected_detail::UnexpectedTag unexpected(
    expected_detail::UnexpectedTag = {}) {
  return {};
}

/**
 * An exception type thrown by Expected on catastrophic logic errors.
 */
class BadExpectedAccess : public std::logic_error {
 public:
  BadExpectedAccess() : std::logic_error("bad Expected access") {}
};

/**
 * Unexpected - a helper type used to disambiguate the construction of
 * Expected objects in the error state.
 */
template <class Error>
class Unexpected final {
  template <class E>
  friend class Unexpected;
  template <class V, class E>
  friend class Expected;
  friend struct expected_detail::ExpectedHelper;

 public:
  /**
   * Unexpected::BadExpectedAccess - An exception type thrown by Expected
   * when the user tries to access the nested value but the Expected object is
   * actually storing an error code.
   */
  class BadExpectedAccess : public folly::BadExpectedAccess {
   public:
    explicit BadExpectedAccess(Error err)
        : folly::BadExpectedAccess{}, error_(std::move(err)) {}
    /**
     * The error code that was held by the Expected object when the user
     * erroneously requested the value.
     */
    Error error() const {
      return error_;
    }

   private:
    Error error_;
  };

  /**
   * Constructors
   */
  Unexpected() = default;
  Unexpected(const Unexpected&) = default;
  Unexpected(Unexpected&&) = default;
  Unexpected& operator=(const Unexpected&) = default;
  Unexpected& operator=(Unexpected&&) = default;
  constexpr /* implicit */ Unexpected(const Error& err) : error_(err) {}
  constexpr /* implicit */ Unexpected(Error&& err) : error_(std::move(err)) {}

  template <class Other FOLLY_REQUIRES_TRAILING(
      std::is_constructible<Error, Other&&>::value)>
  constexpr /* implicit */ Unexpected(Unexpected<Other> that)
      : error_(std::move(that.error())) {}

  /**
   * Assignment
   */
  template <class Other FOLLY_REQUIRES_TRAILING(
      std::is_assignable<Error&, Other&&>::value)>
  Unexpected& operator=(Unexpected<Other> that) {
    error_ = std::move(that.error());
  }

  /**
   * Observers
   */
  Error& error() & {
    return error_;
  }
  const Error& error() const& {
    return error_;
  }
  Error&& error() && {
    return std::move(error_);
  }

 private:
  struct MakeBadExpectedAccess {
    template <class E>
    BadExpectedAccess operator()(E&& err) const {
      return BadExpectedAccess(static_cast<E&&>(err));
    }
  };

  Error error_;
};

template <
    class Error FOLLY_REQUIRES_TRAILING(IsEqualityComparable<Error>::value)>
inline bool operator==(
    const Unexpected<Error>& lhs,
    const Unexpected<Error>& rhs) {
  return lhs.error() == rhs.error();
}

template <
    class Error FOLLY_REQUIRES_TRAILING(IsEqualityComparable<Error>::value)>
inline bool operator!=(
    const Unexpected<Error>& lhs,
    const Unexpected<Error>& rhs) {
  return !(lhs == rhs);
}

/**
 * For constructing an Unexpected object from an error code. Unexpected objects
 * are implicitly convertible to Expected object in the error state. Usage is
 * as follows:
 *
 * enum class MyErrorCode { BAD_ERROR, WORSE_ERROR };
 * Expected<int, MyErrorCode> myAPI() {
 *   int i = // ...;
 *   return i ? makeExpected<MyErrorCode>(i)
 *            : makeUnexpected(MyErrorCode::BAD_ERROR);
 * }
 */
template <class Error>
constexpr Unexpected<typename std::decay<Error>::type> makeUnexpected(
    Error&& err) {
  return Unexpected<typename std::decay<Error>::type>{
      static_cast<Error&&>(err)};
}

/**
 * Expected - For holding a value or an error. Useful as an alternative to
 * exceptions, for APIs where throwing on failure would be too expensive.
 *
 * Expected<Value, Error> is a variant over the types Value and Error.
 *
 * Expected does not offer support for references. Use
 * Expected<std::reference_wrapper<T>, Error> if your API needs to return a
 * reference or an error.
 *
 * Expected offers a continuation-based interface to reduce the boilerplate
 * of checking error codes. The Expected::then member function takes a lambda
 * that is to execute should the Expected object contain a value. The return
 * value of the lambda is wrapped in an Expected and returned. If the lambda is
 * not executed because the Expected contains an error, the error is returned
 * immediately in a new Expected object.
 *
 * Expected<int, Error> funcTheFirst();
 * Expected<std::string, Error> funcTheSecond() {
 *   return funcTheFirst().then([](int i) { return std::to_string(i); });
 * }
 *
 * The above line of code could more verbosely written as:
 *
 * Expected<std::string, Error> funcTheSecond() {
 *   if (auto ex = funcTheFirst()) {
 *     return std::to_string(*ex);
 *   }
 *   return makeUnexpected(ex.error());
 * }
 *
 * Continuations can chain, like:
 *
 * Expected<D, Error> maybeD = someFunc()
 *     .then([](A a){return B(a);})
 *     .then([](B b){return C(b);})
 *     .then([](C c){return D(c);});
 *
 * To avoid the redundant error checking that would happen if a call at the
 * front of the chain returns an error, these call chains can be collaped into
 * a single call to .then:
 *
 * Expected<D, Error> maybeD = someFunc()
 *     .then([](A a){return B(a);},
 *           [](B b){return C(b);},
 *           [](C c){return D(c);});
 *
 * The result of .then() is wrapped into Expected< ~, Error > if it isn't
 * of that form already. Consider the following code:
 *
 * extern Expected<std::string, Error> readLineFromIO();
 * extern Expected<int, Error> parseInt(std::string);
 * extern int increment(int);
 *
 * Expected<int, Error> x = readLineFromIO().then(parseInt).then(increment);
 *
 * From the code above, we see that .then() works both with functions that
 * return an Expected< ~, Error > (like parseInt) and with ones that return
 * a plain value (like increment). In the case of parseInt, .then() returns
 * the result of parseInt as-is. In the case of increment, it wraps the int
 * that increment returns into an Expected< int, Error >.
 *
 * Sometimes when using a continuation you would prefer an exception to be
 * thrown for a value-less Expected. For that you can use .thenOrThrow, as
 * follows:
 *
 * B b = someFunc()
 *     .thenOrThrow([](A a){return B(a);});
 *
 * The above call to thenOrThrow will invoke the lambda if the Expected returned
 * by someFunc() contains a value. Otherwise, it will throw an exception of type
 * Unexpected<Error>::BadExpectedAccess. If you prefer it throw an exception of
 * a different type, you can pass a second lambda to thenOrThrow:
 *
 * B b = someFunc()
 *     .thenOrThrow([](A a){return B(a);},
 *                  [](Error e) {throw MyException(e);});
 *
 * Like C++17's std::variant, Expected offers the almost-never-empty guarantee;
 * that is, an Expected<Value, Error> almost always contains either a Value or
 * and Error. Partially-formed Expected objects occur when an assignment to
 * an Expected object that would change the type of the contained object (Value-
 * to-Error or vice versa) throws. Trying to access either the contained value
 * or error object causes Expected to throw folly::BadExpectedAccess.
 *
 * Expected models OptionalPointee, so calling 'get_pointer(ex)' will return a
 * pointer to nullptr if the 'ex' is in the error state, and a pointer to the
 * value otherwise:
 *
 *  Expected<int, Error> maybeInt = ...;
 *  if (int* v = get_pointer(maybeInt)) {
 *    cout << *v << endl;
 *  }
 */
template <class Value, class Error>
class Expected final : expected_detail::ExpectedStorage<Value, Error> {
  template <class, class>
  friend class Expected;
  template <class, class, expected_detail::StorageType>
  friend struct expected_detail::ExpectedStorage;
  friend struct expected_detail::ExpectedHelper;
  using Base = expected_detail::ExpectedStorage<Value, Error>;
  using MakeBadExpectedAccess =
      typename Unexpected<Error>::MakeBadExpectedAccess;
  Base& base() & {
    return *this;
  }
  const Base& base() const& {
    return *this;
  }
  Base&& base() && {
    return std::move(*this);
  }

 public:
  using value_type = Value;
  using error_type = Error;
  using IsTriviallyCopyable = typename expected_detail::
      StrictAllOf<IsTriviallyCopyable, Value, Error>::type;

  template <class U>
  using rebind = Expected<U, Error>;

  static_assert(
      !std::is_reference<Value>::value,
      "Expected may not be used with reference types");
  static_assert(
      !std::is_abstract<Value>::value,
      "Expected may not be used with abstract types");

  /*
   * Constructors
   */
  template <class B = Base, class = decltype(B{})>
  Expected() noexcept(noexcept(B{})) : Base{} {}
  Expected(const Expected& that) = default;
  Expected(Expected&& that) = default;

  template <
      class V,
      class E FOLLY_REQUIRES_TRAILING(
          !std::is_same<Expected<V, E>, Expected>::value &&
          std::is_constructible<Value, V&&>::value &&
          std::is_constructible<Error, E&&>::value)>
  Expected(Expected<V, E> that) : Base{expected_detail::EmptyTag{}} {
    *this = std::move(that);
  }

  FOLLY_REQUIRES(std::is_copy_constructible<Value>::value)
  constexpr /* implicit */ Expected(const Value& val) noexcept(
      noexcept(Value(val)))
      : Base{expected_detail::ValueTag{}, val} {}

  FOLLY_REQUIRES(std::is_move_constructible<Value>::value)
  constexpr /* implicit */ Expected(Value&& val) noexcept(
      noexcept(Value(std::move(val))))
      : Base{expected_detail::ValueTag{}, std::move(val)} {}

  template <class T FOLLY_REQUIRES_TRAILING(
      std::is_convertible<T, Value>::value &&
      !std::is_convertible<T, Error>::value)>
  constexpr /* implicit */ Expected(T&& val) noexcept(
      noexcept(Value(static_cast<T&&>(val))))
      : Base{expected_detail::ValueTag{}, static_cast<T&&>(val)} {}

  template <class... Ts FOLLY_REQUIRES_TRAILING(
      std::is_constructible<Value, Ts&&...>::value)>
  explicit constexpr Expected(in_place_t, Ts&&... ts) noexcept(
      noexcept(Value(std::declval<Ts>()...)))
      : Base{expected_detail::ValueTag{}, static_cast<Ts&&>(ts)...} {}

  template <
      class U,
      class... Ts FOLLY_REQUIRES_TRAILING(
          std::is_constructible<Value, std::initializer_list<U>&, Ts&&...>::
              value)>
  explicit constexpr Expected(
      in_place_t,
      std::initializer_list<U> il,
      Ts&&... ts) noexcept(noexcept(Value(std::declval<Ts>()...)))
      : Base{expected_detail::ValueTag{}, il, static_cast<Ts&&>(ts)...} {}

  // If overload resolution selects one of these deleted functions, that
  // means you need to use makeUnexpected
  /* implicit */ Expected(const Error&) = delete;
  /* implicit */ Expected(Error&&) = delete;

  FOLLY_REQUIRES(std::is_copy_constructible<Error>::value)
  constexpr Expected(unexpected_t, const Error& err) noexcept(
      noexcept(Error(err)))
      : Base{expected_detail::ErrorTag{}, err} {}

  FOLLY_REQUIRES(std::is_move_constructible<Error>::value)
  constexpr Expected(unexpected_t, Error&& err) noexcept(
      noexcept(Error(std::move(err))))
      : Base{expected_detail::ErrorTag{}, std::move(err)} {}

  FOLLY_REQUIRES(std::is_copy_constructible<Error>::value)
  constexpr /* implicit */ Expected(const Unexpected<Error>& err) noexcept(
      noexcept(Error(err.error())))
      : Base{expected_detail::ErrorTag{}, err.error()} {}

  FOLLY_REQUIRES(std::is_move_constructible<Error>::value)
  constexpr /* implicit */ Expected(Unexpected<Error>&& err) noexcept(
      noexcept(Error(std::move(err.error()))))
      : Base{expected_detail::ErrorTag{}, std::move(err.error())} {}

  /*
   * Assignment operators
   */
  Expected& operator=(const Expected& that) = default;
  Expected& operator=(Expected&& that) = default;

  template <
      class V,
      class E FOLLY_REQUIRES_TRAILING(
          !std::is_same<Expected<V, E>, Expected>::value &&
          expected_detail::IsConvertible<V&&, Value>::value &&
          expected_detail::IsConvertible<E&&, Error>::value)>
  Expected& operator=(Expected<V, E> that) {
    this->assign(std::move(that));
    return *this;
  }

  FOLLY_REQUIRES(expected_detail::IsCopyable<Value>::value)
  Expected& operator=(const Value& val) noexcept(
      expected_detail::IsNothrowCopyable<Value>::value) {
    this->assignValue(val);
    return *this;
  }

  FOLLY_REQUIRES(expected_detail::IsMovable<Value>::value)
  Expected& operator=(Value&& val) noexcept(
      expected_detail::IsNothrowMovable<Value>::value) {
    this->assignValue(std::move(val));
    return *this;
  }

  template <class T FOLLY_REQUIRES_TRAILING(
      std::is_convertible<T, Value>::value &&
      !std::is_convertible<T, Error>::value)>
  Expected& operator=(T&& val) {
    this->assignValue(static_cast<T&&>(val));
    return *this;
  }

  FOLLY_REQUIRES(expected_detail::IsCopyable<Error>::value)
  Expected& operator=(const Unexpected<Error>& err) noexcept(
      expected_detail::IsNothrowCopyable<Error>::value) {
    this->assignError(err.error());
    return *this;
  }

  FOLLY_REQUIRES(expected_detail::IsMovable<Error>::value)
  Expected& operator=(Unexpected<Error>&& err) noexcept(
      expected_detail::IsNothrowMovable<Error>::value) {
    this->assignError(std::move(err.error()));
    return *this;
  }

  template <class... Ts FOLLY_REQUIRES_TRAILING(
      std::is_constructible<Value, Ts&&...>::value)>
  void emplace(Ts&&... ts) {
    this->assignValue(static_cast<Ts&&>(ts)...);
  }

  /**
   * swap
   */
  void swap(Expected& that) noexcept(
      expected_detail::StrictAllOf<IsNothrowSwappable, Value, Error>::value) {
    if (this->uninitializedByException() || that.uninitializedByException())
      throw BadExpectedAccess();
    using std::swap;
    if (*this) {
      if (that) {
        swap(this->value_, that.value_);
      } else {
        Error e(std::move(that.error_));
        that.assignValue(std::move(this->value_));
        this->assignError(std::move(e));
      }
    } else {
      if (!that) {
        swap(this->error_, that.error_);
      } else {
        Error e(std::move(this->error_));
        this->assignValue(std::move(that.value_));
        that.assignError(std::move(e));
      }
    }
  }

  // If overload resolution selects one of these deleted functions, that
  // means you need to use makeUnexpected
  /* implicit */ Expected& operator=(const Error&) = delete;
  /* implicit */ Expected& operator=(Error&&) = delete;

  /**
   * Relational Operators
   */
  template <class Val, class Err>
  friend typename std::enable_if<IsEqualityComparable<Val>::value, bool>::type
  operator==(const Expected<Val, Err>& lhs, const Expected<Val, Err>& rhs);
  template <class Val, class Err>
  friend typename std::enable_if<IsLessThanComparable<Val>::value, bool>::type
  operator<(const Expected<Val, Err>& lhs, const Expected<Val, Err>& rhs);

  /*
   * Accessors
   */
  constexpr bool hasValue() const noexcept {
    return expected_detail::Which::eValue == this->which_;
  }

  constexpr bool hasError() const noexcept {
    return expected_detail::Which::eError == this->which_;
  }

  using Base::uninitializedByException;

  const Value& value() const& {
    requireValue();
    return this->Base::value();
  }

  Value& value() & {
    requireValue();
    return this->Base::value();
  }

  Value&& value() && {
    requireValue();
    return std::move(this->Base::value());
  }

  const Error& error() const& {
    requireError();
    return this->Base::error();
  }

  Error& error() & {
    requireError();
    return this->Base::error();
  }

  Error&& error() && {
    requireError();
    return std::move(this->Base::error());
  }

  // Return a copy of the value if set, or a given default if not.
  template <class U>
  Value value_or(U&& dflt) const& {
    if (LIKELY(this->which_ == expected_detail::Which::eValue)) {
      return this->value_;
    }
    return static_cast<U&&>(dflt);
  }

  template <class U>
  Value value_or(U&& dflt) && {
    if (LIKELY(this->which_ == expected_detail::Which::eValue)) {
      return std::move(this->value_);
    }
    return static_cast<U&&>(dflt);
  }

  explicit constexpr operator bool() const noexcept {
    return hasValue();
  }

  const Value& operator*() const& {
    return this->value();
  }

  Value& operator*() & {
    return this->value();
  }

  Value&& operator*() && {
    return std::move(this->value());
  }

  const Value* operator->() const {
    return std::addressof(this->value());
  }

  Value* operator->() {
    return std::addressof(this->value());
  }

  const Value* get_pointer() const& noexcept {
    return hasValue() ? std::addressof(this->value_) : nullptr;
  }

  Value* get_pointer() & noexcept {
    return hasValue() ? std::addressof(this->value_) : nullptr;
  }

  Value* get_pointer() && = delete;

  /**
   * then
   */
  template <class... Fns FOLLY_REQUIRES_TRAILING(sizeof...(Fns) >= 1)>
  auto then(Fns&&... fns) const& -> decltype(
      expected_detail::ExpectedHelper::then_(
          std::declval<const Base&>(),
          std::declval<Fns>()...)) {
    if (this->uninitializedByException())
      throw BadExpectedAccess();
    return expected_detail::ExpectedHelper::then_(
        base(), static_cast<Fns&&>(fns)...);
  }

  template <class... Fns FOLLY_REQUIRES_TRAILING(sizeof...(Fns) >= 1)>
  auto then(Fns&&... fns) & -> decltype(expected_detail::ExpectedHelper::then_(
      std::declval<Base&>(),
      std::declval<Fns>()...)) {
    if (this->uninitializedByException())
      throw BadExpectedAccess();
    return expected_detail::ExpectedHelper::then_(
        base(), static_cast<Fns&&>(fns)...);
  }

  template <class... Fns FOLLY_REQUIRES_TRAILING(sizeof...(Fns) >= 1)>
  auto then(Fns&&... fns) && -> decltype(expected_detail::ExpectedHelper::then_(
      std::declval<Base&&>(),
      std::declval<Fns>()...)) {
    if (this->uninitializedByException())
      throw BadExpectedAccess();
    return expected_detail::ExpectedHelper::then_(
        std::move(base()), static_cast<Fns&&>(fns)...);
  }

  /**
   * thenOrThrow
   */
  template <class Yes, class No = MakeBadExpectedAccess>
  auto thenOrThrow(Yes&& yes, No&& no = No{}) const& -> decltype(
      std::declval<Yes>()(std::declval<const Value&>())) {
    using Ret = decltype(std::declval<Yes>()(std::declval<const Value&>()));
    if (this->uninitializedByException())
      throw BadExpectedAccess();
    return Ret(expected_detail::ExpectedHelper::thenOrThrow_(
        base(), static_cast<Yes&&>(yes), static_cast<No&&>(no)));
  }

  template <class Yes, class No = MakeBadExpectedAccess>
  auto thenOrThrow(Yes&& yes, No&& no = No{}) & -> decltype(
      std::declval<Yes>()(std::declval<Value&>())) {
    using Ret = decltype(std::declval<Yes>()(std::declval<Value&>()));
    if (this->uninitializedByException())
      throw BadExpectedAccess();
    return Ret(expected_detail::ExpectedHelper::thenOrThrow_(
        base(), static_cast<Yes&&>(yes), static_cast<No&&>(no)));
  }

  template <class Yes, class No = MakeBadExpectedAccess>
  auto thenOrThrow(Yes&& yes, No&& no = No{}) && -> decltype(
      std::declval<Yes>()(std::declval<Value&&>())) {
    using Ret = decltype(std::declval<Yes>()(std::declval<Value&&>()));
    if (this->uninitializedByException())
      throw BadExpectedAccess();
    return Ret(expected_detail::ExpectedHelper::thenOrThrow_(
        std::move(base()), static_cast<Yes&&>(yes), static_cast<No&&>(no)));
  }

 private:
  void requireValue() const {
    if (UNLIKELY(!hasValue())) {
      if (LIKELY(hasError()))
        throw typename Unexpected<Error>::BadExpectedAccess(this->error_);
      throw BadExpectedAccess();
    }
  }

  void requireError() const {
    if (UNLIKELY(!hasError())) {
      throw BadExpectedAccess();
    }
  }

  expected_detail::Which which() const noexcept {
    return this->which_;
  }
};

template <class Value, class Error>
inline typename std::enable_if<IsEqualityComparable<Value>::value, bool>::type
operator==(
    const Expected<Value, Error>& lhs,
    const Expected<Value, Error>& rhs) {
  if (UNLIKELY(lhs.which_ != rhs.which_))
    return UNLIKELY(lhs.uninitializedByException()) ? false
                                                    : throw BadExpectedAccess();
  if (UNLIKELY(lhs.uninitializedByException()))
    throw BadExpectedAccess();
  if (UNLIKELY(lhs.hasError()))
    return true; // All error states are considered equal
  return lhs.value_ == rhs.value_;
}

template <
    class Value,
    class Error FOLLY_REQUIRES_TRAILING(IsEqualityComparable<Value>::value)>
inline bool operator!=(
    const Expected<Value, Error>& lhs,
    const Expected<Value, Error>& rhs) {
  return !(rhs == lhs);
}

template <class Value, class Error>
inline typename std::enable_if<IsLessThanComparable<Value>::value, bool>::type
operator<(
    const Expected<Value, Error>& lhs,
    const Expected<Value, Error>& rhs) {
  if (UNLIKELY(
          lhs.uninitializedByException() || rhs.uninitializedByException()))
    throw BadExpectedAccess();
  if (UNLIKELY(lhs.hasError()))
    return !rhs.hasError();
  if (UNLIKELY(rhs.hasError()))
    return false;
  return lhs.value_ < rhs.value_;
}

template <
    class Value,
    class Error FOLLY_REQUIRES_TRAILING(IsLessThanComparable<Value>::value)>
inline bool operator<=(
    const Expected<Value, Error>& lhs,
    const Expected<Value, Error>& rhs) {
  return !(rhs < lhs);
}

template <
    class Value,
    class Error FOLLY_REQUIRES_TRAILING(IsLessThanComparable<Value>::value)>
inline bool operator>(
    const Expected<Value, Error>& lhs,
    const Expected<Value, Error>& rhs) {
  return rhs < lhs;
}

template <
    class Value,
    class Error FOLLY_REQUIRES_TRAILING(IsLessThanComparable<Value>::value)>
inline bool operator>=(
    const Expected<Value, Error>& lhs,
    const Expected<Value, Error>& rhs) {
  return !(lhs < rhs);
}

/**
 * swap Expected values
 */
template <class Error, class Value>
void swap(Expected<Error, Value>& lhs, Expected<Value, Error>& rhs) noexcept(
    expected_detail::StrictAllOf<IsNothrowSwappable, Value, Error>::value) {
  lhs.swap(rhs);
}

template <class Value, class Error>
const Value* get_pointer(const Expected<Value, Error>& ex) noexcept {
  return ex.get_pointer();
}

template <class Value, class Error>
Value* get_pointer(Expected<Value, Error>& ex) noexcept {
  return ex.get_pointer();
}

/**
 * For constructing an Expected object from a value, with the specified
 * Error type. Usage is as follows:
 *
 * enum MyErrorCode { BAD_ERROR, WORSE_ERROR };
 * Expected<int, MyErrorCode> myAPI() {
 *   int i = // ...;
 *   return i ? makeExpected<MyErrorCode>(i) : makeUnexpected(BAD_ERROR);
 * }
 */
template <class Error, class Value>
constexpr Expected<typename std::decay<Value>::type, Error> makeExpected(
    Value&& val) {
  return Expected<typename std::decay<Value>::type, Error>{
      in_place, static_cast<Value&&>(val)};
}

// Suppress comparability of Optional<T> with T, despite implicit conversion.
template <class Value, class Error>
bool operator==(const Expected<Value, Error>&, const Value& other) = delete;
template <class Value, class Error>
bool operator!=(const Expected<Value, Error>&, const Value& other) = delete;
template <class Value, class Error>
bool operator<(const Expected<Value, Error>&, const Value& other) = delete;
template <class Value, class Error>
bool operator<=(const Expected<Value, Error>&, const Value& other) = delete;
template <class Value, class Error>
bool operator>=(const Expected<Value, Error>&, const Value& other) = delete;
template <class Value, class Error>
bool operator>(const Expected<Value, Error>&, const Value& other) = delete;
template <class Value, class Error>
bool operator==(const Value& other, const Expected<Value, Error>&) = delete;
template <class Value, class Error>
bool operator!=(const Value& other, const Expected<Value, Error>&) = delete;
template <class Value, class Error>
bool operator<(const Value& other, const Expected<Value, Error>&) = delete;
template <class Value, class Error>
bool operator<=(const Value& other, const Expected<Value, Error>&) = delete;
template <class Value, class Error>
bool operator>=(const Value& other, const Expected<Value, Error>&) = delete;
template <class Value, class Error>
bool operator>(const Value& other, const Expected<Value, Error>&) = delete;

} // namespace folly

#if defined(__GNUC__) && !defined(__clang__)
#pragma GCC diagnostic pop
#endif

#undef FOLLY_REQUIRES
#undef FOLLY_REQUIRES_TRAILING
