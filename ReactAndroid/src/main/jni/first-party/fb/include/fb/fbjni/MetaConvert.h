// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <jni.h>

#include "Common.h"
#include "References.h"

namespace facebook {
namespace jni {

namespace detail {

// In order to avoid potentially filling the jni locals table,
// temporary objects (right now, this is just jstrings) need to be
// released. This is done by returning a holder which autoconverts to
// jstring.
template <typename T>
inline T callToJni(T&& t) {
  return t;
}

template <typename T>
inline JniType<T> callToJni(local_ref<T>&& sref) {
  return sref.get();
}

// Normally, pass through types unmolested.
template <typename T, typename Enabled = void>
struct Convert {
  typedef T jniType;
  static jniType fromJni(jniType t) {
    return t;
  }
  static jniType toJniRet(jniType t) {
    return t;
  }
  static jniType toCall(jniType t) {
    return t;
  }
};

// This is needed for return conversion
template <>
struct Convert<void> {
  typedef void jniType;
};

// jboolean is an unsigned char, not a bool. Allow it to work either way.
template<>
struct Convert<bool> {
  typedef jboolean jniType;
  static bool fromJni(jniType t) {
    return t;
  }
  static jniType toJniRet(bool t) {
    return t;
  }
  static jniType toCall(bool t) {
    return t;
  }
};

// convert to alias_ref<T> from T
template <typename T>
struct Convert<alias_ref<T>> {
  typedef JniType<T> jniType;
  static alias_ref<jniType> fromJni(jniType t) {
    return wrap_alias(t);
  }
  static jniType toJniRet(alias_ref<jniType> t) {
    return t.get();
  }
  static jniType toCall(alias_ref<jniType> t) {
    return t.get();
  }
};

// convert return from local_ref<T>
template <typename T>
struct Convert<local_ref<T>> {
  typedef JniType<T> jniType;
  // No automatic synthesis of local_ref
  static jniType toJniRet(local_ref<jniType> t) {
    return t.release();
  }
  static jniType toCall(local_ref<jniType> t) {
    return t.get();
  }
};

// convert return from global_ref<T>
template <typename T>
struct Convert<global_ref<T>> {
  typedef JniType<T> jniType;
  // No automatic synthesis of global_ref
  static jniType toJniRet(global_ref<jniType> t) {
    return t.get();
  }
  static jniType toCall(global_ref<jniType> t) {
    return t.get();
  }
};

template <typename T> struct jni_sig_from_cxx_t;
template <typename R, typename... Args>
struct jni_sig_from_cxx_t<R(Args...)> {
  using JniRet = typename Convert<typename std::decay<R>::type>::jniType;
  using JniSig = JniRet(typename Convert<typename std::decay<Args>::type>::jniType...);
};

template <typename T>
using jni_sig_from_cxx = typename jni_sig_from_cxx_t<T>::JniSig;

} // namespace detail

template <typename R, typename... Args>
struct jmethod_traits_from_cxx<R(Args...)> : jmethod_traits<detail::jni_sig_from_cxx<R(Args...)>> {
};

}}
