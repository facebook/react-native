/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DOMPlatform.h"
#include <react/renderer/textlayoutmanager/TextLayoutManagerExtended.h>

namespace facebook::react::dom {

std::vector<DOMRect> getClientRectsForTextNode(
    const ParagraphShadowNode& paragraphNode,
    const LayoutMetrics& paragraphLayoutMetrics,
    Tag targetTag,
    SurfaceId surfaceId) {
  std::vector<DOMRect> result;

  const auto& state = paragraphNode.getStateData();
  auto layoutManager = state.layoutManager.lock();
  if (layoutManager == nullptr) {
    return result;
  }

  if constexpr (TextLayoutManagerExtended::supportsPreparedLayout()) {
    const auto& preparedLayout = state.measuredLayout.preparedLayout;
    if (preparedLayout.get() != nullptr) {
      auto fragmentRects =
          layoutManager->getFragmentRectsForReactTag(preparedLayout, targetTag);
      result.reserve(fragmentRects.size());
      auto contentOriginX = paragraphLayoutMetrics.frame.origin.x +
          paragraphLayoutMetrics.contentInsets.left;
      auto contentOriginY = paragraphLayoutMetrics.frame.origin.y +
          paragraphLayoutMetrics.contentInsets.top;
      for (const auto& rect : fragmentRects) {
        result.push_back(
            DOMRect{
                .x = contentOriginX + rect.origin.x,
                .y = contentOriginY + rect.origin.y,
                .width = rect.size.width,
                .height = rect.size.height});
      }
      return result;
    }
  }

  auto layoutConstraints = LayoutConstraints{
      .minimumSize = {0, 0},
      .maximumSize = paragraphLayoutMetrics.frame.size,
      .layoutDirection = paragraphLayoutMetrics.layoutDirection};

  auto fragmentRects = layoutManager->getFragmentRectsFromAttributedString(
      surfaceId,
      state.attributedString,
      state.paragraphAttributes,
      layoutConstraints,
      targetTag);

  result.reserve(fragmentRects.size());
  auto originX = paragraphLayoutMetrics.frame.origin.x;
  auto originY = paragraphLayoutMetrics.frame.origin.y;
  for (const auto& rect : fragmentRects) {
    result.push_back(
        DOMRect{
            .x = originX + rect.origin.x,
            .y = originY + rect.origin.y,
            .width = rect.size.width,
            .height = rect.size.height});
  }
  return result;
}

} // namespace facebook::react::dom
