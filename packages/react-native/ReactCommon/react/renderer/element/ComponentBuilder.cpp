/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentBuilder.h"

#include <utility>

namespace facebook::react {

ComponentBuilder::ComponentBuilder(
    ComponentDescriptorRegistry::Shared componentDescriptorRegistry)
    : componentDescriptorRegistry_(std::move(componentDescriptorRegistry)){};

std::shared_ptr<ShadowNode> ComponentBuilder::build(
    const ElementFragment& elementFragment) const {
  auto& componentDescriptor =
      componentDescriptorRegistry_->at(elementFragment.componentHandle);

  auto children = ShadowNode::ListOfShared{};
  children.reserve(elementFragment.children.size());
  for (const auto& childFragment : elementFragment.children) {
    children.push_back(build(childFragment));
  }

  auto family = componentDescriptor.createFamily(ShadowNodeFamilyFragment{
      elementFragment.tag, elementFragment.surfaceId, nullptr});

  auto initialState =
      componentDescriptor.createInitialState(elementFragment.props, family);

  auto constShadowNode = componentDescriptor.createShadowNode(
      ShadowNodeFragment{
          elementFragment.props,
          std::make_shared<const ShadowNode::ListOfShared>(children),
          initialState},
      family);

  if (elementFragment.stateCallback) {
    auto newState = componentDescriptor.createState(
        *family, elementFragment.stateCallback(initialState));
    constShadowNode = componentDescriptor.cloneShadowNode(
        *constShadowNode,
        ShadowNodeFragment{
            ShadowNodeFragment::propsPlaceholder(),
            ShadowNodeFragment::childrenPlaceholder(),
            newState});
  }

  auto shadowNode = std::const_pointer_cast<ShadowNode>(constShadowNode);

  if (elementFragment.referenceCallback) {
    elementFragment.referenceCallback(shadowNode);
  }

  if (elementFragment.finalizeCallback) {
    elementFragment.finalizeCallback(*shadowNode);
  }

  return shadowNode;
}

} // namespace facebook::react
