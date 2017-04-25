// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>
#include <vector>

#include <folly/dynamic.h>
#include <cxxreact/Executor.h>

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

class NativeModule {
 public:
  virtual ~NativeModule() {}
  virtual std::string getName() = 0;
  virtual std::vector<MethodDescriptor> getMethods() = 0;
  virtual folly::dynamic getConstants() = 0;
  // TODO mhorowitz: do we need initialize()/onCatalystInstanceDestroy() in C++
  // or only Java?
  virtual void invoke(unsigned int reactMethodId, folly::dynamic&& params) = 0;
  virtual MethodCallResult callSerializableNativeHook(unsigned int reactMethodId, folly::dynamic&& args) = 0;
};

}
}
