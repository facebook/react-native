/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

namespace facebook::react {

/**
 * Abstract base class for all event payload types.
 */
struct EventPayload {
  virtual ~EventPayload() = default;

  EventPayload() = default;
  EventPayload(const EventPayload &) = default;
  EventPayload &operator=(const EventPayload &) = default;
  EventPayload(EventPayload &&) = default;
  EventPayload &operator=(EventPayload &&) = default;

  virtual jsi::Value asJSIValue(jsi::Runtime &runtime) const = 0;
};

using SharedEventPayload = std::shared_ptr<const EventPayload>;

} // namespace facebook::react
