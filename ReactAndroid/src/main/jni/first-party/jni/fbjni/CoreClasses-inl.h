/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <string.h>
#include <type_traits>

#include "Common.h"
#include "Exceptions.h"

namespace facebook {
namespace jni {

inline bool isSameObject(alias_ref<jobject> lhs, alias_ref<jobject> rhs) noexcept {
  return internal::getEnv()->IsSameObject(lhs.get(), rhs.get()) != JNI_FALSE;
}


// jobject /////////////////////////////////////////////////////////////////////////////////////////

inline JObjectWrapper<jobject>::JObjectWrapper(jobject reference) noexcept
  : this_{reference}
{}

inline JObjectWrapper<jobject>::JObjectWrapper(const JObjectWrapper<jobject>& other) noexcept
  : this_{other.this_} {
  internal::dbglog("wrapper copy from this=%p ref=%p other=%p", this, other.this_, &other);
}

inline local_ref<jclass> JObjectWrapper<jobject>::getClass() const noexcept {
  return adopt_local(internal::getEnv()->GetObjectClass(self()));
}

inline bool JObjectWrapper<jobject>::isInstanceOf(alias_ref<jclass> cls) const noexcept {
  return internal::getEnv()->IsInstanceOf(self(), cls.get()) != JNI_FALSE;
}

template<typename T>
inline T JObjectWrapper<jobject>::getFieldValue(JField<T> field) const noexcept {
  return field.get(self());
}

template<typename T>
inline local_ref<T*> JObjectWrapper<jobject>::getFieldValue(JField<T*> field) noexcept {
  return adopt_local(field.get(self()));
}

template<typename T>
inline void JObjectWrapper<jobject>::setFieldValue(JField<T> field, T value) noexcept {
  field.set(self(), value);
}

inline std::string JObjectWrapper<jobject>::toString() const {
  static auto method = findClassLocal("java/lang/Object")->getMethod<jstring()>("toString");

  return method(self())->toStdString();
}

inline void JObjectWrapper<jobject>::set(jobject reference) noexcept {
  this_ = reference;
}

inline jobject JObjectWrapper<jobject>::get() const noexcept {
  return this_;
}

inline jobject JObjectWrapper<jobject>::self() const noexcept {
  return this_;
}

inline void swap(JObjectWrapper<jobject>& a, JObjectWrapper<jobject>& b) noexcept {
  using std::swap;
  swap(a.this_, b.this_);
}


// jclass //////////////////////////////////////////////////////////////////////////////////////////

namespace detail {

// This is not a real type.  It is used so people won't accidentally
// use a void* to initialize a NativeMethod.
struct NativeMethodWrapper;

};

struct NativeMethod {
  const char* name;
  std::string descriptor;
  detail::NativeMethodWrapper* wrapper;
};

inline local_ref<jclass> JObjectWrapper<jclass>::getSuperclass() const noexcept {
  return adopt_local(internal::getEnv()->GetSuperclass(self()));
}

inline void JObjectWrapper<jclass>::registerNatives(std::initializer_list<NativeMethod> methods) {
  const auto env = internal::getEnv();

  JNINativeMethod jnimethods[methods.size()];
  size_t i = 0;
  for (auto it = methods.begin(); it < methods.end(); ++it, ++i) {
    jnimethods[i].name = it->name;
    jnimethods[i].signature = it->descriptor.c_str();
    jnimethods[i].fnPtr = reinterpret_cast<void*>(it->wrapper);
  }

  auto result = env->RegisterNatives(self(), jnimethods, methods.size());
  FACEBOOK_JNI_THROW_EXCEPTION_IF(result != JNI_OK);
}

inline bool JObjectWrapper<jclass>::isAssignableFrom(alias_ref<jclass> other) const noexcept {
  const auto env = internal::getEnv();
  const auto result = env->IsAssignableFrom(self(), other.get());
  return result;
}

template<typename F>
inline JConstructor<F> JObjectWrapper<jclass>::getConstructor() const {
  return getConstructor<F>(jmethod_traits<F>::constructor_descriptor().c_str());
}

template<typename F>
inline JConstructor<F> JObjectWrapper<jclass>::getConstructor(const char* descriptor) const {
  constexpr auto constructor_method_name = "<init>";
  return getMethod<F>(constructor_method_name, descriptor);
}

template<typename F>
inline JMethod<F> JObjectWrapper<jclass>::getMethod(const char* name) const {
  return getMethod<F>(name, jmethod_traits<F>::descriptor().c_str());
}

template<typename F>
inline JMethod<F> JObjectWrapper<jclass>::getMethod(
    const char* name,
    const char* descriptor) const {
  const auto env = internal::getEnv();
  const auto method = env->GetMethodID(self(), name, descriptor);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!method);
  return JMethod<F>{method};
}

template<typename F>
inline JStaticMethod<F> JObjectWrapper<jclass>::getStaticMethod(const char* name) const {
  return getStaticMethod<F>(name, jmethod_traits<F>::descriptor().c_str());
}

template<typename F>
inline JStaticMethod<F> JObjectWrapper<jclass>::getStaticMethod(
    const char* name,
    const char* descriptor) const {
  const auto env = internal::getEnv();
  const auto method = env->GetStaticMethodID(self(), name, descriptor);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!method);
  return JStaticMethod<F>{method};
}

