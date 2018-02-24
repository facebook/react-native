/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string.h>
#include <type_traits>
#include <stdlib.h>

#include "Common.h"
#include "Exceptions.h"
#include "Meta.h"
#include "MetaConvert.h"

namespace facebook {
namespace jni {

// jobject /////////////////////////////////////////////////////////////////////////////////////////

inline bool isSameObject(alias_ref<JObject> lhs, alias_ref<JObject> rhs) noexcept {
  return internal::getEnv()->IsSameObject(lhs.get(), rhs.get()) != JNI_FALSE;
}

inline local_ref<JClass> JObject::getClass() const noexcept {
  return adopt_local(internal::getEnv()->GetObjectClass(self()));
}

inline bool JObject::isInstanceOf(alias_ref<JClass> cls) const noexcept {
  return internal::getEnv()->IsInstanceOf(self(), cls.get()) != JNI_FALSE;
}

template<typename T>
inline T JObject::getFieldValue(JField<T> field) const noexcept {
  return field.get(self());
}

template<typename T>
inline local_ref<T*> JObject::getFieldValue(JField<T*> field) const noexcept {
  return adopt_local(field.get(self()));
}

template<typename T>
inline void JObject::setFieldValue(JField<T> field, T value) noexcept {
  field.set(self(), value);
}

inline std::string JObject::toString() const {
  static auto method = findClassLocal("java/lang/Object")->getMethod<jstring()>("toString");

  return method(self())->toStdString();
}


// Class is here instead of CoreClasses.h because we need
// alias_ref to be complete.
class MonitorLock {
 public:
  inline MonitorLock() noexcept;
  inline MonitorLock(alias_ref<JObject> object) noexcept;
  inline ~MonitorLock() noexcept;

  inline MonitorLock(MonitorLock&& other) noexcept;
  inline MonitorLock& operator=(MonitorLock&& other) noexcept;

  inline MonitorLock(const MonitorLock&) = delete;
  inline MonitorLock& operator=(const MonitorLock&) = delete;

