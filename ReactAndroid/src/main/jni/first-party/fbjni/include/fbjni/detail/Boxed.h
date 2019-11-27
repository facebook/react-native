/**
 * Copyright 2018-present, Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
    static const auto cls = javaClassStatic();
    static const auto method =
      cls->template getStaticMethod<javaobject(jprim)>("valueOf");
    return method(cls, val);
  }
  jprim value() const {
    static const auto method =
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

template<typename T>
inline typename std::enable_if<
  (std::is_same<T, long long>::value || std::is_same<T, int64_t>::value) && !std::is_same<T, jlong>::value,
  local_ref<jobject>
>::type autobox(T val) {
  return JLong::valueOf(val);
}

struct JVoid : public jni::JavaClass<JVoid> {
  static auto constexpr kJavaDescriptor = "Ljava/lang/Void;";
};

inline local_ref<jobject> autobox(alias_ref<jobject> val) {
  return make_local(val);
}

}}
