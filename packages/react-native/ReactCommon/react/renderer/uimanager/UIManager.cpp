/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManager.h"

#include <cxxreact/JSExecutor.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/core/DynamicPropsUtilities.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/core/TraitCast.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/uimanager/SurfaceRegistryBinding.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>

#include <glog/logging.h>

#include <utility>

namespace {
constexpr int DOCUMENT_POSITION_DISCONNECTED = 1;
constexpr int DOCUMENT_POSITION_PRECEDING = 2;
constexpr int DOCUMENT_POSITION_FOLLOWING = 4;
constexpr int DOCUMENT_POSITION_CONTAINS = 8;
constexpr int DOCUMENT_POSITION_CONTAINED_BY = 16;
} // namespace

namespace facebook::react {

// Explicitly define destructors here, as they to exist in order to act as a
// "key function" for the ShadowNodeWrapper class -- this allow for RTTI to work
// properly across dynamic library boundaries (i.e. dynamic_cast that is used by
// isHostObject method)
ShadowNodeWrapper::~ShadowNodeWrapper() = default;
ShadowNodeListWrapper::~ShadowNodeListWrapper() = default;

static std::unique_ptr<LeakChecker> constructLeakCheckerIfNeeded(
    const RuntimeExecutor& runtimeExecutor) {
#ifdef REACT_NATIVE_DEBUG
  return std::make_unique<LeakChecker>(runtimeExecutor);
#else
  return {};
#endif
}

UIManager::UIManager(
    const RuntimeExecutor& runtimeExecutor,
    BackgroundExecutor backgroundExecutor,
    ContextContainer::Shared contextContainer)
    : runtimeExecutor_(runtimeExecutor),
      backgroundExecutor_(std::move(backgroundExecutor)),
      contextContainer_(std::move(contextContainer)),
      leakChecker_(constructLeakCheckerIfNeeded(runtimeExecutor)) {}

UIManager::~UIManager() {
  LOG(WARNING) << "UIManager::~UIManager() was called (address: " << this
               << ").";
}

ShadowNode::Shared UIManager::createNode(
    Tag tag,
    const std::string& name,
    SurfaceId surfaceId,
    const RawProps& rawProps,
    const InstanceHandle::Shared& instanceHandle) const {
  SystraceSection s("UIManager::createNode", "componentName", name);

  auto& componentDescriptor = componentDescriptorRegistry_->at(name);
  auto fallbackDescriptor =
      componentDescriptorRegistry_->getFallbackComponentDescriptor();

  PropsParserContext propsParserContext{surfaceId, *contextContainer_.get()};

  const auto fragment =
      ShadowNodeFamilyFragment{tag, surfaceId, instanceHandle};
  auto family = componentDescriptor.createFamily(fragment);
  const auto props =
      componentDescriptor.cloneProps(propsParserContext, nullptr, rawProps);
  const auto state = componentDescriptor.createInitialState(props, family);

  auto shadowNode = componentDescriptor.createShadowNode(
      ShadowNodeFragment{
          /* .props = */
          fallbackDescriptor != nullptr &&
                  fallbackDescriptor->getComponentHandle() ==
                      componentDescriptor.getComponentHandle()
              ? componentDescriptor.cloneProps(
                    propsParserContext,
                    props,
                    RawProps(folly::dynamic::object("name", name)))
              : props,
          /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
          /* .state = */ state,
      },
      family);

  if (delegate_ != nullptr) {
    delegate_->uiManagerDidCreateShadowNode(*shadowNode);
  }
  if (leakChecker_) {
    leakChecker_->uiManagerDidCreateShadowNodeFamily(family);
  }

  return shadowNode;
}

ShadowNode::Shared UIManager::cloneNode(
    const ShadowNode& shadowNode,
    const ShadowNode::SharedListOfShared& children,
    const RawProps* rawProps) const {
  SystraceSection s(
      "UIManager::cloneNode", "componentName", shadowNode.getComponentName());

  PropsParserContext propsParserContext{
      shadowNode.getFamily().getSurfaceId(), *contextContainer_.get()};

  auto& componentDescriptor = shadowNode.getComponentDescriptor();
  auto& family = shadowNode.getFamily();
  auto props = ShadowNodeFragment::propsPlaceholder();

  if (rawProps != nullptr) {
    if (family.nativeProps_DEPRECATED != nullptr) {
      // Values in `rawProps` patch (take precedence over)
      // `nativeProps_DEPRECATED`. For example, if both `nativeProps_DEPRECATED`
      // and `rawProps` contain key 'A'. Value from `rawProps` overrides what
      // was previously in `nativeProps_DEPRECATED`.
      family.nativeProps_DEPRECATED =
          std::make_unique<folly::dynamic>(mergeDynamicProps(
              *family.nativeProps_DEPRECATED, (folly::dynamic)*rawProps));

      props = componentDescriptor.cloneProps(
          propsParserContext,
          shadowNode.getProps(),
          RawProps(*family.nativeProps_DEPRECATED));
    } else {
      props = componentDescriptor.cloneProps(
          propsParserContext, shadowNode.getProps(), *rawProps);
    }
  }

  auto clonedShadowNode = componentDescriptor.cloneShadowNode(
      shadowNode,
      {
          /* .props = */ props,
          /* .children = */ children,
      });

  return clonedShadowNode;
}

void UIManager::appendChild(
    const ShadowNode::Shared& parentShadowNode,
    const ShadowNode::Shared& childShadowNode) const {
  SystraceSection s("UIManager::appendChild");

  auto& componentDescriptor = parentShadowNode->getComponentDescriptor();
  componentDescriptor.appendChild(parentShadowNode, childShadowNode);
}

void UIManager::completeSurface(
    SurfaceId surfaceId,
    const ShadowNode::UnsharedListOfShared& rootChildren,
    ShadowTree::CommitOptions commitOptions) const {
  SystraceSection s("UIManager::completeSurface", "surfaceId", surfaceId);

  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree& shadowTree) {
    shadowTree.commit(
        [&](RootShadowNode const& oldRootShadowNode) {
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

void UIManager::setIsJSResponder(
    const ShadowNode::Shared& shadowNode,
    bool isJSResponder,
    bool blockNativeResponder) const {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidSetIsJSResponder(
        shadowNode, isJSResponder, blockNativeResponder);
  }
}

void UIManager::startSurface(
    ShadowTree::Unique&& shadowTree,
    const std::string& moduleName,
    const folly::dynamic& props,
    DisplayMode displayMode) const {
  SystraceSection s("UIManager::startSurface");

  auto surfaceId = shadowTree->getSurfaceId();
  shadowTreeRegistry_.add(std::move(shadowTree));

  runtimeExecutor_([=](jsi::Runtime& runtime) {
    SystraceSection s("UIManager::startSurface::onRuntime");
    SurfaceRegistryBinding::startSurface(
        runtime, surfaceId, moduleName, props, displayMode);
  });
}

void UIManager::setSurfaceProps(
    SurfaceId surfaceId,
    const std::string& moduleName,
    const folly::dynamic& props,
    DisplayMode displayMode) const {
  SystraceSection s("UIManager::setSurfaceProps");

  runtimeExecutor_([=](jsi::Runtime& runtime) {
    SurfaceRegistryBinding::setSurfaceProps(
        runtime, surfaceId, moduleName, props, displayMode);
  });
}

ShadowTree::Unique UIManager::stopSurface(SurfaceId surfaceId) const {
  SystraceSection s("UIManager::stopSurface");

  // Stop any ongoing animations.
  stopSurfaceForAnimationDelegate(surfaceId);

  // Waiting for all concurrent commits to be finished and unregistering the
  // `ShadowTree`.
  auto shadowTree = getShadowTreeRegistry().remove(surfaceId);
  if (shadowTree) {
    // We execute JavaScript/React part of the process at the very end to
    // minimize any visible side-effects of stopping the Surface. Any possible
    // commits from the JavaScript side will not be able to reference a
    // `ShadowTree` and will fail silently.
    runtimeExecutor_([=](jsi::Runtime& runtime) {
      SurfaceRegistryBinding::stopSurface(runtime, surfaceId);
    });

    if (leakChecker_) {
      leakChecker_->stopSurface(surfaceId);
    }
  }
  return shadowTree;
}

ShadowNode::Shared UIManager::getNewestCloneOfShadowNode(
    const ShadowNode& shadowNode) const {
  auto ancestorShadowNode = ShadowNode::Shared{};
  shadowTreeRegistry_.visit(
      shadowNode.getSurfaceId(), [&](const ShadowTree& shadowTree) {
        ancestorShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
      });

  if (!ancestorShadowNode) {
    return nullptr;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(*ancestorShadowNode);

  if (ancestors.empty()) {
    return nullptr;
  }

  auto pair = ancestors.rbegin();
  return pair->first.get().getChildren().at(pair->second);
}

ShadowNode::Shared UIManager::getNewestParentOfShadowNode(
    const ShadowNode& shadowNode) const {
  auto ancestorShadowNode = ShadowNode::Shared{};
  shadowTreeRegistry_.visit(
      shadowNode.getSurfaceId(), [&](const ShadowTree& shadowTree) {
        ancestorShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
      });

  if (!ancestorShadowNode) {
    return nullptr;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(*ancestorShadowNode);

  if (ancestors.empty()) {
    return nullptr;
  }

  if (ancestors.size() == 1) {
    // The parent is the shadow root
    return ancestorShadowNode;
  }

  auto parentOfParentPair = ancestors[ancestors.size() - 2];
  return parentOfParentPair.first.get().getChildren().at(
      parentOfParentPair.second);
}

std::string UIManager::getTextContentInNewestCloneOfShadowNode(
    const ShadowNode& shadowNode) const {
  auto newestCloneOfShadowNode = getNewestCloneOfShadowNode(shadowNode);
  std::string result;
  getTextContentInShadowNode(*newestCloneOfShadowNode, result);
  return result;
}

int UIManager::compareDocumentPosition(
    const ShadowNode& shadowNode,
    const ShadowNode& otherShadowNode) const {
  // Quick check for node vs. itself
  if (&shadowNode == &otherShadowNode) {
    return 0;
  }

  if (shadowNode.getSurfaceId() != otherShadowNode.getSurfaceId()) {
    return DOCUMENT_POSITION_DISCONNECTED;
  }

  auto ancestorShadowNode = ShadowNode::Shared{};
  shadowTreeRegistry_.visit(
      shadowNode.getSurfaceId(), [&](const ShadowTree& shadowTree) {
        ancestorShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
      });
  if (!ancestorShadowNode) {
    return DOCUMENT_POSITION_DISCONNECTED;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(*ancestorShadowNode);
  if (ancestors.empty()) {
    return DOCUMENT_POSITION_DISCONNECTED;
  }

  auto otherAncestors =
      otherShadowNode.getFamily().getAncestors(*ancestorShadowNode);
  if (ancestors.empty()) {
    return DOCUMENT_POSITION_DISCONNECTED;
  }

  // Consume all common ancestors
  size_t i = 0;
  while (i < ancestors.size() && i < otherAncestors.size() &&
         ancestors[i].second == otherAncestors[i].second) {
    i++;
  }

  if (i == ancestors.size()) {
    return (DOCUMENT_POSITION_CONTAINED_BY | DOCUMENT_POSITION_FOLLOWING);
  }

  if (i == otherAncestors.size()) {
    return (DOCUMENT_POSITION_CONTAINS | DOCUMENT_POSITION_PRECEDING);
  }

  if (ancestors[i].second > otherAncestors[i].second) {
    return DOCUMENT_POSITION_PRECEDING;
  }

  return DOCUMENT_POSITION_FOLLOWING;
}

ShadowNode::Shared UIManager::findNodeAtPoint(
    const ShadowNode::Shared& node,
    Point point) const {
  return LayoutableShadowNode::findNodeAtPoint(
      getNewestCloneOfShadowNode(*node), point);
}

LayoutMetrics UIManager::getRelativeLayoutMetrics(
    const ShadowNode& shadowNode,
    const ShadowNode* ancestorShadowNode,
    LayoutableShadowNode::LayoutInspectingPolicy policy) const {
  SystraceSection s("UIManager::getRelativeLayoutMetrics");

  // We might store here an owning pointer to `ancestorShadowNode` to ensure
  // that the node is not deallocated during method execution lifetime.
  auto owningAncestorShadowNode = ShadowNode::Shared{};

  if (ancestorShadowNode == nullptr) {
    shadowTreeRegistry_.visit(
        shadowNode.getSurfaceId(), [&](const ShadowTree& shadowTree) {
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
      traitCast<const LayoutableShadowNode*>(ancestorShadowNode);

  if (layoutableAncestorShadowNode == nullptr) {
    return EmptyLayoutMetrics;
  }

  return LayoutableShadowNode::computeRelativeLayoutMetrics(
      shadowNode.getFamily(), *layoutableAncestorShadowNode, policy);
}

void UIManager::updateState(const StateUpdate& stateUpdate) const {
  SystraceSection s(
      "UIManager::updateState",
      "componentName",
      stateUpdate.family->getComponentName());
  auto& callback = stateUpdate.callback;
  auto& family = stateUpdate.family;
  auto& componentDescriptor = family->getComponentDescriptor();

  shadowTreeRegistry_.visit(
      family->getSurfaceId(), [&](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](RootShadowNode const& oldRootShadowNode) {
              auto isValid = true;

              auto rootNode = oldRootShadowNode.cloneTree(
                  *family, [&](ShadowNode const& oldShadowNode) {
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

              return isValid
                  ? std::static_pointer_cast<RootShadowNode>(rootNode)
                  : nullptr;
            },
            {/* default commit options */});
      });
}

void UIManager::dispatchCommand(
    const ShadowNode::Shared& shadowNode,
    const std::string& commandName,
    const folly::dynamic& args) const {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidDispatchCommand(shadowNode, commandName, args);
  }
}

void UIManager::setNativeProps_DEPRECATED(
    const ShadowNode::Shared& shadowNode,
    const RawProps& rawProps) const {
  auto& family = shadowNode->getFamily();
  if (family.nativeProps_DEPRECATED) {
    // Values in `rawProps` patch (take precedence over)
    // `nativeProps_DEPRECATED`. For example, if both `nativeProps_DEPRECATED`
    // and `rawProps` contain key 'A'. Value from `rawProps` overrides what was
    // previously in `nativeProps_DEPRECATED`.
    family.nativeProps_DEPRECATED =
        std::make_unique<folly::dynamic>(mergeDynamicProps(
            *family.nativeProps_DEPRECATED, (folly::dynamic)rawProps));
  } else {
    family.nativeProps_DEPRECATED =
        std::make_unique<folly::dynamic>((folly::dynamic)rawProps);
  }

  shadowTreeRegistry_.visit(
      family.getSurfaceId(), [&](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](RootShadowNode const& oldRootShadowNode) {
              auto rootNode = oldRootShadowNode.cloneTree(
                  family, [&](ShadowNode const& oldShadowNode) {
                    auto& componentDescriptor =
                        componentDescriptorRegistry_->at(
                            shadowNode->getComponentHandle());
                    PropsParserContext propsParserContext{
                        family.getSurfaceId(), *contextContainer_.get()};
                    auto props = componentDescriptor.cloneProps(
                        propsParserContext,
                        getNewestCloneOfShadowNode(*shadowNode)->getProps(),
                        rawProps);

                    return oldShadowNode.clone({/* .props = */ props});
                  });

              return std::static_pointer_cast<RootShadowNode>(rootNode);
            },
            {/* default commit options */});
      });
}

void UIManager::sendAccessibilityEvent(
    const ShadowNode::Shared& shadowNode,
    const std::string& eventType) {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidSendAccessibilityEvent(shadowNode, eventType);
  }
}

void UIManager::configureNextLayoutAnimation(
    jsi::Runtime& runtime,
    const RawValue& config,
    const jsi::Value& successCallback,
    const jsi::Value& failureCallback) const {
  if (animationDelegate_ != nullptr) {
    animationDelegate_->uiManagerDidConfigureNextLayoutAnimation(
        runtime,
        config,
        std::move(successCallback),
        std::move(failureCallback));
  }
}

static ShadowNode::Shared findShadowNodeByTagRecursively(
    ShadowNode::Shared parentShadowNode,
    Tag tag) {
  if (parentShadowNode->getTag() == tag) {
    return parentShadowNode;
  }

  for (const ShadowNode::Shared& shadowNode : parentShadowNode->getChildren()) {
    auto result = findShadowNodeByTagRecursively(shadowNode, tag);
    if (result) {
      return result;
    }
  }

  return nullptr;
}

ShadowNode::Shared UIManager::findShadowNodeByTag_DEPRECATED(Tag tag) const {
  auto shadowNode = ShadowNode::Shared{};

  shadowTreeRegistry_.enumerate([&](const ShadowTree& shadowTree, bool& stop) {
    RootShadowNode const* rootShadowNode;
    // The public interface of `ShadowTree` discourages accessing a stored
    // pointer to a root node because of the possible data race.
    // To work around this, we ask for a commit and immediately cancel it
    // returning `nullptr` instead of a new shadow tree.
    // We don't want to add a way to access a stored pointer to a root node
    // because this `findShadowNodeByTag` is deprecated. It is only added
    // to make migration to the new architecture easier.
    shadowTree.tryCommit(
        [&](RootShadowNode const& oldRootShadowNode) {
          rootShadowNode = &oldRootShadowNode;
          return nullptr;
        },
        {/* default commit options */});

    if (rootShadowNode != nullptr) {
      auto const& children = rootShadowNode->getChildren();
      if (!children.empty()) {
        auto const& child = children.front();
        shadowNode = findShadowNodeByTagRecursively(child, tag);
        if (shadowNode) {
          stop = true;
        }
      }
    }
  });

  return shadowNode;
}

void UIManager::setComponentDescriptorRegistry(
    const SharedComponentDescriptorRegistry& componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

void UIManager::setDelegate(UIManagerDelegate* delegate) {
  delegate_ = delegate;
}

UIManagerDelegate* UIManager::getDelegate() {
  return delegate_;
}

void UIManager::visitBinding(
    const std::function<void(UIManagerBinding const& uiManagerBinding)>&
        callback,
    jsi::Runtime& runtime) const {
  auto uiManagerBinding = UIManagerBinding::getBinding(runtime);
  if (uiManagerBinding) {
    callback(*uiManagerBinding);
  }
}

const ShadowTreeRegistry& UIManager::getShadowTreeRegistry() const {
  return shadowTreeRegistry_;
}

void UIManager::registerCommitHook(UIManagerCommitHook& commitHook) {
  std::unique_lock lock(commitHookMutex_);
  react_native_assert(
      std::find(commitHooks_.begin(), commitHooks_.end(), &commitHook) ==
      commitHooks_.end());
  commitHook.commitHookWasRegistered(*this);
  commitHooks_.push_back(&commitHook);
}

void UIManager::unregisterCommitHook(UIManagerCommitHook& commitHook) {
  std::unique_lock lock(commitHookMutex_);
  auto iterator =
      std::find(commitHooks_.begin(), commitHooks_.end(), &commitHook);
  react_native_assert(iterator != commitHooks_.end());
  commitHooks_.erase(iterator);
  commitHook.commitHookWasUnregistered(*this);
}

void UIManager::registerMountHook(UIManagerMountHook& mountHook) {
  std::unique_lock lock(mountHookMutex_);
  react_native_assert(
      std::find(mountHooks_.begin(), mountHooks_.end(), &mountHook) ==
      mountHooks_.end());
  mountHooks_.push_back(&mountHook);
}

void UIManager::unregisterMountHook(UIManagerMountHook& mountHook) {
  std::unique_lock lock(mountHookMutex_);
  auto iterator = std::find(mountHooks_.begin(), mountHooks_.end(), &mountHook);
  react_native_assert(iterator != mountHooks_.end());
  mountHooks_.erase(iterator);
}

#pragma mark - ShadowTreeDelegate

RootShadowNode::Unshared UIManager::shadowTreeWillCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& oldRootShadowNode,
    const RootShadowNode::Unshared& newRootShadowNode) const {
  SystraceSection s("UIManager::shadowTreeWillCommit");

  std::shared_lock lock(commitHookMutex_);

  auto resultRootShadowNode = newRootShadowNode;
  for (auto* commitHook : commitHooks_) {
    resultRootShadowNode = commitHook->shadowTreeWillCommit(
        shadowTree, oldRootShadowNode, resultRootShadowNode);
  }

  return resultRootShadowNode;
}

void UIManager::shadowTreeDidFinishTransaction(
    MountingCoordinator::Shared mountingCoordinator,
    bool mountSynchronously) const {
  SystraceSection s("UIManager::shadowTreeDidFinishTransaction");

  if (delegate_ != nullptr) {
    delegate_->uiManagerDidFinishTransaction(
        std::move(mountingCoordinator), mountSynchronously);
  }
}

void UIManager::reportMount(SurfaceId surfaceId) const {
  SystraceSection s("UIManager::reportMount");

  auto time = JSExecutor::performanceNow();

  auto rootShadowNode = RootShadowNode::Shared{};
  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree& shadowTree) {
    rootShadowNode =
        shadowTree.getMountingCoordinator()->getBaseRevision().rootShadowNode;
  });

  if (!rootShadowNode) {
    return;
  }

  {
    std::shared_lock lock(mountHookMutex_);

    for (auto* mountHook : mountHooks_) {
      mountHook->shadowTreeDidMount(rootShadowNode, time);
    }
  }
}

#pragma mark - UIManagerAnimationDelegate

void UIManager::setAnimationDelegate(UIManagerAnimationDelegate* delegate) {
  animationDelegate_ = delegate;
}

void UIManager::stopSurfaceForAnimationDelegate(SurfaceId surfaceId) const {
  if (animationDelegate_ != nullptr) {
    animationDelegate_->stopSurface(surfaceId);
  }
}

void UIManager::animationTick() const {
  if (animationDelegate_ != nullptr &&
      animationDelegate_->shouldAnimateFrame()) {
    shadowTreeRegistry_.enumerate([](const ShadowTree& shadowTree, bool&) {
      shadowTree.notifyDelegatesOfUpdates();
    });
  }
}

} // namespace facebook::react
