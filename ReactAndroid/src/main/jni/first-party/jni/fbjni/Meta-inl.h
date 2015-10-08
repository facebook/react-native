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
        env->CallVoidMethod(self.get(), getId(), args...);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
}

#pragma push_macro("DEFINE_PRIMITIVE_CALL")
#undef DEFINE_PRIMITIVE_CALL
#define DEFINE_PRIMITIVE_CALL(TYPE, METHOD)                                                 \
template<typename... Args>                                                                  \
inline TYPE JMethod<TYPE(Args...)>::operator()(alias_ref<jobject> self, Args... args) {     \
  const auto env = internal::getEnv();                                                      \
  auto result = env->Call ## METHOD ## Method(self.get(), getId(), args...);                \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                                   \
  return result;                                                                            \
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

template<typename T, typename... Args>
inline local_ref<T*> JMethod<T*(Args...)>::operator()(alias_ref<jobject> self, Args... args) {
  const auto env = internal::getEnv();
        auto result = env->CallObjectMethod(self.get(), getId(), args...);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
        return adopt_local(static_cast<T*>(result));
}

template<typename... Args>
inline void JStaticMethod<void(Args...)>::operator()(alias_ref<jclass> cls, Args... args) {
  const auto env = internal::getEnv();
  env->CallStaticVoidMethod(cls.get(), getId(), args...);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
}

#pragma push_macro("DEFINE_PRIMITIVE_STATIC_CALL")
#undef DEFINE_PRIMITIVE_STATIC_CALL
#define DEFINE_PRIMITIVE_STATIC_CALL(TYPE, METHOD)                                          \
template<typename... Args>                                                                  \
inline TYPE JStaticMethod<TYPE(Args...)>::operator()(alias_ref<jclass> cls, Args... args) { \
  const auto env = internal::getEnv();                                                      \
  auto result = env->CallStatic ## METHOD ## Method(cls.get(), getId(), args...);           \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                                   \
        return result;                                                                      \
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

template<typename T, typename... Args>
inline local_ref<T*> JStaticMethod<T*(Args...)>::operator()(alias_ref<jclass> cls, Args... args) {
  const auto env = internal::getEnv();
  auto result = env->CallStaticObjectMethod(cls.get(), getId(), args...);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
  return adopt_local(static_cast<T*>(result));
}


template<typename... Args>
inline void
JNonvirtualMethod<void(Args...)>::operator()(alias_ref<jobject> self, jclass cls, Args... args) {
  const auto env = internal::getEnv();
  env->CallNonvirtualVoidMethod(self.get(), cls, getId(), args...);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
}

#pragma push_macro("DEFINE_PRIMITIVE_NON_VIRTUAL_CALL")
#undef DEFINE_PRIMITIVE_NON_VIRTUAL_CALL
#define DEFINE_PRIMITIVE_NON_VIRTUAL_CALL(TYPE, METHOD)                                           \
template<typename... Args>                                                                        \
inline TYPE                                                                                       \
JNonvirtualMethod<TYPE(Args...)>::operator()(alias_ref<jobject> self, jclass cls, Args... args) { \
  const auto env = internal::getEnv();                                                            \
  auto result = env->CallNonvirtual ## METHOD ## Method(self.get(), cls, getId(), args...);       \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                                         \
  return result;                                                                                  \
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

template<typename T, typename... Args>
inline local_ref<T*> JNonvirtualMethod<T*(Args...)>::operator()(
    alias_ref<jobject> self,
    jclass cls,
    Args... args) {
  const auto env = internal::getEnv();
  auto result = env->CallNonvirtualObjectMethod(self.get(), cls, getId(), args...);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
  return adopt_local(static_cast<T*>(result));
}


// jtype_traits ////////////////////////////////////////////////////////////////////////////////////

/// The generic way to associate a descriptor to a type is to look it up in the
/// corresponding @ref JObjectWrapper specialization. This makes it easy to add
/// support for your user defined type.
template<typename T>
struct jtype_traits {
  // The jni type signature (described at
  // http://docs.oracle.com/javase/1.5.0/docs/guide/jni/spec/types.html).
  static std::string descriptor() {
    static const auto descriptor = JObjectWrapper<T>::kJavaDescriptor != nullptr ?
      std::string{JObjectWrapper<T>::kJavaDescriptor} :
      JObjectWrapper<T>::get_instantiated_java_descriptor();
    return descriptor;
  }

  // The signature used for class lookups. See
  // http://docs.oracle.com/javase/6/docs/api/java/lang/Class.html#getName().
  static std::string base_name() {
    if (JObjectWrapper<T>::kJavaDescriptor != nullptr) {
      std::string base_name = JObjectWrapper<T>::kJavaDescriptor;
      return base_name.substr(1, base_name.size() - 2);
    }
    return JObjectWrapper<T>::get_instantiated_java_descriptor();
  }
};

#pragma push_macro("DEFINE_FIELD_AND_ARRAY_TRAIT")
#undef DEFINE_FIELD_AND_ARRAY_TRAIT

#define DEFINE_FIELD_AND_ARRAY_TRAIT(TYPE, DSC)                     \
template<>                                                          \
struct jtype_traits<TYPE> {                                         \
  static std::string descriptor() { return std::string{#DSC}; }     \
  static std::string base_name() { return descriptor(); }           \
};                                                                  \
template<>                                                          \
struct jtype_traits<TYPE ## Array> {                                \
  static std::string descriptor() { return std::string{"[" #DSC}; } \
  static std::string base_name() { return descriptor(); }           \
};

// There is no voidArray, handle that without the macro.
template<>
struct jtype_traits<void> {
  static std::string descriptor() { return std::string{"V"}; };
};

DEFINE_FIELD_AND_ARRAY_TRAIT(jboolean, Z)
DEFINE_FIELD_AND_ARRAY_TRAIT(jbyte,    B)
DEFINE_FIELD_AND_ARRAY_TRAIT(jchar,    C)
DEFINE_FIELD_AND_ARRAY_TRAIT(jshort,   S)
DEFINE_FIELD_AND_ARRAY_TRAIT(jint,     I)
DEFINE_FIELD_AND_ARRAY_TRAIT(jlong,    J)
DEFINE_FIELD_AND_ARRAY_TRAIT(jfloat,   F)
DEFINE_FIELD_AND_ARRAY_TRAIT(jdouble,  D)

#pragma pop_macro("DEFINE_FIELD_AND_ARRAY_TRAIT")


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
