/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <jni.h>

#include "Common.h"
#include "Exceptions.h"
#include "MetaConvert.h"
#include "References.h"

namespace facebook {
namespace jni {

// JMethod /////////////////////////////////////////////////////////////////////////////////////////

inline JMethodBase::JMethodBase(jmethodID method_id) noexcept
  : method_id_{method_id}
{}

inline JMethodBase::operator bool() const noexcept {
  return method_id_ != nullptr;
}

inline jmethodID JMethodBase::getId() const noexcept {
  return method_id_;
}

template<typename... Args>
inline void JMethod<void(Args...)>::operator()(alias_ref<jobject> self, Args... args) {
  const auto env = internal::getEnv();
  env->CallVoidMethod(
        self.get(),
        getId(),
        detail::callToJni(detail::Convert<typename std::decay<Args>::type>::toCall(args))...);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
}

#pragma push_macro("DEFINE_PRIMITIVE_CALL")
#undef DEFINE_PRIMITIVE_CALL
#define DEFINE_PRIMITIVE_CALL(TYPE, METHOD)                                                    \
template<typename... Args>                                                                     \
inline TYPE JMethod<TYPE(Args...)>::operator()(alias_ref<jobject> self, Args... args) {        \
  const auto env = internal::getEnv();                                                         \
  auto result = env->Call ## METHOD ## Method(                                                 \
        self.get(),                                                                            \
        getId(),                                                                               \
        detail::callToJni(detail::Convert<typename std::decay<Args>::type>::toCall(args))...); \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                                      \
  return result;                                                                               \
}

DEFINE_PRIMITIVE_CALL(jboolean, Boolean)
DEFINE_PRIMITIVE_CALL(jbyte, Byte)
DEFINE_PRIMITIVE_CALL(jchar, Char)
DEFINE_PRIMITIVE_CALL(jshort, Short)
DEFINE_PRIMITIVE_CALL(jint, Int)
DEFINE_PRIMITIVE_CALL(jlong, Long)
DEFINE_PRIMITIVE_CALL(jfloat, Float)
DEFINE_PRIMITIVE_CALL(jdouble, Double)
#pragma pop_macro("DEFINE_PRIMITIVE_CALL")


/// JMethod specialization for references that wraps the return value in a @ref local_ref
template<typename R, typename... Args>
class JMethod<R(Args...)> : public JMethodBase {
 public:
   // TODO: static_assert is jobject-derived or local_ref jobject
  using JniRet = typename detail::Convert<typename std::decay<R>::type>::jniType;
  static_assert(IsPlainJniReference<JniRet>(), "JniRet must be a JNI reference");
  using JMethodBase::JMethodBase;
  JMethod() noexcept {};
  JMethod(const JMethod& other) noexcept = default;

  /// Invoke a method and return a local reference wrapping the result
  local_ref<JniRet> operator()(alias_ref<jobject> self, Args... args) {
    const auto env = internal::getEnv();
    auto result = env->CallObjectMethod(
        self.get(),
        getId(),
        detail::callToJni(detail::Convert<typename std::decay<Args>::type>::toCall(args))...);
    FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
    return adopt_local(static_cast<JniRet>(result));
  }

  friend class JClass;
};

template<typename... Args>
inline void JStaticMethod<void(Args...)>::operator()(alias_ref<jclass> cls, Args... args) {
  const auto env = internal::getEnv();
  env->CallStaticVoidMethod(
        cls.get(),
        getId(),
        detail::callToJni(detail::Convert<typename std::decay<Args>::type>::toCall(args))...);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
}

#pragma push_macro("DEFINE_PRIMITIVE_STATIC_CALL")
#undef DEFINE_PRIMITIVE_STATIC_CALL
#define DEFINE_PRIMITIVE_STATIC_CALL(TYPE, METHOD)                                             \
template<typename... Args>                                                                     \
inline TYPE JStaticMethod<TYPE(Args...)>::operator()(alias_ref<jclass> cls, Args... args) {    \
  const auto env = internal::getEnv();                                                         \
  auto result = env->CallStatic ## METHOD ## Method(                                           \
        cls.get(),                                                                             \
        getId(),                                                                               \
        detail::callToJni(detail::Convert<typename std::decay<Args>::type>::toCall(args))...); \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                                      \
        return result;                                                                         \
}

DEFINE_PRIMITIVE_STATIC_CALL(jboolean, Boolean)
DEFINE_PRIMITIVE_STATIC_CALL(jbyte, Byte)
DEFINE_PRIMITIVE_STATIC_CALL(jchar, Char)
DEFINE_PRIMITIVE_STATIC_CALL(jshort, Short)
DEFINE_PRIMITIVE_STATIC_CALL(jint, Int)
DEFINE_PRIMITIVE_STATIC_CALL(jlong, Long)
DEFINE_PRIMITIVE_STATIC_CALL(jfloat, Float)
DEFINE_PRIMITIVE_STATIC_CALL(jdouble, Double)
#pragma pop_macro("DEFINE_PRIMITIVE_STATIC_CALL")

