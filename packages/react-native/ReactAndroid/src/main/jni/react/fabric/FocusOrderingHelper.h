/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/uimanager/UIManager.h>
#include "FabricUIManagerBinding.h"

namespace facebook::react {

enum class FocusDirection {
  FocusDown = 0,
  FocusUp = 1,
  FocusRight = 2,
  FocusLeft = 3,
};

class FocusOrderingHelper {
 public:
  static void traverseAndUpdateNextFocusableElement(
      const ShadowNode::Shared& parentShadowNode,
      const ShadowNode::Shared& focusedShadowNode,
      const ShadowNode::Shared& currNode,
      FocusDirection focusDirection,
      const UIManager& uimanager,
      Rect sourceRect,
      std::optional<Rect>& nextRect,
      ShadowNode::Shared& nextNode);

  static ShadowNode::Shared findShadowNodeByTagRecursively(
      const ShadowNode::Shared& parentShadowNode,
      Tag tag);

  static std::optional<FocusDirection> resolveFocusDirection(int direction);
};
} // namespace facebook::react