template<typename F>
inline JNonvirtualMethod<F> JObjectWrapper<jclass>::getNonvirtualMethod(const char* name) const {
  return getNonvirtualMethod<F>(name, jmethod_traits<F>::descriptor().c_str());
}

template<typename F>
inline JNonvirtualMethod<F> JObjectWrapper<jclass>::getNonvirtualMethod(
    const char* name,
    const char* descriptor) const {
  const auto env = internal::getEnv();
  const auto method = env->GetMethodID(self(), name, descriptor);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!method);
  return JNonvirtualMethod<F>{method};
}

template<typename T>
inline JField<enable_if_t<IsJniScalar<T>(), T>>
JObjectWrapper<jclass>::getField(const char* name) const {
  return getField<T>(name, jtype_traits<T>::descriptor().c_str());
}

template<typename T>
inline JField<enable_if_t<IsJniScalar<T>(), T>> JObjectWrapper<jclass>::getField(
    const char* name,
    const char* descriptor) const {
  const auto env = internal::getEnv();
  auto field = env->GetFieldID(self(), name, descriptor);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!field);
  return JField<T>{field};
}

template<typename T>
inline JStaticField<enable_if_t<IsJniScalar<T>(), T>> JObjectWrapper<jclass>::getStaticField(
    const char* name) const {
  return getStaticField<T>(name, jtype_traits<T>::descriptor().c_str());
}

template<typename T>
inline JStaticField<enable_if_t<IsJniScalar<T>(), T>> JObjectWrapper<jclass>::getStaticField(
    const char* name,
    const char* descriptor) const {
  const auto env = internal::getEnv();
  auto field = env->GetStaticFieldID(self(), name, descriptor);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!field);
  return JStaticField<T>{field};
}

template<typename T>
inline T JObjectWrapper<jclass>::getStaticFieldValue(JStaticField<T> field) const noexcept {
  return field.get(self());
}

template<typename T>
inline local_ref<T*> JObjectWrapper<jclass>::getStaticFieldValue(JStaticField<T*> field) noexcept {
  return adopt_local(field.get(self()));
}

template<typename T>
inline void JObjectWrapper<jclass>::setStaticFieldValue(JStaticField<T> field, T value) noexcept {
  field.set(self(), value);
}

template<typename R, typename... Args>
inline local_ref<R> JObjectWrapper<jclass>::newObject(
    JConstructor<R(Args...)> constructor,
    Args... args) const {
  const auto env = internal::getEnv();
  auto object = env->NewObject(self(), constructor.getId(), args...);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!object);
  return adopt_local(static_cast<R>(object));
}

inline jclass JObjectWrapper<jclass>::self() const noexcept {
  return static_cast<jclass>(this_);
}

inline void registerNatives(const char* name, std::initializer_list<NativeMethod> methods) {
  findClassLocal(name)->registerNatives(methods);
}


// jstring /////////////////////////////////////////////////////////////////////////////////////////

inline local_ref<jstring> make_jstring(const std::string& modifiedUtf8) {
  return make_jstring(modifiedUtf8.c_str());
}

inline jstring JObjectWrapper<jstring>::self() const noexcept {
  return static_cast<jstring>(this_);
}


// jthrowable //////////////////////////////////////////////////////////////////////////////////////

inline jthrowable JObjectWrapper<jthrowable>::self() const noexcept {
  return static_cast<jthrowable>(this_);
}


// jtypeArray //////////////////////////////////////////////////////////////////////////////////////
template<typename T>
inline ElementProxy<T>::ElementProxy(
    JObjectWrapper<_jtypeArray<T>*>* target,
    size_t idx)
    : target_{target}, idx_{idx} {}

template<typename T>
inline ElementProxy<T>& ElementProxy<T>::operator=(const T& o) {
  target_->setElement(idx_, o);
  return *this;
}

template<typename T>
inline ElementProxy<T>& ElementProxy<T>::operator=(alias_ref<T>& o) {
  target_->setElement(idx_, o.get());
  return *this;
}

template<typename T>
inline ElementProxy<T>& ElementProxy<T>::operator=(alias_ref<T>&& o) {
  target_->setElement(idx_, o.get());
  return *this;
}

template<typename T>
inline ElementProxy<T>& ElementProxy<T>::operator=(const ElementProxy<T>& o) {
  auto src = o.target_->getElement(o.idx_);
  target_->setElement(idx_, src.get());
  return *this;
}

template<typename T>
inline ElementProxy<T>::ElementProxy::operator const local_ref<T> () const {
  return target_->getElement(idx_);
}

template<typename T>
inline ElementProxy<T>::ElementProxy::operator local_ref<T> () {
  return target_->getElement(idx_);
}

