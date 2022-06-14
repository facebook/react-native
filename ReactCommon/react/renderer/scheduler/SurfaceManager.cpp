/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SurfaceManager.h"

#include <react/renderer/scheduler/Scheduler.h>

namespace facebook {
namespace react {

SurfaceManager::SurfaceManager(Scheduler const &scheduler) noexcept
    : scheduler_(scheduler) {}

void SurfaceManager::startSurface(
    SurfaceId surfaceId,
    std::string const &moduleName,
    folly::dynamic const &props,
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext) const noexcept {
  {
    std::unique_lock<butter::shared_mutex> lock(mutex_);
    auto surfaceHandler = SurfaceHandler{moduleName, surfaceId};
    surfaceHandler.setContextContainer(scheduler_.getContextContainer());
    registry_.emplace(surfaceId, std::move(surfaceHandler));
  }

  visit(surfaceId, [&](SurfaceHandler const &surfaceHandler) {
    surfaceHandler.setProps(props);
    surfaceHandler.constraintLayout(layoutConstraints, layoutContext);

    scheduler_.registerSurface(surfaceHandler);

    surfaceHandler.start();
  });
}

void SurfaceManager::stopSurface(SurfaceId surfaceId) const noexcept {
  visit(surfaceId, [&](SurfaceHandler const &surfaceHandler) {
    surfaceHandler.stop();
    scheduler_.unregisterSurface(surfaceHandler);
  });

  {
    std::unique_lock<butter::shared_mutex> lock(mutex_);

    auto iterator = registry_.find(surfaceId);
    registry_.erase(iterator);
  }
}

Size SurfaceManager::measureSurface(
    SurfaceId surfaceId,
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext) const noexcept {
  auto size = Size{};

  visit(surfaceId, [&](SurfaceHandler const &surfaceHandler) {
    size = surfaceHandler.measure(layoutConstraints, layoutContext);
  });

  return size;
}

MountingCoordinator::Shared SurfaceManager::findMountingCoordinator(
    SurfaceId surfaceId) const noexcept {
  auto mountingCoordinator = MountingCoordinator::Shared{};

  visit(surfaceId, [&](SurfaceHandler const &surfaceHandler) {
    mountingCoordinator = surfaceHandler.getMountingCoordinator();
  });

  return mountingCoordinator;
}

void SurfaceManager::constraintSurfaceLayout(
    SurfaceId surfaceId,
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext) const noexcept {
  visit(surfaceId, [=](SurfaceHandler const &surfaceHandler) {
    surfaceHandler.constraintLayout(layoutConstraints, layoutContext);
  });
}

void SurfaceManager::visit(
    SurfaceId surfaceId,
    std::function<void(SurfaceHandler const &surfaceHandler)> const &callback)
    const noexcept {
  std::shared_lock<butter::shared_mutex> lock(mutex_);

  auto iterator = registry_.find(surfaceId);

  if (iterator == registry_.end()) {
    return;
  }

  callback(iterator->second);
}

} // namespace react
} // namespace facebook
