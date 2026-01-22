/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DOMPlatform.h"

namespace facebook::react::dom {

std::vector<DOMRect> getClientRectsForTextNode(
    const ParagraphShadowNode& paragraphNode,
    const LayoutMetrics& paragraphLayoutMetrics,
    Tag targetTag,
    SurfaceId /*surfaceId*/) {
  std::vector<DOMRect> result;

  const auto& state = paragraphNode.getStateData();
  const auto& attributedString = state.attributedString;
  const auto& fragments = attributedString.getFragments();
  auto paragraphFrame = paragraphLayoutMetrics.frame;

  for (const auto& fragment : fragments) {
    if (fragment.parentShadowView.tag == targetTag &&
        !fragment.isAttachment()) {
      result.push_back(
          DOMRect{
              .x = paragraphFrame.origin.x,
              .y = paragraphFrame.origin.y,
              .width = paragraphFrame.size.width,
              .height = paragraphFrame.size.height});
    }
  }
  return result;
}

} // namespace facebook::react::dom
