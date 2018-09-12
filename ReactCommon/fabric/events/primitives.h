/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

namespace facebook {
namespace react {

enum class EventPriority: int {
  SynchronousUnbatched,
  SynchronousBatched,
  AsynchronousUnbatched,
  AsynchronousBatched,

  Sync = SynchronousUnbatched,
  Work = SynchronousBatched,
  Interactive = AsynchronousUnbatched,
  Deferred = AsynchronousBatched
};

/* `InstanceHandler`, `EventTarget`, and `EventHandler` are all opaque
 * raw pointers. We use `struct {} *` trick to differentiate them in compiler's
 * eyes to ensure type safety.
 * These structs must have names (and the names must be exported)
 * to allow consistent template (e.g. `std::function`) instantiating
 * across different modules.
 */
using EventTarget = struct EventTargetDummyStruct {} *;
using EventHandler = struct EventHandlerDummyStruct {} *;

/*
 * EmptyEventTarget is used when some event cannot be dispatched to an original
 * event target but still has to be dispatched to preserve consistency of event flow.
 */
static const EventTarget EmptyEventTarget = nullptr;

using EventPipe = std::function<void(const EventTarget &eventTarget, const std::string &type, const folly::dynamic &payload)>;

} // namespace react
} // namespace facebook
