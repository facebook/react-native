/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SliderEventEmitter.h"

namespace facebook {
namespace react {

void SliderEventEmitter::onValueChange(float value) const {
  dispatchEvent("valueChange", [value](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "value", value);
    return payload;
  });
}

void SliderEventEmitter::onSlidingComplete(float value) const {
  dispatchEvent("slidingComplete", [value](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "value", value);
    return payload;
  });
}

} // namespace react
} // namespace facebook
