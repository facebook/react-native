/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageLoaderModule.h"

namespace facebook::react {

// TODO: T170340321 - actual implementation

jsi::Object ImageLoaderModule::getConstants(jsi::Runtime& rt) {
  return jsi::Object(rt);
}

void ImageLoaderModule::abortRequest(jsi::Runtime& rt, int32_t requestId) {}

AsyncPromise<ImageSize> ImageLoaderModule::getSize(
    jsi::Runtime& rt,
    const std::string& /*uri*/) {
  auto promise = AsyncPromise<ImageSize>(rt, jsInvoker_);
  promise.resolve({.width = 0.0, .height = 0.0});
  return promise;
}

AsyncPromise<ImageSize> ImageLoaderModule::getSizeWithHeaders(
    jsi::Runtime& rt,
    const std::string& /*uri*/,
    jsi::Object /*headers*/) {
  auto promise = AsyncPromise<ImageSize>(rt, jsInvoker_);
  promise.resolve({.width = 0.0, .height = 0.0});
  return promise;
}

AsyncPromise<bool> ImageLoaderModule::prefetchImage(
    jsi::Runtime& rt,
    const std::string& /*uri*/,
    int32_t /*requestId*/) {
  auto promise = AsyncPromise<bool>(rt, jsInvoker_);
  promise.resolve(false);
  return promise;
}

jsi::Object ImageLoaderModule::queryCache(
    jsi::Runtime& rt,
    const std::vector<std::string>& /*uris*/) {
  return jsi::Object(rt);
}

} // namespace facebook::react
