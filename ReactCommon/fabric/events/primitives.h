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

/*
 * We need this types only to ensure type-safety when we deal with them. Conceptually,
 * they are opaque pointers to some types that derived from those classes.
 */
class EventHandler {};
class EventTarget {};
using SharedEventHandler = std::shared_ptr<const EventHandler>;
using SharedEventTarget = std::shared_ptr<const EventTarget>;
using WeakEventTarget = std::weak_ptr<const EventTarget>;

using EventPipe = std::function<void(const EventTarget *eventTarget, const std::string &type, const folly::dynamic &payload)>;

} // namespace react
} // namespace facebook
