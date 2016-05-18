// Copyright 2004-present Facebook. All Rights Reserved.

#include "ModuleRegistry.h"

#include "NativeModule.h"
#include "SystraceSection.h"

namespace facebook {
namespace react {

ModuleRegistry::ModuleRegistry(std::vector<std::unique_ptr<NativeModule>> modules)
    : modules_(std::move(modules)) {}

folly::dynamic ModuleRegistry::moduleDescriptions() {
  folly::dynamic modDescs = folly::dynamic::object;

  for (size_t moduleId = 0; moduleId < modules_.size(); ++moduleId) {
    const auto& module = modules_[moduleId];

    folly::dynamic methodDescs = folly::dynamic::object;
    std::vector<MethodDescriptor> methods;
    {
      SystraceSection s("getMethods",
                        "module", module->getName());
      methods = module->getMethods();
    }
    for (size_t methodId = 0; methodId < methods.size(); ++methodId) {
      methodDescs.insert(std::move(methods[methodId].name),
                         folly::dynamic::object
                         ("methodID", methodId)
                         ("type", std::move(methods[methodId].type)));
    }

    folly::dynamic constants = folly::dynamic::array();
    {
      SystraceSection s("getConstants",
                        "module", module->getName());
      constants = module->getConstants();
    }

    modDescs.insert(module->getName(),
                    folly::dynamic::object
                    ("supportsWebWorkers", module->supportsWebWorkers())
                    ("moduleID", moduleId)
                    ("methods", std::move(methodDescs))
                    ("constants", std::move(constants)));

  }
  return modDescs;
}

void ModuleRegistry::callNativeMethod(ExecutorToken token, unsigned int moduleId, unsigned int methodId,
                                      folly::dynamic&& params, int callId) {
  if (moduleId >= modules_.size()) {
    throw std::runtime_error(
      folly::to<std::string>("moduleId ", moduleId,
                             " out of range [0..", modules_.size(), ")"));
  }

#ifdef WITH_FBSYSTRACE
  if (callId != -1) {
    fbsystrace_end_async_flow(TRACE_TAG_REACT_APPS, "native", callId);
  }
#endif

  // TODO mhorowitz: systrace
  std::string what;
  try {
    modules_[moduleId]->invoke(token, methodId, std::move(params));
    return;
  } catch (const std::exception& e) {
    what = e.what();
    // fall through;
  } catch (...) {
    // fall through;
  }

  std::string moduleName = modules_[moduleId]->getName();
  auto descs = modules_[moduleId]->getMethods();
  std::string methodName;
  if (methodId < descs.size()) {
    methodName = descs[methodId].name;
  } else {
    methodName = folly::to<std::string>("id ", methodId, " (out of range [0..",
                                        descs.size(), "))");
  }

  if (what.empty()) {
    throw std::runtime_error(
      folly::to<std::string>("Unknown native exception in module '", moduleName,
                             "' method '", methodName, "'"));
  } else {
    throw std::runtime_error(
      folly::to<std::string>("Native exception in module '", moduleName,
                             "' method '", methodName, "': ", what));
  }
}

MethodCallResult ModuleRegistry::callSerializableNativeHook(ExecutorToken token, unsigned int moduleId, unsigned int methodId, folly::dynamic&& params) {
  if (moduleId >= modules_.size()) {
    throw std::runtime_error(
      folly::to<std::string>("moduleId ", moduleId,
                             " out of range [0..", modules_.size(), ")"));
  }
  return modules_[moduleId]->callSerializableNativeHook(token, methodId, std::move(params));
}

}}
