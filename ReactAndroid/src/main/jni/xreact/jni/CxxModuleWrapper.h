// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "CxxModuleWrapperBase.h"

namespace facebook {
namespace react {

class CxxModuleWrapper : public jni::HybridClass<CxxModuleWrapper, CxxModuleWrapperBase> {
public:
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/react/cxxbridge/CxxModuleWrapper;";

  static void registerNatives() {
    registerHybrid({
      makeNativeMethod("makeDsoNative", CxxModuleWrapper::makeDsoNative)
    });
  }

  static jni::local_ref<CxxModuleWrapper::javaobject> makeDsoNative(
    jni::alias_ref<jclass>, const std::string& soPath, const std::string& fname);

  std::string getName() override {
    return module_->getName();
  }

  // This steals ownership of the underlying module for use by the C++ bridge
  std::unique_ptr<xplat::module::CxxModule> getModule() override {
    return std::move(module_);
  }

protected:
  friend HybridBase;

  explicit CxxModuleWrapper(std::unique_ptr<xplat::module::CxxModule> module)
    : module_(std::move(module)) {}

  std::unique_ptr<xplat::module::CxxModule> module_;
};

}
}
