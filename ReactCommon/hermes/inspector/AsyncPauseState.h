// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

namespace facebook {
namespace hermes {
namespace inspector {

/**
 * AsyncPauseState is used to track whether we requested an async pause from a
 * running VM, and whether the pause was initiated by us or by the client.
 */
enum class AsyncPauseState {
  /// None means there is no pending async pause in the VM.
  None,

  /// Implicit means we requested an async pause from the VM to service an op
  /// that can only be performed while paused, like setting a breakpoint. An
  /// impliict pause can be upgraded to an explicit pause if the client later
  /// explicitly requests a pause.
  Implicit,

  /// Explicit means that the client requested the pause by calling pause().
  Explicit
};

} // namespace inspector
} // namespace hermes
} // namespace facebook
