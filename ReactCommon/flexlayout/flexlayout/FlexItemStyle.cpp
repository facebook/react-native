/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FlexItemStyle.h"

#ifdef DEBUG
#include <sstream>
#endif

namespace facebook {
namespace flexlayout {
namespace style {

#ifdef DEBUG
auto operator<<(std::ostream& os, const FlexItemStyleBase& style)
    -> std::ostream& {
  std::stringstream styleStr;
  const auto defaultStyle = FlexItemStyleBase{};

  if (!FlexLayoutFloatsEqual(style.flex, defaultStyle.flex)) {
    styleStr << "    flex: " << style.flex << std::endl;
  }

  if (!FlexLayoutFloatsEqual(style.flexGrow, defaultStyle.flexGrow)) {
    styleStr << "    flexGrow: " << style.flexGrow << std::endl;
  }

  if (!FlexLayoutFloatsEqual(style.flexShrink, defaultStyle.flexShrink)) {
    styleStr << "    flexShrink: " << style.flexShrink << std::endl;
  }

  if (style.flexBasis != defaultStyle.flexBasis) {
    styleStr << "    flexBasis: " << style.flexBasis << std::endl;
  }

  if (!FlexLayoutFloatsEqual(style.aspectRatio, defaultStyle.aspectRatio)) {
    styleStr << "    aspectRatio: " << style.aspectRatio << std::endl;
  }

  if (style.alignSelf != defaultStyle.alignSelf) {
    styleStr << "    alignSelf: " << style.alignSelf << std::endl;
  }

  if (style.positionType != defaultStyle.positionType) {
    styleStr << "    positionType: " << style.positionType << std::endl;
  }

  if (style.display != defaultStyle.display) {
    styleStr << "    display: " << style.display << std::endl;
  }

  if (style.width != defaultStyle.width) {
    styleStr << "    width: " << style.width << std::endl;
  }

  if (style.minWidth != defaultStyle.minWidth) {
    styleStr << "    minWidth: " << style.minWidth << std::endl;
  }

  if (style.maxWidth != defaultStyle.maxWidth) {
    styleStr << "    maxWidth: " << style.maxWidth << std::endl;
  }

  if (style.height != defaultStyle.height) {
    styleStr << "    height: " << style.height << std::endl;
  }

  if (style.minHeight != defaultStyle.minHeight) {
    styleStr << "    minHeight: " << style.minHeight << std::endl;
  }

  if (style.maxHeight != defaultStyle.maxHeight) {
    styleStr << "    maxHeight: " << style.maxHeight << std::endl;
  }

  std::stringstream marginStr;
  for (auto edge : {Edge::Left, Edge::Top, Edge::Right, Edge::Bottom}) {
    const auto value = style.getMargin(edge);
    if (value.unit != Unit::Undefined) {
      marginStr << "      " << edge << ": " << value << std::endl;
    }
  }

  if (!marginStr.str().empty()) {
    styleStr << "    margin: {" << std::endl;
    styleStr << marginStr.str();
    styleStr << "    }" << std::endl;
  }

  std::stringstream positionStr;
  for (auto edge : {Edge::Left, Edge::Top, Edge::Right, Edge::Bottom}) {
    const auto value = style.getPosition(edge);
    if (value.unit != Unit::Undefined) {
      positionStr << "      " << edge << ": " << value << std::endl;
    }
  }

  if (!positionStr.str().empty()) {
    styleStr << "    position: {" << std::endl;
    styleStr << positionStr.str();
    styleStr << "    }" << std::endl;
  }

  if (style.isReferenceBaseline != defaultStyle.isReferenceBaseline) {
    styleStr << "    isReferenceBaseline: " << std::boolalpha
             << style.isReferenceBaseline << std::endl;
  }

  if (!styleStr.str().empty()) {
    os << "  {" << std::endl;
    os << styleStr.str();
    os << "  }";
  }

  return os;
}
#endif
} // namespace style
} // namespace flexlayout
} // namespace facebook
