/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fb/fbjni.h>
#include <jsireact/JSCallInvoker.h>
#include <memory>

namespace facebook {
namespace react {

class JSCallInvokerHolder
    : public jni::HybridClass<JSCallInvokerHolder> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/turbomodule/core/JSCallInvokerHolderImpl;";

  static void registerNatives();
  std::shared_ptr<JSCallInvoker> getJSCallInvoker();

 private:
  friend HybridBase;
  JSCallInvokerHolder(std::shared_ptr<JSCallInvoker> jsCallInvoker);
  std::shared_ptr<JSCallInvoker> _jsCallInvoker;
};

} // namespace react
} // namespace facebook
