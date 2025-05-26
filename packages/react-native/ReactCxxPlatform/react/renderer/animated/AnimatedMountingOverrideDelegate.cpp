/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimatedMountingOverrideDelegate.h"

#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

namespace facebook::react {

AnimatedMountingOverrideDelegate::AnimatedMountingOverrideDelegate(
    std::function<folly::dynamic(Tag)> getAnimatedManagedProps,
    std::weak_ptr<UIManagerBinding> uiManagerBinding)
    : MountingOverrideDelegate(),
      getAnimatedManagedProps_(std::move(getAnimatedManagedProps)),
      uiManagerBinding_(std::move(uiManagerBinding)){};

bool AnimatedMountingOverrideDelegate::shouldOverridePullTransaction() const {
  return getAnimatedManagedProps_ != nullptr;
}

std::optional<MountingTransaction>
AnimatedMountingOverrideDelegate::pullTransaction(
    SurfaceId surfaceId,
    MountingTransaction::Number transactionNumber,
    const TransactionTelemetry& telemetry,
    ShadowViewMutationList mutations) const {
  if (!getAnimatedManagedProps_) {
    return MountingTransaction{
        surfaceId, transactionNumber, std::move(mutations), telemetry};
  }

  std::unordered_map<Tag, folly::dynamic> animatedManagedProps;
  for (const auto& mutation : mutations) {
    if (mutation.type == ShadowViewMutation::Update) {
      const auto tag = mutation.newChildShadowView.tag;
      auto props = getAnimatedManagedProps_(tag);
      if (!props.isNull()) {
        animatedManagedProps.insert({tag, std::move(props)});
      }
    }
  }

  if (animatedManagedProps.empty()) {
    return MountingTransaction{
        surfaceId, transactionNumber, std::move(mutations), telemetry};
  }

  ShadowViewMutation::List filteredMutations;
  for (const auto& mutation : mutations) {
    folly::dynamic modifiedProps = folly::dynamic::object();
    if (mutation.type == ShadowViewMutation::Update) {
      if (auto node =
              animatedManagedProps.extract(mutation.newChildShadowView.tag)) {
        modifiedProps = std::move(node.mapped());
      }
    }
    if (modifiedProps.empty()) {
      filteredMutations.emplace_back(mutation);
    } else {
      if (auto uiManagerBinding = uiManagerBinding_.lock()) {
        auto* scheduler = static_cast<Scheduler*>(
            uiManagerBinding->getUIManager().getDelegate());
        react_native_assert(scheduler);
        if (const auto* componentDescriptor =
                scheduler
                    ->findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
                        mutation.newChildShadowView.componentHandle)) {
          PropsParserContext propsParserContext{
              mutation.newChildShadowView.surfaceId,
              *scheduler->getContextContainer()};
          auto modifiedNewChildShadowView = mutation.newChildShadowView;
          modifiedNewChildShadowView.props = componentDescriptor->cloneProps(
              propsParserContext,
              mutation.newChildShadowView.props,
              RawProps(std::move(modifiedProps)));
          filteredMutations.emplace_back(ShadowViewMutation::UpdateMutation(
              mutation.oldChildShadowView,
              std::move(modifiedNewChildShadowView),
              mutation.parentTag));
        }
      }
    }
  }
  return MountingTransaction{
      surfaceId, transactionNumber, std::move(filteredMutations), telemetry};
}

} // namespace facebook::react
