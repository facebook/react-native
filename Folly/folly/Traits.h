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

// @author: Andrei Alexandrescu

#pragma once

#include <memory>
#include <limits>
#include <type_traits>
#include <functional>

#include <folly/Portability.h>

// libc++ doesn't provide this header, nor does msvc
#ifdef FOLLY_HAVE_BITS_CXXCONFIG_H
// This file appears in two locations: inside fbcode and in the
// libstdc++ source code (when embedding fbstring as std::string).
// To aid in this schizophrenic use, two macros are defined in
// c++config.h:
//   _LIBSTDCXX_FBSTRING - Set inside libstdc++.  This is useful to
//      gate use inside fbcode v. libstdc++
#include <bits/c++config.h>
#endif

// msvc has issues with FOLLY_CREATE_HAS_MEMBER_TYPE_TRAITS, so use
// BOOST_MPL_HAS_XXX_TRAIT_DEF instead.
#if defined(_MSC_VER)
#include <boost/mpl/has_xxx.hpp>
#endif // defined(_MSC_VER)

#define FOLLY_CREATE_HAS_MEMBER_TYPE_TRAITS(classname, type_name)              \
  template <typename TTheClass_>                                               \
  struct classname##__folly_traits_impl__ {                                    \
    template <typename UTheClass_>                                             \
    static constexpr bool test(typename UTheClass_::type_name*) {              \
      return true;                                                             \
    }                                                                          \
    template <typename>                                                        \
    static constexpr bool test(...) {                                          \
      return false;                                                            \
    }                                                                          \
  };                                                                           \
  template <typename TTheClass_>                                               \
  using classname = typename std::conditional<                                 \
      classname##__folly_traits_impl__<TTheClass_>::template test<TTheClass_>( \
          nullptr),                                                            \
      std::true_type,                                                          \
      std::false_type>::type;

#define FOLLY_CREATE_HAS_MEMBER_FN_TRAITS_IMPL(classname, func_name, cv_qual) \
  template <typename TTheClass_, typename RTheReturn_, typename... TTheArgs_> \
  struct classname##__folly_traits_impl__<                                    \
      TTheClass_,                                                             \
      RTheReturn_(TTheArgs_...) cv_qual> {                                    \
    template <                                                                \
        typename UTheClass_,                                                  \
        RTheReturn_ (UTheClass_::*)(TTheArgs_...) cv_qual>                    \
    struct sfinae {};                                                         \
    template <typename UTheClass_>                                            \
    static std::true_type test(sfinae<UTheClass_, &UTheClass_::func_name>*);  \
    template <typename>                                                       \
    static std::false_type test(...);                                         \
  }

/*
 * The FOLLY_CREATE_HAS_MEMBER_FN_TRAITS is used to create traits
 * classes that check for the existence of a member function with
 * a given name and signature. It currently does not support
 * checking for inherited members.
 *
 * Such classes receive two template parameters: the class to be checked
 * and the signature of the member function. A static boolean field
 * named `value` (which is also constexpr) tells whether such member
 * function exists.
 *
 * Each traits class created is bound only to the member name, not to
 * its signature nor to the type of the class containing it.
 *
 * Say you need to know if a given class has a member function named
 * `test` with the following signature:
 *
 *    int test() const;
 *
 * You'd need this macro to create a traits class to check for a member
 * named `test`, and then use this traits class to check for the signature:
 *
 * namespace {
 *
 * FOLLY_CREATE_HAS_MEMBER_FN_TRAITS(has_test_traits, test);
 *
 * } // unnamed-namespace
 *
 * void some_func() {
 *   cout << "Does class Foo have a member int test() const? "
 *     << boolalpha << has_test_traits<Foo, int() const>::value;
 * }
 *
 * You can use the same traits class to test for a completely different
 * signature, on a completely different class, as long as the member name
 * is the same:
 *
 * void some_func() {
 *   cout << "Does class Foo have a member int test()? "
 *     << boolalpha << has_test_traits<Foo, int()>::value;
 *   cout << "Does class Foo have a member int test() const? "
 *     << boolalpha << has_test_traits<Foo, int() const>::value;
 *   cout << "Does class Bar have a member double test(const string&, long)? "
 *     << boolalpha << has_test_traits<Bar, double(const string&, long)>::value;
 * }
 *
 * @author: Marcelo Juchem <marcelo@fb.com>
 */
