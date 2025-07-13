/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ModuleRegistry.h"

#ifndef RCT_FIT_RM_OLD_RUNTIME

#include <glog/logging.h>
#include <reactperflogger/BridgeNativeModulePerfLogger.h>

#include "NativeModule.h"
#include "TraceSection.h"

namespace facebook::react {

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

} // namespace

ModuleRegistry::ModuleRegistry(
    std::vector<std::unique_ptr<NativeModule>> modules,
    ModuleNotFoundCallback callback)
    : modules_{std::move(modules)}, moduleNotFoundCallback_{callback} {}

void ModuleRegistry::updateModuleNamesFromIndex(size_t index) {
  for (; index < modules_.size(); index++) {
    std::string name = normalizeName(modules_[index]->getName());
    modulesByName_[name] = index;
  }
}

void ModuleRegistry::registerModules(
    std::vector<std::unique_ptr<NativeModule>> modules) {
  TraceSection s_("ModuleRegistry::registerModules");
  // Noop if there are no NativeModules to add
  if (modules.empty()) {
    return;
  }

  if (modules_.empty() && unknownModules_.empty()) {
    modules_ = std::move(modules);
  } else {
    size_t modulesSize = modules_.size();
    size_t addModulesSize = modules.size();
    bool addToNames = !modulesByName_.empty();
    modules_.reserve(modulesSize + addModulesSize);
    std::move(modules.begin(), modules.end(), std::back_inserter(modules_));
    if (!unknownModules_.empty()) {
      for (size_t index = modulesSize; index < modulesSize + addModulesSize;
           index++) {
        std::string name = normalizeName(modules_[index]->getName());
        auto it = unknownModules_.find(name);
        if (it != unknownModules_.end()) {
          throw std::runtime_error(
              "module " + name +
              " was required without being registered and is now being registered.");
        } else if (addToNames) {
          modulesByName_[name] = index;
        }
      }
    } else if (addToNames) {
      updateModuleNamesFromIndex(modulesSize);
    }
  }
}

std::vector<std::string> ModuleRegistry::moduleNames() {
  TraceSection s_("ModuleRegistry::moduleNames");
  std::vector<std::string> names;
  for (size_t i = 0; i < modules_.size(); i++) {
    std::string name = normalizeName(modules_[i]->getName());
    modulesByName_[name] = i;
    names.push_back(std::move(name));
  }
  return names;
}

std::optional<ModuleConfig> ModuleRegistry::getConfig(const std::string& name) {
  TraceSection s("ModuleRegistry::getConfig", "module", name);

  // Initialize modulesByName_
  if (modulesByName_.empty() && !modules_.empty()) {
    moduleNames();
  }

  auto it = modulesByName_.find(name);

  if (it == modulesByName_.end()) {
    if (unknownModules_.find(name) != unknownModules_.end()) {
      BridgeNativeModulePerfLogger::moduleJSRequireBeginningFail(name.c_str());
      BridgeNativeModulePerfLogger::moduleJSRequireEndingStart(name.c_str());
      return std::nullopt;
    }

    if (!moduleNotFoundCallback_) {
      unknownModules_.insert(name);
      BridgeNativeModulePerfLogger::moduleJSRequireBeginningFail(name.c_str());
      BridgeNativeModulePerfLogger::moduleJSRequireEndingStart(name.c_str());
      return std::nullopt;
    }

    BridgeNativeModulePerfLogger::moduleJSRequireBeginningEnd(name.c_str());

    bool wasModuleLazilyLoaded = moduleNotFoundCallback_(name);
    it = modulesByName_.find(name);

    bool wasModuleRegisteredWithRegistry =
        wasModuleLazilyLoaded && it != modulesByName_.end();

    if (!wasModuleRegisteredWithRegistry) {
      BridgeNativeModulePerfLogger::moduleJSRequireEndingStart(name.c_str());
      unknownModules_.insert(name);
      return std::nullopt;
    }
  } else {
    BridgeNativeModulePerfLogger::moduleJSRequireBeginningEnd(name.c_str());
  }

  // If we've gotten this far, then we've signaled moduleJSRequireBeginningEnd

  size_t index = it->second;

  CHECK(index < modules_.size());
  NativeModule* module = modules_[index].get();

  // string name, object constants, array methodNames (methodId is index),
  // [array promiseMethodIds], [array syncMethodIds]
  folly::dynamic config = folly::dynamic::array(name);

  {
    TraceSection s_("ModuleRegistry::getConstants", "module", name);
    /**
     * In the case that there are constants, we'll initialize the NativeModule,
     * and signal moduleJSRequireEndingStart. Otherwise, we'll simply signal the
     * event. The Module will be initialized when we invoke one of its
     * NativeModule methods.
     */
    config.push_back(module->getConstants());
  }

  {
    TraceSection s_("ModuleRegistry::getMethods", "module", name);
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

  if (config.size() == 2 && config[1].empty()) {
    // no constants or methods
    return std::nullopt;
  } else {
    return ModuleConfig{index, std::move(config)};
  }
}

std::string ModuleRegistry::getModuleName(unsigned int moduleId) {
  if (moduleId >= modules_.size()) {
    throw std::runtime_error(
        "moduleId " + std::to_string(moduleId) + " out of range [0.." +
        std::to_string(modules_.size()) + ")");
  }

  return modules_[moduleId]->getName();
}

std::string ModuleRegistry::getModuleSyncMethodName(
    unsigned int moduleId,
    unsigned int methodId) {
  if (moduleId >= modules_.size()) {
    throw std::runtime_error(
        "moduleId " + std::to_string(moduleId) + " out of range [0.." +
        std::to_string(modules_.size()) + ")");
  }

  return modules_[moduleId]->getSyncMethodName(methodId);
}

void ModuleRegistry::callNativeMethod(
    unsigned int moduleId,
    unsigned int methodId,
    folly::dynamic&& params,
    int callId) {
  if (moduleId >= modules_.size()) {
    throw std::runtime_error(
        "moduleId " + std::to_string(moduleId) + " out of range [0.." +
        std::to_string(modules_.size()) + ")");
  }
  modules_[moduleId]->invoke(methodId, std::move(params), callId);
}

MethodCallResult ModuleRegistry::callSerializableNativeHook(
    unsigned int moduleId,
    unsigned int methodId,
    folly::dynamic&& params) {
  if (moduleId >= modules_.size()) {
    throw std::runtime_error(
        "moduleId " + std::to_string(moduleId) + " out of range [0.." +
        std::to_string(modules_.size()) + ")");
  }
  return modules_[moduleId]->callSerializableNativeHook(
      methodId, std::move(params));
}

} // namespace facebook::react

#endif // RCT_FIT_RM_OLD_RUNTIME
