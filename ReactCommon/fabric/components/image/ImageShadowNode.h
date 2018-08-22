/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/image/ImageEventEmitter.h>
#include <fabric/components/image/ImageProps.h>
#include <fabric/components/view/ConcreteViewShadowNode.h>
#include <fabric/imagemanager/ImageManager.h>
#include <fabric/imagemanager/primitives.h>

namespace facebook {
namespace react {

extern const char ImageComponentName[];

/*
 * `ShadowNode` for <Image> component.
 */
class ImageShadowNode final:
  public ConcreteViewShadowNode<
    ImageComponentName,
    ImageProps,
    ImageEventEmitter
  > {

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
