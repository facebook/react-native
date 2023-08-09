/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook::react {

using DispatchEvent = std::function<void(
    jsi::Runtime &runtime,
    const EventTarget *eventTarget,
    const std::string &type,
    ReactEventPriority priority,
    const EventPayload &payload)>;

class PointerEventsProcessor final {
 public:
  void interceptPointerEvent(
      jsi::Runtime &runtime,
      EventTarget const *eventTarget,
      std::string const &type,
      ReactEventPriority priority,
      PointerEvent const &event,
      DispatchEvent const &eventDispatcher);
};

} // namespace facebook::react
