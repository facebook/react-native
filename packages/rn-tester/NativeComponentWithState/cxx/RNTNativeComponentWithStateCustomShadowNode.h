/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/AppSpecs/EventEmitters.h>
#include <react/renderer/components/AppSpecs/Props.h>
#include <react/renderer/components/AppSpecs/States.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

#include <react/renderer/imagemanager/ImageManager.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook {
namespace react {

JSI_EXPORT extern const char RNTNativeComponentWithStateComponentName[];

/*
 * `ShadowNode` for <Slider> component.
 */
class RNTNativeComponentWithStateCustomShadowNode final
    : public ConcreteViewShadowNode<
          RNTNativeComponentWithStateComponentName,
          RNTNativeComponentWithStateProps,
          RNTNativeComponentWithStateEventEmitter,
          RNTNativeComponentWithStateState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Associates a shared `ImageManager` with the node.
  void setImageManager(const SharedImageManager &imageManager);

  static RNTNativeComponentWithStateState initialStateData(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamilyFragment const &familyFragment,
      ComponentDescriptor const &componentDescriptor) {
    auto imageSource = ImageSource{ImageSource::Type::Invalid};
    return {imageSource, {imageSource, nullptr}};
  }

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

 private:
  void updateStateIfNeeded();

  ImageSource getImageSource() const;

  SharedImageManager imageManager_;
};

} // namespace react
} // namespace facebook
