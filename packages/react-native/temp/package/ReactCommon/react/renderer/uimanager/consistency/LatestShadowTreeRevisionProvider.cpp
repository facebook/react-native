/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LatestShadowTreeRevisionProvider.h"

namespace facebook::react {

LatestShadowTreeRevisionProvider::LatestShadowTreeRevisionProvider(
    ShadowTreeRegistry& shadowTreeRegistry)
    : shadowTreeRegistry_(shadowTreeRegistry) {}

#pragma mark - ShadowTreeRevisionProvider

RootShadowNode::Shared LatestShadowTreeRevisionProvider::getCurrentRevision(
    SurfaceId surfaceId) {
  RootShadowNode::Shared rootShadowNode;

  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree& shadowTree) {
    rootShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
  });

  return rootShadowNode;
}

} // namespace facebook::react
