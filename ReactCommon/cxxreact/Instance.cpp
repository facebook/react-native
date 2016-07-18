// Copyright 2004-present Facebook. All Rights Reserved.

#include "Instance.h"

#include "Executor.h"
#include "MethodCall.h"
#include "SystraceSection.h"

#include <folly/json.h>
#include <folly/Memory.h>
#include <folly/MoveWrapper.h>

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

void Instance::initializeBridge(
    std::unique_ptr<InstanceCallback> callback,
    std::shared_ptr<JSExecutorFactory> jsef,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::unique_ptr<MessageQueueThread> nativeQueue,
    std::shared_ptr<ModuleRegistry> moduleRegistry) {
  callback_ = std::move(callback);

  jsQueue->runOnQueueSync(
    [this, &jsef, moduleRegistry, jsQueue,
     nativeQueue=folly::makeMoveWrapper(std::move(nativeQueue))] () mutable {
      nativeToJsBridge_ = folly::make_unique<NativeToJsBridge>(
          jsef.get(), moduleRegistry, jsQueue, nativeQueue.move(), callback_);
    });

  CHECK(nativeToJsBridge_);
}

void Instance::loadScriptFromString(std::unique_ptr<const JSBigString> string,
                                    std::string sourceURL) {
  callback_->incrementPendingJSCalls();
  SystraceSection s("reactbridge_xplat_loadScriptFromString",
                    "sourceURL", sourceURL);
  // TODO mhorowitz: ReactMarker around loadApplicationScript
  nativeToJsBridge_->loadApplicationScript(std::move(string), std::move(sourceURL));
}

void Instance::loadScriptFromFile(const std::string& filename,
                                  const std::string& sourceURL) {
  // TODO mhorowitz: ReactMarker around file read
  std::unique_ptr<JSBigBufferString> buf;
  {
    SystraceSection s("reactbridge_xplat_loadScriptFromFile",
                      "fileName", filename);

    std::ifstream jsfile(filename);
    if (!jsfile) {
      LOG(ERROR) << "Unable to load script from file" << filename;
    } else {
      jsfile.seekg(0, std::ios::end);
      buf.reset(new JSBigBufferString(jsfile.tellg()));
      jsfile.seekg(0, std::ios::beg);
      jsfile.read(buf->data(), buf->size());
    }
  }

  loadScriptFromString(std::move(buf), sourceURL);
}

void Instance::loadScriptFromOptimizedBundle(std::string bundlePath,
                                             std::string sourceURL,
                                             int flags) {
  SystraceSection s("reactbridge_xplat_loadScriptFromOptimizedBundle",
                    "bundlePath", bundlePath);
  nativeToJsBridge_->loadOptimizedApplicationScript(std::move(bundlePath),
                                                    std::move(sourceURL),
                                                    flags);
}

void Instance::loadUnbundle(std::unique_ptr<JSModulesUnbundle> unbundle,
                            std::unique_ptr<const JSBigString> startupScript,
                            std::string startupScriptSourceURL) {
  callback_->incrementPendingJSCalls();
  SystraceSection s("reactbridge_xplat_setJSModulesUnbundle");
  nativeToJsBridge_->loadApplicationUnbundle(std::move(unbundle), std::move(startupScript),
                                             std::move(startupScriptSourceURL));
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

void Instance::callJSFunction(ExecutorToken token, std::string&& module, std::string&& method,
                              folly::dynamic&& params) {
  callback_->incrementPendingJSCalls();
  nativeToJsBridge_->callFunction(token, std::move(module), std::move(method), std::move(params));
}

void Instance::callJSCallback(ExecutorToken token, uint64_t callbackId, folly::dynamic&& params) {
  SystraceSection s("<callback>");
  callback_->incrementPendingJSCalls();
  nativeToJsBridge_->invokeCallback(token, (double) callbackId, std::move(params));
}

ExecutorToken Instance::getMainExecutorToken() {
  return nativeToJsBridge_->getMainExecutorToken();
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
