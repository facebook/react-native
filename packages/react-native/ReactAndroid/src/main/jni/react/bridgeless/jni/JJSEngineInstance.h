// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <fb/fbjni.h>
#include <jni.h>
#include <react/bridgeless/JSEngineInstance.h>

namespace facebook {

namespace react {

class JJSEngineInstance : public jni::HybridClass<JJSEngineInstance>,
                          public JSEngineInstance {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/venice/JSEngineInstance;";

 private:
  friend HybridBase;
};

} // namespace react
} // namespace facebook
