/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fb/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <react/bridgeless/BindingsInstaller.h>
#include <react/bridgeless/ReactInstance.h>

namespace facebook {
namespace react {

class JBindingsInstaller : public jni::HybridClass<JBindingsInstaller>,
                           public BindingsInstaller {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridgeless/BindingsInstaller;";

  ~JBindingsInstaller() {}

 private:
  friend HybridBase;
};

} // namespace react
} // namespace facebook