#define FOLLY_CREATE_HAS_MEMBER_FN_TRAITS(classname, func_name)               \
  template <typename, typename>                                               \
  struct classname##__folly_traits_impl__;                                    \
  FOLLY_CREATE_HAS_MEMBER_FN_TRAITS_IMPL(classname, func_name, );             \
  FOLLY_CREATE_HAS_MEMBER_FN_TRAITS_IMPL(classname, func_name, const);        \
  FOLLY_CREATE_HAS_MEMBER_FN_TRAITS_IMPL(                                     \
      classname, func_name, /* nolint */ volatile);                           \
  FOLLY_CREATE_HAS_MEMBER_FN_TRAITS_IMPL(                                     \
      classname, func_name, /* nolint */ volatile const);                     \
  template <typename TTheClass_, typename TTheSignature_>                     \
  using classname =                                                           \
      decltype(classname##__folly_traits_impl__<TTheClass_, TTheSignature_>:: \
                   template test<TTheClass_>(nullptr))

namespace folly {

/***
 *  _t
 *
 *  Instead of:
 *
 *    using decayed = typename std::decay<T>::type;
 *
 *  With the C++14 standard trait aliases, we could use:
 *
 *    using decayed = std::decay_t<T>;
 *
 *  Without them, we could use:
 *
 *    using decayed = _t<std::decay<T>>;
 *
 *  Also useful for any other library with template types having dependent
 *  member types named `type`, like the standard trait types.
 */
template <typename T>
using _t = typename T::type;

/**
 *  void_t
 *
 *  A type alias for `void`. `void_t` is useful for controling class-template
 *  partial specialization.
 *
 *  Example:
 *
 *    // has_value_type<T>::value is true if T has a nested type `value_type`
 *    template <class T, class = void>
 *    struct has_value_type
 *        : std::false_type {};
 *
 *    template <class T>
 *    struct has_value_type<T, folly::void_t<typename T::value_type>>
 *        : std::true_type {};
 */
#if defined(__cpp_lib_void_t) || defined(_MSC_VER)

/* using override */ using std::void_t;

#else // defined(__cpp_lib_void_t) || defined(_MSC_VER)

namespace traits_detail {
template <class...>
struct void_t_ {
  using type = void;
};
} // namespace traits_detail

template <class... Ts>
using void_t = _t<traits_detail::void_t_<Ts...>>;

#endif // defined(__cpp_lib_void_t) || defined(_MSC_VER)

/**
 * IsRelocatable<T>::value describes the ability of moving around
 * memory a value of type T by using memcpy (as opposed to the
 * conservative approach of calling the copy constructor and then
 * destroying the old temporary. Essentially for a relocatable type,
 * the following two sequences of code should be semantically
 * equivalent:
 *
 * void move1(T * from, T * to) {
 *   new(to) T(from);
 *   (*from).~T();
 * }
 *
 * void move2(T * from, T * to) {
 *   memcpy(to, from, sizeof(T));
 * }
 *
 * Most C++ types are relocatable; the ones that aren't would include
 * internal pointers or (very rarely) would need to update remote
 * pointers to pointers tracking them. All C++ primitive types and
 * type constructors are relocatable.
 *
 * This property can be used in a variety of optimizations. Currently
 * fbvector uses this property intensively.
 *
 * The default conservatively assumes the type is not
 * relocatable. Several specializations are defined for known
 * types. You may want to add your own specializations. Do so in
 * namespace folly and make sure you keep the specialization of
 * IsRelocatable<SomeStruct> in the same header as SomeStruct.
 *
 * You may also declare a type to be relocatable by including
 *    `typedef std::true_type IsRelocatable;`
 * in the class header.
 *
 * It may be unset in a base class by overriding the typedef to false_type.
 */
/*
 * IsTriviallyCopyable describes the value semantics property. C++11 contains
 * the type trait is_trivially_copyable; however, it is not yet implemented
 * in gcc (as of 4.7.1), and the user may wish to specify otherwise.
 */
/*
 * IsZeroInitializable describes the property that default construction is the
 * same as memset(dst, 0, sizeof(T)).
 */

namespace traits_detail {

// msvc has issues with FOLLY_CREATE_HAS_MEMBER_TYPE_TRAITS, so use
// BOOST_MPL_HAS_XXX_TRAIT_DEF instead.
#if defined(_MSC_VER)
#define FOLLY_HAS_TRUE_XXX(name)                                             \
  BOOST_MPL_HAS_XXX_TRAIT_DEF(name)                                          \
  template <class T>                                                         \
  struct name##_is_true : std::is_same<typename T::name, std::true_type> {}; \
  template <class T>                                                         \
  struct has_true_##name : std::conditional<                                 \
                               has_##name<T>::value,                         \
                               name##_is_true<T>,                            \
                               std::false_type>::type {};
#else
#define FOLLY_HAS_TRUE_XXX(name)                                             \
  FOLLY_CREATE_HAS_MEMBER_TYPE_TRAITS(has_##name, name)                                  \
  template <class T>                                                         \
  struct name##_is_true : std::is_same<typename T::name, std::true_type> {}; \
  template <class T>                                                         \
  struct has_true_##name : std::conditional<                                 \
                               has_##name<T>::value,                         \
                               name##_is_true<T>,                            \
                               std::false_type>::type {};
#endif //defined(_MSC_VER)

FOLLY_HAS_TRUE_XXX(IsRelocatable)
FOLLY_HAS_TRUE_XXX(IsZeroInitializable)
FOLLY_HAS_TRUE_XXX(IsTriviallyCopyable)

#undef FOLLY_HAS_TRUE_XXX

// Older versions of libstdc++ do not provide std::is_trivially_copyable
#if defined(__clang__) && !defined(_LIBCPP_VERSION)
template <class T>
struct is_trivially_copyable
    : std::integral_constant<bool, __is_trivially_copyable(T)> {};
#elif defined(__GNUC__) && !defined(__clang__) && __GNUC__ < 5
template <class T>
struct is_trivially_copyable : std::is_trivial<T> {};
#else
template <class T>
using is_trivially_copyable = std::is_trivially_copyable<T>;
#endif
}

struct Ignore {
  template <class T>
  /* implicit */ Ignore(const T&) {}
  template <class T>
  const Ignore& operator=(T const&) const { return *this; }
};

template <class...>
using Ignored = Ignore;

namespace traits_detail_IsEqualityComparable {
Ignore operator==(Ignore, Ignore);

template <class T, class U = T>
struct IsEqualityComparable
    : std::is_convertible<
          decltype(std::declval<T>() == std::declval<U>()),
          bool
      > {};
}

/* using override */ using traits_detail_IsEqualityComparable::
    IsEqualityComparable;

namespace traits_detail_IsLessThanComparable {
Ignore operator<(Ignore, Ignore);

template <class T, class U = T>
struct IsLessThanComparable
    : std::is_convertible<
          decltype(std::declval<T>() < std::declval<U>()),
          bool
      > {};
}

/* using override */ using traits_detail_IsLessThanComparable::
    IsLessThanComparable;

namespace traits_detail_IsNothrowSwappable {
#if defined(__cpp_lib_is_swappable) || (_CPPLIB_VER && _HAS_CXX17)
// MSVC 2015+ already implements the C++17 P0185R1 proposal which
// adds std::is_nothrow_swappable, so use it instead if C++17 mode
// is enabled.
template <typename T>
using IsNothrowSwappable = std::is_nothrow_swappable<T>;
#elif _CPPLIB_VER
// MSVC 2015+ defines the base even if C++17 is disabled, and
// MSVC 2015 has issues with our fallback implementation due to
// over-eager evaluation of noexcept.
template <typename T>
using IsNothrowSwappable = std::_Is_nothrow_swappable<T>;
#else
/* using override */ using std::swap;

template <class T>
struct IsNothrowSwappable
    : std::integral_constant<bool,
        std::is_nothrow_move_constructible<T>::value &&
        noexcept(swap(std::declval<T&>(), std::declval<T&>()))
      > {};
#endif
}

/* using override */ using traits_detail_IsNothrowSwappable::IsNothrowSwappable;

template <class T> struct IsTriviallyCopyable
  : std::conditional<
      traits_detail::has_IsTriviallyCopyable<T>::value,
      traits_detail::has_true_IsTriviallyCopyable<T>,
      traits_detail::is_trivially_copyable<T>
    >::type {};

template <class T> struct IsRelocatable
  : std::conditional<
      traits_detail::has_IsRelocatable<T>::value,
      traits_detail::has_true_IsRelocatable<T>,
      // TODO add this line (and some tests for it) when we upgrade to gcc 4.7
      //std::is_trivially_move_constructible<T>::value ||
      IsTriviallyCopyable<T>
    >::type {};

template <class T> struct IsZeroInitializable
  : std::conditional<
      traits_detail::has_IsZeroInitializable<T>::value,
      traits_detail::has_true_IsZeroInitializable<T>,
      std::integral_constant<bool, !std::is_class<T>::value>
    >::type {};

template <typename...>
struct Conjunction : std::true_type {};
template <typename T>
struct Conjunction<T> : T {};
template <typename T, typename... TList>
struct Conjunction<T, TList...>
    : std::conditional<T::value, Conjunction<TList...>, T>::type {};

template <typename...>
struct Disjunction : std::false_type {};
template <typename T>
struct Disjunction<T> : T {};
template <typename T, typename... TList>
struct Disjunction<T, TList...>
    : std::conditional<T::value, T, Disjunction<TList...>>::type {};

template <typename T>
struct Negation : std::integral_constant<bool, !T::value> {};

template <bool... Bs>
struct Bools {
  using valid_type = bool;
  static constexpr std::size_t size() {
    return sizeof...(Bs);
  }
};

// Lighter-weight than Conjunction, but evaluates all sub-conditions eagerly.
template <class... Ts>
using StrictConjunction =
    std::is_same<Bools<Ts::value..., true>, Bools<true, Ts::value...>>;

} // namespace folly

/**
 * Use this macro ONLY inside namespace folly. When using it with a
 * regular type, use it like this:
 *
 * // Make sure you're at namespace ::folly scope
 * template<> FOLLY_ASSUME_RELOCATABLE(MyType)
 *
 * When using it with a template type, use it like this:
 *
 * // Make sure you're at namespace ::folly scope
 * template<class T1, class T2>
 * FOLLY_ASSUME_RELOCATABLE(MyType<T1, T2>)
 */
#define FOLLY_ASSUME_RELOCATABLE(...) \
  struct IsRelocatable<  __VA_ARGS__ > : std::true_type {};

/**
 * The FOLLY_ASSUME_FBVECTOR_COMPATIBLE* macros below encode the
 * assumption that the type is relocatable per IsRelocatable
 * above. Many types can be assumed to satisfy this condition, but
 * it is the responsibility of the user to state that assumption.
 * User-defined classes will not be optimized for use with
 * fbvector (see FBVector.h) unless they state that assumption.
 *
 * Use FOLLY_ASSUME_FBVECTOR_COMPATIBLE with regular types like this:
 *
 * FOLLY_ASSUME_FBVECTOR_COMPATIBLE(MyType)
 *
 * The versions FOLLY_ASSUME_FBVECTOR_COMPATIBLE_1, _2, _3, and _4
 * allow using the macro for describing templatized classes with 1, 2,
 * 3, and 4 template parameters respectively. For template classes
 * just use the macro with the appropriate number and pass the name of
 * the template to it. Example:
 *
 * template <class T1, class T2> class MyType { ... };
 * ...
 * // Make sure you're at global scope
 * FOLLY_ASSUME_FBVECTOR_COMPATIBLE_2(MyType)
 */

// Use this macro ONLY at global level (no namespace)
#define FOLLY_ASSUME_FBVECTOR_COMPATIBLE(...) \
  namespace folly {                           \
  template <>                                 \
  FOLLY_ASSUME_RELOCATABLE(__VA_ARGS__)       \
  }
// Use this macro ONLY at global level (no namespace)
#define FOLLY_ASSUME_FBVECTOR_COMPATIBLE_1(...) \
  namespace folly {                             \
  template <class T1>                           \
  FOLLY_ASSUME_RELOCATABLE(__VA_ARGS__<T1>)     \
  }
// Use this macro ONLY at global level (no namespace)
#define FOLLY_ASSUME_FBVECTOR_COMPATIBLE_2(...) \
  namespace folly {                             \
  template <class T1, class T2>                 \
  FOLLY_ASSUME_RELOCATABLE(__VA_ARGS__<T1, T2>) \
  }
// Use this macro ONLY at global level (no namespace)
#define FOLLY_ASSUME_FBVECTOR_COMPATIBLE_3(...)     \
  namespace folly {                                 \
  template <class T1, class T2, class T3>           \
  FOLLY_ASSUME_RELOCATABLE(__VA_ARGS__<T1, T2, T3>) \
  }
// Use this macro ONLY at global level (no namespace)
#define FOLLY_ASSUME_FBVECTOR_COMPATIBLE_4(...)         \
  namespace folly {                                     \
  template <class T1, class T2, class T3, class T4>     \
  FOLLY_ASSUME_RELOCATABLE(__VA_ARGS__<T1, T2, T3, T4>) \
  }

/**
 * Instantiate FOLLY_ASSUME_FBVECTOR_COMPATIBLE for a few types. It is
 * safe to assume that pair is compatible if both of its components
 * are. Furthermore, all STL containers can be assumed to comply,
 * although that is not guaranteed by the standard.
 */

FOLLY_NAMESPACE_STD_BEGIN

template <class T, class U>
  struct pair;
#ifndef _GLIBCXX_USE_FB
FOLLY_GLIBCXX_NAMESPACE_CXX11_BEGIN
template <class T, class R, class A>
  class basic_string;
FOLLY_GLIBCXX_NAMESPACE_CXX11_END
#else
template <class T, class R, class A, class S>
  class basic_string;
#endif
template <class T, class A>
  class vector;
template <class T, class A>
  class deque;
FOLLY_GLIBCXX_NAMESPACE_CXX11_BEGIN
template <class T, class A>
  class list;
FOLLY_GLIBCXX_NAMESPACE_CXX11_END
template <class T, class C, class A>
  class set;
template <class K, class V, class C, class A>
  class map;
template <class T>
  class shared_ptr;

FOLLY_NAMESPACE_STD_END

namespace folly {

// STL commonly-used types
template <class T, class U>
struct IsRelocatable< std::pair<T, U> >
    : std::integral_constant<bool,
        IsRelocatable<T>::value &&
        IsRelocatable<U>::value> {};

// Is T one of T1, T2, ..., Tn?
template <class T, class... Ts>
struct IsOneOf {
  enum { value = false };
};

template <class T, class T1, class... Ts>
struct IsOneOf<T, T1, Ts...> {
  enum { value = std::is_same<T, T1>::value || IsOneOf<T, Ts...>::value };
};

/*
 * Complementary type traits for integral comparisons.
 *
 * For instance, `if(x < 0)` yields an error in clang for unsigned types
 *  when -Werror is used due to -Wtautological-compare
 *
 *
 * @author: Marcelo Juchem <marcelo@fb.com>
 */

namespace detail {

template <typename T, bool>
struct is_negative_impl {
  constexpr static bool check(T x) { return x < 0; }
};

template <typename T>
struct is_negative_impl<T, false> {
  constexpr static bool check(T) { return false; }
};

// folly::to integral specializations can end up generating code
// inside what are really static ifs (not executed because of the templated
// types) that violate -Wsign-compare and/or -Wbool-compare so suppress them
// in order to not prevent all calling code from using it.
FOLLY_PUSH_WARNING
FOLLY_GCC_DISABLE_WARNING(sign-compare)
#if __GNUC_PREREQ(5, 0)
FOLLY_GCC_DISABLE_WARNING(bool-compare)
#endif
FOLLY_MSVC_DISABLE_WARNING(4388) // sign-compare
FOLLY_MSVC_DISABLE_WARNING(4804) // bool-compare

template <typename RHS, RHS rhs, typename LHS>
bool less_than_impl(LHS const lhs) {
  return
    rhs > std::numeric_limits<LHS>::max() ? true :
    rhs <= std::numeric_limits<LHS>::min() ? false :
    lhs < rhs;
}

template <typename RHS, RHS rhs, typename LHS>
bool greater_than_impl(LHS const lhs) {
  return
    rhs > std::numeric_limits<LHS>::max() ? false :
    rhs < std::numeric_limits<LHS>::min() ? true :
    lhs > rhs;
}

FOLLY_POP_WARNING

} // namespace detail {

// same as `x < 0`
template <typename T>
constexpr bool is_negative(T x) {
  return folly::detail::is_negative_impl<T, std::is_signed<T>::value>::check(x);
}

// same as `x <= 0`
template <typename T>
constexpr bool is_non_positive(T x) { return !x || folly::is_negative(x); }

// same as `x > 0`
template <typename T>
constexpr bool is_positive(T x) { return !is_non_positive(x); }

// same as `x >= 0`
template <typename T>
constexpr bool is_non_negative(T x) {
  return !x || is_positive(x);
}

template <typename RHS, RHS rhs, typename LHS>
bool less_than(LHS const lhs) {
  return detail::less_than_impl<
    RHS, rhs, typename std::remove_reference<LHS>::type
  >(lhs);
}

template <typename RHS, RHS rhs, typename LHS>
bool greater_than(LHS const lhs) {
  return detail::greater_than_impl<
    RHS, rhs, typename std::remove_reference<LHS>::type
  >(lhs);
}

namespace traits_detail {
struct InPlaceTag {};
template <class>
struct InPlaceTypeTag {};
template <std::size_t>
struct InPlaceIndexTag {};
}

/**
 * Like std::piecewise_construct, a tag type & instance used for in-place
 * construction of non-movable contained types, e.g. by Synchronized.
 * Follows the naming and design of std::in_place suggested in
 * http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2016/p0032r2.pdf
 */
using in_place_t = traits_detail::InPlaceTag (&)(traits_detail::InPlaceTag);

template <class T>
using in_place_type_t =
    traits_detail::InPlaceTypeTag<T> (&)(traits_detail::InPlaceTypeTag<T>);

template <std::size_t I>
using in_place_index_t =
    traits_detail::InPlaceIndexTag<I> (&)(traits_detail::InPlaceIndexTag<I>);

inline traits_detail::InPlaceTag in_place(traits_detail::InPlaceTag = {}) {
  return {};
}

template <class T>
inline traits_detail::InPlaceTypeTag<T> in_place(
    traits_detail::InPlaceTypeTag<T> = {}) {
  return {};
}

template <std::size_t I>
inline traits_detail::InPlaceIndexTag<I> in_place(
    traits_detail::InPlaceIndexTag<I> = {}) {
  return {};
}

// For backwards compatibility:
using construct_in_place_t = in_place_t;

inline traits_detail::InPlaceTag construct_in_place(
    traits_detail::InPlaceTag = {}) {
  return {};
}

/**
 * Initializer lists are a powerful compile time syntax introduced in C++11
 * but due to their often conflicting syntax they are not used by APIs for
 * construction.
 *
 * Further standard conforming compilers *strongly* favor an
 * std::initalizer_list overload for construction if one exists.  The
 * following is a simple tag used to disambiguate construction with
 * initializer lists and regular uniform initialization.
 *
 * For example consider the following case
 *
 *  class Something {
 *  public:
 *    explicit Something(int);
 *    Something(std::intiializer_list<int>);
 *
 *    operator int();
 *  };
 *
 *  ...
 *  Something something{1}; // SURPRISE!!
 *
 * The last call to instantiate the Something object will go to the
 * initializer_list overload.  Which may be surprising to users.
 *
 * If however this tag was used to disambiguate such construction it would be
 * easy for users to see which construction overload their code was referring
 * to.  For example
 *
 *  class Something {
 *  public:
 *    explicit Something(int);
 *    Something(folly::initlist_construct_t, std::initializer_list<int>);
 *
 *    operator int();
 *  };
 *
 *  ...
 *  Something something_one{1}; // not the initializer_list overload
 *  Something something_two{folly::initlist_construct, {1}}; // correct
 */
struct initlist_construct_t {};
constexpr initlist_construct_t initlist_construct{};

} // namespace folly

// Assume nothing when compiling with MSVC.
#ifndef _MSC_VER
// gcc-5.0 changed string's implementation in libstdc++ to be non-relocatable
#if !_GLIBCXX_USE_CXX11_ABI
FOLLY_ASSUME_FBVECTOR_COMPATIBLE_3(std::basic_string)
#endif
FOLLY_ASSUME_FBVECTOR_COMPATIBLE_2(std::vector)
FOLLY_ASSUME_FBVECTOR_COMPATIBLE_2(std::list)
FOLLY_ASSUME_FBVECTOR_COMPATIBLE_2(std::deque)
FOLLY_ASSUME_FBVECTOR_COMPATIBLE_2(std::unique_ptr)
FOLLY_ASSUME_FBVECTOR_COMPATIBLE_1(std::shared_ptr)
FOLLY_ASSUME_FBVECTOR_COMPATIBLE_1(std::function)
#endif

/* Some combinations of compilers and C++ libraries make __int128 and
 * unsigned __int128 available but do not correctly define their standard type
 * traits.
 *
 * If FOLLY_SUPPLY_MISSING_INT128_TRAITS is defined, we define these traits
 * here.
 *
 * @author: Phil Willoughby <philwill@fb.com>
 */
#if FOLLY_SUPPLY_MISSING_INT128_TRAITS
FOLLY_NAMESPACE_STD_BEGIN
template <>
struct is_arithmetic<__int128> : ::std::true_type {};
template <>
struct is_arithmetic<unsigned __int128> : ::std::true_type {};
template <>
struct is_integral<__int128> : ::std::true_type {};
template <>
struct is_integral<unsigned __int128> : ::std::true_type {};
template <>
struct make_unsigned<__int128> {
  typedef unsigned __int128 type;
};
template <>
struct make_signed<__int128> {
  typedef __int128 type;
};
template <>
struct make_unsigned<unsigned __int128> {
  typedef unsigned __int128 type;
};
template <>
struct make_signed<unsigned __int128> {
  typedef __int128 type;
};
template <>
struct is_signed<__int128> : ::std::true_type {};
template <>
struct is_unsigned<unsigned __int128> : ::std::true_type {};
FOLLY_NAMESPACE_STD_END
#endif // FOLLY_SUPPLY_MISSING_INT128_TRAITS
