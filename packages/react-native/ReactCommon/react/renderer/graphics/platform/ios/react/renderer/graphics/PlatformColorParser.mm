/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "PlatformColorParser.h"

#import <react/renderer/core/RawValue.h>
#import <react/renderer/graphics/HostPlatformColor.h>
#import <react/renderer/graphics/RCTPlatformColorUtils.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <string>
#import <unordered_map>

using namespace facebook::react;

NS_ASSUME_NONNULL_BEGIN

namespace facebook::react {

inline facebook::react::SharedColor RCTPlatformColorComponentsFromDynamicItems(
    const facebook::react::ContextContainer &contextContainer,
    int32_t surfaceId,
    std::unordered_map<std::string, facebook::react::RawValue> &dynamicItems)
{
  SharedColor lightSharedColor{};
  SharedColor darkSharedColor{};
  SharedColor highContrastLightSharedColor{};
  SharedColor highContrastDarkSharedColor{};
  if (dynamicItems.count("light")) {
    fromRawValue(contextContainer, surfaceId, dynamicItems.at("light"), lightSharedColor);
  }
  if (dynamicItems.count("dark")) {
    fromRawValue(contextContainer, surfaceId, dynamicItems.at("dark"), darkSharedColor);
  }
  if (dynamicItems.count("highContrastLight")) {
    fromRawValue(contextContainer, surfaceId, dynamicItems.at("highContrastLight"), highContrastLightSharedColor);
  }
  if (dynamicItems.count("highContrastDark")) {
    fromRawValue(contextContainer, surfaceId, dynamicItems.at("highContrastDark"), highContrastDarkSharedColor);
  }

  Color color = Color(DynamicColor{
      (*lightSharedColor).getColor(),
      (*darkSharedColor).getColor(),
      (*highContrastLightSharedColor).getColor(),
      (*highContrastDarkSharedColor).getColor()});
  return SharedColor(color);
}

SharedColor parsePlatformColor(const ContextContainer &contextContainer, int32_t surfaceId, const RawValue &value)
{
  if (value.hasType<std::unordered_map<std::string, RawValue>>()) {
    auto items = (std::unordered_map<std::string, RawValue>)value;
    if (items.find("semantic") != items.end() && items.at("semantic").hasType<std::vector<std::string>>()) {
      auto semanticItems = (std::vector<std::string>)items.at("semantic");
      return SharedColor(Color::createSemanticColor(semanticItems));
    } else if (
        items.find("dynamic") != items.end() &&
        items.at("dynamic").hasType<std::unordered_map<std::string, RawValue>>()) {
      auto dynamicItems = (std::unordered_map<std::string, RawValue>)items.at("dynamic");
      return RCTPlatformColorComponentsFromDynamicItems(contextContainer, surfaceId, dynamicItems);
    }
  }

  return clearColor();
}

} // namespace facebook::react

NS_ASSUME_NONNULL_END
