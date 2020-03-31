/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/rncore/EventEmitters.h>
#include <react/components/rncore/Props.h>
#include <react/components/slider/SliderMeasurementsManager.h>
#include <react/components/slider/SliderState.h>
#include <react/components/view/ConcreteViewShadowNode.h>
#include <react/imagemanager/ImageManager.h>
#include <react/imagemanager/primitives.h>

namespace facebook {
namespace react {

extern const char SliderComponentName[];

/*
 * `ShadowNode` for <Slider> component.
 */
class SliderShadowNode final : public ConcreteViewShadowNode<
                                   SliderComponentName,
                                   SliderProps,
                                   SliderEventEmitter,
                                   SliderState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Associates a shared `ImageManager` with the node.
  void setImageManager(const SharedImageManager &imageManager);

  // Associates a shared `SliderMeasurementsManager` with the node.
  void setSliderMeasurementsManager(
      const std::shared_ptr<SliderMeasurementsManager> &measurementsManager);

  static SliderState initialStateData(
      ShadowNodeFragment const &fragment,
      SurfaceId const surfaceId,
      ComponentDescriptor const &componentDescriptor) {
    auto imageSource = ImageSource{ImageSource::Type::Invalid};
    return {imageSource,
            {imageSource, nullptr},
            imageSource,
            {imageSource, nullptr},
            imageSource,
            {imageSource, nullptr},
            imageSource,
            {imageSource, nullptr}};
  }

#pragma mark - LayoutableShadowNode

  Size measure(LayoutConstraints layoutConstraints) const override;
  void layout(LayoutContext layoutContext) override;

 private:
  void updateStateIfNeeded();

  ImageSource getTrackImageSource() const;
  ImageSource getMinimumTrackImageSource() const;
  ImageSource getMaximumTrackImageSource() const;
  ImageSource getThumbImageSource() const;

  SharedImageManager imageManager_;
  std::shared_ptr<SliderMeasurementsManager> measurementsManager_;
};

} // namespace react
} // namespace facebook
