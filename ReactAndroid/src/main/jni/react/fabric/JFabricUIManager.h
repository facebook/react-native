/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

#include "Binding.h"

namespace facebook::react {

class JFabricUIManager : public jni::JavaClass<JFabricUIManager> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/fabric/FabricUIManager;";

  Binding *getBinding();
};

} // namespace facebook::react