/// JStaticMethod specialization for references that wraps the return value in a @ref local_ref
template<typename R, typename... Args>
class JStaticMethod<R(Args...)> : public JMethodBase {

 public:
  using JniRet = typename detail::Convert<typename std::decay<R>::type>::jniType;
  static_assert(IsPlainJniReference<JniRet>(), "T* must be a JNI reference");
  using JMethodBase::JMethodBase;
  JStaticMethod() noexcept {};
  JStaticMethod(const JStaticMethod& other) noexcept = default;

  /// Invoke a method and return a local reference wrapping the result
  local_ref<JniRet> operator()(alias_ref<jclass> cls, Args... args) {
    const auto env = internal::getEnv();
    auto result = env->CallStaticObjectMethod(
          cls.get(),
          getId(),
          detail::callToJni(detail::Convert<typename std::decay<Args>::type>::toCall(args))...);
    FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
    return adopt_local(static_cast<JniRet>(result));
  }

  friend class JClass;
};

template<typename... Args>
inline void
JNonvirtualMethod<void(Args...)>::operator()(alias_ref<jobject> self, alias_ref<jclass> cls, Args... args) {
  const auto env = internal::getEnv();
  env->CallNonvirtualVoidMethod(
        self.get(),
        cls.get(),
        getId(),
        detail::callToJni(detail::Convert<typename std::decay<Args>::type>::toCall(args))...);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
}

#pragma push_macro("DEFINE_PRIMITIVE_NON_VIRTUAL_CALL")
#undef DEFINE_PRIMITIVE_NON_VIRTUAL_CALL
#define DEFINE_PRIMITIVE_NON_VIRTUAL_CALL(TYPE, METHOD)                                                      \
template<typename... Args>                                                                                   \
inline TYPE                                                                                                  \
JNonvirtualMethod<TYPE(Args...)>::operator()(alias_ref<jobject> self, alias_ref<jclass> cls, Args... args) { \
  const auto env = internal::getEnv();                                                                       \
  auto result = env->CallNonvirtual ## METHOD ## Method(                                                     \
        self.get(),                                                                                          \
        cls.get(),                                                                                           \
        getId(),                                                                                             \
        detail::callToJni(detail::Convert<typename std::decay<Args>::type>::toCall(args))...);               \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                                                    \
  return result;                                                                                             \
}

DEFINE_PRIMITIVE_NON_VIRTUAL_CALL(jboolean, Boolean)
DEFINE_PRIMITIVE_NON_VIRTUAL_CALL(jbyte, Byte)
DEFINE_PRIMITIVE_NON_VIRTUAL_CALL(jchar, Char)
DEFINE_PRIMITIVE_NON_VIRTUAL_CALL(jshort, Short)
DEFINE_PRIMITIVE_NON_VIRTUAL_CALL(jint, Int)
DEFINE_PRIMITIVE_NON_VIRTUAL_CALL(jlong, Long)
DEFINE_PRIMITIVE_NON_VIRTUAL_CALL(jfloat, Float)
DEFINE_PRIMITIVE_NON_VIRTUAL_CALL(jdouble, Double)
#pragma pop_macro("DEFINE_PRIMITIVE_NON_VIRTUAL_CALL")

/// JNonvirtualMethod specialization for references that wraps the return value in a @ref local_ref
template<typename R, typename... Args>
class JNonvirtualMethod<R(Args...)> : public JMethodBase {
 public:
  using JniRet = typename detail::Convert<typename std::decay<R>::type>::jniType;
  static_assert(IsPlainJniReference<JniRet>(), "T* must be a JNI reference");
  using JMethodBase::JMethodBase;
  JNonvirtualMethod() noexcept {};
  JNonvirtualMethod(const JNonvirtualMethod& other) noexcept = default;

  /// Invoke a method and return a local reference wrapping the result
  local_ref<JniRet> operator()(alias_ref<jobject> self, alias_ref<jclass> cls, Args... args){
    const auto env = internal::getEnv();
    auto result = env->CallNonvirtualObjectMethod(
          self.get(),
          cls.get(),
          getId(),
          detail::callToJni(detail::Convert<typename std::decay<Args>::type>::toCall(args))...);
    FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
    return adopt_local(static_cast<JniRet>(result));
  }

  friend class JClass;
};


// JField<T> ///////////////////////////////////////////////////////////////////////////////////////

template<typename T>
inline JField<T>::JField(jfieldID field) noexcept
  : field_id_{field}
{}

template<typename T>
inline JField<T>::operator bool() const noexcept {
  return field_id_ != nullptr;
}

template<typename T>
inline jfieldID JField<T>::getId() const noexcept {
  return field_id_;
}

