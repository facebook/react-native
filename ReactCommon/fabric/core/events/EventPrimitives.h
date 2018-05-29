/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace react {

enum class EventPriority {
  SynchronousUnbatched,
  SynchronousBatched,
  AsynchronousUnbatched,
  AsynchronousBatched,

  Sync = SynchronousUnbatched,
  Work = SynchronousBatched,
  Interactive = AsynchronousUnbatched,
  Deferred = AsynchronousBatched,
};

// `InstanceHandler`, `EventTarget`, and `EventHandler` are all opaque
// raw pointers. We use `struct {} *` trick to differentiate them in compiler's
// eyes to ensure type safety.
using EventTarget = struct {} *;
using EventHandler = struct {} *;

} // namespace react
} // namespace facebook
