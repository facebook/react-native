/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/scrollview/PullToRefreshViewEventEmitter.h>
#include <react/components/scrollview/PullToRefreshViewProps.h>
#include <react/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char PullToRefreshViewComponentName[];

/*
 * `ShadowNode` for <PullToRefreshView> component.
 */
class PullToRefreshViewShadowNode final : public ConcreteViewShadowNode<
                                              PullToRefreshViewComponentName,
                                              PullToRefreshViewProps,
                                              PullToRefreshViewEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
};

} // namespace react
} // namespace facebook
