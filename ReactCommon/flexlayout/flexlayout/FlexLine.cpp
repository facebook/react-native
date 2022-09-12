/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FlexLine.h"

#include <algorithm>
#include <functional>
#include <numeric>

namespace facebook {
namespace flexlayout {
namespace algo {

template <typename Range, typename Result, typename Map, typename Reduce>
auto mapReduce(const Range& range, Result initial, Map map, Reduce reduce) {
  return std::inner_product(
      std::cbegin(range),
      std::cend(range),
      std::cbegin(range),
      initial,
      reduce,
      [&](const auto& x, const auto&) { return map(x); });
}

template <typename Range, typename Predicate>
auto any_of(const Range& range, Predicate predicate) {
  return std::any_of(std::cbegin(range), std::cend(range), predicate);
}

namespace {
// Stores extra bits of information for each flex item used when resolving
// flexible lengths but not used afterwards
struct Item {
  enum class Violation { None, Min, Max };

  FlexItem& flexItem;
  bool isFrozen = false;
  Violation violation = Violation::None;
};
} // namespace

static auto calculateRemainingFreeSpace(
    const std::vector<Item>& items,
    const FlexDirection mainAxis,
    const Float availableInnerMainDim,
    const Float availableInnerWidth,
    const bool sizeBasedOnContent) -> Float {
  if (sizeBasedOnContent || isUndefined(availableInnerMainDim)) {
    return 0.0f;
  }
  // Sum the outer sizes of all items on the line...
  const auto sumOfOuterSizes = mapReduce(
      items,
      0.0f,
      [&](const Item& item) {
        // For frozen items, use their outer target main size; for other
        // items, use their outer flex base size.
        const auto innerSize = item.isFrozen ? item.flexItem.targetMainSize
                                             : item.flexItem.computedFlexBasis;
        const auto margin = item.flexItem.flexItemStyle.getMarginForAxis(
            mainAxis, availableInnerWidth);
        return innerSize + margin;
      },
      std::plus<>{});
  // ...and subtract this from the flex container’s inner main size.
  return availableInnerMainDim - sumOfOuterSizes;
}

auto FlexLine::resolveFlexibleLengths(
    const FlexDirection mainAxis,
    const Float availableInnerMainDim,
    const Float availableInnerWidth,
    const bool sizeBasedOnContent) -> Float {
  enum class FlexFactor { Grow, Shrink };

  // 1. Determine the used flex factor.
  const auto usedFlexFactor = [&]() {
    if (sizeBasedOnContent || isUndefined(availableInnerMainDim)) {
      return FlexFactor::Shrink;
    }

    // Sum the outer hypothetical main sizes of all items on the line.
    const auto sumOfOuterHypotheticalMainSizes = mapReduce(
        flexItems,
        0.0f,
        [&](const FlexItem& item) {
          const auto hypotheticalMainSize = item.flexItemStyle.nodeBoundAxis(
              mainAxis, item.computedFlexBasis, availableInnerMainDim);
          const auto margin = item.flexItemStyle.getMarginForAxis(
              mainAxis, availableInnerWidth);
          return hypotheticalMainSize + margin;
        },
        std::plus<>{});

    // If the sum is less than the flex container’s inner main size, use the
    // flex grow factor for the rest of this algorithm; otherwise, use the flex
    // shrink factor.
    return sumOfOuterHypotheticalMainSizes < availableInnerMainDim
        ? FlexFactor::Grow
        : FlexFactor::Shrink;
  }();

  auto items = std::vector<Item>{};
  for (auto& flexItem : flexItems) {
    items.push_back({flexItem});
  }

  // 2. Size inflexible items. Freeze, setting its target main size to its
  // hypothetical main size…
  for (auto& item : items) {
    const auto& style = item.flexItem.flexItemStyle;
    const auto flexFactor = [&]() {
      switch (usedFlexFactor) {
        case FlexFactor::Grow:
          return style.flexGrow;
        case FlexFactor::Shrink:
          return style.flexShrink;
      }
    }();

    // any item that has a flex factor of zero
    const auto flexFactorIsZero = flexFactor == 0.0f;
    // if using the flex grow factor: any item that has a flex base size greater
    // than its hypothetical main size
    const auto flexBaseSize = item.flexItem.computedFlexBasis;
    const auto hypotheticalMainSize =
        style.nodeBoundAxis(mainAxis, flexBaseSize, availableInnerMainDim);
    const auto usingFlexGrowAndBaseSizeLargerThanHypothetical =
        usedFlexFactor == FlexFactor::Grow &&
        flexBaseSize > hypotheticalMainSize;
    // if using the flex shrink factor: any item that has a flex base size
    // smaller than its hypothetical main size
    const auto usingFlexShrinkAndBaseSizeSmallerThanHypothetical =
        usedFlexFactor == FlexFactor::Shrink &&
        flexBaseSize < hypotheticalMainSize;

    if (flexFactorIsZero || usingFlexGrowAndBaseSizeLargerThanHypothetical ||
        usingFlexShrinkAndBaseSizeSmallerThanHypothetical) {
      item.isFrozen = true;
      item.flexItem.targetMainSize = hypotheticalMainSize;
    }
  }

  // 3. Calculate initial free space.
  const auto initialFreeSpace = calculateRemainingFreeSpace(
      items,
      mainAxis,
      availableInnerMainDim,
      availableInnerWidth,
      sizeBasedOnContent);

  // 4. Loop:
  // a. Check for flexible items. If all the flex items on the line are
  // frozen, free space has been distributed; exit this loop.
  while (any_of(items, [](const Item& item) { return !item.isFrozen; })) {
    // Calculate the remaining free space as for initial free space, above.
    auto remainingFreeSpace = calculateRemainingFreeSpace(
        items,
        mainAxis,
        availableInnerMainDim,
        availableInnerWidth,
        sizeBasedOnContent);

    const auto totalFlexFactorOfUnfrozenItems = mapReduce(
        items,
        0.0f,
        [&](const Item& item) {
          if (item.isFrozen) {
            return 0.0f;
          }
          const auto& flexItemStyle = item.flexItem.flexItemStyle;
          switch (usedFlexFactor) {
            case FlexFactor::Grow:
              return flexItemStyle.flexGrow;
            case FlexFactor::Shrink:
              return flexItemStyle.flexShrink * item.flexItem.computedFlexBasis;
          }
        },
        std::plus<>{});

    // If the sum of the unfrozen flex items’ flex factors is less than one
    if (totalFlexFactorOfUnfrozenItems < 1) {
      // multiply the initial free space by this sum. If the magnitude of this
      // value is less than the magnitude of the remaining free space...
      if (initialFreeSpace * totalFlexFactorOfUnfrozenItems <
          remainingFreeSpace) {
        // use this as the remaining free space.
        remainingFreeSpace = initialFreeSpace * totalFlexFactorOfUnfrozenItems;
      }
    }

    auto totalViolation = 0.0f;
    for (auto& item : items) {
      if (item.isFrozen) {
        continue;
      }

      const auto& style = item.flexItem.flexItemStyle;
      const auto flexBaseSize = item.flexItem.computedFlexBasis;
      // c. Distribute free space proportional to the flex factors.
      const auto targetMainSize = [&]() {
        if (remainingFreeSpace == 0.0f ||
            totalFlexFactorOfUnfrozenItems == 0.0f) {
          return flexBaseSize;
        }

        switch (usedFlexFactor) {
            // If using the flex grow factor
          case FlexFactor::Grow: {
            // Find the ratio of the item’s flex grow factor to the sum of the
            // flex grow factors of all unfrozen items on the line.
            const auto ratio = style.flexGrow / totalFlexFactorOfUnfrozenItems;
            // Set the item’s target main size to its flex base size plus a
            // fraction of the remaining free space proportional to the ratio.
            return flexBaseSize + ratio * remainingFreeSpace;
          }
          case FlexFactor::Shrink: {
            // For every unfrozen item on the line, multiply its flex shrink
            // factor by its inner flex base size, and note this as its scaled
            // flex shrink factor.
            const auto scaledFlexShrinkFactor = style.flexShrink * flexBaseSize;
            // Find the ratio of the item’s scaled flex shrink factor to the
            // sum of the scaled flex shrink factors of all unfrozen items on
            // the line.
            const auto ratio =
                scaledFlexShrinkFactor / totalFlexFactorOfUnfrozenItems;
            // Set the item’s target main size to its flex base size minus a
            // fraction of the absolute value of the remaining free space
            // proportional to the ratio.
            return flexBaseSize - ratio * std::abs(remainingFreeSpace);
          }
        }
      }();

      // Clamp each non-frozen item’s target main size by its used min and max
      // main sizes and floor its content-box size at zero.
      const auto clampedTargetMainSize =
          style.nodeBoundAxis(mainAxis, targetMainSize, availableInnerMainDim);

      // d. Fix min/max violations.
      if (clampedTargetMainSize > targetMainSize) {
        // If the item’s target main size was made larger by this, it’s a min
        // violation.
        item.violation = Item::Violation::Min;
      } else if (clampedTargetMainSize < targetMainSize) {
        // If the item’s target main size was made smaller by this, it’s a max
        // violation.
        item.violation = Item::Violation::Max;
      } else {
        item.violation = Item::Violation::None;
      }

      // The total violation is the sum of the adjustments from the previous
      // step ∑(clamped size - unclamped size).
      totalViolation += clampedTargetMainSize - targetMainSize;
      item.flexItem.targetMainSize = clampedTargetMainSize;
    }

    // e: Freeze over-flexed items.
    const auto totalViolationIsZero = totalViolation == 0.0f;
    for (auto& item : items) {
      // If the total violation is:
      // Zero: Freeze all items.
      // Positive: Freeze all the items with min violations.
      const auto itemWithMinViolationAndPositiveTotalViolation =
          totalViolation > 0.0f && item.violation == Item::Violation::Min;
      // Negative: Freeze all the items with max violations.
      const auto itemWithMaxViolationAndNegativeTotalViolation =
          totalViolation < 0.0f && item.violation == Item::Violation::Max;

      if (totalViolationIsZero ||
          itemWithMinViolationAndPositiveTotalViolation ||
          itemWithMaxViolationAndNegativeTotalViolation) {
        item.isFrozen = true;
      }
    }
  }

  return calculateRemainingFreeSpace(
      items,
      mainAxis,
      availableInnerMainDim,
      availableInnerWidth,
      sizeBasedOnContent);
}

} // namespace algo
} // namespace flexlayout
} // namespace facebook
