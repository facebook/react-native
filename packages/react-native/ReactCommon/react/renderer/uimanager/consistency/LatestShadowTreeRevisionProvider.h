/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/mounting/ShadowTreeRegistry.h>
#include <react/renderer/uimanager/consistency/ShadowTreeRevisionProvider.h>
#include <memory>

namespace facebook::react {

/**
 * This is a drop-in replacement for `LazyShadowTreeRevisionConsistencyManager`
 * that preserves the current behavior (always providing the latest committed
 * revision instead of locking to a specific one).
 */
class LatestShadowTreeRevisionProvider : public ShadowTreeRevisionProvider {
 public:
  explicit LatestShadowTreeRevisionProvider(
      ShadowTreeRegistry& shadowTreeRegistry);

#pragma mark - ShadowTreeRevisionProvider

  RootShadowNode::Shared getCurrentRevision(SurfaceId surfaceId) override;

 private:
  ShadowTreeRegistry& shadowTreeRegistry_;
};

} // namespace facebook::react
