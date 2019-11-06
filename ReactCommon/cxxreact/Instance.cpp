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
  if (nativeToJsBridge_) {
    nativeToJsBridge_->destroy();
  }
}

void Instance::setModuleRegistry(
    std::shared_ptr<ModuleRegistry> moduleRegistry) {
  moduleRegistry_ = std::move(moduleRegistry);
}

void Instance::initializeBridge(
    std::unique_ptr<InstanceCallback> callback,
    std::shared_ptr<ExecutorDelegateFactory> edf,
    std::shared_ptr<JSExecutorFactory> jsef,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::shared_ptr<ModuleRegistry> moduleRegistry) {
  callback_ = std::move(callback);
  moduleRegistry_ = std::move(moduleRegistry);
  
  std::shared_ptr<ExecutorDelegate> delegate;
  if (edf) {
    delegate = edf->createExecutorDelegate(moduleRegistry_, callback_);
  }

  jsQueue->runOnQueueSync([this, delegate, &jsef, jsQueue]() mutable {
    nativeToJsBridge_ = folly::make_unique<NativeToJsBridge>(
        jsef.get(), delegate, moduleRegistry_, jsQueue, callback_, jseConfigParams_);

    std::lock_guard<std::mutex> lock(m_syncMutex);
    m_syncReady = true;
    m_syncCV.notify_all();
  });

  CHECK(nativeToJsBridge_);
}

void Instance::loadApplication(std::unique_ptr<RAMBundleRegistry> bundleRegistry,
                               std::unique_ptr<const JSBigString> bundle,
                               std::string bundleURL) { // TODO(OSS Candidate ISS#2710739)
  callback_->incrementPendingJSCalls();
  SystraceSection s("Instance::loadApplication", "bundleURL", bundleURL);
  nativeToJsBridge_->loadApplication(
      std::move(bundleRegistry), std::move(bundle), std::move(bundleURL));
}

void Instance::loadApplicationSync(std::unique_ptr<RAMBundleRegistry> bundleRegistry,
                                   std::unique_ptr<const JSBigString> bundle,
                                   std::string bundleURL) {
  std::unique_lock<std::mutex> lock(m_syncMutex);
  m_syncCV.wait(lock, [this] { return m_syncReady; });

  SystraceSection s("Instance::loadApplicationSync", "bundleURL", bundleURL);
  nativeToJsBridge_->loadApplicationSync(
      std::move(bundleRegistry), std::move(bundle), std::move(bundleURL));
}

void Instance::setSourceURL(std::string sourceURL) {
  callback_->incrementPendingJSCalls();
  SystraceSection s("Instance::setSourceURL", "sourceURL", sourceURL);

  nativeToJsBridge_->loadApplication(nullptr, nullptr, std::move(sourceURL));
}

void Instance::loadScriptFromString(std::unique_ptr<const JSBigString> bundleString,
                                    std::string bundleURL, // TODO(OSS Candidate ISS#2710739)
                                    bool loadSynchronously) {
  SystraceSection s("Instance::loadScriptFromString", "bundleURL", bundleURL); // TODO(OSS Candidate ISS#2710739)
  if (loadSynchronously) {
    loadApplicationSync(nullptr, std::move(bundleString), std::move(bundleURL));
  } else {
    loadApplication(nullptr, std::move(bundleString), std::move(bundleURL));
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

void Instance::loadRAMBundleFromString(std::unique_ptr<const JSBigString> script, const std::string& sourceURL) {
  auto bundle = folly::make_unique<JSIndexedRAMBundle>(std::move(script));
  auto startupScript = bundle->getStartupCode();
  auto registry = RAMBundleRegistry::singleBundleRegistry(std::move(bundle));
  loadRAMBundle(
    std::move(registry),
    std::move(startupScript),
    sourceURL,
    true);
}

void Instance::loadRAMBundleFromFile(const std::string& sourcePath,
                           const std::string& sourceURL,
                           bool loadSynchronously) {
    auto bundle = folly::make_unique<JSIndexedRAMBundle>(sourcePath.c_str());
    auto startupScript = bundle->getStartupCode();
    auto registry = RAMBundleRegistry::multipleBundlesRegistry(std::move(bundle), JSIndexedRAMBundle::buildFactory());
    loadRAMBundle(
      std::move(registry),
      std::move(startupScript),
      sourceURL,
      loadSynchronously);
}

void Instance::loadRAMBundle(std::unique_ptr<RAMBundleRegistry> bundleRegistry,
                             std::unique_ptr<const JSBigString> startupScript,
                             std::string startupScriptSourceURL,
                             bool loadSynchronously) {
  if (loadSynchronously) {
    loadApplicationSync(std::move(bundleRegistry), std::move(startupScript),
                        std::move(startupScriptSourceURL));
  } else {
    loadApplication(std::move(bundleRegistry), std::move(startupScript),
                    std::move(startupScriptSourceURL));
  }
}

void Instance::setGlobalVariable(std::string propName,
                                 std::unique_ptr<const JSBigString> jsonValue) {
  nativeToJsBridge_->setGlobalVariable(std::move(propName),
                                       std::move(jsonValue));
}

void *Instance::getJavaScriptContext() {
  return nativeToJsBridge_ ? nativeToJsBridge_->getJavaScriptContext()
                           : nullptr;
}

bool Instance::isInspectable() {
  return nativeToJsBridge_ ? nativeToJsBridge_->isInspectable() : false;
}
  
bool Instance::isBatchActive() {
  return nativeToJsBridge_ ? nativeToJsBridge_->isBatchActive() : false;
}

void Instance::callJSFunction(std::string &&module, std::string &&method,
                              folly::dynamic &&params) {
  callback_->incrementPendingJSCalls();
  nativeToJsBridge_->callFunction(std::move(module), std::move(method),
                                  std::move(params));
}

void Instance::callJSCallback(uint64_t callbackId, folly::dynamic &&params) {
  SystraceSection s("Instance::callJSCallback");
  callback_->incrementPendingJSCalls();
  nativeToJsBridge_->invokeCallback((double)callbackId, std::move(params));
}

void Instance::setJSEConfigParams(std::shared_ptr<JSEConfigParams>&& jseConfigParams) {
  jseConfigParams_ = std::move(jseConfigParams);
}

void Instance::registerBundle(uint32_t bundleId, const std::string& bundlePath) {
  nativeToJsBridge_->registerBundle(bundleId, bundlePath);
}

const ModuleRegistry &Instance::getModuleRegistry() const {
  return *moduleRegistry_;
}

ModuleRegistry &Instance::getModuleRegistry() { return *moduleRegistry_; }

void Instance::handleMemoryPressure(int pressureLevel) {
  nativeToJsBridge_->handleMemoryPressure(pressureLevel);
}

int64_t Instance::getPeakJsMemoryUsage() const noexcept {
  return nativeToJsBridge_->getPeakJsMemoryUsage();
}

void Instance::invokeAsync(std::function<void()>&& func) {
  nativeToJsBridge_->runOnExecutorQueue([func=std::move(func)](JSExecutor *executor) {
    func();
    executor->flush();
  });
}

} // namespace react
} // namespace facebook
