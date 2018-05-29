/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

enum class EventPriority : int {
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
 * We need this types only to ensure type-safety when we deal with them.
 * Conceptually, they are opaque pointers to some types that derived from those
 * classes.
 *
 * `EventHandler` is managed as a `unique_ptr`, so it must have a *virtual*
 * destructor to allow proper deallocation having only a pointer
 * to the base (`EventHandler`) class.
 *
 * `EventTarget` is managed as a `shared_ptr`, so it does not need to have a
 * virtual destructor because `shared_ptr` stores a pointer to destructor
 * inside.
 */
struct EventHandler {
  virtual ~EventHandler() = default;
};
using UniqueEventHandler = std::unique_ptr<const EventHandler>;

struct EventTarget {};
using SharedEventTarget = std::shared_ptr<const EventTarget>;
using WeakEventTarget = std::weak_ptr<const EventTarget>;

using EventPipe = std::function<void(
    jsi::Runtime &runtime,
    const EventTarget *eventTarget,
    const std::string &type,
    const folly::dynamic &payload)>;

} // namespace react
} // namespace facebook
