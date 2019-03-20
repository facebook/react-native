// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ShadowTreeRegistry.h"

namespace facebook {
namespace react {

void ShadowTreeRegistry::add(std::unique_ptr<ShadowTree> &&shadowTree) const {
  std::unique_lock<folly::SharedMutex> lock(mutex_);

  registry_.emplace(shadowTree->getSurfaceId(), std::move(shadowTree));
}

std::unique_ptr<ShadowTree> ShadowTreeRegistry::remove(
    SurfaceId surfaceId) const {
  std::unique_lock<folly::SharedMutex> lock(mutex_);

  auto iterator = registry_.find(surfaceId);
  auto shadowTree = std::unique_ptr<ShadowTree>(iterator->second.release());
  registry_.erase(iterator);
  return shadowTree;
}

bool ShadowTreeRegistry::visit(
    SurfaceId surfaceId,
    std::function<void(const ShadowTree &shadowTree)> callback) const {
  std::shared_lock<folly::SharedMutex> lock(mutex_);

  auto iterator = registry_.find(surfaceId);

  if (iterator == registry_.end()) {
    return false;
  }

  callback(*iterator->second);
  return true;
}

} // namespace react
} // namespace facebook
