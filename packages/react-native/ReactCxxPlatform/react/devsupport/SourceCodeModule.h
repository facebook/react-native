/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <memory>
#include <string>

namespace facebook::react {

class DevServerHelper;

using SourceCodeConstants = NativeSourceCodeSourceCodeConstants<std::string>;

template <>
struct Bridging<SourceCodeConstants>
    : NativeSourceCodeSourceCodeConstantsBridging<SourceCodeConstants> {};

class SourceCodeModule : public NativeSourceCodeCxxSpec<SourceCodeModule> {
 public:
  explicit SourceCodeModule(
      std::shared_ptr<CallInvoker> jsInvoker,
      std::shared_ptr<DevServerHelper> devServerHelper = nullptr)
      : NativeSourceCodeCxxSpec(jsInvoker), devServerHelper_(devServerHelper) {}

  SourceCodeConstants getConstants(jsi::Runtime& rt);

 private:
  std::weak_ptr<DevServerHelper> devServerHelper_;
};

} // namespace facebook::react
