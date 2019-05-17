// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Instance.h"

#include "JSBigString.h"
#include "JSBundleType.h"
#include "JSExecutor.h"
#include "MessageQueueThread.h"
#include "MethodCall.h"
#include "NativeToJsBridge.h"
#include "RAMBundleRegistry.h"
#include "RecoverableError.h"
#include "SystraceSection.h"

#include <cxxreact/JSIndexedRAMBundle.h>
#include <folly/Memory.h>
#include <folly/MoveWrapper.h>
#include <folly/json.h>

#include <glog/logging.h>

#include <condition_variable>
#include <fstream>
#include <mutex>
#include <string>

namespace facebook {
namespace react {

Instance::~Instance() {
  if (bundleRegistry_) {
    bundleRegistry_->disposeExecutionEnvironments();
  }
}

void Instance::initializeBridge(
    std::unique_ptr<InstanceCallback> callback,
    std::shared_ptr<JSExecutorFactory> jsef,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::shared_ptr<ModuleRegistry> moduleRegistry) {
  callback_ = std::move(callback);
  moduleRegistry_ = std::move(moduleRegistry);
  bundleRegistry_ = std::make_unique<BundleRegistry>(
    jsef.get(),
    moduleRegistry_,
    callback_,
    [jsQueue]() { return jsQueue; } // TODO: use a factory
  );
  // jsQueue->runOnQueueSync([this, &jsef, jsQueue]() mutable {
  //   nativeToJsBridge_ = folly::make_unique<NativeToJsBridge>(
  //       jsef.get(), moduleRegistry_, jsQueue, callback_);

  //   std::lock_guard<std::mutex> lock(m_syncMutex);
  //   m_syncReady = true;
  //   m_syncCV.notify_all();
  // });

  // CHECK(nativeToJsBridge_);
}

void Instance::loadBundleAsync(std::unique_ptr<const Bundle> bundle) {
  callback_->incrementPendingJSCalls();
  SystraceSection s("Instance::loadBundleAsync", "sourceURL", bundle->getSourceURL());
  bundleRegistry_->runNewExecutionEnvironment(std::move(bundle), [this]() {
    std::lock_guard<std::mutex> lock(m_syncMutex);
    m_syncReady = true;
    m_syncCV.notify_all();
  });
}

void Instance::loadBundleSync(std::unique_ptr<const Bundle> bundle) {
  std::unique_lock<std::mutex> lock(m_syncMutex);
  m_syncCV.wait(lock, [this] { return m_syncReady; });

  SystraceSection s("Instance::loadBundleSync", "sourceURL", bundle->getSourceURL());
  bundleRegistry_->runNewExecutionEnvironment(std::move(bundle), [this]() {
    // TODO: check if this is needed at all
    std::lock_guard<std::mutex> lock(m_syncMutex);
    m_syncReady = true;
    m_syncCV.notify_all();
  });
}

void Instance::loadBundle(std::unique_ptr<const Bundle> bundle, bool loadSynchronously) {
  SystraceSection s("Instance::loadBundle", "sourceURL", bundle->getSourceURL());
  if (loadSynchronously) {
    loadBundleSync(std::move(bundle));
  } else {
    loadBundleAsync(std::move(bundle));
  }
}

bool Instance::isIndexedRAMBundle(const char *sourcePath) {
  std::ifstream bundle_stream(sourcePath, std::ios_base::in);
  BundleHeader header;

  if (!bundle_stream ||
      !bundle_stream.read(reinterpret_cast<char *>(&header), sizeof(header))) {
    return false;
  }

  return parseTypeFromHeader(header) == ScriptTag::RAMBundle;
}

bool Instance::isIndexedRAMBundle(std::unique_ptr<const JSBigString>* script) {
  BundleHeader header;
  strncpy(reinterpret_cast<char *>(&header), script->get()->c_str(), sizeof(header));

  return parseTypeFromHeader(header) == ScriptTag::RAMBundle;
}

void Instance::setGlobalVariable(std::string propName,
                                 std::unique_ptr<const JSBigString> jsonValue) {
  if (auto execEnv = bundleRegistry_->getFirstExecutionEnvironemnt().lock()) {
    execEnv->nativeToJsBridge->setGlobalVariable(std::move(propName),
                                                 std::move(jsonValue));
  } else {
    throw std::runtime_error("BundleExecutionEnvironment pointer is invalid");
  }
}

void* Instance::getJavaScriptContext() {
  if (bundleRegistry_->hasExecutionEnvironemnt()) {
    if (auto execEnv = bundleRegistry_->getFirstExecutionEnvironemnt().lock()) {
      return execEnv->nativeToJsBridge ? execEnv->nativeToJsBridge->getJavaScriptContext() : nullptr;
    }
  }

  return nullptr;
}

bool Instance::isInspectable() {
  if (bundleRegistry_->hasExecutionEnvironemnt()) {
    if (auto execEnv = bundleRegistry_->getFirstExecutionEnvironemnt().lock()) {
      return execEnv->nativeToJsBridge ? execEnv->nativeToJsBridge->isInspectable() : false;
    }
  }
  
  return false;
}
  
bool Instance::isBatchActive() {
  if (bundleRegistry_->hasExecutionEnvironemnt()) {
    if (auto execEnv = bundleRegistry_->getFirstExecutionEnvironemnt().lock()) {
      return execEnv->nativeToJsBridge ? execEnv->nativeToJsBridge->isBatchActive() : false;
    }
  }
  
  return false;
}

void Instance::callJSFunction(std::string &&module, std::string &&method,
                              folly::dynamic &&params) {
  callback_->incrementPendingJSCalls();
  if (auto execEnv = bundleRegistry_->getFirstExecutionEnvironemnt().lock()) {
    execEnv->nativeToJsBridge->callFunction(std::move(module),
                                            std::move(method),
                                            std::move(params));
  } else {
    throw std::runtime_error("BundleExecutionEnvironment pointer is invalid");
  }
}

void Instance::callJSCallback(uint64_t callbackId, folly::dynamic &&params) {
  SystraceSection s("Instance::callJSCallback");
  callback_->incrementPendingJSCalls();
  if (auto execEnv = bundleRegistry_->getFirstExecutionEnvironemnt().lock()) {
    execEnv->nativeToJsBridge->invokeCallback((double)callbackId, std::move(params));
  } else {
    throw std::runtime_error("BundleExecutionEnvironment pointer is invalid");
  }
}

const ModuleRegistry &Instance::getModuleRegistry() const {
  return *moduleRegistry_;
}

ModuleRegistry &Instance::getModuleRegistry() { return *moduleRegistry_; }

void Instance::handleMemoryPressure(int pressureLevel) {
  if (auto execEnv = bundleRegistry_->getFirstExecutionEnvironemnt().lock()) {
    execEnv->nativeToJsBridge->handleMemoryPressure(pressureLevel);
  } else {
    throw std::runtime_error("BundleExecutionEnvironment pointer is invalid");
  }
}

void Instance::invokeAsync(std::function<void()>&& func) {
  nativeToJsBridge_->runOnExecutorQueue([func=std::move(func)](JSExecutor *executor) {
    func();
    executor->flush();
  });
}

} // namespace react
} // namespace facebook
