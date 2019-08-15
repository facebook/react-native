// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>

#include <react/core/ReactPrimitives.h>
#include <react/core/ShadowNode.h>
#include <react/mounting/MountingTransaction.h>
#include <react/mounting/ShadowViewMutation.h>

namespace facebook {
namespace react {

/*
 * Abstract class for Scheduler's delegate.
 */
class SchedulerDelegate {
 public:
  /*
   * Called right after Scheduler computed (and laid out) a new updated version
   * of the tree and calculated a set of mutations which are sufficient
   * to construct a new one.
   */
  virtual void schedulerDidFinishTransaction(
      MountingCoordinator::Shared const &mountingCoordinator) = 0;

  /*
   * Called right after a new ShadowNode was created.
   */
  virtual void schedulerDidRequestPreliminaryViewAllocation(
      SurfaceId surfaceId,
      const ShadowView &shadowView) = 0;

  virtual void schedulerDidDispatchCommand(
      const ShadowView &shadowView,
      std::string const &commandName,
      folly::dynamic const args) = 0;

  /*
   * Set JS responder for a view
   */
  virtual void schedulerDidSetJSResponder(
      SurfaceId surfaceId,
      const ShadowView &shadowView,
      const ShadowView &initialShadowView,
      bool blockNativeResponder) = 0;

  /*
   * Clear the JSResponder for a view
   */
  virtual void schedulerDidClearJSResponder() = 0;

  virtual ~SchedulerDelegate() noexcept = default;
};

} // namespace react
} // namespace facebook
