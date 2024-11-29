/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <fbjni/fbjni.h>
#include <memory>

namespace facebook::react {

class NativeMethodCallInvokerHolder
    : public jni::HybridClass<NativeMethodCallInvokerHolder> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/turbomodule/core/NativeMethodCallInvokerHolderImpl;";

  static void registerNatives();
  std::shared_ptr<NativeMethodCallInvoker> getNativeMethodCallInvoker();

 private:
  friend HybridBase;
  NativeMethodCallInvokerHolder(
      std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker);
  std::shared_ptr<NativeMethodCallInvoker> _nativeMethodCallInvoker;
};

} // namespace facebook::react
