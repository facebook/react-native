// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <fb/visibility.h>

#include "CoreClasses.h"

namespace facebook {
namespace jni {

/**
 * Wrap Java's WeakReference instead of using JNI WeakGlobalRefs.
 * A WeakGlobalRef can yield a strong reference even after the object has been
  * finalized. See comment in the djinni library.
 * https://github.com/dropbox/djinni/blob/master/support-lib/jni/djinni_support.hpp
 */
template<typename T = jobject>
class JWeakReference : public JavaClass<JWeakReference<T>> {

 typedef JavaClass<JWeakReference<T>> JavaBase_;

 public:
  static constexpr const char* kJavaDescriptor = "Ljava/lang/ref/WeakReference;";

  static local_ref<JWeakReference<T>> newInstance(alias_ref<T> object) {
    return JavaBase_::newInstance(static_ref_cast<jobject>(object));
  }

  local_ref<T> get() const {
    static auto method = JavaBase_::javaClassStatic()->template getMethod<jobject()>("get");
    return static_ref_cast<T>(method(JavaBase_::self()));
  }
};

}
}