 private:
  inline void reset() noexcept;
  alias_ref<JObject> owned_;
};

MonitorLock::MonitorLock() noexcept : owned_(nullptr) {}

MonitorLock::MonitorLock(alias_ref<JObject> object) noexcept
    : owned_(object) {
  internal::getEnv()->MonitorEnter(object.get());
}

void MonitorLock::reset() noexcept {
  if (owned_) {
    internal::getEnv()->MonitorExit(owned_.get());
    if (internal::getEnv()->ExceptionCheck()) {
      abort(); // Lock mismatch
    }
    owned_ = nullptr;
  }
}

MonitorLock::~MonitorLock() noexcept {
  reset();
}

MonitorLock::MonitorLock(MonitorLock&& other) noexcept
    : owned_(other.owned_)
{
  other.owned_ = nullptr;
}

MonitorLock& MonitorLock::operator=(MonitorLock&& other) noexcept {
  reset();
  owned_ = other.owned_;
  other.owned_ = nullptr;
  return *this;
}

inline MonitorLock JObject::lock() const noexcept {
  return MonitorLock(this_);
}

inline jobject JObject::self() const noexcept {
  return this_;
}

inline void swap(JObject& a, JObject& b) noexcept {
  using std::swap;
  swap(a.this_, b.this_);
}

// JavaClass ///////////////////////////////////////////////////////////////////////////////////////

namespace detail {
template<typename JC, typename... Args>
static local_ref<JC> newInstance(Args... args) {
  static auto cls = JC::javaClassStatic();
  static auto constructor = cls->template getConstructor<typename JC::javaobject(Args...)>();
  return cls->newObject(constructor, args...);
}
}


template <typename T, typename B, typename J>
auto JavaClass<T, B, J>::self() const noexcept -> javaobject {
  return static_cast<javaobject>(JObject::self());
}

// jclass //////////////////////////////////////////////////////////////////////////////////////////

namespace detail {

// This is not a real type.  It is used so people won't accidentally
// use a void* to initialize a NativeMethod.
struct NativeMethodWrapper;

}

struct NativeMethod {
  const char* name;
  std::string descriptor;
  detail::NativeMethodWrapper* wrapper;
};

inline local_ref<JClass> JClass::getSuperclass() const noexcept {
  return adopt_local(internal::getEnv()->GetSuperclass(self()));
}

inline void JClass::registerNatives(std::initializer_list<NativeMethod> methods) {
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

inline bool JClass::isAssignableFrom(alias_ref<JClass> other) const noexcept {
  const auto env = internal::getEnv();
  // Ths method has behavior compatible with the
  // java.lang.Class#isAssignableFrom method.  The order of the
  // arguments to the JNI IsAssignableFrom C function is "opposite"
  // from what some might expect, which makes this code look a little
  // odd, but it is correct.
  const auto result = env->IsAssignableFrom(other.get(), self());
  return result;
}

template<typename F>
inline JConstructor<F> JClass::getConstructor() const {
  return getConstructor<F>(jmethod_traits_from_cxx<F>::constructor_descriptor().c_str());
}

template<typename F>
inline JConstructor<F> JClass::getConstructor(const char* descriptor) const {
  constexpr auto constructor_method_name = "<init>";
  return getMethod<F>(constructor_method_name, descriptor);
}

template<typename F>
inline JMethod<F> JClass::getMethod(const char* name) const {
  return getMethod<F>(name, jmethod_traits_from_cxx<F>::descriptor().c_str());
}

template<typename F>
inline JMethod<F> JClass::getMethod(
    const char* name,
    const char* descriptor) const {
  const auto env = internal::getEnv();
  const auto method = env->GetMethodID(self(), name, descriptor);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!method);
  return JMethod<F>{method};
}

template<typename F>
inline JStaticMethod<F> JClass::getStaticMethod(const char* name) const {
  return getStaticMethod<F>(name, jmethod_traits_from_cxx<F>::descriptor().c_str());
}

template<typename F>
inline JStaticMethod<F> JClass::getStaticMethod(
    const char* name,
    const char* descriptor) const {
  const auto env = internal::getEnv();
  const auto method = env->GetStaticMethodID(self(), name, descriptor);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!method);
  return JStaticMethod<F>{method};
}

template<typename F>
inline JNonvirtualMethod<F> JClass::getNonvirtualMethod(const char* name) const {
  return getNonvirtualMethod<F>(name, jmethod_traits_from_cxx<F>::descriptor().c_str());
}

template<typename F>
inline JNonvirtualMethod<F> JClass::getNonvirtualMethod(
    const char* name,
    const char* descriptor) const {
  const auto env = internal::getEnv();
  const auto method = env->GetMethodID(self(), name, descriptor);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!method);
  return JNonvirtualMethod<F>{method};
}

template<typename T>
inline JField<enable_if_t<IsJniScalar<T>(), T>>
JClass::getField(const char* name) const {
  return getField<T>(name, jtype_traits<T>::descriptor().c_str());
}

template<typename T>
inline JField<enable_if_t<IsJniScalar<T>(), T>> JClass::getField(
    const char* name,
    const char* descriptor) const {
  const auto env = internal::getEnv();
  auto field = env->GetFieldID(self(), name, descriptor);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!field);
  return JField<T>{field};
}

template<typename T>
inline JStaticField<enable_if_t<IsJniScalar<T>(), T>> JClass::getStaticField(
    const char* name) const {
  return getStaticField<T>(name, jtype_traits<T>::descriptor().c_str());
}

template<typename T>
inline JStaticField<enable_if_t<IsJniScalar<T>(), T>> JClass::getStaticField(
    const char* name,
    const char* descriptor) const {
  const auto env = internal::getEnv();
  auto field = env->GetStaticFieldID(self(), name, descriptor);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!field);
  return JStaticField<T>{field};
}

template<typename T>
inline T JClass::getStaticFieldValue(JStaticField<T> field) const noexcept {
  return field.get(self());
}

template<typename T>
inline local_ref<T*> JClass::getStaticFieldValue(JStaticField<T*> field) noexcept {
  return adopt_local(field.get(self()));
}

