/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <new>
#include "CoreClasses.h"

namespace facebook {
namespace jni {

template<typename T>
inline enable_if_t<IsPlainJniReference<T>(), T> getPlainJniReference(T ref) {
  return ref;
}

template<typename T>
inline JniType<T> getPlainJniReference(alias_ref<T> ref) {
  return ref.get();
}

template<typename T, typename A>
inline JniType<T> getPlainJniReference(const base_owned_ref<T, A>& ref) {
  return ref.get();
}


namespace detail {
template <typename Repr>
struct ReprAccess {
  using javaobject = JniType<Repr>;
  static void set(Repr& repr, javaobject obj) noexcept {
    repr.JObjectBase::set(obj);
  }
  static javaobject get(const Repr& repr) {
    return static_cast<javaobject>(repr.JObject::get());
  }
};

namespace {
template <typename Repr>
void StaticAssertValidRepr() noexcept {
  static_assert(std::is_base_of<JObject, Repr>::value,
      "A smart ref representation must be derived from JObject.");
  static_assert(IsPlainJniReference<JniType<Repr>>(), "T must be a JNI reference");
  static_assert(sizeof(Repr) == sizeof(JObjectBase), "");
  static_assert(alignof(Repr) == alignof(JObjectBase), "");
}
}

template <typename Repr>
ReprStorage<Repr>::ReprStorage(JniType<Repr> obj) noexcept {
  StaticAssertValidRepr<Repr>();
  set(obj);
}

template <typename Repr>
void ReprStorage<Repr>::set(JniType<Repr> obj) noexcept {
  new (&storage_) Repr;
  ReprAccess<Repr>::set(get(), obj);
}

template <typename Repr>
Repr& ReprStorage<Repr>::get() noexcept {
  return *reinterpret_cast<Repr*>(&storage_);
}

template <typename Repr>
const Repr& ReprStorage<Repr>::get() const noexcept {
  return *reinterpret_cast<const Repr*>(&storage_);
}

template <typename Repr>
JniType<Repr> ReprStorage<Repr>::jobj() const noexcept {
  ReprAccess<Repr>::get(get());
  return ReprAccess<Repr>::get(get());
}

template <typename Repr>
void ReprStorage<Repr>::swap(ReprStorage& other) noexcept {
  StaticAssertValidRepr<Repr>();
  using std::swap;
  swap(get(), other.get());
}

inline void JObjectBase::set(jobject reference) noexcept {
  this_ = reference;
}

inline jobject JObjectBase::get() const noexcept {
  return this_;
}

template<typename T, typename Alloc>
enable_if_t<IsNonWeakReference<T>(), plain_jni_reference_t<T>> make_ref(const T& reference) {
  auto old_reference = getPlainJniReference(reference);
  if (!old_reference) {
    return nullptr;
  }

  auto ref = Alloc{}.newReference(old_reference);
  if (!ref) {
    // Note that we end up here if we pass a weak ref that refers to a collected object.
    // Thus, it's hard to come up with a reason why this function should be used with
    // weak references.
    throw std::bad_alloc{};
  }

  return static_cast<plain_jni_reference_t<T>>(ref);
}

} // namespace detail

template<typename T>
inline local_ref<T> adopt_local(T ref) noexcept {
  static_assert(IsPlainJniReference<T>(), "T must be a plain jni reference");
  return local_ref<T>{ref};
}

template<typename T>
inline global_ref<T> adopt_global(T ref) noexcept {
  static_assert(IsPlainJniReference<T>(), "T must be a plain jni reference");
  return global_ref<T>{ref};
}

template<typename T>
inline weak_ref<T> adopt_weak_global(T ref) noexcept {
  static_assert(IsPlainJniReference<T>(), "T must be a plain jni reference");
  return weak_ref<T>{ref};
}


template<typename T>
inline enable_if_t<IsPlainJniReference<T>(), alias_ref<T>> wrap_alias(T ref) noexcept {
  return alias_ref<T>(ref);
}


template<typename T>
enable_if_t<IsPlainJniReference<T>(), alias_ref<T>> wrap_alias(T ref) noexcept;


template<typename T>
enable_if_t<IsNonWeakReference<T>(), local_ref<plain_jni_reference_t<T>>>
make_local(const T& ref) {
  return adopt_local(detail::make_ref<T, LocalReferenceAllocator>(ref));
}

template<typename T>
enable_if_t<IsNonWeakReference<T>(), global_ref<plain_jni_reference_t<T>>>
make_global(const T& ref) {
  return adopt_global(detail::make_ref<T, GlobalReferenceAllocator>(ref));
}

template<typename T>
enable_if_t<IsNonWeakReference<T>(), weak_ref<plain_jni_reference_t<T>>>
make_weak(const T& ref) {
  return adopt_weak_global(detail::make_ref<T, WeakGlobalReferenceAllocator>(ref));
}

template<typename T1, typename T2>
inline enable_if_t<IsNonWeakReference<T1>() && IsNonWeakReference<T2>(), bool>
operator==(const T1& a, const T2& b) {
  return isSameObject(getPlainJniReference(a), getPlainJniReference(b));
}

template<typename T1, typename T2>
inline enable_if_t<IsNonWeakReference<T1>() && IsNonWeakReference<T2>(), bool>
operator!=(const T1& a, const T2& b) {
  return !(a == b);
}


// base_owned_ref ///////////////////////////////////////////////////////////////////////

template<typename T, typename Alloc>
inline base_owned_ref<T, Alloc>::base_owned_ref() noexcept
  : base_owned_ref(nullptr)
{}

template<typename T, typename Alloc>
inline base_owned_ref<T, Alloc>::base_owned_ref(std::nullptr_t t) noexcept
  : base_owned_ref(static_cast<javaobject>(nullptr))
{}

template<typename T, typename Alloc>
inline base_owned_ref<T, Alloc>::base_owned_ref(const base_owned_ref& other)
  : storage_{static_cast<javaobject>(Alloc{}.newReference(other.get()))}
{}

template<typename T, typename Alloc>
template<typename U>
inline base_owned_ref<T, Alloc>::base_owned_ref(const base_owned_ref<U, Alloc>& other)
  : storage_{static_cast<javaobject>(Alloc{}.newReference(other.get()))}
{}

template<typename T, typename Alloc>
inline facebook::jni::base_owned_ref<T, Alloc>::base_owned_ref(
    javaobject reference) noexcept
  : storage_(reference) {
  assert(Alloc{}.verifyReference(reference));
  internal::dbglog("New wrapped ref=%p this=%p", get(), this);
}

template<typename T, typename Alloc>
inline base_owned_ref<T, Alloc>::base_owned_ref(
    base_owned_ref<T, Alloc>&& other) noexcept
  : storage_(other.get()) {
  internal::dbglog("New move from ref=%p other=%p", other.get(), &other);
  internal::dbglog("New move to ref=%p this=%p", get(), this);
  // JObject is a simple type and does not support move semantics so we explicitly
  // clear other
  other.set(nullptr);
}

template<typename T, typename Alloc>
template<typename U>
base_owned_ref<T, Alloc>::base_owned_ref(base_owned_ref<U, Alloc>&& other) noexcept
  : storage_(other.get()) {
  internal::dbglog("New move from ref=%p other=%p", other.get(), &other);
  internal::dbglog("New move to ref=%p this=%p", get(), this);
  // JObject is a simple type and does not support move semantics so we explicitly
  // clear other
  other.set(nullptr);
}

template<typename T, typename Alloc>
inline base_owned_ref<T, Alloc>::~base_owned_ref() noexcept {
  reset();
  internal::dbglog("Ref destruct ref=%p this=%p", get(), this);
}

template<typename T, typename Alloc>
inline auto base_owned_ref<T, Alloc>::release() noexcept -> javaobject {
  auto value = get();
  internal::dbglog("Ref release ref=%p this=%p", value, this);
  set(nullptr);
  return value;
}

template<typename T, typename Alloc>
inline void base_owned_ref<T,Alloc>::reset() noexcept {
  reset(nullptr);
}

template<typename T, typename Alloc>
inline void base_owned_ref<T,Alloc>::reset(javaobject reference) noexcept {
  if (get()) {
    assert(Alloc{}.verifyReference(reference));
    Alloc{}.deleteReference(get());
  }
  set(reference);
}

template<typename T, typename Alloc>
inline auto base_owned_ref<T, Alloc>::get() const noexcept -> javaobject {
  return storage_.jobj();
}

template<typename T, typename Alloc>
inline void base_owned_ref<T, Alloc>::set(javaobject ref) noexcept {
  storage_.set(ref);
}


// weak_ref ///////////////////////////////////////////////////////////////////////

template<typename T>
inline weak_ref<T>& weak_ref<T>::operator=(
    const weak_ref& other) {
  auto otherCopy = other;
  swap(*this, otherCopy);
  return *this;
}

template<typename T>
inline weak_ref<T>& weak_ref<T>::operator=(
    weak_ref<T>&& other) noexcept {
  internal::dbglog("Op= move ref=%p this=%p oref=%p other=%p",
      get(), this, other.get(), &other);
  reset(other.release());
  return *this;
}

template<typename T>
local_ref<T> weak_ref<T>::lockLocal() const {
  return adopt_local(
      static_cast<javaobject>(LocalReferenceAllocator{}.newReference(get())));
}

template<typename T>
global_ref<T> weak_ref<T>::lockGlobal() const {
  return adopt_global(
      static_cast<javaobject>(GlobalReferenceAllocator{}.newReference(get())));
}

template<typename T>
inline void swap(
    weak_ref<T>& a,
    weak_ref<T>& b) noexcept {
  internal::dbglog("Ref swap a.ref=%p a=%p b.ref=%p b=%p",
      a.get(), &a, b.get(), &b);
  a.storage_.swap(b.storage_);
}


// basic_strong_ref ////////////////////////////////////////////////////////////////////////////

template<typename T, typename Alloc>
inline basic_strong_ref<T, Alloc>& basic_strong_ref<T, Alloc>::operator=(
    const basic_strong_ref& other) {
  auto otherCopy = other;
  swap(*this, otherCopy);
  return *this;
}

template<typename T, typename Alloc>
inline basic_strong_ref<T, Alloc>& basic_strong_ref<T, Alloc>::operator=(
    basic_strong_ref<T, Alloc>&& other) noexcept {
  internal::dbglog("Op= move ref=%p this=%p oref=%p other=%p",
      get(), this, other.get(), &other);
  reset(other.release());
  return *this;
}

template<typename T, typename Alloc>
inline alias_ref<T> basic_strong_ref<T, Alloc>::releaseAlias() noexcept {
  return wrap_alias(release());
}

template<typename T, typename Alloc>
inline basic_strong_ref<T, Alloc>::operator bool() const noexcept {
  return get() != nullptr;
}

template<typename T, typename Alloc>
inline auto basic_strong_ref<T, Alloc>::operator->() noexcept -> Repr* {
  return &storage_.get();
}

template<typename T, typename Alloc>
inline auto basic_strong_ref<T, Alloc>::operator->() const noexcept -> const Repr* {
  return &storage_.get();
}

template<typename T, typename Alloc>
inline auto basic_strong_ref<T, Alloc>::operator*() noexcept -> Repr& {
  return storage_.get();
}

template<typename T, typename Alloc>
inline auto basic_strong_ref<T, Alloc>::operator*() const noexcept -> const Repr& {
  return storage_.get();
}

template<typename T, typename Alloc>
inline void swap(
    basic_strong_ref<T, Alloc>& a,
    basic_strong_ref<T, Alloc>& b) noexcept {
  internal::dbglog("Ref swap a.ref=%p a=%p b.ref=%p b=%p",
      a.get(), &a, b.get(), &b);
  using std::swap;
  a.storage_.swap(b.storage_);
}


// alias_ref //////////////////////////////////////////////////////////////////////////////

template<typename T>
inline alias_ref<T>::alias_ref() noexcept
  : storage_{nullptr}
{}

template<typename T>
inline alias_ref<T>::alias_ref(std::nullptr_t) noexcept
  : storage_{nullptr}
{}

template<typename T>
inline alias_ref<T>::alias_ref(const alias_ref& other) noexcept
  : storage_{other.get()}
{}

template<typename T>
inline alias_ref<T>::alias_ref(javaobject ref) noexcept
  : storage_(ref) {
  assert(
      LocalReferenceAllocator{}.verifyReference(ref) ||
      GlobalReferenceAllocator{}.verifyReference(ref));
}

template<typename T>
template<typename TOther, typename /* for SFINAE */>
inline alias_ref<T>::alias_ref(alias_ref<TOther> other) noexcept
  : storage_{other.get()}
{}

template<typename T>
template<typename TOther, typename AOther, typename /* for SFINAE */>
inline alias_ref<T>::alias_ref(const basic_strong_ref<TOther, AOther>& other) noexcept
  : storage_{other.get()}
{}

template<typename T>
inline alias_ref<T>& alias_ref<T>::operator=(alias_ref other) noexcept {
  swap(*this, other);
  return *this;
}

template<typename T>
inline alias_ref<T>::operator bool() const noexcept {
  return get() != nullptr;
}

template<typename T>
inline auto facebook::jni::alias_ref<T>::get() const noexcept -> javaobject {
  return storage_.jobj();
}

template<typename T>
inline auto alias_ref<T>::operator->() noexcept -> Repr* {
  return &(**this);
}

template<typename T>
inline auto alias_ref<T>::operator->() const noexcept -> const Repr* {
  return &(**this);
}

template<typename T>
inline auto alias_ref<T>::operator*() noexcept -> Repr& {
  return storage_.get();
}

template<typename T>
inline auto alias_ref<T>::operator*() const noexcept -> const Repr& {
  return storage_.get();
}

template<typename T>
inline void alias_ref<T>::set(javaobject ref) noexcept {
  storage_.set(ref);
}

template<typename T>
inline void swap(alias_ref<T>& a, alias_ref<T>& b) noexcept {
  a.storage_.swap(b.storage_);
}

// Could reduce code duplication by using a pointer-to-function
// template argument.  I'm not sure whether that would make the code
// more maintainable (DRY), or less (too clever/confusing.).
template<typename T, typename U>
enable_if_t<IsPlainJniReference<T>(), local_ref<T>>
static_ref_cast(const local_ref<U>& ref) noexcept
{
  T p = static_cast<T>(ref.get());
  return make_local(p);
}

template<typename T, typename U>
enable_if_t<IsPlainJniReference<T>(), global_ref<T>>
static_ref_cast(const global_ref<U>& ref) noexcept
{
  T p = static_cast<T>(ref.get());
  return make_global(p);
}

template<typename T, typename U>
enable_if_t<IsPlainJniReference<T>(), alias_ref<T>>
static_ref_cast(const alias_ref<U>& ref) noexcept
{
  T p = static_cast<T>(ref.get());
  return wrap_alias(p);
}

template<typename T, typename RefType>
auto dynamic_ref_cast(const RefType& ref) ->
enable_if_t<IsPlainJniReference<T>(), decltype(static_ref_cast<T>(ref))>
{
  if (! ref) {
    return decltype(static_ref_cast<T>(ref))();
  }

  std::string target_class_name{jtype_traits<T>::base_name()};

  // If not found, will throw an exception.
  alias_ref<jclass> target_class = findClassStatic(target_class_name.c_str());

  local_ref<jclass> source_class = ref->getClass();

  if ( ! source_class->isAssignableFrom(target_class)) {
    throwNewJavaException("java/lang/ClassCastException",
                          "Tried to cast from %s to %s.",
                          source_class->toString().c_str(),
                          target_class_name.c_str());
  }

  return static_ref_cast<T>(ref);
}

}}
