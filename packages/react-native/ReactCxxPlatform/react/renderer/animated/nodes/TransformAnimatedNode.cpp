/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "TransformAnimatedNode.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>
#include <utility>

namespace facebook::react {

static constexpr std::string_view sTransformsName{"transforms"};
static constexpr std::string_view sPropertyName{"property"};
static constexpr std::string_view sTypeName{"type"};
static constexpr std::string_view sAnimatedName{"animated"};
static constexpr std::string_view sNodeTagName{"nodeTag"};
static constexpr std::string_view sValueName{"value"};
static constexpr std::string_view sTransformPropName{"transform"};

TransformAnimatedNode::TransformAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    const std::shared_ptr<NativeAnimatedNodesManager>& manager)
    : AnimatedNode(tag, config, manager, AnimatedNodeType::Transform),
      props_(folly::dynamic::object()) {}

void TransformAnimatedNode::update() {
  folly::dynamic transforms = folly::dynamic::array();
  if (const auto manager = manager_.lock()) {
    auto transformsArray = getConfig()[sTransformsName];
    react_native_assert(transformsArray.type() == folly::dynamic::ARRAY);
    for (const auto& transform : transformsArray) {
      std::optional<double> value;
      if (transform[sTypeName].asString() == sAnimatedName) {
        const auto inputTag = static_cast<Tag>(transform[sNodeTagName].asInt());
        if (const auto node =
                manager->getAnimatedNode<ValueAnimatedNode>(inputTag)) {
          value = node->value();
        }
      } else {
        value = transform[sValueName].asDouble();
      }
      if (value) {
        const auto property = transform[sPropertyName].asString();
        transforms.push_back(folly::dynamic::object(property, value.value()));
      }
    }
    props_[sTransformPropName] = std::move(transforms);
  }
}

const folly::dynamic& TransformAnimatedNode::getProps() {
  return props_;
}

} // namespace facebook::react
