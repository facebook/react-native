// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <folly/Optional.h>

#include <memory>
#include <string>

#include <jschelpers/Value.h>

#include "ModuleRegistry.h"

namespace facebook {
namespace react {

/**
 * Holds and creates JS representations of the modules in ModuleRegistry
 */
class JSCNativeModules {

public:
  explicit JSCNativeModules(std::shared_ptr<ModuleRegistry> moduleRegistry);
  JSValueRef getModule(JSContextRef context, JSStringRef name);
  void reset();

private:
  folly::Optional<Object> m_genNativeModuleJS;
  std::shared_ptr<ModuleRegistry> m_moduleRegistry;
  std::unordered_map<std::string, Object> m_objects;

  folly::Optional<Object> createModule(const std::string& name, JSContextRef context);
};

}
}
