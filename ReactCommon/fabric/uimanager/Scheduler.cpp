// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Scheduler.h"

#include <jsi/jsi.h>

#include <react/core/LayoutContext.h>
#include <react/debug/SystraceSection.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>
#include <react/uimanager/TimeUtils.h>
#include <react/uimanager/UIManager.h>
#include <react/uimanager/UIManagerBinding.h>
#include <react/uimanager/UITemplateProcessor.h>

namespace facebook {
namespace react {

Scheduler::Scheduler(
    const SharedContextContainer &contextContainer,
    ComponentRegistryFactory buildRegistryFunction) {
  const auto asynchronousEventBeatFactory =
      contextContainer->getInstance<EventBeatFactory>("asynchronous");
  const auto synchronousEventBeatFactory =
      contextContainer->getInstance<EventBeatFactory>("synchronous");

  runtimeExecutor_ =
      contextContainer->getInstance<RuntimeExecutor>("runtime-executor");

  reactNativeConfig_ =
      contextContainer->getInstance<std::shared_ptr<const ReactNativeConfig>>(
          "ReactNativeConfig");

  auto uiManager = std::make_unique<UIManager>();
  auto &uiManagerRef = *uiManager;
  uiManagerBinding_ = std::make_shared<UIManagerBinding>(std::move(uiManager));

  auto eventPipe = [uiManagerBinding = uiManagerBinding_.get()](
                       jsi::Runtime &runtime,
                       const EventTarget *eventTarget,
                       const std::string &type,
                       const ValueFactory &payloadFactory) {
    uiManagerBinding->dispatchEvent(runtime, eventTarget, type, payloadFactory);
  };

  auto eventDispatcher = std::make_shared<EventDispatcher>(
      eventPipe, synchronousEventBeatFactory, asynchronousEventBeatFactory);

  componentDescriptorRegistry_ =
      buildRegistryFunction(eventDispatcher, contextContainer);

  uiManagerRef.setDelegate(this);
  uiManagerRef.setShadowTreeRegistry(&shadowTreeRegistry_);
  uiManagerRef.setComponentDescriptorRegistry(componentDescriptorRegistry_);

  runtimeExecutor_([=](jsi::Runtime &runtime) {
    UIManagerBinding::install(runtime, uiManagerBinding_);
  });
}

Scheduler::~Scheduler() {
  uiManagerBinding_->invalidate();
}

void Scheduler::startSurface(
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initialProps,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  SystraceSection s("Scheduler::startSurface");

  auto shadowTree =
      std::make_unique<ShadowTree>(surfaceId, layoutConstraints, layoutContext);
  shadowTree->setDelegate(this);

  shadowTreeRegistry_.add(std::move(shadowTree));

#ifndef ANDROID
  runtimeExecutor_([=](jsi::Runtime &runtime) {
    uiManagerBinding_->startSurface(
        runtime, surfaceId, moduleName, initialProps);
  });
#endif
}

void Scheduler::renderTemplateToSurface(
    SurfaceId surfaceId,
    const std::string &uiTemplate) {
  SystraceSection s("Scheduler::renderTemplateToSurface");
  long commitStartTime = getTime();

  try {
    if (uiTemplate.size() == 0) {
      return;
    }
    NativeModuleRegistry nMR;
    auto tree = UITemplateProcessor::buildShadowTree(
        uiTemplate,
        surfaceId,
        folly::dynamic::object(),
        *componentDescriptorRegistry_,
        nMR,
        reactNativeConfig_);

    shadowTreeRegistry_.visit(surfaceId, [=](const ShadowTree &shadowTree) {
      return shadowTree.tryCommit(
          [&](const SharedRootShadowNode &oldRootShadowNode) {
            return std::make_shared<RootShadowNode>(
                *oldRootShadowNode,
                ShadowNodeFragment{.children =
                                       std::make_shared<SharedShadowNodeList>(
                                           SharedShadowNodeList{tree})});
          },
          commitStartTime);
    });
  } catch (const std::exception &e) {
    LOG(ERROR) << "    >>>> EXCEPTION <<<  rendering uiTemplate in "
               << "Scheduler::renderTemplateToSurface: " << e.what();
  }
}

void Scheduler::stopSurface(SurfaceId surfaceId) const {
  SystraceSection s("Scheduler::stopSurface");

  long commitStartTime = getTime();
  shadowTreeRegistry_.visit(
      surfaceId, [commitStartTime](const ShadowTree &shadowTree) {
        // As part of stopping the Surface, we have to commit an empty tree.
        return shadowTree.tryCommit(
            [&](const SharedRootShadowNode &oldRootShadowNode) {
              return std::make_shared<RootShadowNode>(
                  *oldRootShadowNode,
                  ShadowNodeFragment{
                      .children =
                          ShadowNode::emptySharedShadowNodeSharedList()});
            },
            commitStartTime);
      });

  auto shadowTree = shadowTreeRegistry_.remove(surfaceId);
  shadowTree->setDelegate(nullptr);

#ifndef ANDROID
  runtimeExecutor_([=](jsi::Runtime &runtime) {
    uiManagerBinding_->stopSurface(runtime, surfaceId);
  });
#endif
}

Size Scheduler::measureSurface(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  SystraceSection s("Scheduler::measureSurface");

  long commitStartTime = getTime();

  Size size;
  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree &shadowTree) {
    shadowTree.tryCommit(
        [&](const SharedRootShadowNode &oldRootShadowNode) {
          auto rootShadowNode =
              oldRootShadowNode->clone(layoutConstraints, layoutContext);
          rootShadowNode->layout();
          size = rootShadowNode->getLayoutMetrics().frame.size;
          return nullptr;
        },
        commitStartTime);
  });
  return size;
}

