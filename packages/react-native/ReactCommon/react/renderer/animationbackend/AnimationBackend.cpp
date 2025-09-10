/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationBackend.h"
#include <chrono>

namespace facebook::react {

AnimationBackend::AnimationBackend(
    StartOnRenderCallback&& startOnRenderCallback,
    StopOnRenderCallback&& stopOnRenderCallback,
    DirectManipulationCallback&& directManipulationCallback,
    FabricCommitCallback&& fabricCommitCallback,
    UIManager* uiManager)
    : startOnRenderCallback_(startOnRenderCallback),
      stopOnRenderCallback_(stopOnRenderCallback),
      directManipulationCallback_(directManipulationCallback),
      fabricCommitCallback_(fabricCommitCallback),
      uiManager_(uiManager){}

void AnimationBackend::onAnimationFrame(double timestamp) {
  std::unordered_map<Tag, AnimatedProps> updates;
  std::unordered_set<const ShadowNodeFamily*> families;
  for (auto& callback : callbacks) {
    auto muatations = callback(timestamp);
    for (auto& mutation : muatations) {
      families.insert(mutation.family);
      updates[mutation.tag] = std::move(mutation.props);
    }
  }
//  fabricCommitCallback_(updates);
  uiManager_->getShadowTreeRegistry().enumerate([this, families, updates](const ShadowTree& shadowTree, bool& stop){
    shadowTree.commit([this, families, updates](const RootShadowNode& oldRootShadowNode){
      
      return std::static_pointer_cast<RootShadowNode>(oldRootShadowNode.cloneMultiple(families, [this, families, updates](const ShadowNode &shadowNode, const ShadowNodeFragment &fragment){
        PropsParserContext propsParserContext{
            shadowNode.getSurfaceId(), *shadowNode.getContextContainer()};
        auto newProps = shadowNode.getComponentDescriptor().cloneProps(propsParserContext, shadowNode.getProps(), {});
        auto viewProps = std::const_pointer_cast<BaseViewProps>(std::static_pointer_cast<const BaseViewProps>(newProps));
        for (auto& animatedProp: updates.at(shadowNode.getTag()).props){
          switch (animatedProp.propName) {
            case OPACITY:
              viewProps->opacity = animatedProp.value.float_;
              break;
              
            case WIDTH:
              viewProps->yogaStyle.setDimension(yoga::Dimension::Width, animatedProp.value.styleSizeLength_);
              break;
              
            case HEIGHT:
              viewProps->yogaStyle.setDimension(yoga::Dimension::Height, animatedProp.value.styleSizeLength_);
              break;
              
            case BORDER_RADII:
              viewProps->borderRadii = std::move(*animatedProp.value.borderRadii_);
//              delete animatedProp.value.borderRadii_;
              break;
              
            case FLEX:
              viewProps->yogaStyle.setFlex(animatedProp.value.floatOptional_);
              break;
              
            default:
              break;
          }
        }
//        viewProps->opacity = updates.at(shadowNode.getTag()).opacity;
//        viewProps->yogaStyle.dimensions_
//        viewProps->yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(updates.at(shadowNode.getTag()).height));
        return shadowNode.clone({newProps, fragment.children, shadowNode.getState()});
      }));
    }, {.mountSynchronously = true});
  });
}

void AnimationBackend::start(const Callback& callback) {
  callbacks.push_back(callback);
  // startOnRenderCallback_ should provide the timestamp from the platform
  startOnRenderCallback_([this]() { onAnimationFrame(std::chrono::steady_clock::now().time_since_epoch()
    .count()/1000); });
}
void AnimationBackend::stop() {
  stopOnRenderCallback_();
  callbacks.clear();
}
} // namespace facebook::react
