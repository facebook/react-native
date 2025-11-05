/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimatedMountingOverrideDelegate.h"
#include "../NativeAnimatedNodesManager.h"

#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/DynamicPropsUtilities.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

namespace facebook::react {

AnimatedMountingOverrideDelegate::AnimatedMountingOverrideDelegate(
    NativeAnimatedNodesManager& animatedManager,
    const Scheduler& scheduler)
    : MountingOverrideDelegate(),
      animatedManager_(&animatedManager),
      scheduler_(&scheduler) {};

bool AnimatedMountingOverrideDelegate::shouldOverridePullTransaction() const {
  if (animatedManager_ != nullptr) {
    return animatedManager_->hasManagedProps();
  }
  return false;
}

std::optional<MountingTransaction>
AnimatedMountingOverrideDelegate::pullTransaction(
    SurfaceId surfaceId,
    MountingTransaction::Number transactionNumber,
    const TransactionTelemetry& telemetry,
    ShadowViewMutationList mutations) const {
  std::unordered_map<Tag, folly::dynamic> animatedManagedProps;
  for (const auto& mutation : mutations) {
    if (mutation.type == ShadowViewMutation::Update) {
      const auto tag = mutation.newChildShadowView.tag;
      auto props = animatedManager_->managedProps(tag);
      if (!props.isNull()) {
        animatedManagedProps.insert({tag, std::move(props)});
      }
    } else if (mutation.type == ShadowViewMutation::Delete) {
      animatedManager_->onManagedPropsRemoved(mutation.oldChildShadowView.tag);
    }
  }

  if (animatedManagedProps.empty()) {
    return MountingTransaction{
        surfaceId, transactionNumber, std::move(mutations), telemetry};
  }

  ShadowViewMutation::List filteredMutations;
  filteredMutations.reserve(mutations.size());
  for (const auto& mutation : mutations) {
    folly::dynamic modifiedProps = folly::dynamic::object();
    if (mutation.type == ShadowViewMutation::Update) {
      if (auto node =
              animatedManagedProps.extract(mutation.newChildShadowView.tag)) {
        modifiedProps = std::move(node.mapped());
      }
    }
    if (modifiedProps.empty()) {
      filteredMutations.push_back(mutation);
    } else {
      if (const auto* componentDescriptor =
              scheduler_
                  ->findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
                      mutation.newChildShadowView.componentHandle)) {
        PropsParserContext propsParserContext{
            mutation.newChildShadowView.surfaceId,
            *scheduler_->getContextContainer()};
        auto modifiedNewChildShadowView = mutation.newChildShadowView;
        modifiedNewChildShadowView.props = componentDescriptor->cloneProps(
            propsParserContext,
            mutation.newChildShadowView.props,
            RawProps(modifiedProps));
#ifdef RN_SERIALIZABLE_STATE
        // Until Props 2.0 is shipped, android uses rawProps.
        // RawProps must be kept synced with C++ Animated as well
        // as props object.
        auto& castedProps =
            const_cast<Props&>(*modifiedNewChildShadowView.props);
        castedProps.rawProps = mergeDynamicProps(
            mutation.newChildShadowView.props->rawProps,
            modifiedProps,
            NullValueStrategy::Override);
#endif

        filteredMutations.emplace_back(
            ShadowViewMutation::UpdateMutation(
                mutation.oldChildShadowView,
                std::move(modifiedNewChildShadowView),
                mutation.parentTag));
      }
    }
  }
  return MountingTransaction{
      surfaceId, transactionNumber, std::move(filteredMutations), telemetry};
}

} // namespace facebook::react
