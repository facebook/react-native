/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <fabric/events/primitives.h>

namespace facebook {
namespace react {

/*
 * Represents ready-to-dispatch event data.
 */
class RawEvent {

public:
  using RawEventDispatchable = std::function<bool()>;

  RawEvent(
    const std::string &type,
    const folly::dynamic &payload,
    const EventTarget &eventTarget,
    const RawEventDispatchable &isDispachable
  );

  const std::string type;
  const folly::dynamic payload;
  const EventTarget eventTarget;

  /*
   * Returns `true` if event can be dispatched to `eventTarget`.
   * Events that associated with unmounted or deallocated `ShadowNode`s
   * must not be dispatched.
   */
  bool isDispachable() const;

private:
  const RawEventDispatchable isDispachable_;
};

} // namespace react
} // namespace facebook
