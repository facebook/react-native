/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <limits>
#include <numeric>
#include <vector>
#include "FlexBoxStyle.h"
#include "FlexItem.h"
#include "FlexItemStyle.h"
#include "FlexLine.h"
#include "LayoutOutput.h"
#include "Rounding.h"
#include "Type.h"

namespace facebook {
namespace flexlayout {
namespace algo {

using namespace facebook::flexlayout::style;

FLEX_LAYOUT_EXPORT auto IsBaselineNode(
    const FlexBoxStyle& node,
    const FlexItemStyleBase& flexItemStyle) -> bool;

FLEX_LAYOUT_EXPORT auto ResolveAlignment(
    AlignSelf alignSelf,
    AlignItems alignItems) -> AlignItems;

template <typename MeasureData, typename Result>
FLEX_LAYOUT_EXPORT auto calculateLayoutInternal(
    const FlexBoxStyle& node,
    const std::vector<FlexItemStyle<MeasureData, Result>>& children,
    const Float minWidth,
    const Float maxWidth,
    const Float minHeight,
    const Float maxHeight,
    const Float ownerWidth) -> layoutoutput::LayoutOutput<Result> {
  // Step 1 Initialize values required for algorithm
  const auto isMainAxisRow = FlexDirectionIsRow(node.flexDirection);
  const std::array<Float, 4> paddingAndBorder = {
      node.getPaddingAndBorder(Edge::Left, ownerWidth),
      node.getPaddingAndBorder(Edge::Top, ownerWidth),
      node.getPaddingAndBorder(Edge::Right, ownerWidth),
      node.getPaddingAndBorder(Edge::Bottom, ownerWidth)};
  const auto paddingAndBorderAxisMain = isMainAxisRow
      ? paddingAndBorder[static_cast<size_t>(Edge::Left)] +
          paddingAndBorder[static_cast<size_t>(Edge::Right)]
      : paddingAndBorder[static_cast<size_t>(Edge::Top)] +
          paddingAndBorder[static_cast<size_t>(Edge::Bottom)];
  const auto paddingAndBorderAxisCross = isMainAxisRow
      ? paddingAndBorder[static_cast<size_t>(Edge::Top)] +
          paddingAndBorder[static_cast<size_t>(Edge::Bottom)]
      : paddingAndBorder[static_cast<size_t>(Edge::Left)] +
          paddingAndBorder[static_cast<size_t>(Edge::Right)];

  const auto isExactWidth =
      isDefined(minWidth) && isDefined(maxWidth) && minWidth == maxWidth;
  const auto isExactHeight =
      isDefined(minHeight) && isDefined(maxHeight) && minHeight == maxHeight;

  const auto isExactCrossDim = isMainAxisRow ? isExactHeight : isExactWidth;
  const auto isExactMainDim = isMainAxisRow ? isExactWidth : isExactHeight;

  auto minMainDim = isMainAxisRow ? minWidth : minHeight;
  const auto minCrossDim = isMainAxisRow ? minHeight : minWidth;

  const auto mainAxis = node.mainAxis();

  auto nodeLayoutOutput = layoutoutput::LayoutOutput<Result>{};
  if (children.empty()) {
    const auto mainDim = isMainAxisRow ? maxWidth : maxHeight;
    const auto crossDim = isMainAxisRow ? maxHeight : maxWidth;

    const auto mainDimFinal = ConstraintMin(
        !isExactMainDim ? paddingAndBorderAxisMain : mainDim, minMainDim);
    const auto crossDimFinal = ConstraintMin(
        !isExactCrossDim ? paddingAndBorderAxisCross : crossDim, minCrossDim);

    nodeLayoutOutput.setSize(
        mainAxis,
        isUndefined(mainDimFinal) ? 0 : mainDimFinal,
        isUndefined(crossDimFinal) ? 0 : crossDimFinal);

    return nodeLayoutOutput;
  }

  // Step 2 Calculate available main and cross size
  const auto availableInnerWidth = std::max(
      maxWidth - paddingAndBorder[static_cast<int>(Edge::Left)] -
          paddingAndBorder[static_cast<int>(Edge::Right)],
      0.0f);
  const auto availableInnerHeight = std::max(
      maxHeight - paddingAndBorder[static_cast<int>(Edge::Top)] -
          paddingAndBorder[static_cast<int>(Edge::Bottom)],
      0.0f);
  auto availableInnerMainDim =
      isMainAxisRow ? availableInnerWidth : availableInnerHeight;

  // We are removing all children with DisplayNone and positionType Absolute as
  // they are not needed at all during the flexbox algorithm. DisplayNone will
  // not be displayed so their layout values can be default i.e Undefined.
  // Absolute children will be measured and layed out at the last step after
  // container's size has been determined.
  auto flexItems = std::vector<FlexItem>{};
  auto singleFlexChildIndex = std::numeric_limits<size_t>::max();
  auto index = size_t{0};
  auto singleFlexChildPossible = true;
  for (const auto& child : children) {
    if (child.display != Display::None &&
        child.positionType != PositionType::Absolute) {
      const auto w =
          isDefined(child.maxWidth.value) && (child.minWidth == child.maxWidth)
          ? child.maxWidth
          : child.width;
      const auto h = isDefined(child.maxHeight.value) &&
              (child.minHeight == child.maxHeight)
          ? child.maxHeight
          : child.height;
      flexItems.emplace_back(index, child, w, h);

      if (isExactMainDim && singleFlexChildPossible) {
        if (child.isFlexible()) {
          if (singleFlexChildIndex != std::numeric_limits<size_t>::max() ||
              FlexLayoutFloatsEqual(child.flexGrow, 0.0f) ||
              FlexLayoutFloatsEqual(child.flexShrink, 0.0f)) {
            // There is already a flexible child, or this flexible child doesn't
            // have flexGrow and flexShrink, abort
            singleFlexChildIndex = std::numeric_limits<size_t>::max();
            singleFlexChildPossible = false;
          } else {
            singleFlexChildIndex = index;
          }
        }
      }
    }
    nodeLayoutOutput.children.push_back(
        typename layoutoutput::LayoutOutput<Result>::Child());
    nodeLayoutOutput.children[index].enableTextRounding =
        child.enableTextRounding;
    index++;
  }

  // Step 3 Calculate the flex base size and hypothetical main size
  auto totalOuterFlexBasis = 0.0;
  for (auto& flexItem : flexItems) {
    const auto& flexItemStyle = children[flexItem.index];
    if (flexItem.index == singleFlexChildIndex) {
      flexItem.computedFlexBasis = 0;
    } else {
      const auto resolvedFlexBasis =
          flexItemStyle.flexBasis.resolve(availableInnerMainDim);
      const auto resolvedWidth =
          flexItem.resolvedWidth.resolve(availableInnerWidth);
      const auto resolvedHeight =
          flexItem.resolvedHeight.resolve(availableInnerHeight);
      const auto crossSize = isMainAxisRow ? resolvedHeight : resolvedWidth;
      if (isDefined(resolvedFlexBasis) && isDefined(availableInnerMainDim)) {
        // if flex basis is defined use that
        flexItem.computedFlexBasis = resolvedFlexBasis;
      } else if (isMainAxisRow && isDefined(resolvedWidth)) {
        // if main axis is row and width is defined use width as flexBasis
        flexItem.computedFlexBasis = resolvedWidth;
      } else if (!isMainAxisRow && isDefined(resolvedHeight)) {
        // if main axis is column and height is defined use height as flexBasis
        flexItem.computedFlexBasis = resolvedHeight;
      } else if (
          isDefined(flexItemStyle.aspectRatio) && isDefined(crossSize) &&
          flexItemStyle.flexBasis.unit == Unit::Auto) {
        // if aspect ratio is defined and cross size is defined then flex basis
        // is crossSize * aspectRatio
        if (isMainAxisRow) {
          flexItem.computedFlexBasis = crossSize * flexItemStyle.aspectRatio;
        } else {
          flexItem.computedFlexBasis = flexItemStyle.aspectRatio > 0
              ? crossSize / flexItemStyle.aspectRatio
              : 0.0f;
        }
      } else {
        // calculate childWidth/childHeight and measure child
        // flex basis is child's measured main size
        const auto align =
            ResolveAlignment(flexItemStyle.alignSelf, node.alignItems);

        float childMinWidth = NAN;
        float childMaxWidth = NAN;

        float childMinHeight = NAN;
        float childMaxHeight = NAN;

        if (isDefined(resolvedWidth)) {
          childMinWidth = resolvedWidth;
          childMaxWidth = resolvedWidth;
        }

        if (isDefined(resolvedHeight)) {
          childMinHeight = resolvedHeight;
          childMaxHeight = resolvedHeight;
        }

        // The W3C spec doesn't say anything about the 'overflow' property, but
        // all major browsers appear to implement the following logic.
        if ((!isMainAxisRow && node.overflow == Overflow::Scroll) ||
            node.overflow != Overflow::Scroll) {
          if (isUndefined(resolvedWidth) && isDefined(availableInnerWidth)) {
            childMinWidth = 0;
            childMaxWidth = availableInnerWidth <= 0
                ? NAN
                : FlexLayoutFloatMax(
                      0,
                      availableInnerWidth -
                          flexItemStyle.getMarginForAxis(
                              FlexDirection::Row, availableInnerWidth));
          }
        }

        if ((isMainAxisRow && node.overflow == Overflow::Scroll) ||
            node.overflow != Overflow::Scroll) {
          if (isUndefined(resolvedHeight) && isDefined(availableInnerHeight)) {
            childMinHeight = 0;
            childMaxHeight = availableInnerHeight <= 0
                ? NAN
                : FlexLayoutFloatMax(
                      0,
                      availableInnerHeight -
                          flexItemStyle.getMarginForAxis(
                              FlexDirection::Column, availableInnerWidth));
          }
        }

        if (isDefined(flexItemStyle.aspectRatio)) {
          if (!isMainAxisRow && isDefined(resolvedWidth)) {
            childMinHeight = resolvedWidth / flexItemStyle.aspectRatio;
            childMaxHeight = childMinHeight;
          } else if (isMainAxisRow && isDefined(resolvedHeight)) {
            childMinWidth = resolvedHeight * flexItemStyle.aspectRatio;
            childMaxWidth = childMinWidth;
          }
        }

        // If child has no defined size in the cross axis and is set to stretch,
        // set the cross axis to be measured exactly with the available inner
        // width

        const auto childWidthStretch = align == AlignItems::Stretch &&
            !(isDefined(childMaxWidth) && childMinWidth == childMaxWidth);
        if (!isMainAxisRow && isUndefined(resolvedWidth) && isExactWidth &&
            childWidthStretch) {
          childMinWidth = FlexLayoutFloatMax(
              0,
              availableInnerWidth -
                  flexItemStyle.getMarginForAxis(
                      FlexDirection::Row, availableInnerWidth));
          childMaxWidth = childMinWidth;
          if (isDefined(flexItemStyle.aspectRatio)) {
            childMinHeight = childMinWidth / flexItemStyle.aspectRatio;
            childMaxHeight = childMinHeight;
          }
        }

        const auto childHeightStretch = align == AlignItems::Stretch &&
            !(isDefined(childMaxHeight) && childMinHeight == childMaxHeight);
        if (isMainAxisRow && isUndefined(resolvedHeight) && isExactHeight &&
            childHeightStretch) {
          childMinHeight = FlexLayoutFloatMax(
              0,
              availableInnerHeight -
                  flexItemStyle.getMarginForAxis(
                      FlexDirection::Column, availableInnerWidth));
          childMaxHeight = childMinHeight;
          if (isDefined(flexItemStyle.aspectRatio)) {
            childMinWidth = childMinHeight * flexItemStyle.aspectRatio;
            childMaxWidth = childMinWidth;
          }
        }

        childMinWidth = ConstraintMinMax(
            childMinWidth,
            flexItemStyle.minWidth.resolve(availableInnerWidth),
            flexItemStyle.maxWidth.resolve(availableInnerWidth));

        childMaxWidth = ConstraintMinMax(
            childMaxWidth,
            flexItemStyle.minWidth.resolve(availableInnerWidth),
            flexItemStyle.maxWidth.resolve(availableInnerWidth));

        const auto resolvedMinHeight =
            flexItemStyle.minHeight.resolve(availableInnerHeight);
        const auto usedMinHeight =
            isDefined(resolvedMinHeight) ? resolvedMinHeight : 0;
        const auto resolvedMaxHeight =
            flexItemStyle.maxHeight.resolve(availableInnerHeight);
        const auto usedMaxHeight = isDefined(resolvedMaxHeight)
            ? resolvedMaxHeight
            : std::numeric_limits<Float>::infinity();
        if (isUndefined(childMinHeight)) {
          childMinHeight = resolvedMinHeight;
        } else {
          childMinHeight =
              std::min(std::max(childMinHeight, usedMinHeight), usedMaxHeight);
        }

        if (isUndefined(childMaxHeight)) {
          childMaxHeight = resolvedMaxHeight;
        } else {
          childMaxHeight =
              std::min(std::max(childMaxHeight, usedMinHeight), usedMaxHeight);
        }

        const auto measureParams = layoutoutput::MeasureParams{
            childMinWidth, childMaxWidth, childMinHeight, childMaxHeight};
        auto measureOutput = flexItemStyle.measureFunction(
            flexItemStyle.measureData,
            childMinWidth,
            childMaxWidth,
            childMinHeight,
            childMaxHeight,
            availableInnerWidth,
            availableInnerHeight);
        flexItem.computedFlexBasis =
            isMainAxisRow ? measureOutput.width : measureOutput.height;
        nodeLayoutOutput.children[flexItem.index].setMeasureOutput(
            std::move(measureOutput), measureParams);
      }
    }

    // hypothetical main size is flexBasis with child's min and max constraints

    totalOuterFlexBasis += flexItem.computedFlexBasis +
        flexItemStyle.getMarginForAxis(mainAxis, availableInnerWidth);
  }

  // totalOuterFlexBasis is mainSize of flexContainer at this point

  const auto maxMainDim = isMainAxisRow ? maxWidth : maxHeight;
  const auto maxCrossDim = isMainAxisRow ? maxHeight : maxWidth;
  const auto flexBasisOverflows =
      isUndefined(minMainDim) && isUndefined(maxMainDim)
      ? false
      : totalOuterFlexBasis > availableInnerMainDim;
  const auto isSingleLineContainer = node.flexWrap == FlexWrap::NoWrap;
  const auto isAtMostMainDim = isDefined(maxMainDim) &&
      (isUndefined(minMainDim) || FlexLayoutFloatsEqual(minMainDim, 0) ||
       minMainDim != maxMainDim);

  if (!isSingleLineContainer && flexBasisOverflows && isAtMostMainDim) {
    minMainDim = maxMainDim;
  }

  // Step 4 Collect flex items into flex lines

  // Accumulated cross dimensions of all lines so far.
  auto totalLineCrossDim = 0.0f;

  // Max main dimension of all the lines.
  auto maxLineMainDim = 0.0f;

  auto flexLines = std::vector<FlexLine>{};
  const auto crossAxis = node.crossAxis();
  const auto availableInnerCrossDim =
      !isMainAxisRow ? availableInnerWidth : availableInnerHeight;

  for (auto i = std::size_t{0}; i < flexItems.size();) {
    auto flexLine = FlexLine{};
    auto mainSizeConsumedOnLine = 0.0f;

    auto innerIndex = i;
    for (; innerIndex < flexItems.size(); ++innerIndex) {
      const auto& flexItem = flexItems.at(innerIndex);
      const auto& flexItemStyle = flexItem.flexItemStyle;
      const auto flexBasisWithMinMaxConstraints = flexItemStyle.nodeBoundAxis(
          mainAxis, flexItem.computedFlexBasis, availableInnerMainDim);
      const auto sizeOfChildIncludingMargin = flexBasisWithMinMaxConstraints +
          flexItemStyle.getMarginForAxis(mainAxis, availableInnerWidth);
      if (!isSingleLineContainer &&
          mainSizeConsumedOnLine + sizeOfChildIncludingMargin >
              availableInnerMainDim &&
          !flexLine.flexItems.empty()) {
        // If noWrap we dont want to break as we want all children on single
        // line if size exceeds then break there should be atleast one item on
        // the line
        break;
      }

      mainSizeConsumedOnLine += sizeOfChildIncludingMargin;
      flexLine.flexItems.push_back(flexItem);
    }

    i = innerIndex;

    auto sizeBasedOnContent = false;
    if (isUndefined(minMainDim) && isUndefined(maxMainDim)) {
      // do nothing
    } else if (
        (isUndefined(minMainDim) || isUndefined(maxMainDim)) ||
        (isDefined(maxMainDim) && isDefined(minMainDim) &&
         maxMainDim != minMainDim)) {
      if (mainSizeConsumedOnLine < minMainDim - paddingAndBorderAxisMain) {
        availableInnerMainDim = minMainDim - paddingAndBorderAxisMain;
      } else if (
          mainSizeConsumedOnLine > maxMainDim - paddingAndBorderAxisMain) {
        availableInnerMainDim = maxMainDim - paddingAndBorderAxisMain;
      } else {
        sizeBasedOnContent = true;
      }
    }

    // Step 5 Resolve flexible lengths on main axis
    // https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths
    const auto remainingFreeSpace = flexLine.resolveFlexibleLengths(
        mainAxis,
        availableInnerMainDim,
        availableInnerWidth,
        sizeBasedOnContent);

    auto maxBaseline = 0.0f;
    const FlexItem* baselineChild = nullptr;
    auto isAlignBaseline = false;
    auto cumulativeHeight = 0.0f;

    for (const auto& flexItem : flexLine.flexItems) {
      const auto& flexItemStyle = children[flexItem.index];
      // Determine the hypothetical cross size of each item by performing layout
      // with the used main size and the available space, treating auto as
      // fit-content.
      const auto align =
          ResolveAlignment(flexItemStyle.alignSelf, node.alignItems);

      const auto childCrossSizeRange = flexItem.crossSizeRange(
          isMainAxisRow,
          availableInnerCrossDim,
          align,
          isExactCrossDim,
          isSingleLineContainer,
          flexBasisOverflows,
          crossAxis,
          availableInnerWidth);

      const auto childMinWidth =
          isMainAxisRow ? flexItem.targetMainSize : childCrossSizeRange.min;
      const auto childMaxWidth =
          isMainAxisRow ? flexItem.targetMainSize : childCrossSizeRange.max;
      const auto childMinHeight =
          isMainAxisRow ? childCrossSizeRange.min : flexItem.targetMainSize;
      const auto childMaxHeight =
          isMainAxisRow ? childCrossSizeRange.max : flexItem.targetMainSize;

      const auto measureParams = layoutoutput::MeasureParams{
          childMinWidth, childMaxWidth, childMinHeight, childMaxHeight};
      if (!nodeLayoutOutput.children[flexItem.index].canBeReusedFor(
              measureParams)) {
        auto measureOutput = flexItemStyle.measureFunction(
            flexItemStyle.measureData,
            childMinWidth,
            childMaxWidth,
            childMinHeight,
            childMaxHeight,
            availableInnerWidth,
            availableInnerHeight);
        nodeLayoutOutput.children[flexItem.index].setMeasureOutput(
            std::move(measureOutput), measureParams);
      }

      const auto& childLayout = nodeLayoutOutput.children[flexItem.index];
      const auto width = childLayout.width;
      const auto height = childLayout.height;
      // Baseline Calculation
      const auto margin = flexItem.flexItemStyle.getLeadingMargin(
          FlexDirection::Column, availableInnerWidth);
      const auto baseline = margin + cumulativeHeight + [&]() {
        if (const auto baselineFunc =
                children[flexItem.index].baselineFunction) {
          return baselineFunc(
              children[flexItem.index].measureData, width, height);
        }
        return isDefined(childLayout.baseline) ? childLayout.baseline : height;
      }();

      nodeLayoutOutput.children[flexItem.index].baseline = baseline;
      if (!isMainAxisRow) {
        cumulativeHeight += height;
      }

      if (align == AlignItems::Baseline ||
          flexItem.flexItemStyle.isReferenceBaseline) {
        maxBaseline = FlexLayoutFloatMax(maxBaseline, baseline);
        if (!isAlignBaseline) {
          baselineChild = &flexItem;
        }
        isAlignBaseline = true;
      }

      if (baselineChild == nullptr) {
        baselineChild = &flexItem;
      }
    }
    flexLine.maxBaseline = maxBaseline;

    if (flexLines.empty()) {
      nodeLayoutOutput.baseline =
          getLeadingPadding(node, FlexDirection::Column, 0) +
          nodeLayoutOutput.children[baselineChild->index].baseline;
    }

    // Step 6 Cross size determination
    // If there's no flex wrap, the cross dimension is defined by the container.
    if (isSingleLineContainer && isExactCrossDim) {
      flexLine.crossDim = availableInnerCrossDim;
    } else {
      for (const auto& flexItem : flexLine.flexItems) {
        const auto& flexItemStyle = flexItem.flexItemStyle;
        if (IsBaselineNode(node, flexItemStyle)) {
          // If the child is baseline aligned then the cross dimension is
          // calculated by adding maxAscent and maxDescent from the baseline.
          const auto value = flexLine.maxBaseline -
              nodeLayoutOutput.children[flexItem.index].baseline +
              nodeLayoutOutput.children[flexItem.index].height +
              flexItemStyle.getMarginForAxis(
                  FlexDirection::Column, availableInnerWidth);
          flexLine.crossDim = FlexLayoutFloatMax(flexLine.crossDim, value);
        } else {
          // The cross dimension is the max of the elements dimension since
          // there can only be one element in that cross dimension in the case
          // when the items are not baseline aligned
          const auto crossSize = FlexDirectionIsRow(crossAxis)
              ? nodeLayoutOutput.children[flexItem.index].width
              : nodeLayoutOutput.children[flexItem.index].height;
          flexLine.crossDim = FlexLayoutFloatMax(
              flexLine.crossDim,
              crossSize +
                  flexItemStyle.getLeadingMargin(
                      crossAxis, availableInnerWidth) +
                  flexItemStyle.getTrailingMargin(
                      crossAxis, availableInnerWidth));
        }
      }
    }

    const auto containerCrossDim = [&]() {
      if (isExactCrossDim) {
        return availableInnerCrossDim;
      }

      return FlexLayoutFloatMax(
                 ConstraintMinMax(
                     flexLine.crossDim + paddingAndBorderAxisCross,
                     minCrossDim,
                     maxCrossDim),
                 paddingAndBorderAxisCross) -
          paddingAndBorderAxisCross;
    }();

    for (const auto& flexItem : flexLine.flexItems) {
      const auto& flexItemStyle = flexItem.flexItemStyle;
      const auto align =
          ResolveAlignment(flexItemStyle.alignSelf, node.alignItems);

      const auto crossSize = FlexDirectionIsRow(crossAxis)
          ? flexItem.resolvedWidth
          : flexItem.resolvedHeight;

      const auto needsStretch = align == AlignItems::Stretch &&
          flexItemStyle.getMargin(getLeadingEdge(crossAxis)).unit !=
              Unit::Auto &&
          flexItemStyle.getMargin(getTrailingEdge(crossAxis)).unit !=
              Unit::Auto &&
          isUndefined(crossSize.resolve(availableInnerCrossDim));

      if (!needsStretch) {
        continue;
      }

      auto childMainSize = isMainAxisRow
          ? nodeLayoutOutput.children[flexItem.index].width
          : nodeLayoutOutput.children[flexItem.index].height;
      float childCrossSize;

      if (isUndefined(flexItemStyle.aspectRatio)) {
        childCrossSize = containerCrossDim -
            flexItemStyle.getMarginForAxis(crossAxis, availableInnerWidth);
      } else {
        childCrossSize = isMainAxisRow
            ? childMainSize / flexItemStyle.aspectRatio
            : childMainSize * flexItemStyle.aspectRatio;
      }

      childMainSize = ConstraintMinMax(
          childMainSize,
          (isMainAxisRow ? flexItemStyle.minWidth : flexItemStyle.minHeight)
              .resolve(
                  isMainAxisRow ? availableInnerWidth : availableInnerHeight),
          (isMainAxisRow ? flexItemStyle.maxWidth : flexItemStyle.maxHeight)
              .resolve(
                  isMainAxisRow ? availableInnerWidth : availableInnerHeight));
      childCrossSize = ConstraintMinMax(
          childCrossSize,
          (!isMainAxisRow ? flexItemStyle.minWidth : flexItemStyle.minHeight)
              .resolve(
                  !isMainAxisRow ? availableInnerWidth : availableInnerHeight),
          (!isMainAxisRow ? flexItemStyle.maxWidth : flexItemStyle.maxHeight)
              .resolve(
                  !isMainAxisRow ? availableInnerWidth : availableInnerHeight));

      auto childWidth = isMainAxisRow ? childMainSize : childCrossSize;
      auto childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

      const auto crossAxisDoesNotGrow =
          node.alignContent != AlignContent::Stretch && !isSingleLineContainer;
      if (isUndefined(childWidth) || (!isMainAxisRow && crossAxisDoesNotGrow)) {
        childWidth = NAN;
      }
      if (isUndefined(childHeight) || (isMainAxisRow && crossAxisDoesNotGrow)) {
        childHeight = NAN;
      }

      const auto measureParams = layoutoutput::MeasureParams{
          childWidth, childWidth, childHeight, childHeight};
      if (!nodeLayoutOutput.children[flexItem.index].canBeReusedFor(
              measureParams)) {
        auto measureOutput = children[flexItem.index].measureFunction(
            children[flexItem.index].measureData,
            childWidth,
            childWidth,
            childHeight,
            childHeight,
            availableInnerWidth,
            availableInnerHeight);
        nodeLayoutOutput.children[flexItem.index].setMeasureOutput(
            std::move(measureOutput), measureParams);
      }
    }

    // Step 7 Main Axis Alignment
    // Cast to Float straight away as it is being used in multiple fp arithmetic
    // expressions below
    const auto numberOfAutoMarginsOnCurrentLine = static_cast<Float>(
        std::count_if(
            flexLine.flexItems.cbegin(),
            flexLine.flexItems.cend(),
            [mainAxis](const FlexItem& flexItem) {
              return flexItem.flexItemStyle.marginLeadingValue(mainAxis).unit ==
                  Unit::Auto;
            }) +
        std::count_if(
            flexLine.flexItems.cbegin(),
            flexLine.flexItems.cend(),
            [mainAxis](const FlexItem& flexItem) {
              return flexItem.flexItemStyle.marginTrailingValue(mainAxis)
                         .unit == Unit::Auto;
            }));

    const auto leadingPaddingAndBorderMain =
        getLeadingPaddingAndBorder(node, mainAxis, ownerWidth);
    const auto leadingPaddingAndBorderCross =
        getLeadingPaddingAndBorder(node, crossAxis, ownerWidth);

    flexLine.mainDim = leadingPaddingAndBorderMain;

    // In order to position the elements in the main axis, we have two controls.
    // The space between the beginning and the first element and the space
    // between each two elements.
    // Cast to Float straight away as it is being used in multiple fp arithmetic
    // expressions below
    const auto itemsOnLine = static_cast<Float>(flexLine.flexItems.size());
    const auto leadingMainDim = [&]() {
      if (remainingFreeSpace > 0 && numberOfAutoMarginsOnCurrentLine > 0) {
        return 0.0f;
      }

      switch (node.justifyContent) {
        case JustifyContent::Center:
          return remainingFreeSpace / 2;
        case JustifyContent::FlexEnd:
          return remainingFreeSpace;
        case JustifyContent::SpaceEvenly:
          // Space is distributed evenly across all elements
          return remainingFreeSpace / (itemsOnLine + 1);
        case JustifyContent::SpaceAround:
          // Space on the edges is half of the space between elements
          return remainingFreeSpace / itemsOnLine / 2;
        case JustifyContent::FlexStart:
        case JustifyContent::SpaceBetween:
          return 0.0f;
      }
    }();

    const auto betweenMainDim = [&]() {
      if (remainingFreeSpace > 0 && numberOfAutoMarginsOnCurrentLine > 0) {
        return 0.0f;
      }

      switch (node.justifyContent) {
        case JustifyContent::SpaceBetween:
          return itemsOnLine > 1
              ? FlexLayoutFloatMax(remainingFreeSpace, 0) / (itemsOnLine - 1)
              : 0.0f;
        case JustifyContent::SpaceEvenly:
          // Space is distributed evenly across all elements
          return remainingFreeSpace / (itemsOnLine + 1);
        case JustifyContent::SpaceAround:
          // Space on the edges is half of the space between elements
          return remainingFreeSpace / itemsOnLine;
        case JustifyContent::FlexStart:
        case JustifyContent::Center:
        case JustifyContent::FlexEnd:
          return 0.0f;
      }
    }();

    flexLine.mainDim += leadingMainDim;

    const auto usedSize = std::accumulate(
        flexLine.flexItems.cbegin(),
        flexLine.flexItems.cend(),
        0.0f,
        [&](Float size, const FlexItem& item) {
          const auto& child = nodeLayoutOutput.children[item.index];
          const auto innerSize = isMainAxisRow ? child.width : child.height;
          const auto margins = item.flexItemStyle.getMarginForAxis(
              mainAxis, availableInnerWidth);
          return size + innerSize + margins;
        });

    const auto containerMainDim = usedSize + remainingFreeSpace;

    // Step 8A Cross Axis Alignment
    for (const auto& flexItem : flexLine.flexItems) {
      // this is from previous step done here to prevent one more loop
      if (flexItem.flexItemStyle.marginLeadingValue(mainAxis).unit ==
          Unit::Auto) {
        flexLine.mainDim +=
            remainingFreeSpace / numberOfAutoMarginsOnCurrentLine;
      }

      // https://www.w3.org/TR/css-flexbox-1/#justify-content-property
      const auto relativePositionMain = flexItem.flexItemStyle.relativePosition(
          mainAxis, availableInnerWidth);

      const auto leadingMainMargin = flexItem.flexItemStyle.getLeadingMargin(
          mainAxis, availableInnerWidth);

      const auto offsetFromMainStartEdgeOfLine =
          (isUndefined(leadingMainMargin) ? 0 : leadingMainMargin) +
          relativePositionMain + flexLine.mainDim;

      const auto flowIsReverse = mainAxis == FlexDirection::RowReverse ||
          mainAxis == FlexDirection::ColumnReverse;
      // Reverse flows have their start and end edges reversed i.e. the start
      // edge would be at containerMainDim, not zero
      const auto mainStartEdgeOfLine =
          flowIsReverse ? containerMainDim + paddingAndBorderAxisMain : 0;
      // Offsets push items towards zero in reverse flows and away from zero in
      // non-reverse flows
      const auto directionalOffsetFromMainStartEdgeOfLine = flowIsReverse
          ? -offsetFromMainStartEdgeOfLine
          : offsetFromMainStartEdgeOfLine;
      nodeLayoutOutput.children[flexItem.index].setStartPositionOnAxis(
          mainStartEdgeOfLine + directionalOffsetFromMainStartEdgeOfLine,
          mainAxis);

      if (flexItem.flexItemStyle.marginTrailingValue(mainAxis).unit ==
          Unit::Auto) {
        flexLine.mainDim +=
            remainingFreeSpace / numberOfAutoMarginsOnCurrentLine;
      }

      const auto mainSize = isMainAxisRow
          ? nodeLayoutOutput.children[flexItem.index].width
          : nodeLayoutOutput.children[flexItem.index].height;
      flexLine.mainDim += betweenMainDim + mainSize +
          flexItem.flexItemStyle.getMarginForAxis(
              mainAxis, availableInnerWidth);

      const auto alignItem =
          ResolveAlignment(flexItem.flexItemStyle.alignSelf, node.alignItems);

      const auto crossSize = isMainAxisRow
          ? nodeLayoutOutput.children[flexItem.index].height
          : nodeLayoutOutput.children[flexItem.index].width;

      const auto leadingCrossDim = leadingPaddingAndBorderCross + [&]() {
        if (alignItem == AlignItems::Stretch &&
            flexItem.flexItemStyle.marginLeadingValue(crossAxis).unit !=
                Unit::Auto &&
            flexItem.flexItemStyle.marginTrailingValue(crossAxis).unit !=
                Unit::Auto) {
          return 0.0f;
        }

        const auto remainingCrossDim = containerCrossDim - crossSize -
            flexItem.flexItemStyle.getMarginForAxis(
                crossAxis, availableInnerWidth);

        if (flexItem.flexItemStyle.marginLeadingValue(crossAxis).unit ==
                Unit::Auto &&
            flexItem.flexItemStyle.marginTrailingValue(crossAxis).unit ==
                Unit::Auto) {
          return FlexLayoutFloatMax(0.0f, remainingCrossDim / 2);
        }
        if (flexItem.flexItemStyle.marginTrailingValue(crossAxis).unit ==
            Unit::Auto) {
          return 0.0f;
        }
        if (flexItem.flexItemStyle.marginLeadingValue(crossAxis).unit ==
            Unit::Auto) {
          return FlexLayoutFloatMax(0.0f, remainingCrossDim);
        }

        switch (alignItem) {
          case AlignItems::FlexStart:
          case AlignItems::Stretch:
            return 0.0f;
          case AlignItems::FlexEnd:
            return remainingCrossDim;
          case AlignItems::Center:
            return remainingCrossDim / 2;
          case AlignItems::Baseline:
            return isMainAxisRow ? flexLine.maxBaseline -
                    nodeLayoutOutput.children[flexItem.index].baseline
                                 : 0.0f;
        }
      }();

      // https://www.w3.org/TR/css-flexbox-1/#align-items-property
      const auto relativePositionCross =
          flexItem.flexItemStyle.relativePosition(
              crossAxis, availableInnerWidth);
      const auto leadingCrossMargin = flexItem.flexItemStyle.getLeadingMargin(
          crossAxis, availableInnerWidth);

      const auto offsetFromCrossStartEdgeOfLine =
          (isUndefined(leadingCrossMargin) ? 0 : leadingCrossMargin) +
          relativePositionCross + leadingCrossDim;
      const auto offsetFromCrossStartEdgeOfContainer =
          totalLineCrossDim + offsetFromCrossStartEdgeOfLine;

      const auto crossStartEdgeOfContainer =
          crossAxis == FlexDirection::RowReverse
          ? containerCrossDim + paddingAndBorderAxisCross
          : 0;
      const auto directionalOffsetFromCrossStartEdgeOfContainer =
          crossAxis == FlexDirection::RowReverse
          ? -offsetFromCrossStartEdgeOfContainer
          : offsetFromCrossStartEdgeOfContainer;

      nodeLayoutOutput.children[flexItem.index].setStartPositionOnAxis(
          crossStartEdgeOfContainer +
              directionalOffsetFromCrossStartEdgeOfContainer,
          crossAxis);
    }

    flexLine.mainDim += getTrailingPaddingAndBorder(node, mainAxis, ownerWidth);

    totalLineCrossDim += flexLine.crossDim;
    maxLineMainDim = FlexLayoutFloatMax(maxLineMainDim, flexLine.mainDim);

    flexLines.push_back(flexLine);
  }

  // Step 8B Multi line content alignment
  auto newAvailableInnerCrossDim =
      isExactCrossDim ? availableInnerCrossDim : totalLineCrossDim;

  if (node.flexWrap != FlexWrap::NoWrap) {
    const auto remainingAlignContentDim =
        newAvailableInnerCrossDim - totalLineCrossDim;
    // Cast to Float straight away as it is being used in multiple fp arithmetic
    // expressions below
    const auto lineCount = static_cast<Float>(flexLines.size());
    const auto crossDimLead = [&]() {
      switch (node.alignContent) {
        case AlignContent::SpaceBetween:
          if (newAvailableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
            return remainingAlignContentDim / (lineCount - 1);
          }
          return 0.0f;
        case AlignContent::SpaceAround:
          if (newAvailableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
            return remainingAlignContentDim / lineCount;
          }
          return 0.0f;
        case AlignContent::Stretch:
          if (newAvailableInnerCrossDim > totalLineCrossDim) {
            return remainingAlignContentDim / lineCount;
          }
          return 0.0f;
        case AlignContent::FlexStart:
        case AlignContent::Baseline:
        case AlignContent::FlexEnd:
        case AlignContent::Center:
          return 0.0f;
      }
    }();

    auto currentLead = getLeadingPaddingAndBorder(node, crossAxis, ownerWidth);
    switch (node.alignContent) {
      case AlignContent::FlexEnd:
        currentLead += remainingAlignContentDim;
        break;
      case AlignContent::Center:
        currentLead += remainingAlignContentDim / 2;
        break;
      case AlignContent::SpaceAround:
        if (newAvailableInnerCrossDim > totalLineCrossDim) {
          currentLead += remainingAlignContentDim / (2 * lineCount);
        } else {
          currentLead += remainingAlignContentDim / 2;
        }
        break;
      case AlignContent::SpaceBetween:
      case AlignContent::Stretch:
      case AlignContent::FlexStart:
      case AlignContent::Baseline:
        break;
    }

    for (const auto& flexLine : flexLines) {
      const auto lineHeight = flexLine.crossDim + crossDimLead;
      for (const auto& flexItem : flexLine.flexItems) {
        auto crossAxisStart = 0.0f;

        auto crossSize = isMainAxisRow
            ? nodeLayoutOutput.children[flexItem.index].height
            : nodeLayoutOutput.children[flexItem.index].width;

        const auto alignItem =
            ResolveAlignment(flexItem.flexItemStyle.alignSelf, node.alignItems);

        switch (alignItem) {
          case AlignItems::FlexStart:
            crossAxisStart = currentLead +
                flexItem.flexItemStyle.getLeadingMargin(
                    crossAxis, availableInnerWidth);
            break;
          case AlignItems::FlexEnd:
            crossAxisStart = currentLead + lineHeight -
                flexItem.flexItemStyle.getTrailingMargin(
                    crossAxis, availableInnerWidth) -
                crossSize;
            break;
          case AlignItems::Center:
            crossAxisStart = currentLead + (lineHeight - crossSize) / 2;
            break;
          case AlignItems::Stretch: {
            crossAxisStart = currentLead +
                flexItem.flexItemStyle.getLeadingMargin(
                    crossAxis, availableInnerWidth);

            const auto definedCrossSize =
                (isMainAxisRow ? flexItem.resolvedHeight
                               : flexItem.resolvedWidth)
                    .resolve(
                        isMainAxisRow ? availableInnerHeight
                                      : availableInnerWidth);

            if (isUndefined(definedCrossSize)) {
              const auto mainSize = isMainAxisRow
                  ? nodeLayoutOutput.children[flexItem.index].width
                  : nodeLayoutOutput.children[flexItem.index].height;
              const auto margin = flexItem.flexItemStyle.getMarginForAxis(
                  crossAxis, availableInnerWidth);
              float width = isMainAxisRow ? mainSize : lineHeight - margin;
              float height = isMainAxisRow ? lineHeight - margin : mainSize;

              width = ConstraintMinMax(
                  width,
                  flexItem.flexItemStyle.minWidth.resolve(availableInnerWidth),
                  flexItem.flexItemStyle.maxWidth.resolve(availableInnerWidth));
              height = ConstraintMinMax(
                  height,
                  flexItem.flexItemStyle.minHeight.resolve(
                      availableInnerHeight),
                  flexItem.flexItemStyle.maxHeight.resolve(
                      availableInnerHeight));

              if (!(FlexLayoutFloatsEqual(
                        isMainAxisRow ? width : height, mainSize) &&
                    FlexLayoutFloatsEqual(
                        isMainAxisRow ? height : width, crossSize))) {
                const auto measureParams =
                    layoutoutput::MeasureParams{width, width, height, height};
                if (!nodeLayoutOutput.children[flexItem.index].canBeReusedFor(
                        measureParams)) {
                  auto measureOutput = children[flexItem.index].measureFunction(
                      children[flexItem.index].measureData,
                      width,
                      width,
                      height,
                      height,
                      availableInnerWidth,
                      availableInnerHeight);

                  nodeLayoutOutput.children[flexItem.index].setMeasureOutput(
                      std::move(measureOutput), measureParams);
                }

                crossSize = isMainAxisRow
                    ? nodeLayoutOutput.children[flexItem.index].height
                    : nodeLayoutOutput.children[flexItem.index].width;
              }
            }
          } break;
          case AlignItems::Baseline:
            break;
        }

        if (alignItem != AlignItems::Baseline) {
          if (isMainAxisRow) {
            nodeLayoutOutput.children[flexItem.index].top = crossAxisStart;
          } else {
            const auto crossStartEdgeOfContainer =
                crossAxis == FlexDirection::RowReverse
                ? newAvailableInnerCrossDim
                : 0;
            const auto directionalOffsetFromCrossStartEdgeOfContainer =
                crossAxis == FlexDirection::RowReverse ? -crossAxisStart
                                                       : crossAxisStart;
            nodeLayoutOutput.children[flexItem.index].setStartPositionOnAxis(
                crossStartEdgeOfContainer +
                    directionalOffsetFromCrossStartEdgeOfContainer,
                crossAxis);
          }
        }

        if (node.flexWrap == FlexWrap::WrapReverse) {
          if (isMainAxisRow) {
            const auto topPosition =
                nodeLayoutOutput.children[flexItem.index].top;
            nodeLayoutOutput.children[flexItem.index].top =
                newAvailableInnerCrossDim + paddingAndBorderAxisCross -
                topPosition - (crossAxisStart + crossSize - topPosition);
          } else {
            const auto crossEndEdgeOfContainer =
                crossAxis == FlexDirection::RowReverse
                ? 0
                : newAvailableInnerCrossDim;
            const auto directionalOffsetFromCrossEndEdgeOfContainer =
                crossAxis == FlexDirection::RowReverse ? crossAxisStart
                                                       : -crossAxisStart;
            nodeLayoutOutput.children[flexItem.index].setEndPositionOnAxis(
                crossEndEdgeOfContainer +
                    directionalOffsetFromCrossEndEdgeOfContainer,
                crossAxis);
          }
        }
      }
      currentLead += lineHeight;
    }
  }

  // Step 9 Computing final Dimensions
  auto newAvailableInnerMainDim =
      availableInnerMainDim + paddingAndBorderAxisMain;
  newAvailableInnerCrossDim =
      availableInnerCrossDim + paddingAndBorderAxisCross;

  if (isUndefined(maxMainDim) ||
      (node.overflow != Overflow::Scroll && isAtMostMainDim)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    newAvailableInnerMainDim =
        ConstraintMinMax(maxLineMainDim, minMainDim, maxMainDim);
  } else if (isAtMostMainDim && node.overflow == Overflow::Scroll) {
    newAvailableInnerMainDim = FlexLayoutFloatMax(
        FlexLayoutFloatMin(
            availableInnerMainDim + paddingAndBorderAxisMain,
            ConstraintMinMax(maxLineMainDim, minMainDim, maxMainDim)),
        paddingAndBorderAxisMain);
  }

  const auto isAtMostCrossDim = isDefined(maxCrossDim) &&
      (isUndefined(minCrossDim) || FlexLayoutFloatsEqual(minCrossDim, 0) ||
       minCrossDim != maxCrossDim);

  if (isUndefined(maxCrossDim) ||
      (node.overflow != Overflow::Scroll && isAtMostCrossDim)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    newAvailableInnerCrossDim = ConstraintMinMax(
        totalLineCrossDim + paddingAndBorderAxisCross,
        minCrossDim,
        maxCrossDim);
  } else if (isAtMostCrossDim && node.overflow == Overflow::Scroll) {
    newAvailableInnerCrossDim = FlexLayoutFloatMax(
        FlexLayoutFloatMin(
            availableInnerCrossDim + paddingAndBorderAxisCross,
            ConstraintMinMax(
                totalLineCrossDim + paddingAndBorderAxisCross,
                minCrossDim,
                maxCrossDim)),
        paddingAndBorderAxisCross);
  }

  nodeLayoutOutput.setSize(
      mainAxis, newAvailableInnerMainDim, newAvailableInnerCrossDim);

  nodeLayoutOutput.roundToPixelGrid(node.pointScaleFactor);

  // Step 10 Sizing and positioning absolute children
  for (auto i = std::size_t{0}; i < children.size(); ++i) {
    const auto& child = children[i];
    if (child.positionType != PositionType::Absolute ||
        child.display == Display::None) {
      continue;
    }

    const auto nodeWidth =
        isMainAxisRow ? newAvailableInnerMainDim : newAvailableInnerCrossDim;
    const auto nodeHeight =
        isMainAxisRow ? newAvailableInnerCrossDim : newAvailableInnerMainDim;

    const auto w =
        isDefined(child.maxWidth.value) && (child.minWidth == child.maxWidth)
        ? child.maxWidth
        : child.width;
    const auto h =
        isDefined(child.maxHeight.value) && (child.minHeight == child.maxWidth)
        ? child.maxHeight
        : child.height;

    const auto childWidth = w.resolve(nodeWidth);
    const auto childHeight = h.resolve(nodeHeight);

    const auto left = child.getPosition(Edge::Left).resolve(nodeWidth);
    const auto right = child.getPosition(Edge::Right).resolve(nodeWidth);
    const auto top = child.getPosition(Edge::Top).resolve(nodeHeight);
    const auto bottom = child.getPosition(Edge::Bottom).resolve(nodeHeight);

    const auto startMain = [&]() {
      switch (mainAxis) {
        case FlexDirection::Row:
          return left;
        case FlexDirection::RowReverse:
          return right;
        case FlexDirection::Column:
          return top;
        case FlexDirection::ColumnReverse:
          return bottom;
      }
    }();
    const auto startCross = [&]() {
      switch (crossAxis) {
        case FlexDirection::Row:
          return left;
        case FlexDirection::RowReverse:
          return right;
        case FlexDirection::Column:
        case FlexDirection::ColumnReverse:
          return top;
      }
    }();
    const auto endMain = [&]() {
      switch (mainAxis) {
        case FlexDirection::Row:
          return right;
        case FlexDirection::RowReverse:
          return left;
        case FlexDirection::Column:
          return bottom;
        case FlexDirection::ColumnReverse:
          return top;
      }
    }();
    const auto endCross = [&]() {
      switch (crossAxis) {
        case FlexDirection::Row:
          return right;
        case FlexDirection::RowReverse:
          return left;
        case FlexDirection::Column:
        case FlexDirection::ColumnReverse:
          return bottom;
      }
    }();

    auto borderLeft = node.getBorder(Edge::Left).resolve(nodeWidth);
    borderLeft = isUndefined(borderLeft) ? 0 : borderLeft;
    auto borderTop = node.getBorder(Edge::Top).resolve(nodeWidth);
    borderTop = isUndefined(borderTop) ? 0 : borderTop;

    auto borderRight = node.getBorder(Edge::Right).resolve(nodeWidth);
    borderRight = isUndefined(borderRight) ? 0 : borderRight;
    auto borderBottom = node.getBorder(Edge::Bottom).resolve(nodeWidth);
    borderBottom = isUndefined(borderBottom) ? 0 : borderBottom;

    const auto borderStartMain = isMainAxisRow ? borderLeft : borderTop;
    const auto borderStartCross = isMainAxisRow ? borderTop : borderLeft;
    const auto borderEndMain = isMainAxisRow ? borderRight : borderBottom;
    const auto borderEndCross = isMainAxisRow ? borderBottom : borderRight;

    auto width = isDefined(childWidth)
        ? childWidth
        : ((isDefined(left) && isDefined(right))
               ? nodeWidth - borderLeft - borderRight - left - right
               : NAN);
    auto height = isDefined(childHeight)
        ? childHeight
        : ((isDefined(top) && isDefined(bottom))
               ? nodeHeight - borderTop - borderBottom - top - bottom
               : NAN);

    if (isUndefined(width) ^ isUndefined(height)) {
      if (isDefined(child.aspectRatio)) {
        if (isUndefined(width)) {
          width = height * child.aspectRatio;
        } else if (isUndefined(height)) {
          height = width / child.aspectRatio;
        }
      }
    }

    auto absMinWidth = width;
    auto absMaxWidth = width;

    if (!isMainAxisRow && isUndefined(width) && isDefined(nodeWidth) &&
        nodeWidth > 0) {
      absMinWidth = 0;
      absMaxWidth = nodeWidth;
    }

    const auto measureParams = layoutoutput::MeasureParams{
        absMinWidth,
        absMaxWidth,
        height,
        height,
    };
    auto measureOutput = child.measureFunction(
        child.measureData,
        absMinWidth,
        absMaxWidth,
        height,
        height,
        availableInnerWidth,
        availableInnerHeight);
    const auto measuredMainSize =
        isMainAxisRow ? measureOutput.width : measureOutput.height;
    const auto measuredCrossSize =
        isMainAxisRow ? measureOutput.height : measureOutput.width;
    nodeLayoutOutput.children[i].setMeasureOutput(
        std::move(measureOutput), measureParams);

    const auto marginLeft =
        ResolveValueMargin(child.getMargin(Edge::Left), nodeWidth);
    const auto marginTop =
        ResolveValueMargin(child.getMargin(Edge::Top), nodeWidth);
    const auto marginRight =
        ResolveValueMargin(child.getMargin(Edge::Right), nodeWidth);
    const auto marginBottom =
        ResolveValueMargin(child.getMargin(Edge::Bottom), nodeWidth);

    const auto marginStartMain = [&]() {
      switch (mainAxis) {
        case FlexDirection::Row:
          return marginLeft;
        case FlexDirection::RowReverse:
          return marginRight;
        case FlexDirection::Column:
          return marginTop;
        case FlexDirection::ColumnReverse:
          return marginBottom;
      }
    }();
    const auto marginEndMain = [&]() {
      switch (mainAxis) {
        case FlexDirection::Row:
          return marginRight;
        case FlexDirection::RowReverse:
          return marginLeft;
        case FlexDirection::Column:
          return marginBottom;
        case FlexDirection::ColumnReverse:
          return marginTop;
      }
    }();
    const auto marginStartCross = [&]() {
      switch (crossAxis) {
        case FlexDirection::Row:
          return marginLeft;
        case FlexDirection::RowReverse:
          return marginRight;
        case FlexDirection::Column:
        case FlexDirection::ColumnReverse:
          return marginTop;
      }
    }();
    const auto marginEndCross = [&]() {
      switch (crossAxis) {
        case FlexDirection::Row:
          return marginRight;
        case FlexDirection::RowReverse:
          return marginLeft;
        case FlexDirection::Column:
        case FlexDirection::ColumnReverse:
          return marginBottom;
      }
    }();

    const auto freeMainSpace =
        (isMainAxisRow ? nodeWidth : nodeHeight) - measuredMainSize;
    const auto freeCrossSpace =
        (isMainAxisRow ? nodeHeight : nodeWidth) - measuredCrossSize;
    // do main axis alignment on absolute child
    // do cross axis alignment on absolute child

    const auto offsetMain = [&]() {
      if (isDefined(startMain)) {
        return startMain + borderStartMain + marginStartMain;
      }
      if (isDefined(endMain)) {
        return freeMainSpace - endMain - borderEndMain - marginEndMain;
      }
      switch (node.justifyContent) {
        case JustifyContent::FlexStart:
        case JustifyContent::SpaceBetween:
          return marginStartMain +
              (isMainAxisRow
                   ? paddingAndBorder[static_cast<size_t>(Edge::Left)]
                   : paddingAndBorder[static_cast<size_t>(Edge::Top)]);
        case JustifyContent::FlexEnd:
          return freeMainSpace -
              (isMainAxisRow
                   ? paddingAndBorder[static_cast<size_t>(Edge::Right)]
                   : paddingAndBorder[static_cast<size_t>(Edge::Bottom)]);
        case JustifyContent::SpaceEvenly:
        case JustifyContent::SpaceAround:
        case JustifyContent::Center:
          return freeMainSpace / 2;
      }
    }();

    const auto mainStartEdgeOfContainer =
        mainAxis == FlexDirection::RowReverse ? nodeWidth : 0;
    const auto directionalOffsetFromMainStartEdgeOfContainer =
        mainAxis == FlexDirection::RowReverse ? -offsetMain : offsetMain;
    nodeLayoutOutput.children[i].setStartPositionOnAxis(
        mainStartEdgeOfContainer +
            directionalOffsetFromMainStartEdgeOfContainer,
        mainAxis);

    const auto isWrapReverse = node.flexWrap == FlexWrap::WrapReverse;
    const auto offsetCross = [&]() {
      if (isDefined(startCross)) {
        return startCross + borderStartCross + marginStartCross;
      }
      if (isDefined(endCross)) {
        return freeCrossSpace - endCross - borderEndCross - marginEndCross;
      }

      const auto alignItem = ResolveAlignment(child.alignSelf, node.alignItems);
      switch (alignItem) {
        // Absolutely-positioned children are considered to be “fixed-size”,
        // so a value of 'stretch' is treated the same as 'flex-start'. See
        // https://www.w3.org/TR/css-flexbox-1/#abspos-items
        case AlignItems::FlexStart:
        case AlignItems::Stretch:
          // https://www.w3.org/TR/CSS2/visudet.html#abs-non-replaced-width
          return marginStartCross +
              (isWrapReverse ? freeCrossSpace -
                       getTrailingPaddingAndBorder(
                                   node, crossAxis, availableInnerWidth)
                             : getLeadingPaddingAndBorder(
                                   node, crossAxis, availableInnerWidth));
        case AlignItems::FlexEnd:
          return isWrapReverse
              ? getLeadingPaddingAndBorder(node, crossAxis, availableInnerWidth)
              : freeCrossSpace -
                  getTrailingPaddingAndBorder(
                      node, crossAxis, availableInnerWidth);
        case AlignItems::Center:
        case AlignItems::Baseline:
          return freeCrossSpace / 2;
      }
    }();

    const auto crossStartEdgeOfContainer =
        crossAxis == FlexDirection::RowReverse ? nodeWidth : 0;
    const auto directionalOffsetFromCrossStartEdgeOfContainer =
        crossAxis == FlexDirection::RowReverse ? -offsetCross : offsetCross;
    nodeLayoutOutput.children[i].setStartPositionOnAxis(
        crossStartEdgeOfContainer +
            directionalOffsetFromCrossStartEdgeOfContainer,
        crossAxis);
  }

  for (auto i = std::size_t{0}; i < children.size(); ++i) {
    // Because we never invoke the measure function for children with
    // Display::None their size needs to be set to zero explicitly.
    if (children[i].display == Display::None) {
      nodeLayoutOutput.children[i].width = 0;
      nodeLayoutOutput.children[i].height = 0;
    }
  }

  return nodeLayoutOutput;
}
} // namespace algo
} // namespace flexlayout
} // namespace facebook
