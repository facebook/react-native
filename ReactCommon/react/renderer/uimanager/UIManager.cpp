/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManager.h"

#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/graphics/Geometry.h>

#include <glog/logging.h>

namespace facebook {
namespace react {

UIManager::~UIManager() {
  LOG(WARNING) << "UIManager::~UIManager() was called (address: " << this
               << ").";
}

SharedShadowNode UIManager::createNode(
    Tag tag,
    std::string const &name,
    SurfaceId surfaceId,
    const RawProps &rawProps,
    SharedEventTarget eventTarget) const {
  SystraceSection s("UIManager::createNode");

  auto &componentDescriptor = componentDescriptorRegistry_->at(name);
  auto fallbackDescriptor =
      componentDescriptorRegistry_->getFallbackComponentDescriptor();

  auto family = componentDescriptor.createFamily(
      ShadowNodeFamilyFragment{tag, surfaceId, nullptr},
      std::move(eventTarget));
  auto const props = componentDescriptor.cloneProps(nullptr, rawProps);
  auto const state =
      componentDescriptor.createInitialState(ShadowNodeFragment{props}, family);

  auto shadowNode = componentDescriptor.createShadowNode(
      ShadowNodeFragment{
          /* .props = */
          fallbackDescriptor != nullptr &&
                  fallbackDescriptor->getComponentHandle() ==
                      componentDescriptor.getComponentHandle()
              ? componentDescriptor.cloneProps(
                    props, RawProps(folly::dynamic::object("name", name)))
              : props,
          /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
          /* .state = */ state,
      },
      family);

  if (delegate_) {
    delegate_->uiManagerDidCreateShadowNode(shadowNode);
  }

  return shadowNode;
}

SharedShadowNode UIManager::cloneNode(
    const ShadowNode::Shared &shadowNode,
    const SharedShadowNodeSharedList &children,
    const RawProps *rawProps) const {
  SystraceSection s("UIManager::cloneNode");

  auto &componentDescriptor = shadowNode->getComponentDescriptor();
  auto clonedShadowNode = componentDescriptor.cloneShadowNode(
      *shadowNode,
      {
          /* .props = */
          rawProps ? componentDescriptor.cloneProps(
                         shadowNode->getProps(), *rawProps)
                   : ShadowNodeFragment::propsPlaceholder(),
          /* .children = */ children,
      });

  return clonedShadowNode;
}

void UIManager::appendChild(
    const ShadowNode::Shared &parentShadowNode,
    const ShadowNode::Shared &childShadowNode) const {
  SystraceSection s("UIManager::appendChild");

  auto &componentDescriptor = parentShadowNode->getComponentDescriptor();
  componentDescriptor.appendChild(parentShadowNode, childShadowNode);
}

void UIManager::completeSurface(
    SurfaceId surfaceId,
    SharedShadowNodeUnsharedList const &rootChildren,
    ShadowTree::CommitOptions commitOptions) const {
  SystraceSection s("UIManager::completeSurface");

  shadowTreeRegistry_.visit(surfaceId, [&](ShadowTree const &shadowTree) {
    shadowTree.commit(
        [&](RootShadowNode const &oldRootShadowNode) {
          return std::make_shared<RootShadowNode>(
              oldRootShadowNode,
              ShadowNodeFragment{
                  /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                  /* .children = */ rootChildren,
              });
        },
        commitOptions);
  });
}

void UIManager::setJSResponder(
    const ShadowNode::Shared &shadowNode,
    const bool blockNativeResponder) const {
  if (delegate_) {
    delegate_->uiManagerDidSetJSResponder(
        shadowNode->getSurfaceId(), shadowNode, blockNativeResponder);
  }
}

void UIManager::clearJSResponder() const {
  if (delegate_) {
    delegate_->uiManagerDidClearJSResponder();
  }
}

ShadowNode::Shared UIManager::getNewestCloneOfShadowNode(
    ShadowNode const &shadowNode) const {
  auto findNewestChildInParent =
      [&](auto const &parentNode) -> ShadowNode::Shared {
    for (auto const &child : parentNode.getChildren()) {
      if (ShadowNode::sameFamily(*child, shadowNode)) {
        return child;
      }
    }
    return nullptr;
  };

  auto ancestorShadowNode = ShadowNode::Shared{};
  shadowTreeRegistry_.visit(
      shadowNode.getSurfaceId(), [&](ShadowTree const &shadowTree) {
        ancestorShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
      });

  if (!ancestorShadowNode) {
    return nullptr;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(*ancestorShadowNode);

  if (ancestors.empty()) {
    return nullptr;
  }

  return findNewestChildInParent(ancestors.rbegin()->first.get());
}

ShadowNode::Shared UIManager::findNodeAtPoint(
    ShadowNode::Shared const &node,
    Point point) const {
  return LayoutableShadowNode::findNodeAtPoint(
      getNewestCloneOfShadowNode(*node), point);
}

LayoutMetrics UIManager::getRelativeLayoutMetrics(
    ShadowNode const &shadowNode,
    ShadowNode const *ancestorShadowNode,
    LayoutableShadowNode::LayoutInspectingPolicy policy) const {
  SystraceSection s("UIManager::getRelativeLayoutMetrics");

  // We might store here an owning pointer to `ancestorShadowNode` to ensure
  // that the node is not deallocated during method execution lifetime.
  auto owningAncestorShadowNode = ShadowNode::Shared{};

  if (!ancestorShadowNode) {
    shadowTreeRegistry_.visit(
        shadowNode.getSurfaceId(), [&](ShadowTree const &shadowTree) {
          owningAncestorShadowNode =
              shadowTree.getCurrentRevision().rootShadowNode;
          ancestorShadowNode = owningAncestorShadowNode.get();
        });
  } else {
    // It is possible for JavaScript (or other callers) to have a reference
    // to a previous version of ShadowNodes, but we enforce that
    // metrics are only calculated on most recently committed versions.
    owningAncestorShadowNode = getNewestCloneOfShadowNode(*ancestorShadowNode);
    ancestorShadowNode = owningAncestorShadowNode.get();
  }

  auto layoutableAncestorShadowNode =
      traitCast<LayoutableShadowNode const *>(ancestorShadowNode);

  if (!layoutableAncestorShadowNode) {
    return EmptyLayoutMetrics;
  }

  return LayoutableShadowNode::computeRelativeLayoutMetrics(
      shadowNode.getFamily(), *layoutableAncestorShadowNode, policy);
}

void UIManager::updateStateWithAutorepeat(
    StateUpdate const &stateUpdate) const {
  auto &callback = stateUpdate.callback;
  auto &family = stateUpdate.family;
  auto &componentDescriptor = family->getComponentDescriptor();

  shadowTreeRegistry_.visit(
      family->getSurfaceId(), [&](ShadowTree const &shadowTree) {
        shadowTree.commit([&](RootShadowNode const &oldRootShadowNode) {
          auto isValid = true;

          auto rootNode = oldRootShadowNode.cloneTree(
              *family, [&](ShadowNode const &oldShadowNode) {
                auto newData =
                    callback(oldShadowNode.getState()->getDataPointer());

                if (!newData) {
                  isValid = false;
                  // Just return something, we will discard it anyway.
                  return oldShadowNode.clone({});
                }

                auto newState =
                    componentDescriptor.createState(*family, newData);

                return oldShadowNode.clone({
                    /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                    /* .children = */
                    ShadowNodeFragment::childrenPlaceholder(),
                    /* .state = */ newState,
                });
              });

          return isValid ? std::static_pointer_cast<RootShadowNode>(rootNode)
                         : nullptr;
        });
      });
}

void UIManager::updateState(StateUpdate const &stateUpdate) const {
  if (stateUpdate.autorepeat || experimentEnableStateUpdateWithAutorepeat) {
    updateStateWithAutorepeat(stateUpdate);
    return;
  }

  auto &callback = stateUpdate.callback;
  auto &family = stateUpdate.family;
  auto &componentDescriptor = family->getComponentDescriptor();

  shadowTreeRegistry_.visit(
      family->getSurfaceId(), [&](ShadowTree const &shadowTree) {
        auto status = shadowTree.tryCommit([&](RootShadowNode const
                                                   &oldRootShadowNode) {
          return std::static_pointer_cast<RootShadowNode>(
              oldRootShadowNode.cloneTree(
                  *family, [&](ShadowNode const &oldShadowNode) {
                    auto newData =
                        callback(oldShadowNode.getState()->getDataPointer());
                    auto newState =
                        componentDescriptor.createState(*family, newData);

                    return oldShadowNode.clone({
                        /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                        /* .children = */
                        ShadowNodeFragment::childrenPlaceholder(),
                        /* .state = */ newState,
                    });
                  }));
        });
        if (status != ShadowTree::CommitStatus::Succeeded &&
            stateUpdate.failureCallback) {
          stateUpdate.failureCallback();
        }
      });
}

void UIManager::dispatchCommand(
    const ShadowNode::Shared &shadowNode,
    std::string const &commandName,
    folly::dynamic const args) const {
  if (delegate_) {
    delegate_->uiManagerDidDispatchCommand(shadowNode, commandName, args);
  }
}

void UIManager::configureNextLayoutAnimation(
    jsi::Runtime &runtime,
    RawValue const &config,
    jsi::Value const &successCallback,
    jsi::Value const &failureCallback) const {
  if (animationDelegate_) {
    animationDelegate_->uiManagerDidConfigureNextLayoutAnimation(
        runtime,
        config,
        std::move(successCallback),
        std::move(failureCallback));
  }
}

void UIManager::setComponentDescriptorRegistry(
    const SharedComponentDescriptorRegistry &componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

void UIManager::setDelegate(UIManagerDelegate *delegate) {
  delegate_ = delegate;
}

UIManagerDelegate *UIManager::getDelegate() {
  return delegate_;
}

void UIManager::setBackgroundExecutor(
    BackgroundExecutor const &backgroundExecutor) {
  backgroundExecutor_ = backgroundExecutor;
}

void UIManager::visitBinding(
    std::function<void(UIManagerBinding const &uiManagerBinding)> callback)
    const {
  if (!uiManagerBinding_) {
    return;
  }

  callback(*uiManagerBinding_);
}

ShadowTreeRegistry const &UIManager::getShadowTreeRegistry() const {
  return shadowTreeRegistry_;
}

#pragma mark - ShadowTreeDelegate

void UIManager::shadowTreeDidFinishTransaction(
    ShadowTree const &shadowTree,
    MountingCoordinator::Shared const &mountingCoordinator) const {
  SystraceSection s("UIManager::shadowTreeDidFinishTransaction");

  if (delegate_) {
    delegate_->uiManagerDidFinishTransaction(mountingCoordinator);
  }
}

#pragma mark - UIManagerAnimationDelegate

void UIManager::setAnimationDelegate(UIManagerAnimationDelegate *delegate) {
  animationDelegate_ = delegate;
}

void UIManager::stopSurfaceForAnimationDelegate(SurfaceId surfaceId) {
  if (animationDelegate_ != nullptr) {
    animationDelegate_->stopSurface(surfaceId);
  }
}

void UIManager::animationTick() {
  if (animationDelegate_ != nullptr &&
      animationDelegate_->shouldAnimateFrame()) {
    shadowTreeRegistry_.enumerate(
        [&](ShadowTree const &shadowTree, bool &stop) {
          shadowTree.notifyDelegatesOfUpdates();
        });
  }
}

} // namespace react
} // namespace facebook
