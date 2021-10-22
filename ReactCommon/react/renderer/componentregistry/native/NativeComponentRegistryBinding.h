/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <jsi/jsi.h>

namespace facebook {
namespace react {

/**
 * An app/platform-specific provider function to determine if a component
 * is registered in the native platform.
 */
using HasComponentProviderFunctionType =
    std::function<bool(const std::string &name)>;

/**
 * Represents the JavaScript binding for the HasComponent global function.
 */
class NativeComponentRegistryBinding {
 public:
  /*
   * Installs NativeComponentRegistryBinding into JavaScript runtime.
   * Thread synchronization must be enforced externally.
   */
  static void install(
      jsi::Runtime &runtime,
      const HasComponentProviderFunctionType &&provider);

  NativeComponentRegistryBinding(
      const HasComponentProviderFunctionType &&provider);

  /**
   * Returns if there's a component registered with the name received as a
   * parameter
   */
  bool hasComponent(const std::string &name);

 private:
  /**
   * A lookup function exposed to JS to determine if a component is registered
   * in the native platform.
   */
  jsi::Value jsProxy(
      jsi::Runtime &runtime,
      const jsi::Value &thisVal,
      const jsi::Value *args,
      size_t count);

  HasComponentProviderFunctionType hasComponentProvider_;
};

} // namespace react
} // namespace facebook
