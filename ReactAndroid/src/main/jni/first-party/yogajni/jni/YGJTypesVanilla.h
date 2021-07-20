/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "jni.h"
#include <yoga/YGValue.h>
#include <yoga/Yoga.h>
#include <map>
#include "common.h"

using namespace facebook::yoga::vanillajni;
using namespace std;

class PtrJNodeMapVanilla {
  std::map<YGNodeRef, size_t> ptrsToIdxs_;
  jobjectArray javaNodes_;

public:
  PtrJNodeMapVanilla() : ptrsToIdxs_{}, javaNodes_{} {}
  PtrJNodeMapVanilla(jlongArray javaNativePointers, jobjectArray javaNodes)
      : javaNodes_{javaNodes} {

    JNIEnv* env = getCurrentEnv();
    size_t nativePointersSize = env->GetArrayLength(javaNativePointers);
    std::vector<jlong> nativePointers(nativePointersSize);
    env->GetLongArrayRegion(
        javaNativePointers, 0, nativePointersSize, nativePointers.data());

    for (size_t i = 0; i < nativePointersSize; ++i) {
      ptrsToIdxs_[(YGNodeRef) nativePointers[i]] = i;
    }
  }

  ScopedLocalRef<jobject> ref(YGNodeRef node) {
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
