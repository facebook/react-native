// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <react/core/ReactPrimitives.h>
#include <react/uimanager/ShadowTree.h>

namespace facebook {
namespace react {

/*
 * Owning registry of `ShadowTree`s.
 */
class ShadowTreeRegistry final {
 public:
  ShadowTreeRegistry() = default;

  /*
   * Adds a `ShadowTree` instance to the registry.
   * The ownership of the instance is also transferred to the registry.
   * Can be called from any thread.
   */
  void add(std::unique_ptr<ShadowTree> &&shadowTree) const;

  /*
   * Removes a `ShadowTree` instance with given `surfaceId` from the registry
   * and returns it as a result.
   * The ownership of the instance is also transferred to the caller.
   * Can be called from any thread.
   */
  std::unique_ptr<ShadowTree> remove(SurfaceId surfaceId) const;

  /*
   * Finds a `ShadowTree` instance with a given `surfaceId` in the registry and
   * synchronously calls the `callback` with a reference to the instance while
   * the mutex is being acquired.
   * Returns `true` if the registry has `ShadowTree` instance with corresponding
   * `surfaceId`, otherwise returns `false` without calling the `callback`.
   * Can be called from any thread.
   */
  bool get(
      SurfaceId surfaceId,
      std::function<void(const ShadowTree &shadowTree)> callback) const;

 private:
  mutable std::mutex mutex_;
  mutable std::unordered_map<SurfaceId, std::unique_ptr<ShadowTree>>
      registry_; // Protected by `mutex_`.
};

} // namespace react
} // namespace facebook
