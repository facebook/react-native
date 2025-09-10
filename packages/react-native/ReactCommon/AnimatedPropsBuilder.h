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

struct AnimatedPropsBuilder{
  folly::dynamic dyn;
  std::vector<AnimatedProp> props;
  void setOpacity(Float value){
    props.push_back({OPACITY, {.float_ = value}});
  }
  void setWidth(yoga::Style::SizeLength value){
    props.push_back({WIDTH, {.styleSizeLength_ = value}});
  }
  void setHeight(yoga::Style::SizeLength value){
    props.push_back({HEIGHT, {.styleSizeLength_ = value}});
  }
  void setBorderRadii(CascadedBorderRadii& borderRadii){
    //ugly
    props.push_back({BORDER_RADII, {.borderRadii_ = &borderRadii}});
  }
  void storeDynamic(folly::dynamic& d){
    dyn = std::move(d);
  }
  void storeJSI(jsi::Runtime& runtime, jsi::Value& value){
//    animatedProps.rest = std::make_unique<RawProps>(runtime, value);
  }
  AnimatedProps get(){
//    return std::move(animatedProps);
    return AnimatedProps{std::move(props), std::move(dyn)};
  }
};

struct AnimatedPropsBuilder2{
  std::vector<std::unique_ptr<AnimatedProp2Base>> props;
  void setOpacity(Float value){
//    AnimatedProp2<Float> a;
    props.push_back(std::make_unique<AnimatedProp2<Float>>(OPACITY, value));
  }
  void setWidth(yoga::Style::SizeLength value){
    props.push_back(std::make_unique<AnimatedProp2<yoga::Style::SizeLength>>(WIDTH, value));
  }
  void setHeight(yoga::Style::SizeLength value){
    props.push_back(std::make_unique<AnimatedProp2<yoga::Style::SizeLength>>(HEIGHT, value));
  }
  void setBorderRadii(CascadedBorderRadii& value){
    props.push_back(std::make_unique<AnimatedProp2<CascadedBorderRadii>>(BORDER_RADII, value));
  }
  void storeDynamic(folly::dynamic& d){
//    animatedProps.rest = std::make_unique<RawProps>(std::move(d));
  }
  void storeJSI(jsi::Runtime& runtime, jsi::Value& value){
//    animatedProps.rest = std::make_unique<RawProps>(runtime, value);
  }
  AnimatedProps2 get(){
    return AnimatedProps2{std::move(props)};
  }
};

}
