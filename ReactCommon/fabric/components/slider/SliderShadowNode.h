/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/slider/SliderEventEmitter.h>
#include <react/components/slider/SliderProps.h>
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
                                   SliderEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Associates a shared `ImageManager` with the node.
  void setImageManager(const SharedImageManager &imageManager);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

 private:
  // (Re)Creates a `LocalData` object (with `ImageRequest`) if needed.
  void updateLocalData();

  ImageSource getTrackImageSource() const;
  ImageSource getMinimumTrackImageSource() const;
  ImageSource getMaximumTrackImageSource() const;
  ImageSource getThumbImageSource() const;

  SharedImageManager imageManager_;
};

} // namespace react
} // namespace facebook
