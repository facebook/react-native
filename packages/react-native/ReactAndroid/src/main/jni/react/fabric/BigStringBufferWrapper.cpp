/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BigStringBufferWrapper.h"
#include <cxxreact/JSBigString.h>
#include <cxxreact/RecoverableError.h>

using namespace facebook::jni;

namespace facebook::react {
jni::local_ref<BigStringBufferWrapper::jhybriddata>
BigStringBufferWrapper::initHybridFromFile(
    jni::alias_ref<jhybridobject> jThis,
    std::string fileName) {
  std::unique_ptr<const JSBigFileString> script;
  RecoverableError::runRethrowingAsRecoverable<std::system_error>(
      [&fileName, &script]() { script = JSBigFileString::fromPath(fileName); });
  auto buffer = std::make_shared<BigStringBuffer>(std::move(script));
  return makeCxxInstance(buffer);
}

jni::local_ref<BigStringBufferWrapper::jhybriddata>
BigStringBufferWrapper::initHybridFromAssets(
    jni::alias_ref<jhybridobject> jThis,
    jni::alias_ref<JAssetManager::javaobject> assetManager,
    const std::string& sourceURL) {
  auto manager = extractAssetManager(assetManager);
  auto script = loadScriptFromAssets(manager, sourceURL);
  auto buffer = std::make_shared<BigStringBuffer>(std::move(script));
  return makeCxxInstance(buffer);
}

BigStringBufferWrapper::BigStringBufferWrapper(
    const std::shared_ptr<const BigStringBuffer>& script)
    : script_(script) {}

const std::shared_ptr<const BigStringBuffer> BigStringBufferWrapper::getScript()
    const {
  return script_;
}

void BigStringBufferWrapper::registerNatives() {
  registerHybrid(
      {makeNativeMethod(
           "initHybridFromFile", BigStringBufferWrapper::initHybridFromFile),
       makeNativeMethod(
           "initHybridFromAssets",
           BigStringBufferWrapper::initHybridFromAssets)});
}
} // namespace facebook::react
