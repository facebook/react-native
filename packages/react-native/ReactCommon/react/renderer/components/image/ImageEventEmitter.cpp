/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageEventEmitter.h"

namespace facebook::react {

void ImageEventEmitter::onLoadStart() const {
  dispatchEvent("loadStart");
}

void ImageEventEmitter::onLoad(const ImageSource& source) const {
  dispatchEvent("load", [source](jsi::Runtime& runtime) {
    auto src = jsi::Object(runtime);
    src.setProperty(runtime, "uri", source.uri);
    src.setProperty(runtime, "width", source.size.width);
    src.setProperty(runtime, "height", source.size.height);
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "source", src);
    return payload;
  });
}

void ImageEventEmitter::onLoadEnd() const {
  dispatchEvent("loadEnd");
}

void ImageEventEmitter::onProgress(
    double progress,
    int64_t loaded,
    int64_t total) const {
  dispatchEvent("progress", [progress, loaded, total](jsi::Runtime& runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "progress", progress);
    payload.setProperty(runtime, "loaded", (double)loaded);
    payload.setProperty(runtime, "total", (double)total);
    return payload;
  });
}

void ImageEventEmitter::onError(const ImageErrorInfo& error) const {
  dispatchEvent("error", [error](jsi::Runtime& runtime) {
    auto payload = jsi::Object(runtime);
    if (!error.error.empty()) {
      payload.setProperty(runtime, "error", error.error);
    }
    if (error.responseCode != 0) {
      payload.setProperty(runtime, "responseCode", error.responseCode);
    }
    if (!error.httpResponseHeaders.empty()) {
      auto headers = jsi::Object(runtime);
      for (const auto& x : error.httpResponseHeaders) {
        headers.setProperty(runtime, x.first.c_str(), x.second);
      }
      payload.setProperty(runtime, "httpResponseHeaders", headers);
    }
    return payload;
  });
}

void ImageEventEmitter::onPartialLoad() const {
  dispatchEvent("partialLoad");
}

} // namespace facebook::react
