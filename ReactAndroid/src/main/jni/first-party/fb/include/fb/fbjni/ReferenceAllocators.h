/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * @file ReferenceAllocators.h
 *
 * Reference allocators are used to create and delete various classes of JNI references (local,
 * global, and weak global).
 */

#pragma once

#include <fb/visibility.h>

#include "Common.h"

namespace facebook { namespace jni {

/// Allocator that handles local references
class FBEXPORT LocalReferenceAllocator {
 public:
  jobject newReference(jobject original) const;
  void deleteReference(jobject reference) const noexcept;
  bool verifyReference(jobject reference) const noexcept;
};

/// Allocator that handles global references
class FBEXPORT GlobalReferenceAllocator {
 public:
  jobject newReference(jobject original) const;
  void deleteReference(jobject reference) const noexcept;
  bool verifyReference(jobject reference) const noexcept;
};

/// Allocator that handles weak global references
class FBEXPORT WeakGlobalReferenceAllocator {
 public:
  jobject newReference(jobject original) const;
  void deleteReference(jobject reference) const noexcept;
  bool verifyReference(jobject reference) const noexcept;
};

/// @cond INTERNAL
namespace internal {

/**
 * @return true iff env->GetObjectRefType is expected to work properly.
 */
FBEXPORT bool doesGetObjectRefTypeWork();

}
/// @endcond

}}

#include "ReferenceAllocators-inl.h"
