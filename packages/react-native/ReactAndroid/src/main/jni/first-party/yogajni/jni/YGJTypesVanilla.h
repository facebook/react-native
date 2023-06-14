/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <map>
#include <vector>

#include <yoga/Yoga.h>

#include "common.h"
#include "jni.h"

class PtrJNodeMapVanilla {
  std::map<YGNodeRef, size_t> ptrsToIdxs_;
  jobjectArray javaNodes_;

public:
  PtrJNodeMapVanilla() : ptrsToIdxs_{}, javaNodes_{} {}
  PtrJNodeMapVanilla(jlongArray javaNativePointers, jobjectArray javaNodes)
      : javaNodes_{javaNodes} {
    using namespace facebook::yoga::vanillajni;

    JNIEnv* env = getCurrentEnv();
    size_t nativePointersSize = env->GetArrayLength(javaNativePointers);
    std::vector<jlong> nativePointers(nativePointersSize);
    env->GetLongArrayRegion(
        javaNativePointers, 0, nativePointersSize, nativePointers.data());

    for (size_t i = 0; i < nativePointersSize; ++i) {
      ptrsToIdxs_[(YGNodeRef) nativePointers[i]] = i;
    }
  }

  facebook::yoga::vanillajni::ScopedLocalRef<jobject> ref(YGNodeRef node) {
    using namespace facebook::yoga::vanillajni;

    JNIEnv* env = getCurrentEnv();
    auto idx = ptrsToIdxs_.find(node);
    if (idx == ptrsToIdxs_.end()) {
      return ScopedLocalRef<jobject>(env);
    } else {
      return make_local_ref(
          env, env->GetObjectArrayElement(javaNodes_, idx->second));
    }
  }
};
