/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <hermes/hermes.h>

namespace facebook {
namespace hermes {
namespace inspector {

/**
 * RuntimeAdapter encapsulates a HermesRuntime object. The underlying Hermes
 * runtime object should stay alive for at least as long as the RuntimeAdapter
 * is alive.
 */
class RuntimeAdapter {
 public:
  virtual ~RuntimeAdapter() = 0;

  /// getRuntime should return the runtime encapsulated by this adapter.
  virtual jsi::Runtime &getRuntime() = 0;
  virtual debugger::Debugger &getDebugger() = 0;

  /// tickleJs is a method that subclasses can choose to override to make the
  /// inspector more responsive. If overridden, it should call the "__tickleJs"
  /// function. The call should occur with appropriate locking (e.g. via a
  /// thread-safe runtime instance, or by enqueuing the call on to a dedicated
  /// JS thread).
  ///
  /// This makes the inspector more responsive because it gives the inspector
  /// the ability to force the process to enter the Hermes interpreter loop
  /// soon. This is important because the inspector can only do a number of
  /// important operations (like manipulating breakpoints) within the context of
  /// a Hermes interperter loop.
  ///
  /// The default implementation does nothing.
  virtual void tickleJs();
};

/**
 * SharedRuntimeAdapter is a simple implementation of RuntimeAdapter that
 * uses shared_ptr to hold on to the runtime. It's generally only used in tests,
 * since it does not implement tickleJs.
 */
class SharedRuntimeAdapter : public RuntimeAdapter {
 public:
  SharedRuntimeAdapter(
      std::shared_ptr<jsi::Runtime> runtime,
      debugger::Debugger &debugger);
  virtual ~SharedRuntimeAdapter();

  jsi::Runtime &getRuntime() override;
  debugger::Debugger &getDebugger() override;

 private:
  std::shared_ptr<jsi::Runtime> runtime_;
  debugger::Debugger &debugger_;
};

} // namespace inspector
} // namespace hermes
} // namespace facebook
