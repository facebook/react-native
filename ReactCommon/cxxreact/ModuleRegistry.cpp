// Copyright 2004-present Facebook. All Rights Reserved.

#include "ModuleRegistry.h"

#include "NativeModule.h"
#include "SystraceSection.h"

namespace facebook {
namespace react {

namespace {

std::string normalizeName(std::string name) {
  // TODO mhorowitz #10487027: This is super ugly.  We should just
  // change iOS to emit normalized names, drop the "RK..." from
  // names hardcoded in Android, and then delete this and the
  // similar hacks in js.
  if (name.compare(0, 3, "RCT") == 0) {
    return name.substr(3);
  } else if (name.compare(0, 2, "RK") == 0) {
    return name.substr(2);
  }
  return name;
}

}

ModuleRegistry::ModuleRegistry(std::vector<std::unique_ptr<NativeModule>> modules)
    : modules_(std::move(modules)) {}

std::vector<std::string> ModuleRegistry::moduleNames() {
  std::vector<std::string> names;
  for (size_t i = 0; i < modules_.size(); i++) {
    std::string name = normalizeName(modules_[i]->getName());
    modulesByName_[name] = i;
    names.push_back(std::move(name));
  }
  return names;
}

folly::Optional<ModuleConfig> ModuleRegistry::getConfig(const std::string& name) {
  SystraceSection s("getConfig", "module", name);
  auto it = modulesByName_.find(name);
  if (it == modulesByName_.end()) {
    return nullptr;
  }

  CHECK(it->second < modules_.size());
  NativeModule* module = modules_[it->second].get();

  // string name, object constants, array methodNames (methodId is index), [array promiseMethodIds], [array syncMethodIds]
  folly::dynamic config = folly::dynamic::array(name);

  {
    SystraceSection s("getConstants");
    config.push_back(module->getConstants());
  }

  {
    SystraceSection s("getMethods");
    std::vector<MethodDescriptor> methods = module->getMethods();

    folly::dynamic methodNames = folly::dynamic::array;
    folly::dynamic promiseMethodIds = folly::dynamic::array;
    folly::dynamic syncMethodIds = folly::dynamic::array;

    for (auto& descriptor : methods) {
      // TODO: #10487027 compare tags instead of doing string comparison?
      methodNames.push_back(std::move(descriptor.name));
      if (descriptor.type == "promise") {
        promiseMethodIds.push_back(methodNames.size() - 1);
      } else if (descriptor.type == "sync") {
        syncMethodIds.push_back(methodNames.size() - 1);
      }
    }

    if (!methodNames.empty()) {
      config.push_back(std::move(methodNames));
      if (!promiseMethodIds.empty() || !syncMethodIds.empty()) {
        config.push_back(std::move(promiseMethodIds));
        if (!syncMethodIds.empty()) {
          config.push_back(std::move(syncMethodIds));
        }
      }
    }
  }

  if (config.size() == 1) {
    // no constants or methods
    return nullptr;
  } else {
    return ModuleConfig({it->second, config});
  }
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

  modules_[moduleId]->invoke(token, methodId, std::move(params));
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
