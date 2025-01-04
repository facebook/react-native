/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SurfaceManager.h"

#include <glog/logging.h>
#include <react/renderer/scheduler/Scheduler.h>

namespace facebook::react {

SurfaceManager::SurfaceManager(const Scheduler& scheduler) noexcept
    : scheduler_(scheduler) {}

SurfaceManager::~SurfaceManager() noexcept {
  LOG(WARNING) << "SurfaceManager::~SurfaceManager() was called (address: "
               << this << ").";
  stopAllSurfaces();
}

void SurfaceManager::startSurface(
    SurfaceId surfaceId,
    const std::string& moduleName,
    const folly::dynamic& props,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) const noexcept {
  {
    std::unique_lock lock(mutex_);
    auto surfaceHandler = SurfaceHandler{moduleName, surfaceId};
    surfaceHandler.setContextContainer(scheduler_.getContextContainer());
    registry_.emplace(surfaceId, std::move(surfaceHandler));
  }

  visit(surfaceId, [&](const SurfaceHandler& surfaceHandler) {
    surfaceHandler.setProps(props);
    surfaceHandler.constraintLayout(layoutConstraints, layoutContext);

    scheduler_.registerSurface(surfaceHandler);

    surfaceHandler.start();
  });
}

void SurfaceManager::startEmptySurface(
    SurfaceId surfaceId,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) const noexcept {
  startSurface(surfaceId, "", {}, layoutConstraints, layoutContext);
}

void SurfaceManager::stopSurface(SurfaceId surfaceId) const noexcept {
  visit(surfaceId, [&](const SurfaceHandler& surfaceHandler) {
    surfaceHandler.stop();
    scheduler_.unregisterSurface(surfaceHandler);
  });

  {
    std::unique_lock lock(mutex_);

    auto iterator = registry_.find(surfaceId);
    registry_.erase(iterator);
  }
}

void SurfaceManager::stopAllSurfaces() const noexcept {
  std::unordered_set<SurfaceId> surfaceIds;
  {
    std::shared_lock lock(mutex_);
    for (const auto& [surfaceId, _] : registry_) {
      surfaceIds.insert(surfaceId);
    }
  }
  for (const auto& surfaceId : surfaceIds) {
    stopSurface(surfaceId);
  }
}

Size SurfaceManager::measureSurface(
    SurfaceId surfaceId,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) const noexcept {
  auto size = Size{};

  visit(surfaceId, [&](const SurfaceHandler& surfaceHandler) {
    size = surfaceHandler.measure(layoutConstraints, layoutContext);
  });

  return size;
}

std::shared_ptr<const MountingCoordinator>
SurfaceManager::findMountingCoordinator(SurfaceId surfaceId) const noexcept {
  auto mountingCoordinator = std::shared_ptr<const MountingCoordinator>{};

  visit(surfaceId, [&](const SurfaceHandler& surfaceHandler) {
    mountingCoordinator = surfaceHandler.getMountingCoordinator();
  });

  return mountingCoordinator;
}

void SurfaceManager::constraintSurfaceLayout(
    SurfaceId surfaceId,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) const noexcept {
  visit(surfaceId, [=](const SurfaceHandler& surfaceHandler) {
    surfaceHandler.constraintLayout(layoutConstraints, layoutContext);
  });
}

void SurfaceManager::visit(
    SurfaceId surfaceId,
    const std::function<void(const SurfaceHandler& surfaceHandler)>& callback)
    const noexcept {
  std::shared_lock lock(mutex_);

  auto iterator = registry_.find(surfaceId);

  if (iterator == registry_.end()) {
    return;
  }

  callback(iterator->second);
}

} // namespace facebook::react
