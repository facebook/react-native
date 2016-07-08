/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <cassert>
#include <new>
#include <atomic>

namespace facebook {
namespace jni {

/// @cond INTERNAL
namespace internal {

// Statistics mostly provided for test (only updated if FBJNI_DEBUG_REFS is defined)
struct ReferenceStats {
  std::atomic_uint locals_deleted, globals_deleted, weaks_deleted;

  void reset() noexcept;
};

extern ReferenceStats g_reference_stats;
}
/// @endcond


// LocalReferenceAllocator /////////////////////////////////////////////////////////////////////////

inline jobject LocalReferenceAllocator::newReference(jobject original) const {
  internal::dbglog("Local new: %p", original);
  auto ref = internal::getEnv()->NewLocalRef(original);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
  return ref;
}

inline void LocalReferenceAllocator::deleteReference(jobject reference) const noexcept {
  internal::dbglog("Local release: %p", reference);

  if (reference) {
    #ifdef FBJNI_DEBUG_REFS
      ++internal::g_reference_stats.locals_deleted;
    #endif
    assert(verifyReference(reference));
    internal::getEnv()->DeleteLocalRef(reference);
  }
}

inline bool LocalReferenceAllocator::verifyReference(jobject reference) const noexcept {
  if (!reference || !internal::doesGetObjectRefTypeWork()) {
    return true;
  }
  return internal::getEnv()->GetObjectRefType(reference) == JNILocalRefType;
}


// GlobalReferenceAllocator ////////////////////////////////////////////////////////////////////////

inline jobject GlobalReferenceAllocator::newReference(jobject original) const {
  internal::dbglog("Global new: %p", original);
  auto ref = internal::getEnv()->NewGlobalRef(original);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
  return ref;
}

inline void GlobalReferenceAllocator::deleteReference(jobject reference) const noexcept {
  internal::dbglog("Global release: %p", reference);

  if (reference) {
    #ifdef FBJNI_DEBUG_REFS
      ++internal::g_reference_stats.globals_deleted;
    #endif
    assert(verifyReference(reference));
    internal::getEnv()->DeleteGlobalRef(reference);
  }
}

inline bool GlobalReferenceAllocator::verifyReference(jobject reference) const noexcept {
  if (!reference || !internal::doesGetObjectRefTypeWork()) {
    return true;
  }
  return internal::getEnv()->GetObjectRefType(reference) == JNIGlobalRefType;
}


// WeakGlobalReferenceAllocator ////////////////////////////////////////////////////////////////////

inline jobject WeakGlobalReferenceAllocator::newReference(jobject original) const {
  internal::dbglog("Weak global new: %p", original);
  auto ref = internal::getEnv()->NewWeakGlobalRef(original);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
  return ref;
}

inline void WeakGlobalReferenceAllocator::deleteReference(jobject reference) const noexcept {
  internal::dbglog("Weak Global release: %p", reference);

  if (reference) {
    #ifdef FBJNI_DEBUG_REFS
      ++internal::g_reference_stats.weaks_deleted;
    #endif
    assert(verifyReference(reference));
    internal::getEnv()->DeleteWeakGlobalRef(reference);
  }
}

inline bool WeakGlobalReferenceAllocator::verifyReference(jobject reference) const noexcept {
  if (!reference || !internal::doesGetObjectRefTypeWork()) {
    return true;
  }
  return internal::getEnv()->GetObjectRefType(reference) == JNIWeakGlobalRefType;
}

}}
