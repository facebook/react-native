/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <shared_mutex>
#include <unordered_map>

#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/scheduler/SurfaceHandler.h>

namespace facebook::react {

/*
 * `SurfaceManager` allows controlling React Native Surfaces via
 * `SurfaceHandler` without using `SurfaceHandler` directly. `SurfaceManager`
 * maintains a registry of `SurfaceHandler`s and allows to reference to them via
 * a `SurfaceId`.
 * The is supposed to be used during the transition period only.
 */
class SurfaceManager final {
 public:
  explicit SurfaceManager(const Scheduler& scheduler) noexcept;

#pragma mark - Surface Management

  void startSurface(
      SurfaceId surfaceId,
      const std::string& moduleName,
      const folly::dynamic& props,
      const LayoutConstraints& layoutConstraints = {},
      const LayoutContext& layoutContext = {}) const noexcept;

  void startEmptySurface(
      SurfaceId surfaceId,
      const LayoutConstraints& layoutConstraints = {},
      const LayoutContext& layoutContext = {}) const noexcept;

  void stopSurface(SurfaceId surfaceId) const noexcept;

  Size measureSurface(
      SurfaceId surfaceId,
      const LayoutConstraints& layoutConstraints,
      const LayoutContext& layoutContext) const noexcept;

  void constraintSurfaceLayout(
      SurfaceId surfaceId,
      const LayoutConstraints& layoutConstraints,
      const LayoutContext& layoutContext) const noexcept;

  std::shared_ptr<const MountingCoordinator> findMountingCoordinator(
      SurfaceId surfaceId) const noexcept;

 private:
  void visit(
      SurfaceId surfaceId,
      const std::function<void(const SurfaceHandler& surfaceHandler)>& callback)
      const noexcept;

  const Scheduler& scheduler_;
  mutable std::shared_mutex mutex_; // Protects `registry_`.
  mutable std::unordered_map<SurfaceId, SurfaceHandler> registry_{};
};

} // namespace facebook::react