template<typename T>
inline void JClass::setStaticFieldValue(JStaticField<T> field, T value) noexcept {
  field.set(self(), value);
}

template<typename R, typename... Args>
inline local_ref<R> JClass::newObject(
    JConstructor<R(Args...)> constructor,
    Args... args) const {
  const auto env = internal::getEnv();
  auto object = env->NewObject(self(), constructor.getId(),
      detail::callToJni(
        detail::Convert<typename std::decay<Args>::type>::toCall(args))...);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!object);
  return adopt_local(static_cast<R>(object));
}

inline jclass JClass::self() const noexcept {
  return static_cast<jclass>(JObject::self());
}

inline void registerNatives(const char* name, std::initializer_list<NativeMethod> methods) {
  findClassLocal(name)->registerNatives(methods);
}


// jstring /////////////////////////////////////////////////////////////////////////////////////////

inline local_ref<JString> make_jstring(const std::string& modifiedUtf8) {
  return make_jstring(modifiedUtf8.c_str());
}

namespace detail {
// convert to std::string from jstring
template <>
struct Convert<std::string> {
  typedef jstring jniType;
  static std::string fromJni(jniType t) {
    return wrap_alias(t)->toStdString();
  }
  static jniType toJniRet(const std::string& t) {
    return make_jstring(t).release();
  }
  static local_ref<JString> toCall(const std::string& t) {
    return make_jstring(t);
  }
};

// convert return from const char*
template <>
struct Convert<const char*> {
  typedef jstring jniType;
  // no automatic synthesis of const char*.  (It can't be freed.)
  static jniType toJniRet(const char* t) {
    return make_jstring(t).release();
  }
  static local_ref<JString> toCall(const char* t) {
    return make_jstring(t);
  }
};
}

// jtypeArray //////////////////////////////////////////////////////////////////////////////////////

namespace detail {
inline size_t JArray::size() const noexcept {
  const auto env = internal::getEnv();
  return env->GetArrayLength(self());
}
}

namespace detail {
template<typename Target>
inline ElementProxy<Target>::ElementProxy(
    Target* target,
    size_t idx)
    : target_{target}, idx_{idx} {}

template<typename Target>
inline ElementProxy<Target>& ElementProxy<Target>::operator=(const T& o) {
  target_->setElement(idx_, o);
  return *this;
}

template<typename Target>
inline ElementProxy<Target>& ElementProxy<Target>::operator=(alias_ref<T>& o) {
  target_->setElement(idx_, o.get());
  return *this;
}

template<typename Target>
inline ElementProxy<Target>& ElementProxy<Target>::operator=(alias_ref<T>&& o) {
  target_->setElement(idx_, o.get());
  return *this;
}

template<typename Target>
inline ElementProxy<Target>& ElementProxy<Target>::operator=(const ElementProxy<Target>& o) {
  auto src = o.target_->getElement(o.idx_);
  target_->setElement(idx_, src.get());
  return *this;
}

template<typename Target>
inline ElementProxy<Target>::ElementProxy::operator const local_ref<T> () const {
  return target_->getElement(idx_);
}

template<typename Target>
inline ElementProxy<Target>::ElementProxy::operator local_ref<T> () {
  return target_->getElement(idx_);
}
}

template <typename T>
std::string JArrayClass<T>::get_instantiated_java_descriptor() {
  return "[" + jtype_traits<T>::descriptor();
};

template <typename T>
std::string JArrayClass<T>::get_instantiated_base_name() {
  return get_instantiated_java_descriptor();
};

template<typename T>
auto JArrayClass<T>::newArray(size_t size) -> local_ref<javaobject> {
  static auto elementClass = findClassStatic(jtype_traits<T>::base_name().c_str());
  const auto env = internal::getEnv();
  auto rawArray = env->NewObjectArray(size, elementClass.get(), nullptr);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!rawArray);
  return adopt_local(static_cast<javaobject>(rawArray));
}

