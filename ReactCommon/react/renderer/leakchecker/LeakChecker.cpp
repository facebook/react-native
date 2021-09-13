/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LeakChecker.h"

#include <glog/logging.h>
#include <jsi/instrumentation.h>

namespace facebook {
namespace react {

LeakChecker::LeakChecker(RuntimeExecutor const &runtimeExecutor)
    : runtimeExecutor_(runtimeExecutor) {}

void LeakChecker::uiManagerDidCreateShadowNodeFamily(
    ShadowNodeFamily::Shared const &shadowNodeFamily) const {
  registry_.add(shadowNodeFamily);
}

void LeakChecker::stopSurface(SurfaceId surfaceId) {
  if (previouslyStoppedSurface_ > 0) {
    // Dispatch the check onto JavaScript thread to make sure all other
    // cleanup code has had chance to run.
    runtimeExecutor_([previouslySoppedSurface = previouslyStoppedSurface_,
                      this](jsi::Runtime &runtime) {
      runtime.instrumentation().collectGarbage("LeakChecker");
      // For now check the previous surface because React uses double
      // buffering which keeps the surface that was just stopped in
      // memory. This is a documented problem in the last point of
      // https://github.com/facebook/react/issues/16087
      checkSurfaceForLeaks(previouslySoppedSurface);
    });
  }

  previouslyStoppedSurface_ = surfaceId;
}

void LeakChecker::checkSurfaceForLeaks(SurfaceId surfaceId) const {
  auto weakFamilies = registry_.weakFamiliesForSurfaceId(surfaceId);
  unsigned int numberOfLeaks = 0;
  for (auto const &weakFamily : weakFamilies) {
    auto strong = weakFamily.lock();
    if (strong) {
      ++numberOfLeaks;
    }
  }
  if (numberOfLeaks > 0) {
    LOG(ERROR) << "[LeakChecker] Surface with id: " << surfaceId
               << " has leaked " << numberOfLeaks << " components out of "
               << weakFamilies.size();
  }
  registry_.removeFamiliesWithSurfaceId(surfaceId);
}

} // namespace react
} // namespace facebook
