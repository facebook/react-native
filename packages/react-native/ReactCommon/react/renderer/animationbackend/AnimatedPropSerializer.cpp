/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <stdexcept>
#include "AnimatedPropsSerializer.h"

namespace facebook::react {

namespace {

void packBorderRadiusCorner(
    folly::dynamic& dyn,
    const std::string& propName,
    const std::optional<ValueUnit>& cornerValue) {
  if (cornerValue.has_value()) {
    dyn.insert(propName, cornerValue.value().value);
  }
}

void packBorderRadii(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& borderRadii = get<CascadedBorderRadii>(animatedProp);

  packBorderRadiusCorner(dyn, "borderTopRightRadius", borderRadii.topRight);
  packBorderRadiusCorner(dyn, "borderTopLeftRadius", borderRadii.topLeft);
  packBorderRadiusCorner(
      dyn, "borderBottomRightRadius", borderRadii.bottomRight);
  packBorderRadiusCorner(dyn, "borderBottomLeftRadius", borderRadii.bottomLeft);
  packBorderRadiusCorner(dyn, "borderTopStartRadius", borderRadii.topStart);
  packBorderRadiusCorner(dyn, "borderTopEndRadius", borderRadii.topEnd);
  packBorderRadiusCorner(
      dyn, "borderBottomStartRadius", borderRadii.bottomStart);
  packBorderRadiusCorner(dyn, "borderBottomEndRadius", borderRadii.bottomEnd);
  packBorderRadiusCorner(dyn, "borderStartStartRadius", borderRadii.startStart);
  packBorderRadiusCorner(dyn, "borderStartEndRadius", borderRadii.startEnd);
  packBorderRadiusCorner(dyn, "borderEndStartRadius", borderRadii.endStart);
  packBorderRadiusCorner(dyn, "borderEndEndRadius", borderRadii.endEnd);

  if (borderRadii.all.has_value()) {
    dyn.insert("borderRadius", borderRadii.all.value().value);
  }
}

void packOpacity(folly::dynamic& dyn, const AnimatedPropBase& animatedProp) {
  dyn.insert("opacity", get<Float>(animatedProp));
}

void packTransform(folly::dynamic& dyn, const AnimatedPropBase& animatedProp) {
  const auto transform = get<Transform>(animatedProp);
  const auto matrixArray = folly::dynamic::array(
      transform.matrix[0],
      transform.matrix[1],
      transform.matrix[2],
      transform.matrix[3],
      transform.matrix[4],
      transform.matrix[5],
      transform.matrix[6],
      transform.matrix[7],
      transform.matrix[8],
      transform.matrix[9],
      transform.matrix[10],
      transform.matrix[11],
      transform.matrix[12],
      transform.matrix[13],
      transform.matrix[14],
      transform.matrix[15]);
  dyn.insert(
      "transform",
      folly::dynamic::array(folly::dynamic::object("matrix", matrixArray)));
}

void packBackgroundColor(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& backgroundColor = get<SharedColor>(animatedProp);
  if (backgroundColor) {
    dyn.insert("backgroundColor", static_cast<int32_t>(*backgroundColor));
  }
}

void packAnimatedProp(
    folly::dynamic& dyn,
    const std::unique_ptr<AnimatedPropBase>& animatedProp) {
  switch (animatedProp->propName) {
    case OPACITY:
      packOpacity(dyn, *animatedProp);
      break;

    case TRANSFORM:
      packTransform(dyn, *animatedProp);
      break;

    case BACKGROUND_COLOR:
      packBackgroundColor(dyn, *animatedProp);
      break;

    case BORDER_RADII:
      packBorderRadii(dyn, *animatedProp);
      break;

    case WIDTH:
    case HEIGHT:
    case FLEX:
      throw std::runtime_error("Tried to synchronously update layout props");
  }
}

} // namespace

namespace animationbackend {

folly::dynamic packAnimatedProps(const AnimatedProps& animatedProps) {
  auto dyn = animatedProps.rawProps ? animatedProps.rawProps->toDynamic()
                                    : folly::dynamic::object();

  for (auto& animatedProp : animatedProps.props) {
    packAnimatedProp(dyn, animatedProp);
  }

  return dyn;
}

} // namespace animationbackend

} // namespace facebook::react