template<typename T>
local_ref<jtypeArray<T>> JObjectWrapper<jtypeArray<T>>::newArray(size_t size) {
  static auto elementClass = findClassStatic(jtype_traits<T>::base_name().c_str());
  const auto env = internal::getEnv();
  auto rawArray = env->NewObjectArray(size, elementClass.get(), nullptr);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!rawArray);
  return adopt_local(static_cast<jtypeArray<T>>(rawArray));
}

template<typename T>
inline void JObjectWrapper<jtypeArray<T>>::setElement(size_t idx, const T& value) {
  const auto env = internal::getEnv();
  env->SetObjectArrayElement(static_cast<jobjectArray>(self()), idx, value);
}

template<typename T>
inline local_ref<T> JObjectWrapper<jtypeArray<T>>::getElement(size_t idx) {
  const auto env = internal::getEnv();
  auto rawElement = env->GetObjectArrayElement(static_cast<jobjectArray>(self()), idx);
  return adopt_local(static_cast<T>(rawElement));
}

template<typename T>
inline size_t JObjectWrapper<jtypeArray<T>>::size() {
  const auto env = internal::getEnv();
  return env->GetArrayLength(static_cast<jobjectArray>(self()));
}

template<typename T>
inline ElementProxy<T> JObjectWrapper<jtypeArray<T>>::operator[](size_t index) {
  return ElementProxy<T>(this, index);
}

template<typename T>
inline jtypeArray<T> JObjectWrapper<jtypeArray<T>>::self() const noexcept {
  return static_cast<jtypeArray<T>>(this_);
}


// jarray /////////////////////////////////////////////////////////////////////////////////////////

inline size_t JObjectWrapper<jarray>::size() const noexcept {
  const auto env = internal::getEnv();
  return env->GetArrayLength(self());
}

inline jarray JObjectWrapper<jarray>::self() const noexcept {
  return static_cast<jarray>(this_);
}


// PinnedPrimitiveArray ///////////////////////////////////////////////////////////////////////////

template<typename T>
inline PinnedPrimitiveArray<T>::PinnedPrimitiveArray(alias_ref<jarray> array) noexcept
  : array_{array} {
  get();
}

template<typename T>
PinnedPrimitiveArray<T>::PinnedPrimitiveArray(PinnedPrimitiveArray&& o) noexcept {
  array_ = std::move(o.array_);
  elements_ = o.elements_;
  isCopy_ = o.isCopy_;
  size_ = o.size_;
  o.elements_ = nullptr;
  o.isCopy_ = false;
  o.size_ = 0;
}

template<typename T>
PinnedPrimitiveArray<T>&
PinnedPrimitiveArray<T>::operator=(PinnedPrimitiveArray&& o) noexcept {
  array_ = std::move(o.array_);
  elements_ = o.elements_;
  isCopy_ = o.isCopy_;
  size_ = o.size_;
  o.elements_ = nullptr;
  o.isCopy_ = false;
  o.size_ = 0;
  return *this;
}

template<typename T>
inline T& PinnedPrimitiveArray<T>::operator[](size_t index) {
  FACEBOOK_JNI_THROW_EXCEPTION_IF(elements_ == nullptr);
  return elements_[index];
}

template<typename T>
inline bool PinnedPrimitiveArray<T>::isCopy() const noexcept {
  return isCopy_ == JNI_TRUE;
}

template<typename T>
inline size_t PinnedPrimitiveArray<T>::size() const noexcept {
  return size_;
}

template<typename T>
inline PinnedPrimitiveArray<T>::~PinnedPrimitiveArray() noexcept {
  if (elements_) {
    release();
  }
}

#pragma push_macro("DECLARE_PRIMITIVE_METHODS")
#undef DECLARE_PRIMITIVE_METHODS
#define DECLARE_PRIMITIVE_METHODS(TYPE, NAME)          \
template<> TYPE* PinnedPrimitiveArray<TYPE>::get();    \
template<> void PinnedPrimitiveArray<TYPE>::release(); \

DECLARE_PRIMITIVE_METHODS(jboolean, Boolean)
DECLARE_PRIMITIVE_METHODS(jbyte, Byte)
DECLARE_PRIMITIVE_METHODS(jchar, Char)
DECLARE_PRIMITIVE_METHODS(jshort, Short)
DECLARE_PRIMITIVE_METHODS(jint, Int)
DECLARE_PRIMITIVE_METHODS(jlong, Long)
DECLARE_PRIMITIVE_METHODS(jfloat, Float)
DECLARE_PRIMITIVE_METHODS(jdouble, Double)
#pragma pop_macro("DECLARE_PRIMITIVE_METHODS")


template<typename T, typename Base>
inline alias_ref<jclass> JavaClass<T, Base>::javaClassStatic() {
  static auto cls = findClassStatic(
    std::string(T::kJavaDescriptor + 1, strlen(T::kJavaDescriptor) - 2).c_str());
  return cls;
}

template<typename T, typename Base>
inline local_ref<jclass> JavaClass<T, Base>::javaClassLocal() {
  std::string className(T::kJavaDescriptor + 1, strlen(T::kJavaDescriptor) - 2);
  return findClassLocal(className.c_str());
}

}}
