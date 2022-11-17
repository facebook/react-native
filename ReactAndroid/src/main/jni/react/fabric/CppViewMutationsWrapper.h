/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/fabric/CppComponentRegistry.h>

#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/mounting/ShadowViewMutation.h>

namespace facebook {
namespace react {

class CppViewMutationsWrapper
    : public jni::HybridClass<CppViewMutationsWrapper> {
 public:
  constexpr static const char *const kJavaDescriptor =
      "Lcom/facebook/react/fabric/CppViewMutationsWrapper;";

  static void registerNatives();

  // TODO move this to a constructor or init methods
  std::shared_ptr<ShadowViewMutationList> cppViewMutations;

  std::shared_ptr<const CppComponentRegistry> cppComponentRegistry;

  void runCppViewMutations();

 private:
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);
};

} // namespace react
} // namespace facebook
