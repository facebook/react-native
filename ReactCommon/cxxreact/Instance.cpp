/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
#include <folly/MoveWrapper.h>
#include <folly/json.h>

#include <glog/logging.h>

#include <condition_variable>
#include <fstream>
#include <memory>
#include <mutex>
#include <string>

namespace facebook {
namespace react {

Instance::~Instance() {
  if (nativeToJsBridge_) {
    nativeToJsBridge_->destroy();
  }
}

void Instance::initializeBridge(
    std::unique_ptr<InstanceCallback> callback,
    std::shared_ptr<JSExecutorFactory> jsef,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::shared_ptr<ModuleRegistry> moduleRegistry) {
  callback_ = std::move(callback);
  moduleRegistry_ = std::move(moduleRegistry);
  jsQueue->runOnQueueSync([this, &jsef, jsQueue]() mutable {
    nativeToJsBridge_ = std::make_unique<NativeToJsBridge>(
        jsef.get(), moduleRegistry_, jsQueue, callback_);
    nativeToJsBridge_->initializeRuntime();
    std::lock_guard<std::mutex> lock(m_syncMutex);
    m_syncReady = true;
    m_syncCV.notify_all();
  });

  CHECK(nativeToJsBridge_);
}

void Instance::loadBundle(
    std::unique_ptr<const JSBigString> string,
    std::string sourceURL) {
  callback_->incrementPendingJSCalls();
  SystraceSection s("Instance::loadBundle", "sourceURL", sourceURL);
  nativeToJsBridge_->loadBundle(
      std::move(string), std::move(sourceURL));
}

void Instance::loadBundleSync(
    std::unique_ptr<const JSBigString> string,
    std::string sourceURL) {
  std::unique_lock<std::mutex> lock(m_syncMutex);
  m_syncCV.wait(lock, [this] { return m_syncReady; });

  SystraceSection s("Instance::loadBundleSync", "sourceURL", sourceURL);
  nativeToJsBridge_->loadBundleSync(
      std::move(string), std::move(sourceURL));
}

void Instance::setSourceURL(std::string sourceURL) {
  callback_->incrementPendingJSCalls();
  SystraceSection s("Instance::setSourceURL", "sourceURL", sourceURL);

  nativeToJsBridge_->loadBundle(nullptr, std::move(sourceURL));
}

void Instance::loadScriptFromString(
    std::unique_ptr<const JSBigString> string,
    std::string sourceURL,
    bool loadSynchronously) {
  SystraceSection s("Instance::loadScriptFromString", "sourceURL", sourceURL);
  if (loadSynchronously) {
    loadBundleSync(std::move(string), std::move(sourceURL));
  } else {
    loadBundle(std::move(string), std::move(sourceURL));
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

bool Instance::isIndexedRAMBundle(std::unique_ptr<const JSBigString> *script) {
  BundleHeader header;
  strncpy(
      reinterpret_cast<char *>(&header),
      script->get()->c_str(),
      sizeof(header));

  return parseTypeFromHeader(header) == ScriptTag::RAMBundle;
}

void Instance::loadRAMBundleFromString(
    std::unique_ptr<const JSBigString> script,
    const std::string& sourceURL,
    uint32_t bundleId,
    bool loadSynchronously) {
  auto bundle = std::make_unique<JSIndexedRAMBundle>(std::move(script));
  auto startupScript = bundle->getStartupCode();
  loadRAMBundle(
      std::move(bundle),
      std::move(startupScript),
      sourceURL,
      bundleId,
      loadSynchronously);
}

void Instance::loadRAMBundleFromFile(
    const std::string &sourcePath,
    const std::string &sourceURL,
    uint32_t bundleId,
    bool loadSynchronously) {
  auto bundle = std::make_unique<JSIndexedRAMBundle>(sourcePath.c_str());
  auto startupScript = bundle->getStartupCode();
  loadRAMBundle(
      std::move(bundle),
      std::move(startupScript),
      sourceURL,
      bundleId,
      loadSynchronously);
}

void Instance::loadRAMBundle(
    std::unique_ptr<JSModulesUnbundle> bundle,
    std::unique_ptr<const JSBigString> startupScript,
    std::string startupScriptSourceURL,
    uint32_t bundleId,
    bool loadSynchronously) {
  nativeToJsBridge_->registerBundle(bundleId, std::move(bundle));
  if (loadSynchronously) {
    loadBundleSync(
        std::move(startupScript),
        std::move(startupScriptSourceURL));
  } else {
    loadBundle(
        std::move(startupScript),
        std::move(startupScriptSourceURL));
  }
}

void Instance::setGlobalVariable(
    std::string propName,
    std::unique_ptr<const JSBigString> jsonValue) {
  nativeToJsBridge_->setGlobalVariable(
      std::move(propName), std::move(jsonValue));
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

void Instance::callJSFunction(
    std::string &&module,
    std::string &&method,
    folly::dynamic &&params) {
  callback_->incrementPendingJSCalls();
  nativeToJsBridge_->callFunction(
      std::move(module), std::move(method), std::move(params));
}

void Instance::callJSCallback(uint64_t callbackId, folly::dynamic &&params) {
  SystraceSection s("Instance::callJSCallback");
  callback_->incrementPendingJSCalls();
  nativeToJsBridge_->invokeCallback((double)callbackId, std::move(params));
}

void Instance::registerBundle(
    uint32_t bundleId,
    const std::string &bundlePath) {
  loadRAMBundleFromFile(bundlePath, bundlePath, bundleId, true);
}

const ModuleRegistry &Instance::getModuleRegistry() const {
  return *moduleRegistry_;
}

ModuleRegistry &Instance::getModuleRegistry() {
  return *moduleRegistry_;
}

void Instance::handleMemoryPressure(int pressureLevel) {
  nativeToJsBridge_->handleMemoryPressure(pressureLevel);
}

void Instance::invokeAsync(std::function<void()> &&func) {
  nativeToJsBridge_->runOnExecutorQueue(
      [func = std::move(func)](JSExecutor *executor) {
        func();
        executor->flush();
      });
}

} // namespace react
} // namespace facebook
