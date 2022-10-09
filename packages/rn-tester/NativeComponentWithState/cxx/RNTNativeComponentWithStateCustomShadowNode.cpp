/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RNTNativeComponentWithStateCustomShadowNode.h"

#include <react/renderer/core/LayoutContext.h>

namespace facebook {
namespace react {

extern const char RNTNativeComponentWithStateComponentName[] =
    "RNTNativeComponentWithState";

void RNTNativeComponentWithStateCustomShadowNode::setImageManager(
    const SharedImageManager &imageManager) {
  ensureUnsealed();
  imageManager_ = imageManager;
}

void RNTNativeComponentWithStateCustomShadowNode::updateStateIfNeeded() {
  const auto &newImageSource = getImageSource();

  auto const &currentState = getStateData();

  auto imageSource = currentState.getImageSource();

  bool anyChanged = newImageSource != imageSource;

  if (!anyChanged) {
    return;
  }

  // Now we are about to mutate the Shadow Node.
  ensureUnsealed();

  // It is not possible to copy or move image requests from SliderLocalData,
  // so instead we recreate any image requests (that may already be in-flight?)
  // TODO: check if multiple requests are cached or if it's a net loss
  auto state = RNTNativeComponentWithStateState{
      newImageSource,
      imageManager_->requestImage(newImageSource, getSurfaceId())};
  setStateData(std::move(state));
}

ImageSource RNTNativeComponentWithStateCustomShadowNode::getImageSource()
    const {
  return getConcreteProps().imageSource;
}

void RNTNativeComponentWithStateCustomShadowNode::layout(
    LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
