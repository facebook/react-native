/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <vector>

#include <folly/dynamic.h>
#include <optional>

namespace facebook::react {

#ifndef RCT_FIT_RM_OLD_RUNTIME
struct MethodDescriptor {
  std::string name;
  // type is one of js MessageQueue.MethodTypes
  std::string type;

  MethodDescriptor(std::string n, std::string t)
      : name(std::move(n)), type(std::move(t)) {}
};
#endif // RCT_FIT_RM_OLD_RUNTIME

using MethodCallResult = std::optional<folly::dynamic>;

#ifndef RCT_FIT_RM_OLD_RUNTIME
class NativeModule {
 public:
  virtual ~NativeModule() = default;
  virtual std::string getName() = 0;
  virtual std::string getSyncMethodName(unsigned int methodId) = 0;
  virtual std::vector<MethodDescriptor> getMethods() = 0;
  virtual folly::dynamic getConstants() = 0;
  virtual void
  invoke(unsigned int reactMethodId, folly::dynamic&& params, int callId) = 0;
  virtual MethodCallResult callSerializableNativeHook(
      unsigned int reactMethodId,
      folly::dynamic&& args) = 0;
};
#endif // RCT_FIT_RM_OLD_RUNTIME

} // namespace facebook::react
