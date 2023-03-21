/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowView.h>

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
      const ShadowNode &shadowView) = 0;

  virtual void schedulerDidDispatchCommand(
      const ShadowView &shadowView,
      std::string const &commandName,
      folly::dynamic const &args) = 0;

  virtual void schedulerDidSendAccessibilityEvent(
      const ShadowView &shadowView,
      std::string const &eventType) = 0;

  /*
   * Set JS responder for a view
   */
  virtual void schedulerDidSetIsJSResponder(
      ShadowView const &shadowView,
      bool isJSResponder,
      bool blockNativeResponder) = 0;

  virtual ~SchedulerDelegate() noexcept = default;
};

} // namespace react
} // namespace facebook
