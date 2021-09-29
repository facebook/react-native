/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PickerEventEmitter.h"

namespace facebook {
namespace react {

void PickerEventEmitter::onChange(PickerIOSChangeEvent event) const {
  dispatchEvent("change", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "newValue", event.newValue);
    payload.setProperty(runtime, "newIndex", event.newIndex);
    return payload;
  });
}

} // namespace react
} // namespace facebook
