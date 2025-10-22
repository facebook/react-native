/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimatedPropsRegistry.h"
#include <react/renderer/core/PropsParserContext.h>
#include "AnimatedProps.h"

namespace facebook::react {

void AnimatedPropsRegistry::update(
    std::unordered_map<Tag, AnimatedProps>& animatedPropsMap,
    std::unordered_set<const ShadowNodeFamily*>& families) {
  for (const auto& family : families) {
    if (family != nullptr) {
      surfaceToFamilies_[family->getSurfaceId()].insert(family);
    }
  }
  for (auto& [tag, animatedProps] : animatedPropsMap) {
    auto& snapshot = map_[tag];
    auto& viewProps = snapshot.props;

    for (auto& animatedProp : animatedProps.props) {
      snapshot.propNames.insert(animatedProp->propName);
      switch (animatedProp->propName) {
        case OPACITY:
          viewProps.opacity = get<Float>(animatedProp);
          break;

        case WIDTH:
          viewProps.yogaStyle.setDimension(
              yoga::Dimension::Width,
              get<yoga::Style::SizeLength>(animatedProp));
          break;

        case HEIGHT:
          viewProps.yogaStyle.setDimension(
              yoga::Dimension::Height,
              get<yoga::Style::SizeLength>(animatedProp));
          break;

        case BORDER_RADII:
          viewProps.borderRadii = get<CascadedBorderRadii>(animatedProp);
          break;

        case FLEX:
          viewProps.yogaStyle.setFlex(get<yoga::FloatOptional>(animatedProp));
          break;

        case TRANSFORM:
          viewProps.transform = get<Transform>(animatedProp);
          break;
      }
    }
  }
}

} // namespace facebook::react
