/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/image/ImageEventEmitter.h>
#include <react/components/image/ImageProps.h>
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
                                  ImageEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  /*
   * Associates a shared `ImageManager` with the node.
   */
  void setImageManager(const SharedImageManager &imageManager);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

 private:
  /*
   * (Re)Creates a `LocalData` object (with `ImageRequest`) if needed.
   */
  void updateLocalData();

  ImageSource getImageSource() const;

  SharedImageManager imageManager_;
};

} // namespace react
} // namespace facebook
