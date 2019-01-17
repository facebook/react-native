/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventTarget.h"

namespace facebook {
namespace react {

using Tag = EventTarget::Tag;

EventTarget::EventTarget(
    jsi::Runtime &runtime,
    const jsi::Value &instanceHandle,
    Tag tag)
    : weakInstanceHandle_(
          jsi::WeakObject(runtime, instanceHandle.asObject(runtime))),
      strongInstanceHandle_(jsi::Value::null()),
      tag_(tag) {}

void EventTarget::setEnabled(bool enabled) const {
  enabled_ = enabled;
}

void EventTarget::retain(jsi::Runtime &runtime) const {
  if (!enabled_) {
    return;
  }

  strongInstanceHandle_ = weakInstanceHandle_.lock(runtime);
}

jsi::Value EventTarget::release(jsi::Runtime &runtime) const {
  // The method does not use `jsi::Runtime` reference.
  // It takes it only to ensure thread-safety (if the caller has the reference,
  // we are on a proper thread).
  return std::move(strongInstanceHandle_);
}

Tag EventTarget::getTag() const {
  return tag_;
}

} // namespace react
} // namespace facebook
