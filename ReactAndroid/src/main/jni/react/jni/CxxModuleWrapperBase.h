// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <string>

#include <cxxreact/CxxModule.h>
#include <fb/fbjni.h>

namespace facebook {
namespace react {

struct JNativeModule : jni::JavaClass<JNativeModule> {
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/react/bridge/NativeModule;";
};

/**
 * The C++ part of a CxxModuleWrapper is not a unique class, but it
 * must extend this base class.
 */
class CxxModuleWrapperBase
  : public jni::HybridClass<CxxModuleWrapperBase, JNativeModule> {
public:
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/react/bridge/CxxModuleWrapperBase;";

  static void registerNatives() {
    registerHybrid({
      makeNativeMethod("getName", CxxModuleWrapperBase::getName)
    });
  }

  // JNI method
  virtual std::string getName() = 0;

  // Called by ModuleRegistryBuilder
  virtual std::unique_ptr<xplat::module::CxxModule> getModule() = 0;
};

}
}
