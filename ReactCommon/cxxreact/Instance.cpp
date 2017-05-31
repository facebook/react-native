// Copyright 2004-present Facebook. All Rights Reserved.

#include "Instance.h"

#include "Executor.h"
#include "MethodCall.h"
#include "RecoverableError.h"
#include "SystraceSection.h"

#include <folly/json.h>
#include <folly/Memory.h>
#include <folly/MoveWrapper.h>

#include <glog/logging.h>

#include <condition_variable>
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

  jsQueue->runOnQueueSync(
    [this, &jsef, moduleRegistry, jsQueue] () mutable {
      nativeToJsBridge_ = folly::make_unique<NativeToJsBridge>(
          jsef.get(), moduleRegistry, jsQueue, callback_);

      std::lock_guard<std::mutex> lock(m_syncMutex);
      m_syncReady = true;
      m_syncCV.notify_all();
    });

  CHECK(nativeToJsBridge_);
}

void Instance::loadApplication(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> string,
    std::string sourceURL) {
  callback_->incrementPendingJSCalls();
  SystraceSection s("reactbridge_xplat_loadApplication", "sourceURL", sourceURL);
  nativeToJsBridge_->loadApplication(std::move(unbundle), std::move(string), std::move(sourceURL));
}

void Instance::loadApplicationSync(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> string,
    std::string sourceURL) {
  std::unique_lock<std::mutex> lock(m_syncMutex);
  m_syncCV.wait(lock, [this] { return m_syncReady; });

  SystraceSection s("reactbridge_xplat_loadApplicationSync", "sourceURL", sourceURL);
  nativeToJsBridge_->loadApplicationSync(std::move(unbundle), std::move(string), std::move(sourceURL));
}

void Instance::setSourceURL(std::string sourceURL) {
  callback_->incrementPendingJSCalls();
  SystraceSection s("reactbridge_xplat_setSourceURL", "sourceURL", sourceURL);

  nativeToJsBridge_->loadApplication(nullptr, nullptr, std::move(sourceURL));
}

void Instance::loadScriptFromString(std::unique_ptr<const JSBigString> string,
                                    std::string sourceURL,
                                    bool loadSynchronously) {
  SystraceSection s("reactbridge_xplat_loadScriptFromString", "sourceURL", sourceURL);
  if (loadSynchronously) {
    loadApplicationSync(nullptr, std::move(string), std::move(sourceURL));
  } else {
    loadApplication(nullptr, std::move(string), std::move(sourceURL));
  }
}

void Instance::loadUnbundle(std::unique_ptr<JSModulesUnbundle> unbundle,
                            std::unique_ptr<const JSBigString> startupScript,
                            std::string startupScriptSourceURL,
                            bool loadSynchronously) {
  if (loadSynchronously) {
    loadApplicationSync(std::move(unbundle), std::move(startupScript),
                        std::move(startupScriptSourceURL));
  } else {
      loadApplication(std::move(unbundle), std::move(startupScript),
                      std::move(startupScriptSourceURL));
  }
 }

bool Instance::supportsProfiling() {
  return nativeToJsBridge_->supportsProfiling();
}

void Instance::startProfiler(const std::string& title) {
  return nativeToJsBridge_->startProfiler(title);
}

void Instance::stopProfiler(const std::string& title, const std::string& filename) {
  return nativeToJsBridge_->stopProfiler(title, filename);
}

void Instance::setGlobalVariable(std::string propName,
                                 std::unique_ptr<const JSBigString> jsonValue) {
  nativeToJsBridge_->setGlobalVariable(std::move(propName), std::move(jsonValue));
}

void *Instance::getJavaScriptContext() {
  return nativeToJsBridge_->getJavaScriptContext();
}

void Instance::callJSFunction(std::string&& module, std::string&& method, folly::dynamic&& params) {
  callback_->incrementPendingJSCalls();
  nativeToJsBridge_->callFunction(std::move(module), std::move(method), std::move(params));
}

void Instance::callJSCallback(uint64_t callbackId, folly::dynamic&& params) {
  SystraceSection s("<callback>");
  callback_->incrementPendingJSCalls();
  nativeToJsBridge_->invokeCallback((double) callbackId, std::move(params));
}

void Instance::handleMemoryPressureUiHidden() {
  nativeToJsBridge_->handleMemoryPressureUiHidden();
}

void Instance::handleMemoryPressureModerate() {
  nativeToJsBridge_->handleMemoryPressureModerate();
}

void Instance::handleMemoryPressureCritical() {
  nativeToJsBridge_->handleMemoryPressureCritical();
}

} // namespace react
} // namespace facebook