template<typename T>
inline void JArrayClass<T>::setElement(size_t idx, const T& value) {
  const auto env = internal::getEnv();
  env->SetObjectArrayElement(this->self(), idx, value);
}

template<typename T>
inline local_ref<T> JArrayClass<T>::getElement(size_t idx) {
  const auto env = internal::getEnv();
  auto rawElement = env->GetObjectArrayElement(this->self(), idx);
  return adopt_local(static_cast<T>(rawElement));
}

template<typename T>
inline detail::ElementProxy<JArrayClass<T>> JArrayClass<T>::operator[](size_t index) {
  return detail::ElementProxy<JArrayClass<T>>(this, index);
}

// jarray /////////////////////////////////////////////////////////////////////////////////////////

template <typename JArrayType>
auto JPrimitiveArray<JArrayType>::getRegion(jsize start, jsize length)
    -> std::unique_ptr<T[]> {
  using T = typename jtype_traits<JArrayType>::entry_type;
  auto buf = std::unique_ptr<T[]>{new T[length]};
  getRegion(start, length, buf.get());
  return buf;
}

template <typename JArrayType>
std::string JPrimitiveArray<JArrayType>::get_instantiated_java_descriptor() {
  return jtype_traits<JArrayType>::descriptor();
}
template <typename JArrayType>
std::string JPrimitiveArray<JArrayType>::get_instantiated_base_name() {
  return JPrimitiveArray::get_instantiated_java_descriptor();
}

template <typename JArrayType>
auto JPrimitiveArray<JArrayType>::pin() -> PinnedPrimitiveArray<T, PinnedArrayAlloc<T>> {
  return PinnedPrimitiveArray<T, PinnedArrayAlloc<T>>{this->self(), 0, 0};
}

template <typename JArrayType>
auto JPrimitiveArray<JArrayType>::pinRegion(jsize start, jsize length)
    -> PinnedPrimitiveArray<T, PinnedRegionAlloc<T>> {
  return PinnedPrimitiveArray<T, PinnedRegionAlloc<T>>{this->self(), start, length};
}

template <typename JArrayType>
auto JPrimitiveArray<JArrayType>::pinCritical()
    -> PinnedPrimitiveArray<T, PinnedCriticalAlloc<T>> {
  return PinnedPrimitiveArray<T, PinnedCriticalAlloc<T>>{this->self(), 0, 0};
}

template <typename T>
class PinnedArrayAlloc {
 public:
  static void allocate(
      alias_ref<typename jtype_traits<T>::array_type> array,
      jsize start,
      jsize length,
      T** elements,
      size_t* size,
      jboolean* isCopy) {
    (void) start;
    (void) length;
    *elements = array->getElements(isCopy);
    *size = array->size();
  }
  static void release(
      alias_ref<typename jtype_traits<T>::array_type> array,
      T* elements,
      jint start,
      jint size,
      jint mode) {
    (void) start;
    (void) size;
    array->releaseElements(elements, mode);
  }
};

template <typename T>
class PinnedCriticalAlloc {
 public:
  static void allocate(
      alias_ref<typename jtype_traits<T>::array_type> array,
      jsize start,
      jsize length,
      T** elements,
      size_t* size,
      jboolean* isCopy) {
    const auto env = internal::getEnv();
    *elements = static_cast<T*>(env->GetPrimitiveArrayCritical(array.get(), isCopy));
    FACEBOOK_JNI_THROW_EXCEPTION_IF(!elements);
    *size = array->size();
  }
  static void release(
      alias_ref<typename jtype_traits<T>::array_type> array,
      T* elements,
      jint start,
      jint size,
      jint mode) {
    const auto env = internal::getEnv();
    env->ReleasePrimitiveArrayCritical(array.get(), elements, mode);
  }
};

