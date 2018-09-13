/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ReferenceAllocators.h"

namespace facebook {
namespace jni {

template<typename T, typename Enable = void>
class JObjectWrapper;

namespace detail {
struct JObjectBase {
  jobject get() const noexcept;
  void set(jobject reference) noexcept;
  jobject this_;
};

// RefReprType maps a type to the representation used by fbjni smart references.
template <typename T, typename Enable = void>
struct RefReprType;

template <typename T>
struct JavaObjectType;

template <typename T>
struct ReprAccess;
}

// Given T, either a jobject-like type or a JavaClass-derived type, ReprType<T>
// is the corresponding JavaClass-derived type and JniType<T> is the
// jobject-like type.
template <typename T>
using ReprType = typename detail::RefReprType<T>::type;

template <typename T>
using JniType = typename detail::JavaObjectType<T>::type;

template<typename T, typename Alloc>
class base_owned_ref;

template<typename T, typename Alloc>
class basic_strong_ref;

template<typename T>
class weak_ref;

template<typename T>
class alias_ref;

/// A smart unique reference owning a local JNI reference
template<typename T>
using local_ref = basic_strong_ref<T, LocalReferenceAllocator>;

/// A smart unique reference owning a global JNI reference
template<typename T>
using global_ref = basic_strong_ref<T, GlobalReferenceAllocator>;

}} // namespace facebook::jni
