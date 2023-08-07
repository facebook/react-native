/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PointerEventsProcessor.h"

namespace facebook::react {

void PointerEventsProcessor::interceptPointerEvent(
    jsi::Runtime &runtime,
    EventTarget const *eventTarget,
    std::string const &type,
    ReactEventPriority priority,
    PointerEvent const &event,
    DispatchEvent const &eventDispatcher) {
  // TODO: implement pointer capture redirection
  eventDispatcher(runtime, eventTarget, type, priority, event);
}

} // namespace facebook::react
