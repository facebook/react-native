/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PullToRefreshViewEventEmitter.h"

namespace facebook {
namespace react {

void PullToRefreshViewEventEmitter::onRefresh() const {
  dispatchEvent("refresh");
}

} // namespace react
} // namespace facebook
