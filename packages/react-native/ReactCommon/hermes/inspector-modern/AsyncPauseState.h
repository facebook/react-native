/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace hermes {
namespace inspector_modern {

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

} // namespace inspector_modern
} // namespace hermes
} // namespace facebook
