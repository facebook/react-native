/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageEventEmitter.h"

namespace facebook {
namespace react {

void ImageEventEmitter::onLoadStart() const {
  dispatchEvent("loadStart");
}

void ImageEventEmitter::onLoad() const {
  dispatchEvent("load");
}

void ImageEventEmitter::onLoadEnd() const {
  dispatchEvent("loadEnd");
}

void ImageEventEmitter::onProgress() const {
  dispatchEvent("progress");
}

void ImageEventEmitter::onError() const {
  dispatchEvent("error");
}

void ImageEventEmitter::onPartialLoad() const {
  dispatchEvent("partialLoad");
}

} // namespace react
} // namespace facebook
