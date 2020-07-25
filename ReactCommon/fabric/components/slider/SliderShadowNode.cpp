/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SliderShadowNode.h"

#include <react/core/LayoutContext.h>

namespace facebook {
namespace react {

extern const char SliderComponentName[] = "Slider";

void SliderShadowNode::setImageManager(const SharedImageManager &imageManager) {
  ensureUnsealed();
  imageManager_ = imageManager;
}

void SliderShadowNode::setSliderMeasurementsManager(
    const std::shared_ptr<SliderMeasurementsManager> &measurementsManager) {
  ensureUnsealed();
  measurementsManager_ = measurementsManager;
}

void SliderShadowNode::updateStateIfNeeded() {
  const auto &newTrackImageSource = getTrackImageSource();
  const auto &newMinimumTrackImageSource = getMinimumTrackImageSource();
  const auto &newMaximumTrackImageSource = getMaximumTrackImageSource();
  const auto &newThumbImageSource = getThumbImageSource();

  auto const &currentState = getStateData();

  auto trackImageSource = currentState.getTrackImageSource();
  auto minimumTrackImageSource = currentState.getMinimumTrackImageSource();
  auto maximumTrackImageSource = currentState.getMaximumTrackImageSource();
  auto thumbImageSource = currentState.getThumbImageSource();

  bool anyChanged = newTrackImageSource != trackImageSource ||
      newMinimumTrackImageSource != minimumTrackImageSource ||
      newMaximumTrackImageSource != maximumTrackImageSource ||
      newThumbImageSource != thumbImageSource;

  if (!anyChanged) {
    return;
  }

  // Now we are about to mutate the Shadow Node.
  ensureUnsealed();

  // It is not possible to copy or move image requests from SliderLocalData,
  // so instead we recreate any image requests (that may already be in-flight?)
  // TODO: check if multiple requests are cached or if it's a net loss
  auto state = SliderState{
      newTrackImageSource,
      imageManager_->requestImage(newTrackImageSource, getSurfaceId()),
      newMinimumTrackImageSource,
      imageManager_->requestImage(newMinimumTrackImageSource, getSurfaceId()),
      newMaximumTrackImageSource,
      imageManager_->requestImage(newMaximumTrackImageSource, getSurfaceId()),
      newThumbImageSource,
      imageManager_->requestImage(newThumbImageSource, getSurfaceId())};
  setStateData(std::move(state));
}

ImageSource SliderShadowNode::getTrackImageSource() const {
  return getConcreteProps().trackImage;
}

ImageSource SliderShadowNode::getMinimumTrackImageSource() const {
  return getConcreteProps().minimumTrackImage;
}

ImageSource SliderShadowNode::getMaximumTrackImageSource() const {
  return getConcreteProps().maximumTrackImage;
}

ImageSource SliderShadowNode::getThumbImageSource() const {
  return getConcreteProps().thumbImage;
}

#pragma mark - LayoutableShadowNode

Size SliderShadowNode::measureContent(
    LayoutContext const &layoutContext,
    LayoutConstraints const &layoutConstraints) const {
  if (SliderMeasurementsManager::shouldMeasureSlider()) {
    return measurementsManager_->measure(getSurfaceId(), layoutConstraints);
  }

  return {};
}

void SliderShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
