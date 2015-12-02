/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <type_traits>

namespace facebook {
namespace jni {

/// Generic std::enable_if helper
template<bool B, typename T>
using enable_if_t = typename std::enable_if<B, T>::type;

/// Generic std::is_convertible helper
template<typename From, typename To>
constexpr bool IsConvertible() {
  return std::is_convertible<From, To>::value;
}

template<template<typename...> class TT, typename T>
struct is_instantiation_of : std::false_type {};

template<template<typename...> class TT, typename... Ts>
struct is_instantiation_of<TT, TT<Ts...>> : std::true_type {};

template<template<typename...> class TT, typename... Ts>
constexpr bool IsInstantiationOf() {
  return is_instantiation_of<TT, Ts...>::value;
}

/// Metafunction to determine whether a type is a JNI reference or not
template<typename T>
struct is_plain_jni_reference :
  std::integral_constant<bool,
      std::is_pointer<T>::value &&
      std::is_base_of<
        typename std::remove_pointer<jobject>::type,
        typename std::remove_pointer<T>::type>::value> {};

/// Helper to simplify use of is_plain_jni_reference
template<typename T>
constexpr bool IsPlainJniReference() {
  return is_plain_jni_reference<T>::value;
}

/// Metafunction to determine whether a type is a primitive JNI type or not
template<typename T>
struct is_jni_primitive :
  std::integral_constant<bool,
    std::is_same<jboolean, T>::value ||
    std::is_same<jbyte, T>::value ||
    std::is_same<jchar, T>::value ||
    std::is_same<jshort, T>::value ||
    std::is_same<jint, T>::value ||
    std::is_same<jlong, T>::value ||
    std::is_same<jfloat, T>::value ||
    std::is_same<jdouble, T>::value> {};

/// Helper to simplify use of is_jni_primitive
template<typename T>
constexpr bool IsJniPrimitive() {
  return is_jni_primitive<T>::value;
}

/// Metafunction to determine if a type is a scalar (primitive or reference) JNI type
template<typename T>
struct is_jni_scalar :
  std::integral_constant<bool,
    is_plain_jni_reference<T>::value ||
    is_jni_primitive<T>::value> {};

/// Helper to simplify use of is_jni_scalar
template<typename T>
constexpr bool IsJniScalar() {
  return is_jni_scalar<T>::value;
}

// Metafunction to determine if a type is a JNI type
template<typename T>
struct is_jni_type :
  std::integral_constant<bool,
    is_jni_scalar<T>::value ||
    std::is_void<T>::value> {};

/// Helper to simplify use of is_jni_type
template<typename T>
constexpr bool IsJniType() {
  return is_jni_type<T>::value;
}

template<typename T>
class weak_global_ref;

template<typename T, typename Alloc>
class basic_strong_ref;

template<typename T>
class alias_ref;

template<typename T>
struct is_non_weak_reference :
  std::integral_constant<bool,
    IsPlainJniReference<T>() ||
    IsInstantiationOf<basic_strong_ref, T>() ||
    IsInstantiationOf<alias_ref, T>()> {};

template<typename T>
constexpr bool IsNonWeakReference() {
  return is_non_weak_reference<T>::value;
}

template<typename T>
struct is_any_reference :
  std::integral_constant<bool,
    IsPlainJniReference<T>() ||
    IsInstantiationOf<weak_global_ref, T>() ||
    IsInstantiationOf<basic_strong_ref, T>() ||
    IsInstantiationOf<alias_ref, T>()> {};

template<typename T>
constexpr bool IsAnyReference() {
  return is_any_reference<T>::value;
}

template<typename T>
struct reference_traits {
  static_assert(IsPlainJniReference<T>(), "Need a plain JNI reference");
  using plain_jni_reference_t = T;
};

template<template <typename...> class R, typename T, typename... A>
struct reference_traits<R<T, A...>> {
  static_assert(IsAnyReference<T>(), "Need an fbjni reference");
  using plain_jni_reference_t = T;
};

template<typename T>
using plain_jni_reference_t = typename reference_traits<T>::plain_jni_reference_t;

}
}

