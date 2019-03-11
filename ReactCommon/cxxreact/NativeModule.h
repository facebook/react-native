// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <string>
#include <vector>

#include <folly/Optional.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

struct MethodDescriptor {
  std::string name;
  // type is one of js MessageQueue.MethodTypes
  std::string type;

  MethodDescriptor(std::string n, std::string t)
      : name(std::move(n))
      , type(std::move(t)) {}
};

  using MethodCallResult = folly::Optional<folly::dynamic>;

class NativeModule {
 public:
  virtual ~NativeModule() {}
  virtual std::string getName() = 0;
  virtual std::vector<MethodDescriptor> getMethods() = 0;
  virtual folly::dynamic getConstants() = 0;
  virtual void invoke(unsigned int reactMethodId, folly::dynamic&& params, int callId) = 0;
  virtual MethodCallResult callSerializableNativeHook(unsigned int reactMethodId, folly::dynamic&& args) = 0;
};

}
}
