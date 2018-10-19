/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <string>
#include <jni.h>
#include <fb/noncopyable.h>
#include <fb/Countable.h>
#include <fb/visibility.h>


namespace facebook {
namespace jni {

class FBEXPORT WeakReference : public Countable {
public:
  typedef RefPtr<WeakReference> Ptr;
  WeakReference(jobject strongRef);
  ~WeakReference();
  jweak weakRef() {
    return m_weakReference;
  }

private:
  jweak m_weakReference;
};

// This class is intended to take a weak reference and turn it into a strong
// local reference. Consequently, it should only be allocated on the stack.
class FBEXPORT ResolvedWeakReference : public noncopyable {
public:
  ResolvedWeakReference(jobject weakRef);
  ResolvedWeakReference(const RefPtr<WeakReference>& weakRef);
  ~ResolvedWeakReference();

  operator jobject () {
    return m_strongReference;
  }

  explicit operator bool () {
    return m_strongReference != nullptr;
  }

private:
  jobject m_strongReference;
};

} }

