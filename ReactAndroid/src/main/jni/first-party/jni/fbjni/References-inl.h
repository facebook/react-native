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
inline enable_if_t<IsPlainJniReference<T>(), local_ref<T>> adopt_local(T ref) noexcept {
  return local_ref<T>{ref};
}

template<typename T>
inline enable_if_t<IsPlainJniReference<T>(), global_ref<T>> adopt_global(T ref) noexcept {
  return global_ref<T>{ref};
}

template<typename T>
inline enable_if_t<IsPlainJniReference<T>(), weak_ref<T>> adopt_weak_global(T ref) noexcept {
  return weak_ref<T>{ref};
}


template<typename T>
inline enable_if_t<IsPlainJniReference<T>(), alias_ref<T>> wrap_alias(T ref) noexcept {
  return alias_ref<T>(ref);
}


template<typename T>
enable_if_t<IsPlainJniReference<T>(), alias_ref<T>> wrap_alias(T ref) noexcept;


template<typename T>
inline enable_if_t<IsPlainJniReference<T>(), T> getPlainJniReference(T ref) {
  return ref;
}

template<typename T>
inline T getPlainJniReference(alias_ref<T> ref) {
  return ref.get();
}

template<typename T, typename A>
inline T getPlainJniReference(const base_owned_ref<T, A>& ref) {
  return ref.getPlainJniReference();
}


namespace internal {

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

}

template<typename T>
enable_if_t<IsNonWeakReference<T>(), local_ref<plain_jni_reference_t<T>>>
make_local(const T& ref) {
  return adopt_local(internal::make_ref<T, LocalReferenceAllocator>(ref));
}

template<typename T>
enable_if_t<IsNonWeakReference<T>(), global_ref<plain_jni_reference_t<T>>>
make_global(const T& ref) {
  return adopt_global(internal::make_ref<T, GlobalReferenceAllocator>(ref));
}

template<typename T>
enable_if_t<IsNonWeakReference<T>(), weak_ref<plain_jni_reference_t<T>>>
make_weak(const T& ref) {
  return adopt_weak_global(internal::make_ref<T, WeakGlobalReferenceAllocator>(ref));
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
inline constexpr base_owned_ref<T, Alloc>::base_owned_ref() noexcept
  : object_{nullptr}
{}

template<typename T, typename Alloc>
inline constexpr base_owned_ref<T, Alloc>::base_owned_ref(
    std::nullptr_t t) noexcept
  : object_{nullptr}
{}

template<typename T, typename Alloc>
inline base_owned_ref<T, Alloc>::base_owned_ref(
    const base_owned_ref& other)
  : object_{Alloc{}.newReference(other.getPlainJniReference())}
{}

template<typename T, typename Alloc>
template<typename U>
inline base_owned_ref<T, Alloc>::base_owned_ref(const base_owned_ref<U, Alloc>& other)
  : object_{Alloc{}.newReference(other.getPlainJniReference())}
{}

template<typename T, typename Alloc>
inline facebook::jni::base_owned_ref<T, Alloc>::base_owned_ref(
    T reference) noexcept
  : object_{reference} {
  assert(Alloc{}.verifyReference(reference));
  internal::dbglog("New wrapped ref=%p this=%p", getPlainJniReference(), this);
}

template<typename T, typename Alloc>
inline base_owned_ref<T, Alloc>::base_owned_ref(
    base_owned_ref<T, Alloc>&& other) noexcept
  : object_{other.object_} {
  internal::dbglog("New move from ref=%p other=%p", other.getPlainJniReference(), &other);
  internal::dbglog("New move to ref=%p this=%p", getPlainJniReference(), this);
  // JObjectWrapper is a simple type and does not support move semantics so we explicitly
  // clear other
  other.object_.set(nullptr);
}

template<typename T, typename Alloc>
template<typename U>
base_owned_ref<T, Alloc>::base_owned_ref(base_owned_ref<U, Alloc>&& other) noexcept
  : object_{other.object_} {
  internal::dbglog("New move from ref=%p other=%p", other.getPlainJniReference(), &other);
  internal::dbglog("New move to ref=%p this=%p", getPlainJniReference(), this);
  // JObjectWrapper is a simple type and does not support move semantics so we explicitly
  // clear other
  other.object_.set(nullptr);
}

template<typename T, typename Alloc>
inline base_owned_ref<T, Alloc>::~base_owned_ref() noexcept {
  reset();
  internal::dbglog("Ref destruct ref=%p this=%p", getPlainJniReference(), this);
}

template<typename T, typename Alloc>
inline T base_owned_ref<T, Alloc>::release() noexcept {
  auto value = getPlainJniReference();
  internal::dbglog("Ref release ref=%p this=%p", value, this);
  object_.set(nullptr);
  return value;
}

template<typename T, typename Alloc>
inline void base_owned_ref<T,Alloc>::reset() noexcept {
  reset(nullptr);
}

template<typename T, typename Alloc>
inline void base_owned_ref<T,Alloc>::reset(T reference) noexcept {
  if (getPlainJniReference()) {
    assert(Alloc{}.verifyReference(reference));
    Alloc{}.deleteReference(getPlainJniReference());
  }
  object_.set(reference);
}

template<typename T, typename Alloc>
inline T base_owned_ref<T, Alloc>::getPlainJniReference() const noexcept {
  return static_cast<T>(object_.get());
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
      getPlainJniReference(), this, other.getPlainJniReference(), &other);
  reset(other.release());
  return *this;
}

