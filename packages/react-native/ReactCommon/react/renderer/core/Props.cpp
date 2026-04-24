/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Props.h"

#include <react/renderer/core/propsConversions.h>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include "DynamicPropsUtilities.h"

namespace facebook::react {

Props::Props(
    const PropsParserContext& context,
    const Props& sourceProps,
    const RawProps& rawProps,
    const std::function<bool(const std::string&)>& filterObjectKeys) {
  initialize(context, sourceProps, rawProps, filterObjectKeys);
}

void Props::initialize(
    const PropsParserContext& context,
    const Props& sourceProps,
    const RawProps& rawProps,
    [[maybe_unused]] const std::function<bool(const std::string&)>&
        filterObjectKeys) {
  nativeId = ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
      ? sourceProps.nativeId
      : convertRawProp(context, rawProps, "nativeID", sourceProps.nativeId, {});

  if (!ReactNativeFeatureFlags::enableCppPropsIteratorSetter()) {
    if (ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
      // id -> nativeId
      auto* idValue = rawProps.at("id", nullptr, nullptr);
      if (idValue != nullptr) {
        if (idValue->hasValue()) {
          fromRawValue(context, *idValue, nativeId);
        } else {
          nativeId = {};
        }
      }
    }
  }
#ifdef RN_SERIALIZABLE_STATE
  if (!ReactNativeFeatureFlags::enableExclusivePropsUpdateAndroid()) {
    initializeDynamicProps(sourceProps, rawProps, filterObjectKeys);
  }
#endif
}

void Props::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* /*propName*/,
    const RawValue& value) {
  switch (hash) {
    case CONSTEXPR_RAW_PROPS_KEY_HASH("nativeID"):
      fromRawValue(context, value, nativeId, {});
      return;
    case CONSTEXPR_RAW_PROPS_KEY_HASH("id"):
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      fromRawValue(context, value, nativeId, {});
      return;
  }
}

#ifdef RN_SERIALIZABLE_STATE
void Props::initializeDynamicProps(
    const Props& sourceProps,
    const RawProps& rawProps,
    const std::function<bool(const std::string&)>& filterObjectKeys) {
  // Always merge the previous rawProps with the incoming patch so that
  // `rawProps` reflects the full accumulated state for this shadow node.
  // Without this, a shadow node reconstructed from a subsequent JS update
  // only stores the latest prop diff in its rawProps. If the same shadow
  // node later un-flattens and the Differentiator emits a CREATE mutation
  // for it, FabricMountingManager::getProps ships only that partial diff
  // to Java — causing props like borderRadius to never reach the newly
  // created native view.
  auto& oldRawProps = sourceProps.rawProps;
  auto newRawProps = rawProps.toDynamic(filterObjectKeys);
  auto mergedRawProps =
      mergeDynamicProps(oldRawProps, newRawProps, NullValueStrategy::Override);
  this->rawProps = mergedRawProps;
}

ComponentName Props::getDiffPropsImplementationTarget() const {
  return "";
}
#endif

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList Props::getDebugProps() const {
  return {debugStringConvertibleItem("nativeID", nativeId)};
}
#endif

} // namespace facebook::react
