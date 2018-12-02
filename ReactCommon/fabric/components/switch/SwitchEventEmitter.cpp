/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SwitchEventEmitter.h"

namespace facebook {
namespace react {

void SwitchEventEmitter::onChange(bool value) const {
  dispatchEvent("change", [value](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "value", value);
    return payload;
  });
}

} // namespace react
} // namespace facebook
