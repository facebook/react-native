/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/leakchecker/WeakFamilyRegistry.h>
#include <vector>

namespace facebook {
namespace react {

using GarbageCollectionTrigger = std::function<void()>;

class LeakChecker final {
 public:
  LeakChecker(RuntimeExecutor const &runtimeExecutor);

  void uiManagerDidCreateShadowNodeFamily(
      ShadowNodeFamily::Shared const &shadowNodeFamily) const;
  void stopSurface(SurfaceId surfaceId);

 private:
  void checkSurfaceForLeaks(SurfaceId surfaceId) const;

  RuntimeExecutor const runtimeExecutor_{};

  WeakFamilyRegistry registry_{};
  SurfaceId previouslyStoppedSurface_;
};

} // namespace react
} // namespace facebook
