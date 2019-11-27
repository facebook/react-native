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

/**
 * @file ReferenceAllocators.h
 *
 * Reference allocators are used to create and delete various classes of JNI references (local,
 * global, and weak global).
 */

#pragma once

#include "Common.h"

namespace facebook { namespace jni {

/// Allocator that handles local references
class LocalReferenceAllocator {
 public:
  jobject newReference(jobject original) const;
  void deleteReference(jobject reference) const noexcept;
  bool verifyReference(jobject reference) const noexcept;
};

/// Allocator that handles global references
class GlobalReferenceAllocator {
 public:
  jobject newReference(jobject original) const;
  void deleteReference(jobject reference) const noexcept;
  bool verifyReference(jobject reference) const noexcept;
};

/// Allocator that handles weak global references
class WeakGlobalReferenceAllocator {
 public:
  jobject newReference(jobject original) const;
  void deleteReference(jobject reference) const noexcept;
  bool verifyReference(jobject reference) const noexcept;
};

/**
 * @return Helper based on GetObjectRefType.  Since this isn't defined
 * on all versions of Java or Android, if the type can't be
 * determined, this returns true.  If reference is nullptr, returns
 * true.
 */
bool isObjectRefType(jobject reference, jobjectRefType refType);

}}

#include "ReferenceAllocators-inl.h"
