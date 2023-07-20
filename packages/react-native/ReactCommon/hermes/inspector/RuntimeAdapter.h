/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <hermes/hermes.h>

#ifndef INSPECTOR_EXPORT
#ifdef _MSC_VER
#ifdef CREATE_SHARED_LIBRARY
#define INSPECTOR_EXPORT __declspec(dllexport)
#else
#define INSPECTOR_EXPORT
#endif // CREATE_SHARED_LIBRARY
#else // _MSC_VER
#define INSPECTOR_EXPORT __attribute__((visibility("default")))
#endif // _MSC_VER
#endif // !defined(INSPECTOR_EXPORT)

namespace facebook {
namespace hermes {
namespace inspector {

/**
 * RuntimeAdapter encapsulates a HermesRuntime object. The underlying Hermes
 * runtime object should stay alive for at least as long as the RuntimeAdapter
 * is alive.
 */
class INSPECTOR_EXPORT RuntimeAdapter {
 public:
  virtual ~RuntimeAdapter() = 0;

  /// getRuntime should return the runtime encapsulated by this adapter.
  virtual HermesRuntime &getRuntime() = 0;

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
  /// a Hermes interpreter loop.
  ///
  /// The default implementation does nothing.
  virtual void tickleJs();
};

/**
 * SharedRuntimeAdapter is a simple implementation of RuntimeAdapter that
 * uses shared_ptr to hold on to the runtime. It's generally only used in tests,
 * since it does not implement tickleJs.
 */
class INSPECTOR_EXPORT SharedRuntimeAdapter : public RuntimeAdapter {
 public:
  SharedRuntimeAdapter(std::shared_ptr<HermesRuntime> runtime);
  ~SharedRuntimeAdapter() override;

  HermesRuntime &getRuntime() override;

 private:
  std::shared_ptr<HermesRuntime> runtime_;
};

} // namespace inspector
} // namespace hermes
} // namespace facebook
