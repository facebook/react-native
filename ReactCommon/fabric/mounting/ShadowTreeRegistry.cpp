/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowTreeRegistry.h"

namespace facebook {
namespace react {

ShadowTreeRegistry::~ShadowTreeRegistry() {
  assert(
      registry_.size() == 0 &&
      "Deallocation of non-empty `ShadowTreeRegistry`.");
}

void ShadowTreeRegistry::add(std::unique_ptr<ShadowTree> &&shadowTree) const {
  std::unique_lock<better::shared_mutex> lock(mutex_);

  registry_.emplace(shadowTree->getSurfaceId(), std::move(shadowTree));
}

std::unique_ptr<ShadowTree> ShadowTreeRegistry::remove(
    SurfaceId surfaceId) const {
  std::unique_lock<better::shared_mutex> lock(mutex_);

  auto iterator = registry_.find(surfaceId);
  auto shadowTree = std::unique_ptr<ShadowTree>(iterator->second.release());
  registry_.erase(iterator);
  return shadowTree;
}

bool ShadowTreeRegistry::visit(
    SurfaceId surfaceId,
    std::function<void(const ShadowTree &shadowTree)> callback) const {
  std::shared_lock<better::shared_mutex> lock(mutex_);

  auto iterator = registry_.find(surfaceId);

  if (iterator == registry_.end()) {
    return false;
  }

  callback(*iterator->second);
  return true;
}

void ShadowTreeRegistry::enumerate(
    std::function<void(const ShadowTree &shadowTree, bool &stop)> callback)
    const {
  std::shared_lock<better::shared_mutex> lock(mutex_);
  bool stop = false;
  for (auto const &pair : registry_) {
    callback(*pair.second, stop);
    if (stop) {
      break;
    }
  }
}

} // namespace react
} // namespace facebook
