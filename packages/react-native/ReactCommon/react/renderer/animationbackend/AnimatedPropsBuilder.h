/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <react/renderer/components/view/BaseViewProps.h>
#include "AnimatedProps.h"

namespace facebook::react {

struct AnimatedPropsBuilder {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  std::unique_ptr<RawProps> rawProps;

  void setOpacity(Float value)
  {
    props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, value));
  }
  void setWidth(yoga::Style::SizeLength value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::SizeLength>>(WIDTH, value));
  }
  void setHeight(yoga::Style::SizeLength value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::SizeLength>>(HEIGHT, value));
  }
  void setBorderRadii(CascadedBorderRadii &value)
  {
    props.push_back(std::make_unique<AnimatedProp<CascadedBorderRadii>>(BORDER_RADII, value));
  }
  void setTransform(Transform &t)
  {
    props.push_back(std::make_unique<AnimatedProp<Transform>>(TRANSFORM, std::move(t)));
  }
  void storeDynamic(folly::dynamic &d)
  {
    rawProps = std::make_unique<RawProps>(std::move(d));
  }
  void storeJSI(jsi::Runtime &runtime, jsi::Value &value)
  {
    rawProps = std::make_unique<RawProps>(runtime, value);
  }
  AnimatedProps get()
  {
    return AnimatedProps{std::move(props), std::move(rawProps)};
  }
};

} // namespace facebook::react
