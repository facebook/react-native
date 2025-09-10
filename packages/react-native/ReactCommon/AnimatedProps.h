/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <react/renderer/components/view/BaseViewProps.h>

namespace facebook::react {

enum PropName{
  OPACITY,
  WIDTH,
  HEIGHT,
  BORDER_RADII,
  FLEX
};

//struct DynamicPropsWrapper = std::variant<>;

union AnimatedPropUnion{
  Float float_{0};
  yoga::FloatOptional floatOptional_;
  yoga::StyleSizeLength styleSizeLength_;
  CascadedBorderRadii* borderRadii_;
};
static_assert(sizeof(AnimatedPropUnion) <= 8, "");


struct AnimatedProp{
  PropName propName;
  AnimatedPropUnion value;
};
static_assert(sizeof(AnimatedProp) <= 16, "");

struct AnimatedProps{
  std::vector<AnimatedProp> props;
  folly::dynamic d;
//  RawProps rest;
};

struct AnimatedProp2Base{
  PropName propName;
};

template <typename T>
struct AnimatedProp2: AnimatedProp2Base{
  T value;
  AnimatedProp2() = default;
  AnimatedProp2(PropName propName, T value): AnimatedProp2Base{propName}, value(value) {}
};

template <typename T>
T get(std::unique_ptr<AnimatedProp2Base>& animatedProp){
  return std::static_pointer_cast<AnimatedProp2<T>>(animatedProp).value;
}

struct AnimatedProps2{
  std::vector<std::unique_ptr<AnimatedProp2Base>> props;
//  std::unique_ptr<RawProps> rest;
};
}

