/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "fb/fbjni.h"


namespace facebook {
namespace jni {

namespace detail {

local_ref<HybridData> HybridData::create() {
  return newInstance();
}

}

namespace {
void deleteNative(alias_ref<jclass>, jlong ptr) {
  delete reinterpret_cast<detail::BaseHybridClass*>(ptr);
}
}

void HybridDataOnLoad() {
  registerNatives("com/facebook/jni/HybridData$Destructor", {
      makeNativeMethod("deleteNative", deleteNative),
  });
}

}}
