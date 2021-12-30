/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <butter/optional.h>
#include <react/renderer/animations/primitives.h>

#include <glog/logging.h>

namespace facebook {
namespace react {

static inline butter::optional<AnimationType> parseAnimationType(
    std::string param) {
  if (param == "spring") {
    return AnimationType::Spring;
  }
  if (param == "linear") {
    return AnimationType::Linear;
  }
  if (param == "easeInEaseOut") {
    return AnimationType::EaseInEaseOut;
  }
  if (param == "easeIn") {
    return AnimationType::EaseIn;
  }
  if (param == "easeOut") {
    return AnimationType::EaseOut;
  }
  if (param == "keyboard") {
    return AnimationType::Keyboard;
  }

  LOG(ERROR) << "Error parsing animation type: " << param;
  return {};
}

static inline butter::optional<AnimationProperty> parseAnimationProperty(
    std::string param) {
  if (param == "opacity") {
    return AnimationProperty::Opacity;
  }
  if (param == "scaleX") {
    return AnimationProperty::ScaleX;
  }
  if (param == "scaleY") {
    return AnimationProperty::ScaleY;
  }
  if (param == "scaleXY") {
    return AnimationProperty::ScaleXY;
  }

  LOG(ERROR) << "Error parsing animation property: " << param;
  return {};
}

static inline butter::optional<AnimationConfig> parseAnimationConfig(
    folly::dynamic const &config,
    double defaultDuration,
    bool parsePropertyType) {
  if (config.empty() || !config.isObject()) {
    return AnimationConfig{
        AnimationType::Linear,
        AnimationProperty::NotApplicable,
        defaultDuration,
        0,
        0,
        0};
  }

  auto const typeIt = config.find("type");
  if (typeIt == config.items().end()) {
    LOG(ERROR) << "Error parsing animation config: could not find field `type`";
    return {};
  }
  auto const animationTypeParam = typeIt->second;
  if (animationTypeParam.empty() || !animationTypeParam.isString()) {
    LOG(ERROR)
        << "Error parsing animation config: could not unwrap field `type`";
    return {};
  }
  const auto animationType = parseAnimationType(animationTypeParam.asString());
  if (!animationType) {
    LOG(ERROR)
        << "Error parsing animation config: could not parse field `type`";
    return {};
  }

  AnimationProperty animationProperty = AnimationProperty::NotApplicable;
  if (parsePropertyType) {
    auto const propertyIt = config.find("property");
    if (propertyIt == config.items().end()) {
      LOG(ERROR)
          << "Error parsing animation config: could not find field `property`";
      return {};
    }
    auto const animationPropertyParam = propertyIt->second;
    if (animationPropertyParam.empty() || !animationPropertyParam.isString()) {
      LOG(ERROR)
          << "Error parsing animation config: could not unwrap field `property`";
      return {};
    }
    const auto animationPropertyParsed =
        parseAnimationProperty(animationPropertyParam.asString());
    if (!animationPropertyParsed) {
      LOG(ERROR)
          << "Error parsing animation config: could not parse field `property`";
      return {};
    }
    animationProperty = *animationPropertyParsed;
  }

  double duration = defaultDuration;
  double delay = 0;
  Float springDamping = 0.5;
  Float initialVelocity = 0;

  auto const durationIt = config.find("duration");
  if (durationIt != config.items().end()) {
    if (durationIt->second.isDouble()) {
      duration = durationIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `duration` must be a number";
      return {};
    }
  }

  auto const delayIt = config.find("delay");
  if (delayIt != config.items().end()) {
    if (delayIt->second.isDouble()) {
      delay = delayIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `delay` must be a number";
      return {};
    }
  }

  auto const springDampingIt = config.find("springDamping");
  if (springDampingIt != config.items().end() &&
      springDampingIt->second.isDouble()) {
    if (springDampingIt->second.isDouble()) {
      springDamping = (Float)springDampingIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `springDamping` must be a number";
      return {};
    }
  }

  auto const initialVelocityIt = config.find("initialVelocity");
  if (initialVelocityIt != config.items().end()) {
    if (initialVelocityIt->second.isDouble()) {
      initialVelocity = (Float)initialVelocityIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `initialVelocity` must be a number";
      return {};
    }
  }

  return butter::optional<AnimationConfig>(AnimationConfig{
      *animationType,
      animationProperty,
      duration,
      delay,
      springDamping,
      initialVelocity});
}

// Parse animation config from JS
static inline butter::optional<LayoutAnimationConfig>
parseLayoutAnimationConfig(folly::dynamic const &config) {
  if (config.empty() || !config.isObject()) {
    return {};
  }

  const auto durationIt = config.find("duration");
  if (durationIt == config.items().end() || !durationIt->second.isDouble()) {
    return {};
  }
  const double duration = durationIt->second.asDouble();

  const auto createConfigIt = config.find("create");
  const auto createConfig = createConfigIt == config.items().end()
      ? butter::optional<AnimationConfig>(AnimationConfig{})
      : parseAnimationConfig(createConfigIt->second, duration, true);

  const auto updateConfigIt = config.find("update");
  const auto updateConfig = updateConfigIt == config.items().end()
      ? butter::optional<AnimationConfig>(AnimationConfig{})
      : parseAnimationConfig(updateConfigIt->second, duration, false);

  const auto deleteConfigIt = config.find("delete");
  const auto deleteConfig = deleteConfigIt == config.items().end()
      ? butter::optional<AnimationConfig>(AnimationConfig{})
      : parseAnimationConfig(deleteConfigIt->second, duration, true);

  if (!createConfig || !updateConfig || !deleteConfig) {
    return {};
  }

  return LayoutAnimationConfig{
      duration, *createConfig, *updateConfig, *deleteConfig};
}

} // namespace react
} // namespace facebook
