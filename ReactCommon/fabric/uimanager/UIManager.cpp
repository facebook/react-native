/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManager.h"

#include <react/core/ShadowNodeFragment.h>
#include <react/debug/SystraceSection.h>
#include <react/graphics/Geometry.h>

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
    const SharedShadowNodeUnsharedList &rootChildren) const {
  SystraceSection s("UIManager::completeSurface");

  shadowTreeRegistry_.visit(surfaceId, [&](ShadowTree const &shadowTree) {
    shadowTree.commit(
        [&](RootShadowNode::Shared const &oldRootShadowNode) {
          return std::make_shared<RootShadowNode>(
              *oldRootShadowNode,
              ShadowNodeFragment{
                  /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                  /* .children = */ rootChildren,
              });
        },
        true);
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

ShadowNode::Shared const *UIManager::getNewestCloneOfShadowNode(
    ShadowNode::Shared const &shadowNode) const {
  auto findNewestChildInParent =
      [&](auto const &parentNode) -> ShadowNode::Shared const * {
    for (auto const &child : parentNode.getChildren()) {
      if (ShadowNode::sameFamily(*child, *shadowNode)) {
        return &child;
      }
    }
    return nullptr;
  };

  ShadowNode const *ancestorShadowNode;
  shadowTreeRegistry_.visit(
      shadowNode->getSurfaceId(), [&](ShadowTree const &shadowTree) {
        shadowTree.tryCommit(
            [&](RootShadowNode::Shared const &oldRootShadowNode) {
              ancestorShadowNode = oldRootShadowNode.get();
              return nullptr;
            },
            true);
      });

  auto ancestors = shadowNode->getFamily().getAncestors(*ancestorShadowNode);

  return findNewestChildInParent(ancestors.rbegin()->first.get());
}

ShadowNode::Shared UIManager::findNodeAtPoint(
    ShadowNode::Shared const &node,
    Point point) const {
  return LayoutableShadowNode::findNodeAtPoint(
      *getNewestCloneOfShadowNode(node), point);
}

void UIManager::setNativeProps(
    ShadowNode const &shadowNode,
    RawProps const &rawProps) const {
  SystraceSection s("UIManager::setNativeProps");

  auto &componentDescriptor = shadowNode.getComponentDescriptor();
  auto props = componentDescriptor.cloneProps(shadowNode.getProps(), rawProps);

  shadowTreeRegistry_.visit(
      shadowNode.getSurfaceId(), [&](ShadowTree const &shadowTree) {
        shadowTree.tryCommit(
            [&](RootShadowNode::Shared const &oldRootShadowNode) {
              return std::static_pointer_cast<RootShadowNode>(
                  oldRootShadowNode->cloneTree(
                      shadowNode.getFamily(),
                      [&](ShadowNode const &oldShadowNode) {
                        return oldShadowNode.clone({
                            /* .props = */ props,
                        });
                      }));
            },
            true);
      });
}

LayoutMetrics UIManager::getRelativeLayoutMetrics(
    ShadowNode const &shadowNode,
    ShadowNode const *ancestorShadowNode,
    LayoutableShadowNode::LayoutInspectingPolicy policy) const {
  SystraceSection s("UIManager::getRelativeLayoutMetrics");

  if (!ancestorShadowNode) {
    shadowTreeRegistry_.visit(
        shadowNode.getSurfaceId(), [&](ShadowTree const &shadowTree) {
          shadowTree.tryCommit(
              [&](RootShadowNode::Shared const &oldRootShadowNode) {
                ancestorShadowNode = oldRootShadowNode.get();
                return nullptr;
              },
              true);
        });
  }

  auto layoutableShadowNode =
      traitCast<LayoutableShadowNode const *>(&shadowNode);
  auto layoutableAncestorShadowNode =
      traitCast<LayoutableShadowNode const *>(ancestorShadowNode);

  if (!layoutableShadowNode || !layoutableAncestorShadowNode) {
    return EmptyLayoutMetrics;
  }

  return layoutableShadowNode->getRelativeLayoutMetrics(
      *layoutableAncestorShadowNode, policy);
}

void UIManager::updateState(StateUpdate const &stateUpdate) const {
  auto &callback = stateUpdate.callback;
  auto &family = stateUpdate.family;
  auto &componentDescriptor = family->getComponentDescriptor();

  shadowTreeRegistry_.visit(
      family->getSurfaceId(), [&](ShadowTree const &shadowTree) {
        shadowTree.tryCommit([&](RootShadowNode::Shared const
                                     &oldRootShadowNode) {
          return std::static_pointer_cast<
              RootShadowNode>(oldRootShadowNode->cloneTree(
              *family, [&](ShadowNode const &oldShadowNode) {
                auto newData =
                    callback(oldShadowNode.getState()->getDataPointer());
                auto newState =
                    componentDescriptor.createState(*family, newData);

                return oldShadowNode.clone({
                    /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                    /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
                    /* .state = */ newState,
                });
              }));
        });
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

} // namespace react
} // namespace facebook
