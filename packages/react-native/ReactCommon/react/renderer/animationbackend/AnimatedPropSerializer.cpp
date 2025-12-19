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
  dyn.insert("backgroundColor", static_cast<int32_t>(*backgroundColor));
}

void packShadowColor(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& shadowColor = get<SharedColor>(animatedProp);
  dyn.insert("shadowColor", static_cast<int32_t>(*shadowColor));
}

void packShadowOffset(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& shadowOffset = get<Size>(animatedProp);
  dyn.insert(
      "shadowOffset",
      folly::dynamic::object("width", shadowOffset.width)(
          "height", shadowOffset.height));
}

void packShadowOpacity(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  dyn.insert("shadowOpacity", get<Float>(animatedProp));
}

void packShadowRadius(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  dyn.insert("shadowRadius", get<Float>(animatedProp));
}

void packBorderColorEdge(
    folly::dynamic& dyn,
    const std::string& propName,
    const std::optional<SharedColor>& colorValue) {
  if (colorValue.has_value() && colorValue.value()) {
    dyn.insert(propName, static_cast<int32_t>(*colorValue.value()));
  }
}

void packBorderColor(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& borderColors = get<CascadedBorderColors>(animatedProp);

  packBorderColorEdge(dyn, "borderLeftColor", borderColors.left);
  packBorderColorEdge(dyn, "borderTopColor", borderColors.top);
  packBorderColorEdge(dyn, "borderRightColor", borderColors.right);
  packBorderColorEdge(dyn, "borderBottomColor", borderColors.bottom);
  packBorderColorEdge(dyn, "borderStartColor", borderColors.start);
  packBorderColorEdge(dyn, "borderEndColor", borderColors.end);

  if (borderColors.all.has_value() && borderColors.all.value()) {
    dyn.insert("borderColor", static_cast<int32_t>(*borderColors.all.value()));
  }
}

void packFilter(folly::dynamic& dyn, const AnimatedPropBase& animatedProp) {
  const auto& filters = get<std::vector<FilterFunction>>(animatedProp);
  auto filterArray = folly::dynamic::array();
  for (const auto& f : filters) {
    folly::dynamic filterObj = folly::dynamic::object();
    std::string typeKey = toString(f.type);
    if (std::holds_alternative<Float>(f.parameters)) {
      filterObj[typeKey] = std::get<Float>(f.parameters);
    } else if (std::holds_alternative<DropShadowParams>(f.parameters)) {
      const auto& dropShadowParams = std::get<DropShadowParams>(f.parameters);
      folly::dynamic shadowObj = folly::dynamic::object();
      shadowObj["offsetX"] = dropShadowParams.offsetX;
      shadowObj["offsetY"] = dropShadowParams.offsetY;
      shadowObj["standardDeviation"] = dropShadowParams.standardDeviation;
      shadowObj["color"] = static_cast<int32_t>(*dropShadowParams.color);
      filterObj[typeKey] = shadowObj;
    }
    filterArray.push_back(filterObj);
  }
  dyn.insert("filter", filterArray);
}

void packOutlineColor(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& outlineColor = get<SharedColor>(animatedProp);
  dyn.insert("outlineColor", static_cast<int32_t>(*outlineColor));
}

void packOutlineOffset(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  dyn.insert("outlineOffset", get<Float>(animatedProp));
}

void packOutlineStyle(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& outlineStyle = get<OutlineStyle>(animatedProp);
  std::string styleStr;
  switch (outlineStyle) {
    case OutlineStyle::Solid:
      styleStr = "solid";
      break;
    case OutlineStyle::Dotted:
      styleStr = "dotted";
      break;
    case OutlineStyle::Dashed:
      styleStr = "dashed";
      break;
    default:
      throw std::runtime_error("Unknown outline style");
  }
  dyn.insert("outlineStyle", styleStr);
}

void packOutlineWidth(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  dyn.insert("outlineWidth", get<Float>(animatedProp));
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

    case SHADOW_COLOR:
      packShadowColor(dyn, *animatedProp);
      break;

    case SHADOW_OFFSET:
      packShadowOffset(dyn, *animatedProp);
      break;

    case SHADOW_OPACITY:
      packShadowOpacity(dyn, *animatedProp);
      break;

    case SHADOW_RADIUS:
      packShadowRadius(dyn, *animatedProp);
      break;

    case BORDER_COLOR:
      packBorderColor(dyn, *animatedProp);
      break;

    case FILTER:
      packFilter(dyn, *animatedProp);
      break;

    case OUTLINE_COLOR:
      packOutlineColor(dyn, *animatedProp);
      break;

    case OUTLINE_OFFSET:
      packOutlineOffset(dyn, *animatedProp);
      break;

    case OUTLINE_STYLE:
      packOutlineStyle(dyn, *animatedProp);
      break;

    case OUTLINE_WIDTH:
      packOutlineWidth(dyn, *animatedProp);
      break;

    case WIDTH:
    case HEIGHT:
    case FLEX:
    case PADDING:
    case MARGIN:
    case POSITION:
    case BORDER_WIDTH:
    case ALIGN_CONTENT:
    case ALIGN_ITEMS:
    case ALIGN_SELF:
    case ASPECT_RATIO:
    case BOX_SIZING:
    case DISPLAY:
    case FLEX_BASIS:
    case FLEX_DIRECTION:
    case ROW_GAP:
    case COLUMN_GAP:
    case FLEX_GROW:
    case FLEX_SHRINK:
    case FLEX_WRAP:
    case JUSTIFY_CONTENT:
    case MAX_HEIGHT:
    case MAX_WIDTH:
    case MIN_HEIGHT:
    case MIN_WIDTH:
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
