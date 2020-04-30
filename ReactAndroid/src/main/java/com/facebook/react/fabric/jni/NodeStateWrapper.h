/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/core/State.h>
#include <react/jni/ReadableNativeMap.h>

namespace facebook {
namespace react {

class NodeStateWrapper : public jni::HybridClass<NodeStateWrapper> {
 public:
  constexpr static const char *const kJavaDescriptor =
      "Lcom/facebook/react/fabric/NodeStateWrapper;";

  NodeStateWrapper() {}

  static void registerNatives();

  jni::local_ref<ReadableNativeMap::jhybridobject> getState();
  void updateState(ReadableNativeMap *map);

  const State *state_;

 private:
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);
};

} // namespace react
} // namespace facebook
