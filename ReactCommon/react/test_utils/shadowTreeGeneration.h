/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <algorithm>
#include <iostream>
#include <memory>
#include <random>

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/stubs.h>

#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>

#include "Entropy.h"

namespace facebook {
namespace react {

static Tag generateReactTag() {
  static Tag tag = 1000;
  return tag++;
}

class ShadowTreeEdge final {
 public:
  ShadowNode::Shared shadowNode{nullptr};
  ShadowNode::Shared parentShadowNode{nullptr};
  int index{0};
};

static bool traverseShadowTree(
    ShadowNode::Shared const &parentShadowNode,
    std::function<void(ShadowTreeEdge const &edge, bool &stop)> const
        &callback) {
  auto index = int{0};
  for (auto const &childNode : parentShadowNode->getChildren()) {
    auto stop = bool{false};

    callback(ShadowTreeEdge{childNode, parentShadowNode, index}, stop);

    if (stop) {
      return true;
    }

    if (traverseShadowTree(childNode, callback)) {
      return true;
    }

    index++;
  }
  return false;
}

static int countShadowNodes(ShadowNode::Shared const &rootShadowNode) {
  auto counter = int{0};

  traverseShadowTree(
      rootShadowNode,
      [&](ShadowTreeEdge const &edge, bool &stop) { counter++; });

  return counter;
}

static ShadowTreeEdge findShadowNodeWithIndex(
    ShadowNode::Shared const &rootNode,
    int index) {
  auto counter = int{0};
  auto result = ShadowTreeEdge{};

  traverseShadowTree(rootNode, [&](ShadowTreeEdge const &edge, bool &stop) {
    if (index == counter) {
      result = edge;
    }

    counter++;
  });

  return result;
}

static ShadowTreeEdge findRandomShadowNode(
    Entropy const &entropy,
    ShadowNode::Shared const &rootShadowNode) {
  auto count = countShadowNodes(rootShadowNode);
  return findShadowNodeWithIndex(
      rootShadowNode,
      entropy.random<int>(1 /* Excluding a root node */, count - 1));
}

static ShadowNode::ListOfShared cloneSharedShadowNodeList(
    ShadowNode::ListOfShared const &list) {
  auto result = ShadowNode::ListOfShared{};
  result.reserve(list.size());
  for (auto const &shadowNode : list) {
    result.push_back(shadowNode->clone({}));
  }
  return result;
}

static inline ShadowNode::Unshared messWithChildren(
    Entropy const &entropy,
    ShadowNode const &shadowNode) {
  auto children = shadowNode.getChildren();
  children = cloneSharedShadowNodeList(children);
  entropy.shuffle(children);
  return shadowNode.clone(
      {ShadowNodeFragment::propsPlaceholder(),
       std::make_shared<ShadowNode::ListOfShared const>(children)});
}

static inline ShadowNode::Unshared messWithLayoutableOnlyFlag(
    Entropy const &entropy,
    ShadowNode const &shadowNode) {
  auto oldProps = shadowNode.getProps();

  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto newProps = shadowNode.getComponentDescriptor().cloneProps(
      parserContext, oldProps, RawProps(folly::dynamic::object()));

  auto &viewProps =
      const_cast<ViewProps &>(static_cast<ViewProps const &>(*newProps));

  if (entropy.random<bool>(0.1)) {
    viewProps.nativeId = entropy.random<bool>() ? "42" : "";
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.backgroundColor =
        entropy.random<bool>() ? SharedColor() : whiteColor();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.foregroundColor =
        entropy.random<bool>() ? SharedColor() : blackColor();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.shadowColor =
        entropy.random<bool>() ? SharedColor() : blackColor();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.accessible = entropy.random<bool>();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.zIndex = entropy.random<int>();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.pointerEvents = entropy.random<bool>() ? PointerEventsMode::Auto
                                                     : PointerEventsMode::None;
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.transform = entropy.random<bool>() ? Transform::Identity()
                                                 : Transform::Perspective(42);
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.elevation = entropy.random<bool>() ? 1 : 0;
  }

  return shadowNode.clone({newProps});
}

// Similar to `messWithLayoutableOnlyFlag` but has a 50/50 chance of flattening
// (or unflattening) a node's children.
static inline ShadowNode::Unshared messWithNodeFlattenednessFlags(
    Entropy const &entropy,
    ShadowNode const &shadowNode) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto oldProps = shadowNode.getProps();
  auto newProps = shadowNode.getComponentDescriptor().cloneProps(
      parserContext, oldProps, RawProps(folly::dynamic::object()));

