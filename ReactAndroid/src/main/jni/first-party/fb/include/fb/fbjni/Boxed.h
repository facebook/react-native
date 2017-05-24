/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "CoreClasses.h"

namespace facebook {
namespace jni {

namespace detail {
template <typename T, typename jprim>
struct JPrimitive : JavaClass<T> {
  using typename JavaClass<T>::javaobject;
  using JavaClass<T>::javaClassStatic;
  static local_ref<javaobject> valueOf(jprim val) {
    static auto cls = javaClassStatic();
    static auto method =
      cls->template getStaticMethod<javaobject(jprim)>("valueOf");
    return method(cls, val);
  }
  jprim value() const {
    static auto method =
      javaClassStatic()->template getMethod<jprim()>(T::kValueMethod);
    return method(this->self());
  }
};

} // namespace detail


#define DEFINE_BOXED_PRIMITIVE(LITTLE, BIG)                          \
  struct J ## BIG : detail::JPrimitive<J ## BIG, j ## LITTLE> {      \
    static auto constexpr kJavaDescriptor = "Ljava/lang/" #BIG ";";  \
    static auto constexpr kValueMethod = #LITTLE "Value";            \
    j ## LITTLE LITTLE ## Value() const {                            \
      return value();                                                \
    }                                                                \
  };                                                                 \
  inline local_ref<jobject> autobox(j ## LITTLE val) {               \
    return J ## BIG::valueOf(val);                                   \
  }

DEFINE_BOXED_PRIMITIVE(boolean, Boolean)
DEFINE_BOXED_PRIMITIVE(byte, Byte)
DEFINE_BOXED_PRIMITIVE(char, Character)
DEFINE_BOXED_PRIMITIVE(short, Short)
DEFINE_BOXED_PRIMITIVE(int, Integer)
DEFINE_BOXED_PRIMITIVE(long, Long)
DEFINE_BOXED_PRIMITIVE(float, Float)
DEFINE_BOXED_PRIMITIVE(double, Double)

#undef DEFINE_BOXED_PRIMITIVE

inline local_ref<jobject> autobox(alias_ref<jobject> val) {
  return make_local(val);
}

}}

