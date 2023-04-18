// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <memory>
#include <string>

#include <fb/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <react/bridgeless/JSEngineInstance.h>
#include <react/bridgeless/hermes/HermesInstance.h>
#include "../../jni/JJSEngineInstance.h"

namespace facebook {
namespace react {

class JHermesInstance
    : public jni::HybridClass<JHermesInstance, JJSEngineInstance> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/venice/hermes/HermesInstance;";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject>);

  static void registerNatives();

  std::unique_ptr<jsi::Runtime> createJSRuntime() noexcept;

  ~JHermesInstance() {}

 private:
  friend HybridBase;
};

} // namespace react
} // namespace facebook
