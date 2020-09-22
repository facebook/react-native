/*
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
    jsi::Value const &instanceHandle,
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

  // Having a `null` or `undefined` object here indicates that
  // `weakInstanceHandle_` was already deallocated. This should *not* happen by
  // design, and if it happens it's a severe problem. This basically means that
  // particular implementation of JSI was able to detect this inconsistency and
  // dealt with it, but some JSI implementation may not support this feature and
  // that case will lead to a crash in those environments.
  assert(!strongInstanceHandle_.isNull());
  assert(!strongInstanceHandle_.isUndefined());
}

void EventTarget::release(jsi::Runtime &runtime) const {
  // The method does not use `jsi::Runtime` reference.
  // It takes it only to ensure thread-safety (if the caller has the reference,
  // we are on a proper thread).
  strongInstanceHandle_ = jsi::Value::null();
}

jsi::Value EventTarget::getInstanceHandle(jsi::Runtime &runtime) const {
  if (strongInstanceHandle_.isNull()) {
    // The `instanceHandle` is not retained.
    return jsi::Value::null();
  }

  return jsi::Value(runtime, strongInstanceHandle_);
}

Tag EventTarget::getTag() const {
  return tag_;
}

} // namespace react
} // namespace facebook