void Scheduler::constraintSurfaceLayout(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  SystraceSection s("Scheduler::constraintSurfaceLayout");

  long commitStartTime = getTime();

  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree &shadowTree) {
    shadowTree.commit(
        [&](const SharedRootShadowNode &oldRootShadowNode) {
          return oldRootShadowNode->clone(layoutConstraints, layoutContext);
        },
        commitStartTime);
  });
}

#pragma mark - Delegate

void Scheduler::setDelegate(SchedulerDelegate *delegate) {
  delegate_ = delegate;
}

SchedulerDelegate *Scheduler::getDelegate() const {
  return delegate_;
}

#pragma mark - ShadowTreeDelegate

void Scheduler::shadowTreeDidCommit(
    const ShadowTree &shadowTree,
    const ShadowViewMutationList &mutations,
    long commitStartTime,
    long layoutTime) const {
  SystraceSection s("Scheduler::shadowTreeDidCommit");

  if (delegate_) {
    delegate_->schedulerDidFinishTransaction(
        shadowTree.getSurfaceId(), mutations, commitStartTime, layoutTime);
  }
}

#pragma mark - UIManagerDelegate

void Scheduler::uiManagerDidFinishTransaction(
    SurfaceId surfaceId,
    const SharedShadowNodeUnsharedList &rootChildNodes,
    long startCommitTime) {
  SystraceSection s("Scheduler::uiManagerDidFinishTransaction");

  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree &shadowTree) {
    shadowTree.commit(
        [&](const SharedRootShadowNode &oldRootShadowNode) {
          return std::make_shared<RootShadowNode>(
              *oldRootShadowNode,
              ShadowNodeFragment{.children = rootChildNodes});
        },
        startCommitTime);
  });
}

void Scheduler::uiManagerDidCreateShadowNode(
    const SharedShadowNode &shadowNode) {
  SystraceSection s("Scheduler::uiManagerDidCreateShadowNode");

  if (delegate_) {
    auto layoutableShadowNode =
        dynamic_cast<const LayoutableShadowNode *>(shadowNode.get());
    auto isLayoutable = layoutableShadowNode != nullptr;

    delegate_->schedulerDidRequestPreliminaryViewAllocation(
        shadowNode->getRootTag(),
        shadowNode->getComponentName(),
        isLayoutable,
        shadowNode->getComponentHandle());
  }
}

} // namespace react
} // namespace facebook