  auto &viewProps =
      const_cast<ViewProps &>(static_cast<ViewProps const &>(*newProps));

  if (entropy.random<bool>(0.5)) {
    viewProps.nativeId = "";
    viewProps.collapsable = true;
    viewProps.backgroundColor = SharedColor();
    viewProps.foregroundColor = SharedColor();
    viewProps.shadowColor = SharedColor();
    viewProps.accessible = false;
    viewProps.zIndex = {};
    viewProps.pointerEvents = PointerEventsMode::Auto;
    viewProps.transform = Transform::Identity();
    viewProps.elevation = 0;
  } else {
    viewProps.nativeId = "42";
    viewProps.backgroundColor = whiteColor();
    viewProps.foregroundColor = blackColor();
    viewProps.shadowColor = blackColor();
    viewProps.accessible = true;
    viewProps.zIndex = {entropy.random<int>()};
    viewProps.pointerEvents = PointerEventsMode::None;
    viewProps.transform = Transform::Perspective(entropy.random<int>());
    viewProps.elevation = entropy.random<int>();
  }

  return shadowNode.clone({newProps});
}

static inline ShadowNode::Unshared messWithYogaStyles(
    Entropy const &entropy,
    ShadowNode const &shadowNode) {
  folly::dynamic dynamic = folly::dynamic::object();

  if (entropy.random<bool>()) {
    dynamic["flexDirection"] = entropy.random<bool>() ? "row" : "column";
  }

  std::vector<std::string> properties = {
      "flex",         "flexGrow",      "flexShrink",  "flexBasis",
      "left",         "top",           "marginLeft",  "marginTop",
      "marginRight",  "marginBottom",  "paddingLeft", "paddingTop",
      "paddingRight", "paddingBottom", "width",       "height",
      "maxWidth",     "maxHeight",     "minWidth",    "minHeight",
  };

  for (auto const &property : properties) {
    if (entropy.random<bool>(0.1)) {
      dynamic[property] = entropy.random<int>(0, 1024);
    }
  }

  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto oldProps = shadowNode.getProps();
  auto newProps = shadowNode.getComponentDescriptor().cloneProps(
      parserContext, oldProps, RawProps(dynamic));
  return shadowNode.clone({newProps});
}

using ShadowNodeAlteration = std::function<
    ShadowNode::Unshared(Entropy const &entropy, ShadowNode const &shadowNode)>;

static inline void alterShadowTree(
    Entropy const &entropy,
    RootShadowNode::Shared &rootShadowNode,
    ShadowNodeAlteration alteration) {
  auto edge = findRandomShadowNode(entropy, rootShadowNode);

  rootShadowNode =
      std::static_pointer_cast<RootShadowNode>(rootShadowNode->cloneTree(
          edge.shadowNode->getFamily(), [&](ShadowNode const &oldShadowNode) {
            return alteration(entropy, oldShadowNode);
          }));
}

static inline void alterShadowTree(
    Entropy const &entropy,
    RootShadowNode::Shared &rootShadowNode,
    std::vector<ShadowNodeAlteration> alterations) {
  auto i = entropy.random<int>(0, alterations.size() - 1);
  alterShadowTree(entropy, rootShadowNode, alterations[i]);
}

static SharedViewProps generateDefaultProps(
    ComponentDescriptor const &componentDescriptor) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  return std::static_pointer_cast<ViewProps const>(
      componentDescriptor.cloneProps(parserContext, nullptr, RawProps{}));
}

static inline ShadowNode::Shared generateShadowNodeTree(
    Entropy const &entropy,
    ComponentDescriptor const &componentDescriptor,
    int size,
    int deviation = 3) {
  if (size <= 1) {
    auto family = componentDescriptor.createFamily(
        {generateReactTag(), SurfaceId(1), nullptr}, nullptr);
    return componentDescriptor.createShadowNode(
        ShadowNodeFragment{generateDefaultProps(componentDescriptor)}, family);
  }

  auto items = std::vector<int>(size);
  std::fill(items.begin(), items.end(), 1);
  auto chunks = entropy.distribute(items, deviation);
  auto children = ShadowNode::ListOfShared{};

  for (auto const &chunk : chunks) {
    children.push_back(
        generateShadowNodeTree(entropy, componentDescriptor, chunk.size()));
  }

  auto family = componentDescriptor.createFamily(
      {generateReactTag(), SurfaceId(1), nullptr}, nullptr);
  return componentDescriptor.createShadowNode(
      ShadowNodeFragment{
          generateDefaultProps(componentDescriptor),
          std::make_shared<SharedShadowNodeList>(children)},
      family);
}

} // namespace react
} // namespace facebook