template <typename T>
class PinnedRegionAlloc {
 public:
  static void allocate(
      alias_ref<typename jtype_traits<T>::array_type> array,
      jsize start,
      jsize length,
      T** elements,
      size_t* size,
      jboolean* isCopy) {
    auto buf = array->getRegion(start, length);
    FACEBOOK_JNI_THROW_EXCEPTION_IF(!buf);
    *elements = buf.release();
    *size = length;
    *isCopy = true;
  }
  static void release(
      alias_ref<typename jtype_traits<T>::array_type> array,
      T* elements,
      jint start,
      jint size,
      jint mode) {
    std::unique_ptr<T[]> holder;
    if (mode == 0 || mode == JNI_ABORT) {
      holder.reset(elements);
    }
    if (mode == 0 || mode == JNI_COMMIT) {
      array->setRegion(start, size, elements);
    }
  }
};

// PinnedPrimitiveArray ///////////////////////////////////////////////////////////////////////////

template<typename T, typename Alloc>
PinnedPrimitiveArray<T, Alloc>::PinnedPrimitiveArray(PinnedPrimitiveArray&& o) {
  *this = std::move(o);
}

template<typename T, typename Alloc>
PinnedPrimitiveArray<T, Alloc>&
PinnedPrimitiveArray<T, Alloc>::operator=(PinnedPrimitiveArray&& o) {
  if (array_) {
    release();
  }
  array_ = std::move(o.array_);
  elements_ = o.elements_;
  isCopy_ = o.isCopy_;
  size_ = o.size_;
  start_ = o.start_;
  o.clear();
  return *this;
}

template<typename T, typename Alloc>
T* PinnedPrimitiveArray<T, Alloc>::get() {
  return elements_;
}

template<typename T, typename Alloc>
inline void PinnedPrimitiveArray<T, Alloc>::release() {
  releaseImpl(0);
  clear();
}

template<typename T, typename Alloc>
inline void PinnedPrimitiveArray<T, Alloc>::commit() {
  releaseImpl(JNI_COMMIT);
}

template<typename T, typename Alloc>
inline void PinnedPrimitiveArray<T, Alloc>::abort() {
  releaseImpl(JNI_ABORT);
  clear();
}

template <typename T, typename Alloc>
inline void PinnedPrimitiveArray<T, Alloc>::releaseImpl(jint mode) {
  FACEBOOK_JNI_THROW_EXCEPTION_IF(array_.get() == nullptr);
  Alloc::release(array_, elements_, start_, size_, mode);
}

template<typename T, typename Alloc>
inline void PinnedPrimitiveArray<T, Alloc>::clear() noexcept {
  array_ = nullptr;
  elements_ = nullptr;
  isCopy_ = false;
  start_ = 0;
  size_ = 0;
}

template<typename T, typename Alloc>
inline T& PinnedPrimitiveArray<T, Alloc>::operator[](size_t index) {
  FACEBOOK_JNI_THROW_EXCEPTION_IF(elements_ == nullptr);
  return elements_[index];
}

template<typename T, typename Alloc>
inline bool PinnedPrimitiveArray<T, Alloc>::isCopy() const noexcept {
  return isCopy_ == JNI_TRUE;
}

template<typename T, typename Alloc>
inline size_t PinnedPrimitiveArray<T, Alloc>::size() const noexcept {
  return size_;
}

template<typename T, typename Alloc>
inline PinnedPrimitiveArray<T, Alloc>::~PinnedPrimitiveArray() noexcept {
  if (elements_) {
    release();
  }
}

template<typename T, typename Alloc>
inline PinnedPrimitiveArray<T, Alloc>::PinnedPrimitiveArray(alias_ref<typename jtype_traits<T>::array_type> array, jint start, jint length) {
  array_ = array;
  start_ = start;
  Alloc::allocate(array, start, length, &elements_, &size_, &isCopy_);
}

template<typename T, typename Base, typename JType>
inline alias_ref<JClass> JavaClass<T, Base, JType>::javaClassStatic() {
  static auto cls = findClassStatic(jtype_traits<typename T::javaobject>::base_name().c_str());
  return cls;
}

template<typename T, typename Base, typename JType>
inline local_ref<JClass> JavaClass<T, Base, JType>::javaClassLocal() {
  std::string className(jtype_traits<typename T::javaobject>::base_name().c_str());
  return findClassLocal(className.c_str());
}

}}
