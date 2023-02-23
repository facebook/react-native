/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <butter/map.h>
#include <mutex>
#include <shared_mutex>

#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/scheduler/SurfaceHandler.h>

namespace facebook {
namespace react {

/*
 * `SurfaceManager` allows controlling React Native Surfaces via
 * `SurfaceHandler` without using `SurfaceHandler` directly. `SurfaceManager`
 * maintains a registry of `SurfaceHandler`s and allows to reference to them via
 * a `SurfaceId`.
 * The is supposed to be used during the transition period only.
 */
class SurfaceManager final {
 public:
  explicit SurfaceManager(Scheduler const &scheduler) noexcept;

#pragma mark - Surface Management

  void startSurface(
      SurfaceId surfaceId,
      std::string const &moduleName,
      folly::dynamic const &props,
      LayoutConstraints const &layoutConstraints = {},
      LayoutContext const &layoutContext = {}) const noexcept;

  void stopSurface(SurfaceId surfaceId) const noexcept;

  Size measureSurface(
      SurfaceId surfaceId,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext) const noexcept;

  void constraintSurfaceLayout(
      SurfaceId surfaceId,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext) const noexcept;

  MountingCoordinator::Shared findMountingCoordinator(
      SurfaceId surfaceId) const noexcept;

 private:
  void visit(
      SurfaceId surfaceId,
      std::function<void(SurfaceHandler const &surfaceHandler)> const &callback)
      const noexcept;

  Scheduler const &scheduler_;
  mutable std::shared_mutex mutex_; // Protects `registry_`.
  mutable butter::map<SurfaceId, SurfaceHandler> registry_{};
};

} // namespace react
} // namespace facebook
