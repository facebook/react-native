/**
 * Copyright 2004-present, Facebook, Inc.
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

#pragma once

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
    static const auto method = JavaBase_::javaClassStatic()->template getMethod<jobject()>("get");
    return static_ref_cast<T>(method(JavaBase_::self()));
  }
};

}
}
