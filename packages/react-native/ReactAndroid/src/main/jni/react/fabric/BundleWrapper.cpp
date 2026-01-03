/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BundleWrapper.h"
#include <cxxreact/JSBigString.h>
#include <cxxreact/RecoverableError.h>

using namespace facebook::jni;

namespace facebook::react {
jni::local_ref<BundleWrapper::jhybriddata> BundleWrapper::initHybridFromFile(
    jni::alias_ref<jhybridobject> jThis,
    std::string fileName) {
  std::unique_ptr<const JSBigFileString> script;
  RecoverableError::runRethrowingAsRecoverable<std::system_error>(
      [&fileName, &script]() { script = JSBigFileString::fromPath(fileName); });
  return makeCxxInstance(std::move(script));
}

jni::local_ref<BundleWrapper::jhybriddata> BundleWrapper::initHybridFromAssets(
    jni::alias_ref<jhybridobject> jThis,
    jni::alias_ref<JAssetManager::javaobject> assetManager,
    const std::string& sourceURL) {
  auto manager = extractAssetManager(assetManager);
  auto script = loadScriptFromAssets(manager, sourceURL);
  return makeCxxInstance(std::move(script));
}

BundleWrapper::BundleWrapper(
    const std::shared_ptr<const JSBigString>& bundle)
    : bundle_(bundle) {}

std::shared_ptr<const JSBigString> BundleWrapper::getBundle() const {
  return bundle_;
}

void BundleWrapper::registerNatives() {
  registerHybrid(
      {makeNativeMethod(
           "initHybridFromFile", BundleWrapper::initHybridFromFile),
       makeNativeMethod(
           "initHybridFromAssets", BundleWrapper::initHybridFromAssets)});
}
} // namespace facebook::react
