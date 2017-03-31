// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <string>
#include <vector>

#include <cxxreact/CxxModule.h>
#include <fb/fbjni.h>

namespace facebook {
namespace react {

struct JNativeModule : jni::JavaClass<JNativeModule> {
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/react/bridge/NativeModule;";
};

class CxxModuleWrapper :
    public jni::HybridClass<CxxModuleWrapper, JNativeModule> {
public:
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/react/cxxbridge/CxxModuleWrapper;";

  static void registerNatives();

  CxxModuleWrapper(const std::string& soPath, const std::string& fname);

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject>, const std::string& soPath, const std::string& fname) {
    return makeCxxInstance(soPath, fname);
  }

  // JNI methods
  std::string getName();

  // This steals ownership of the underlying module for use by the C++ bridge
  std::unique_ptr<xplat::module::CxxModule> getModule() {
    // TODO mhorowitz: remove this (and a lot of other code) once the java
    // bridge is dead.
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
