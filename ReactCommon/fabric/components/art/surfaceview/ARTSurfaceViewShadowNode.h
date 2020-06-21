/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTElement.h>
#include <react/components/art/ARTSurfaceViewProps.h>
#include <react/components/art/ARTSurfaceViewState.h>
#include <react/components/view/ConcreteViewShadowNode.h>
#include <react/core/ConcreteShadowNode.h>
#include <react/core/LayoutContext.h>
#include <react/core/ShadowNode.h>

namespace facebook {
namespace react {

extern const char ARTSurfaceViewComponentName[];

using ARTSurfaceViewEventEmitter = ViewEventEmitter;

/*
 * `ShadowNode` for <ARTSurfaceViewState> component, represents <View>-like
 * component containing that will be used to display ARTElements.
 */
class ARTSurfaceViewShadowNode : public ConcreteViewShadowNode<
                                     ARTSurfaceViewComponentName,
                                     ARTSurfaceViewProps,
                                     ARTSurfaceViewEventEmitter,
                                     ARTSurfaceViewState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    return traits;
  }

  class Content final {
   public:
    ARTElement::ListOfShared elements{};
  };

  void layout(LayoutContext layoutContext) override;

 private:
  Content const &getContent() const;

  void updateStateIfNeeded(Content const &content);

  /*
   * Cached content of the subtree started from the node.
   */
  mutable better::optional<Content> content_{};
};

} // namespace react
} // namespace facebook
