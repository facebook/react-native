/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

#include <react/renderer/core/EventTarget.h>

namespace facebook::react {

/**
 * RAII wrapper around `SharedEventTarget` which manages the retain/release of
 * the underlying `EventTarget`.
 */
class EventTargetWrapper final {
 public:
  EventTargetWrapper(SharedEventTarget eventTarget, jsi::Runtime &runtime);
  ~EventTargetWrapper();
  EventTargetWrapper(const EventTargetWrapper &) = delete;
  EventTargetWrapper &operator=(const EventTargetWrapper &) = delete;
  EventTargetWrapper(EventTargetWrapper &&) = delete;
  EventTargetWrapper &operator=(EventTargetWrapper &&) = delete;

 private:
  SharedEventTarget eventTarget_;
  jsi::Runtime &runtime_;
};

} // namespace facebook::react
