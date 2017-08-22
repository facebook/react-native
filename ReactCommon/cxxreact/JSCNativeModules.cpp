// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCNativeModules.h"

#include <string>

#include "Platform.h"

namespace facebook {
namespace react {

JSCNativeModules::JSCNativeModules(std::shared_ptr<ModuleRegistry> moduleRegistry) :
  m_moduleRegistry(std::move(moduleRegistry)) {}

JSValueRef JSCNativeModules::getModule(JSContextRef context, JSStringRef jsName) {
  if (!m_moduleRegistry) {
    return nullptr;
  }

  std::string moduleName = String::ref(context, jsName).str();

  const auto it = m_objects.find(moduleName);
  if (it != m_objects.end()) {
    return static_cast<JSObjectRef>(it->second);
  }

  auto module = createModule(moduleName, context);
  if (!module.hasValue()) {
    // Allow lookup to continue in the objects own properties, which allows for overrides of NativeModules
    return nullptr;
  }

  // Protect since we'll be holding on to this value, even though JS may not
  module->makeProtected();

  auto result = m_objects.emplace(std::move(moduleName), std::move(*module)).first;
  return static_cast<JSObjectRef>(result->second);
}

void JSCNativeModules::reset() {
  m_genNativeModuleJS = nullptr;
  m_objects.clear();
}

folly::Optional<Object> JSCNativeModules::createModule(const std::string& name, JSContextRef context) {
  ReactMarker::logTaggedMarker(ReactMarker::NATIVE_MODULE_SETUP_START, name.c_str());

  if (!m_genNativeModuleJS) {
    auto global = Object::getGlobalObject(context);
    m_genNativeModuleJS = global.getProperty("__fbGenNativeModule").asObject();
    m_genNativeModuleJS->makeProtected();
  }

  auto result = m_moduleRegistry->getConfig(name);
  if (!result.hasValue()) {
    return nullptr;
  }

  Value moduleInfo = m_genNativeModuleJS->callAsFunction({
    Value::fromDynamic(context, result->config),
    Value::makeNumber(context, result->index)
  });
  CHECK(!moduleInfo.isNull()) << "Module returned from genNativeModule is null";

  folly::Optional<Object> module(moduleInfo.asObject().getProperty("module").asObject());

  ReactMarker::logTaggedMarker(ReactMarker::NATIVE_MODULE_SETUP_STOP, name.c_str());

  return module;
}

} }
