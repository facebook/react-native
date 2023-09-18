/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <react/runtime/JSEngineInstance.h>

namespace facebook::react {

class JJSEngineInstance : public jni::HybridClass<JJSEngineInstance>,
                          public JSEngineInstance {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/runtime/JSEngineInstance;";

 private:
  friend HybridBase;
};

} // namespace facebook::react