template<typename T>
local_ref<T> weak_ref<T>::lockLocal() {
  return adopt_local(static_cast<T>(LocalReferenceAllocator{}.newReference(getPlainJniReference())));
}

template<typename T>
global_ref<T> weak_ref<T>::lockGlobal() {
  return adopt_global(static_cast<T>(GlobalReferenceAllocator{}.newReference(getPlainJniReference())));
}

template<typename T>
inline void swap(
    weak_ref<T>& a,
    weak_ref<T>& b) noexcept {
  internal::dbglog("Ref swap a.ref=%p a=%p b.ref=%p b=%p",
      a.getPlainJniReference(), &a, b.getPlainJniReference(), &b);
  using std::swap;
  swap(a.object_, b.object_);
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
      getPlainJniReference(), this, other.getPlainJniReference(), &other);
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
inline T basic_strong_ref<T, Alloc>::get() const noexcept {
  return getPlainJniReference();
}

template<typename T, typename Alloc>
inline JObjectWrapper<T>* basic_strong_ref<T, Alloc>::operator->() noexcept {
  return &object_;
}

template<typename T, typename Alloc>
inline const JObjectWrapper<T>* basic_strong_ref<T, Alloc>::operator->() const noexcept {
  return &object_;
}

template<typename T, typename Alloc>
inline JObjectWrapper<T>& basic_strong_ref<T, Alloc>::operator*() noexcept {
  return object_;
}

template<typename T, typename Alloc>
inline const JObjectWrapper<T>& basic_strong_ref<T, Alloc>::operator*() const noexcept {
  return object_;
}

template<typename T, typename Alloc>
inline void swap(
    basic_strong_ref<T, Alloc>& a,
    basic_strong_ref<T, Alloc>& b) noexcept {
  internal::dbglog("Ref swap a.ref=%p a=%p b.ref=%p b=%p",
      a.getPlainJniReference(), &a, b.getPlainJniReference(), &b);
  using std::swap;
  swap(a.object_, b.object_);
}


// alias_ref //////////////////////////////////////////////////////////////////////////////

template<typename T>
inline constexpr alias_ref<T>::alias_ref() noexcept
  : object_{nullptr}
{}

template<typename T>
inline constexpr alias_ref<T>::alias_ref(std::nullptr_t) noexcept
  : object_{nullptr}
{}

template<typename T>
inline alias_ref<T>::alias_ref(const alias_ref& other) noexcept
  : object_{other.object_}
{}


template<typename T>
inline alias_ref<T>::alias_ref(T ref) noexcept
  : object_{ref} {
  assert(
      LocalReferenceAllocator{}.verifyReference(ref) ||
      GlobalReferenceAllocator{}.verifyReference(ref));
}

template<typename T>
template<typename TOther, typename /* for SFINAE */>
inline alias_ref<T>::alias_ref(alias_ref<TOther> other) noexcept
  : object_{other.get()}
{}

template<typename T>
template<typename TOther, typename AOther, typename /* for SFINAE */>
inline alias_ref<T>::alias_ref(const basic_strong_ref<TOther, AOther>& other) noexcept
  : object_{other.get()}
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
inline T facebook::jni::alias_ref<T>::get() const noexcept {
  return static_cast<T>(object_.get());
}

template<typename T>
inline JObjectWrapper<T>* alias_ref<T>::operator->() noexcept {
  return &object_;
}

template<typename T>
inline const JObjectWrapper<T>* alias_ref<T>::operator->() const noexcept {
  return &object_;
}

template<typename T>
inline JObjectWrapper<T>& alias_ref<T>::operator*() noexcept {
  return object_;
}

template<typename T>
inline const JObjectWrapper<T>& alias_ref<T>::operator*() const noexcept {
  return object_;
}

template<typename T>
inline void swap(alias_ref<T>& a, alias_ref<T>& b) noexcept {
  using std::swap;
  swap(a.object_, b.object_);
}

}}
