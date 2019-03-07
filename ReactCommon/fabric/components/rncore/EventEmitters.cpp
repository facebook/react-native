
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/rncore/EventEmitters.h>

namespace facebook {
namespace react {


void SwitchEventEmitter::onChange(SwitchOnChangeStruct event) const {
  dispatchEvent("change", [event=std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "value", event.value);
    return payload;
  });
}
void SliderEventEmitter::onChange(SliderOnChangeStruct event) const {
  dispatchEvent("change", [event=std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "value", event.value);
payload.setProperty(runtime, "fromUser", event.fromUser);
    return payload;
  });
}
void SliderEventEmitter::onSlidingComplete(SliderOnSlidingCompleteStruct event) const {
  dispatchEvent("slidingComplete", [event=std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "value", event.value);
payload.setProperty(runtime, "fromUser", event.fromUser);
    return payload;
  });
}
void SliderEventEmitter::onValueChange(SliderOnValueChangeStruct event) const {
  dispatchEvent("valueChange", [event=std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "value", event.value);
payload.setProperty(runtime, "fromUser", event.fromUser);
    return payload;
  });
}

} // namespace react
} // namespace facebook
