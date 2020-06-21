/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/image/ImageEventEmitter.h>
#include <react/components/image/ImageProps.h>
#include <react/components/image/ImageState.h>
#include <react/components/view/ConcreteViewShadowNode.h>
#include <react/imagemanager/ImageManager.h>
#include <react/imagemanager/primitives.h>

namespace facebook {
namespace react {

extern const char ImageComponentName[];

/*
 * `ShadowNode` for <Image> component.
 */
class ImageShadowNode final : public ConcreteViewShadowNode<
                                  ImageComponentName,
                                  ImageProps,
                                  ImageEventEmitter,
                                  ImageState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    return traits;
  }

  /*
   * Associates a shared `ImageManager` with the node.
   */
  void setImageManager(const SharedImageManager &imageManager);

  static ImageState initialStateData(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamilyFragment const &familyFragment,
      ComponentDescriptor const &componentDescriptor) {
    auto imageSource = ImageSource{ImageSource::Type::Invalid};
    return {imageSource, {imageSource, nullptr}, 0};
  }

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

 private:
  ImageSource getImageSource() const;

  SharedImageManager imageManager_;

  void updateStateIfNeeded();
};

} // namespace react
} // namespace facebook