#pragma push_macro("DEFINE_FIELD_PRIMITIVE_GET_SET")
#undef DEFINE_FIELD_PRIMITIVE_GET_SET
#define DEFINE_FIELD_PRIMITIVE_GET_SET(TYPE, METHOD)                 \
template<>                                                           \
inline TYPE JField<TYPE>::get(jobject object) const noexcept {       \
  const auto env = internal::getEnv();                               \
  return env->Get ## METHOD ## Field(object, field_id_);             \
}                                                                    \
                                                                     \
template<>                                                           \
inline void JField<TYPE>::set(jobject object, TYPE value) noexcept { \
  const auto env = internal::getEnv();                               \
  env->Set ## METHOD ## Field(object, field_id_, value);             \
}

DEFINE_FIELD_PRIMITIVE_GET_SET(jboolean, Boolean)
DEFINE_FIELD_PRIMITIVE_GET_SET(jbyte, Byte)
DEFINE_FIELD_PRIMITIVE_GET_SET(jchar, Char)
DEFINE_FIELD_PRIMITIVE_GET_SET(jshort, Short)
DEFINE_FIELD_PRIMITIVE_GET_SET(jint, Int)
DEFINE_FIELD_PRIMITIVE_GET_SET(jlong, Long)
DEFINE_FIELD_PRIMITIVE_GET_SET(jfloat, Float)
DEFINE_FIELD_PRIMITIVE_GET_SET(jdouble, Double)
#pragma pop_macro("DEFINE_FIELD_PRIMITIVE_GET_SET")

template<typename T>
inline T JField<T>::get(jobject object) const noexcept {
  return static_cast<T>(internal::getEnv()->GetObjectField(object, field_id_));
}

template<typename T>
inline void JField<T>::set(jobject object, T value) noexcept {
  internal::getEnv()->SetObjectField(object, field_id_, static_cast<jobject>(value));
}

// JStaticField<T> /////////////////////////////////////////////////////////////////////////////////

template<typename T>
inline JStaticField<T>::JStaticField(jfieldID field) noexcept
  : field_id_{field}
{}

template<typename T>
inline JStaticField<T>::operator bool() const noexcept {
  return field_id_ != nullptr;
}

template<typename T>
inline jfieldID JStaticField<T>::getId() const noexcept {
  return field_id_;
}

#pragma push_macro("DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET")
#undef DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET
#define DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET(TYPE, METHOD)                \
template<>                                                                 \
inline TYPE JStaticField<TYPE>::get(jclass jcls) const noexcept {          \
  const auto env = internal::getEnv();                                     \
  return env->GetStatic ## METHOD ## Field(jcls, field_id_);               \
}                                                                          \
                                                                           \
template<>                                                                 \
inline void JStaticField<TYPE>::set(jclass jcls, TYPE value) noexcept {    \
  const auto env = internal::getEnv();                                     \
  env->SetStatic ## METHOD ## Field(jcls, field_id_, value);               \
}

DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET(jboolean, Boolean)
DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET(jbyte, Byte)
DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET(jchar, Char)
DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET(jshort, Short)
DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET(jint, Int)
DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET(jlong, Long)
DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET(jfloat, Float)
DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET(jdouble, Double)
#pragma pop_macro("DEFINE_STATIC_FIELD_PRIMITIVE_GET_SET")

template<typename T>
inline T JStaticField<T>::get(jclass jcls) const noexcept {
  const auto env = internal::getEnv();
  return static_cast<T>(env->GetStaticObjectField(jcls, field_id_));
}

template<typename T>
inline void JStaticField<T>::set(jclass jcls, T value) noexcept {
  internal::getEnv()->SetStaticObjectField(jcls, field_id_, value);
}


// jmethod_traits //////////////////////////////////////////////////////////////////////////////////

// TODO(T6608405) Adapt this to implement a register natives method that requires no descriptor
namespace internal {

template<typename Head>
inline std::string JavaDescriptor() {
  return jtype_traits<Head>::descriptor();
}

template<typename Head, typename Elem, typename... Tail>
inline std::string JavaDescriptor() {
  return JavaDescriptor<Head>() + JavaDescriptor<Elem, Tail...>();
}

template<typename R, typename Arg1, typename... Args>
inline std::string JMethodDescriptor() {
  return "(" + JavaDescriptor<Arg1, Args...>() + ")" + JavaDescriptor<R>();
}

template<typename R>
inline std::string JMethodDescriptor() {
  return "()" + JavaDescriptor<R>();
}

} // internal

template<typename R, typename... Args>
inline std::string jmethod_traits<R(Args...)>::descriptor() {
  return internal::JMethodDescriptor<R, Args...>();
}

template<typename R, typename... Args>
inline std::string jmethod_traits<R(Args...)>::constructor_descriptor() {
  return internal::JMethodDescriptor<void, Args...>();
}

}}
