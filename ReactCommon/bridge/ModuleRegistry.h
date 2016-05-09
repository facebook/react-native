// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <vector>

#include <folly/dynamic.h>

#include "ExecutorToken.h"
#include "NativeModule.h"

namespace facebook {
namespace react {

class NativeModule;

class ModuleRegistry {
 public:
  // not implemented:
  // onBatchComplete: see https://our.intern.facebook.com/intern/tasks/?t=5279396
  // getModule: only used by views
  // getAllModules: only used for cleanup; use RAII instead
  // notifyCatalystInstanceInitialized: this is really only used by view-related code
  // notifyCatalystInstanceDestroy: use RAII instead

  ModuleRegistry(std::vector<std::unique_ptr<NativeModule>> modules);
  folly::dynamic moduleDescriptions();
  void callNativeMethod(ExecutorToken token, unsigned int moduleId, unsigned int methodId,
                        folly::dynamic&& params, int callId);
  MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int moduleId, unsigned int methodId, folly::dynamic&& args);

 private:
  std::vector<std::unique_ptr<NativeModule>> modules_;
};

}
}
