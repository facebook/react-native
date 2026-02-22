/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/node/Node.h>
#include <yoga/style/GridLine.h>
#include <array>
#include <cstdint>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace facebook::yoga {

struct OccupancyGrid {
  std::unordered_map<int32_t, std::vector<std::pair<int32_t, int32_t>>>
      rowIntervals;

  void markOccupied(
      int32_t rowStart,
      int32_t rowEnd,
      int32_t colStart,
      int32_t colEnd) {
    for (int32_t row = rowStart; row < rowEnd; row++) {
      rowIntervals[row].emplace_back(colStart, colEnd);
    }
  }

  bool hasOverlap(
      int32_t rowStart,
      int32_t rowEnd,
      int32_t colStart,
      int32_t colEnd) const {
    for (int32_t row = rowStart; row < rowEnd; row++) {
      auto it = rowIntervals.find(row);
      if (it == rowIntervals.end()) {
        continue;
      }
      for (const auto& interval : it->second) {
        if (interval.first < colEnd && interval.second > colStart) {
          return true;
        }
      }
    }
    return false;
  }
};

struct GridItemTrackPlacement {
  int32_t start = 0;
  int32_t end = 0;
  int32_t span = 1;
  // https://www.w3.org/TR/css-grid-1/#grid-placement-errors
  static GridItemTrackPlacement resolveLinePlacement(
      const GridLine& startLine,
      const GridLine& endLine,
      int32_t explicitLineCount) {
    GridItemTrackPlacement placement;

    auto resolveNegativeLineValue = [](int32_t lineValue,
                                       int32_t explicitLineCount) -> int32_t {
      return lineValue < 0 ? explicitLineCount + lineValue + 1 : lineValue;
    };

    // If the placement for a grid item contains two lines
    if (startLine.type == GridLineType::Integer &&
        endLine.type == GridLineType::Integer) {
      // if lines are negative, we count it from the last line. e.g. -1 is the
      // last line
      auto normalizedStartLine =
          resolveNegativeLineValue(startLine.integer, explicitLineCount);
      auto normalizedEndLine =
          resolveNegativeLineValue(endLine.integer, explicitLineCount);
      // and the start line is further end-ward than the end line, swap the two
      // lines.
      if (normalizedStartLine > normalizedEndLine) {
        placement.start = normalizedEndLine;
        placement.end = normalizedStartLine;
        placement.span = placement.end - placement.start;
      }
      // If the start line is equal to the end line, remove the end line.
      else if (normalizedStartLine == normalizedEndLine) {
        placement.start = normalizedStartLine;
        placement.end = normalizedStartLine + 1;
        placement.span = 1;
      } else {
        placement.start = normalizedStartLine;
        placement.end = normalizedEndLine;
        placement.span = placement.end - placement.start;
      }
    }
    // If the placement contains two spans, remove the one contributed by the
    // end grid-placement property.
    else if (
        startLine.type == GridLineType::Span &&
        endLine.type == GridLineType::Span) {
      placement.start = 0;
      placement.end = 0;
      placement.span = startLine.integer;
    }

    else if (
        startLine.type == GridLineType::Integer &&
        endLine.type == GridLineType::Span) {
      auto normalizedStartLine =
          resolveNegativeLineValue(startLine.integer, explicitLineCount);
      placement.start = normalizedStartLine;
      placement.span = endLine.integer;
      placement.end = placement.start + placement.span;
    }

    else if (
        startLine.type == GridLineType::Span &&
        endLine.type == GridLineType::Integer) {
      auto normalizedEndLine =
          resolveNegativeLineValue(endLine.integer, explicitLineCount);
      placement.end = normalizedEndLine;
      placement.span = startLine.integer;
      placement.start = placement.end - placement.span;
    }

    else if (startLine.type == GridLineType::Integer) {
      auto normalizedStartLine =
          resolveNegativeLineValue(startLine.integer, explicitLineCount);
      placement.start = normalizedStartLine;
      placement.span = 1;
      placement.end = placement.start + placement.span;
    }

    else if (startLine.type == GridLineType::Span) {
      placement.span = startLine.integer;
      placement.start = 0;
      placement.end = 0;
    }

    else if (endLine.type == GridLineType::Integer) {
      auto normalizedEndLine =
          resolveNegativeLineValue(endLine.integer, explicitLineCount);
      placement.end = normalizedEndLine;
      placement.span = 1;
      placement.start = placement.end - placement.span;
    }

    else if (endLine.type == GridLineType::Span) {
      placement.span = endLine.integer;
      placement.start = 0;
      placement.end = 0;
    }

    else {
      placement.start = 0;
      placement.end = 0;
      placement.span = 1;
    }

    // we want 0 based indexing, so we subtract 1. Negative values will imply
    // auto implicit grid lines
    placement.start = placement.start - 1;
    placement.end = placement.end - 1;

    return placement;
  }
};

struct AutoPlacement {
  struct AutoPlacementItem {
    int32_t columnStart;
    int32_t columnEnd;
    int32_t rowStart;
    int32_t rowEnd;

    yoga::Node* node;

    bool overlaps(const AutoPlacementItem& other) const {
      return columnStart < other.columnEnd && columnEnd > other.columnStart &&
          rowStart < other.rowEnd && rowEnd > other.rowStart;
    }
  };

  std::vector<AutoPlacementItem> gridItems;
  int32_t minColumnStart;
  int32_t minRowStart;
  int32_t maxColumnEnd;
  int32_t maxRowEnd;

  static AutoPlacement performAutoPlacement(yoga::Node* node) {
    std::vector<AutoPlacementItem> gridItems;
    gridItems.reserve(node->getChildCount());
    std::unordered_set<yoga::Node*> placedItems;
    placedItems.reserve(node->getChildCount());
    int32_t minColumnStart = 0;
    int32_t minRowStart = 0;
    int32_t maxColumnEnd =
        static_cast<int32_t>(node->style().gridTemplateColumns().size());
    int32_t maxRowEnd =
        static_cast<int32_t>(node->style().gridTemplateRows().size());
    OccupancyGrid occupancy;

    // function to push back a grid item placement and record the min/max
    // column/row start/end
    auto recordGridArea = [&](AutoPlacementItem& gridItemArea) {
      yoga::assertFatal(
          gridItemArea.columnEnd > gridItemArea.columnStart,
          "Grid item column end must be greater than column start");
      yoga::assertFatal(
          gridItemArea.rowEnd > gridItemArea.rowStart,
          "Grid item row end must be greater than row start");
      gridItems.push_back(gridItemArea);
      placedItems.insert(gridItemArea.node);
      occupancy.markOccupied(
          gridItemArea.rowStart,
          gridItemArea.rowEnd,
          gridItemArea.columnStart,
          gridItemArea.columnEnd);
      minColumnStart = std::min(minColumnStart, gridItemArea.columnStart);
      minRowStart = std::min(minRowStart, gridItemArea.rowStart);
      maxColumnEnd = std::max(maxColumnEnd, gridItemArea.columnEnd);
      maxRowEnd = std::max(maxRowEnd, gridItemArea.rowEnd);
    };

    auto explicitColumnLineCount =
        static_cast<int32_t>(node->style().gridTemplateColumns().size() + 1);
    auto explicitRowLineCount =
        static_cast<int32_t>(node->style().gridTemplateRows().size() + 1);

    // Step 1: Position anything that's not auto-positioned.
    // In spec level 1, span is always definite. Default is 1.
    // So for grid position to be definite, we need either start or end to be
    // definite.
    for (auto child : node->getLayoutChildren()) {
      if (child->style().positionType() == PositionType::Absolute ||
          child->style().display() == Display::None) {
        continue;
      }

      auto gridItemColumnStart = child->style().gridColumnStart();
      auto gridItemColumnEnd = child->style().gridColumnEnd();
      auto gridItemRowStart = child->style().gridRowStart();
      auto gridItemRowEnd = child->style().gridRowEnd();
      auto hasDefiniteColumn =
          gridItemColumnStart.type == GridLineType::Integer ||
          gridItemColumnEnd.type == GridLineType::Integer;
      auto hasDefiniteRow = gridItemRowStart.type == GridLineType::Integer ||
          gridItemRowEnd.type == GridLineType::Integer;

      auto hasDefinitePosition = hasDefiniteColumn && hasDefiniteRow;

      if (hasDefinitePosition) {
        auto columnPlacement = GridItemTrackPlacement::resolveLinePlacement(
            gridItemColumnStart, gridItemColumnEnd, explicitColumnLineCount);
        auto rowPlacement = GridItemTrackPlacement::resolveLinePlacement(
            gridItemRowStart, gridItemRowEnd, explicitRowLineCount);

        auto columnStart = columnPlacement.start;
        auto columnEnd = columnPlacement.end;

        auto rowStart = rowPlacement.start;
        auto rowEnd = rowPlacement.end;

        auto gridItemArea = AutoPlacementItem{
            .columnStart = columnStart,
            .columnEnd = columnEnd,
            .rowStart = rowStart,
            .rowEnd = rowEnd,
            .node = child};
        recordGridArea(gridItemArea);
      }
    }

    // Step 2: Process the items locked to a given row.
    // Definite row positions only, exclude items with definite column
    // positions.
    std::unordered_map<int32_t, int32_t> rowStartToColumnStartCache;
    for (auto child : node->getLayoutChildren()) {
      if (child->style().positionType() == PositionType::Absolute ||
          child->style().display() == Display::None) {
        continue;
      }

      auto gridItemColumnStart = child->style().gridColumnStart();
      auto gridItemColumnEnd = child->style().gridColumnEnd();
      auto gridItemRowStart = child->style().gridRowStart();
      auto gridItemRowEnd = child->style().gridRowEnd();
      auto hasDefiniteRow = gridItemRowStart.type == GridLineType::Integer ||
          gridItemRowEnd.type == GridLineType::Integer;
      auto hasDefiniteColumn =
          gridItemColumnStart.type == GridLineType::Integer ||
          gridItemColumnEnd.type == GridLineType::Integer;

      if (hasDefiniteRow && !hasDefiniteColumn) {
        auto rowPlacement = GridItemTrackPlacement::resolveLinePlacement(
            gridItemRowStart, gridItemRowEnd, explicitRowLineCount);

        auto rowStart = rowPlacement.start;
        auto rowEnd = rowPlacement.end;

        auto columnStart = rowStartToColumnStartCache.contains(rowStart)
            ? rowStartToColumnStartCache[rowStart]
            : minColumnStart;

        auto columnPlacement = GridItemTrackPlacement::resolveLinePlacement(
            gridItemColumnStart, gridItemColumnEnd, explicitColumnLineCount);
        auto columnSpan = columnPlacement.span;
        auto columnEnd = columnStart + columnSpan;

        bool placed = false;
        while (!placed) {
          auto gridItemArea = AutoPlacementItem{
              .columnStart = columnStart,
              .columnEnd = columnEnd,
              .rowStart = rowStart,
              .rowEnd = rowEnd,
              .node = child};
          if (occupancy.hasOverlap(rowStart, rowEnd, columnStart, columnEnd)) {
            columnStart++;
            columnEnd = columnStart + columnSpan;
          } else {
            recordGridArea(gridItemArea);
            rowStartToColumnStartCache[rowStart] = columnEnd;
            placed = true;
          }
        }
      }
    }

    // Step 3: Determine the columns in the implicit grid.
    // TODO: we dont need this loop. we can do it in above steps. But keeping it
    // for now, to match the spec.
    auto largestColumnSpan = 1;
    for (auto child : node->getLayoutChildren()) {
      if (child->style().positionType() == PositionType::Absolute ||
          child->style().display() == Display::None) {
        continue;
      }

      auto gridItemColumnStart = child->style().gridColumnStart();
      auto gridItemColumnEnd = child->style().gridColumnEnd();

      auto hasDefiniteColumn =
          gridItemColumnStart.type == GridLineType::Integer ||
          gridItemColumnEnd.type == GridLineType::Integer;

      if (hasDefiniteColumn) {
        auto columnPlacement = GridItemTrackPlacement::resolveLinePlacement(
            gridItemColumnStart, gridItemColumnEnd, explicitColumnLineCount);

        auto columnStart = columnPlacement.start;
        auto columnEnd = columnPlacement.end;

        minColumnStart = std::min(minColumnStart, columnStart);
        maxColumnEnd = std::max(maxColumnEnd, columnEnd);
      } else {
        auto columnPlacement = GridItemTrackPlacement::resolveLinePlacement(
            gridItemColumnStart, gridItemColumnEnd, explicitColumnLineCount);
        largestColumnSpan = std::max(largestColumnSpan, columnPlacement.span);
      }
    }

    // If largest span is larger than current grid width, extend the end
    auto currentGridWidth = maxColumnEnd - minColumnStart;
    if (largestColumnSpan > currentGridWidth) {
      maxColumnEnd = minColumnStart + largestColumnSpan;
    }

    // Step 4: Position the remaining grid items.
    std::array<int32_t, 2> autoPlacementCursor = {minColumnStart, minRowStart};
    for (auto child : node->getLayoutChildren()) {
      if (child->style().positionType() == PositionType::Absolute ||
          child->style().display() == Display::None) {
        continue;
      }

      if (!placedItems.contains(child)) {
        auto gridItemColumnStart = child->style().gridColumnStart();
        auto gridItemColumnEnd = child->style().gridColumnEnd();
        auto hasDefiniteColumn =
            gridItemColumnStart.type == GridLineType::Integer ||
            gridItemColumnEnd.type == GridLineType::Integer;

        auto gridItemRowStart = child->style().gridRowStart();
        auto gridItemRowEnd = child->style().gridRowEnd();
        auto hasDefiniteRow = gridItemRowStart.type == GridLineType::Integer ||
            gridItemRowEnd.type == GridLineType::Integer;

        auto columnPlacement = GridItemTrackPlacement::resolveLinePlacement(
            gridItemColumnStart, gridItemColumnEnd, explicitColumnLineCount);
        auto rowPlacement = GridItemTrackPlacement::resolveLinePlacement(
            gridItemRowStart, gridItemRowEnd, explicitRowLineCount);

        // If the item has a definite column position:
        if (hasDefiniteColumn) {
          auto columnStart = columnPlacement.start;
          auto columnEnd = columnPlacement.end;

          // Set cursor column position to item's column-start line
          auto previousColumnPosition = autoPlacementCursor[0];
          autoPlacementCursor[0] = columnStart;

          // If this is less than previous column position, increment row
          if (autoPlacementCursor[0] < previousColumnPosition) {
            autoPlacementCursor[1]++;
          }

          // Find a row position where the item doesn't overlap occupied cells
          bool foundPosition = false;
          auto rowSpan = rowPlacement.span;
          while (!foundPosition) {
            auto proposedRowStart = autoPlacementCursor[1];
            auto proposedRowEnd = proposedRowStart + rowSpan;

            // Check for overlaps with already placed items
            AutoPlacementItem proposedPlacement{
                .columnStart = columnStart,
                .columnEnd = columnEnd,
                .rowStart = proposedRowStart,
                .rowEnd = proposedRowEnd,
                .node = child};

            if (occupancy.hasOverlap(
                    proposedRowStart, proposedRowEnd, columnStart, columnEnd)) {
              autoPlacementCursor[1]++;
            } else {
              recordGridArea(proposedPlacement);
              foundPosition = true;
            }
          }
        }

        // If the item has an automatic grid position in both axes:
        else if (!hasDefiniteRow && !hasDefiniteColumn) {
          auto itemColumnSpan = columnPlacement.span;
          auto itemRowSpan = rowPlacement.span;

          bool foundPosition = false;
          while (!foundPosition) {
            // Try to find a position starting from current cursor position
            while (autoPlacementCursor[0] + itemColumnSpan <= maxColumnEnd) {
              auto columnStart = autoPlacementCursor[0];
              auto columnEnd = columnStart + itemColumnSpan;
              auto rowStart = autoPlacementCursor[1];
              auto rowEnd = rowStart + itemRowSpan;

              AutoPlacementItem proposedPlacement{
                  .columnStart = columnStart,
                  .columnEnd = columnEnd,
                  .rowStart = rowStart,
                  .rowEnd = rowEnd,
                  .node = child};

              if (occupancy.hasOverlap(
                      rowStart, rowEnd, columnStart, columnEnd)) {
                autoPlacementCursor[0]++;
              } else {
                recordGridArea(proposedPlacement);
                foundPosition = true;
                break;
              }
            }

            if (!foundPosition) {
              // Cursor column position + span would overflow, move to next row
              autoPlacementCursor[1]++;
              autoPlacementCursor[0] = minColumnStart;
            }
          }
        }
      }
    }

    return AutoPlacement{
        std::move(gridItems),
        minColumnStart,
        minRowStart,
        maxColumnEnd,
        maxRowEnd};
  }
};

struct GridItem {
  size_t columnStart;
  size_t columnEnd;
  size_t rowStart;
  size_t rowEnd;
  yoga::Node* node;
  // additional space added to align baselines
  // https://www.w3.org/TR/css-grid-1/#algo-baseline-shims
  float baselineShim = 0.0f;
  // Flags used for optimisations in TrackSizing
  bool crossesIntrinsicRow = false;
  bool crossesIntrinsicColumn = false;
  bool crossesFlexibleRow = false;
  bool crossesFlexibleColumn = false;

  GridItem(
      size_t columnStart,
      size_t columnEnd,
      size_t rowStart,
      size_t rowEnd,
      yoga::Node* node,
      float baselineShim = 0.0f)
      : columnStart(columnStart),
        columnEnd(columnEnd),
        rowStart(rowStart),
        rowEnd(rowEnd),
        node(node),
        baselineShim(baselineShim) {}

  bool crossesIntrinsicTrack(Dimension dimension) const {
    return dimension == Dimension::Width ? crossesIntrinsicColumn
                                         : crossesIntrinsicRow;
  }
  bool crossesFlexibleTrack(Dimension dimension) const {
    return dimension == Dimension::Width ? crossesFlexibleColumn
                                         : crossesFlexibleRow;
  }
};

// Baseline sharing groups - items grouped by their starting row for resolve
// intrinsic size step in TrackSizing
// https://www.w3.org/TR/css-grid-1/#algo-baseline-shims
using BaselineItemGroups = std::map<size_t, std::vector<GridItem*>>;

struct ResolvedAutoPlacement {
  std::vector<GridItem> gridItems;
  BaselineItemGroups baselineItemGroups;
  int32_t minColumnStart;
  int32_t minRowStart;
  int32_t maxColumnEnd;
  int32_t maxRowEnd;

  // Offset column and row so they starts at 0 index
  // also casts start and end values from int32_t to size_t
  static ResolvedAutoPlacement resolveGridItemPlacements(Node* node) {
    auto autoPlacement = AutoPlacement::performAutoPlacement(node);

    auto minColumnStart = autoPlacement.minColumnStart;
    auto minRowStart = autoPlacement.minRowStart;
    auto maxColumnEnd = autoPlacement.maxColumnEnd;
    auto maxRowEnd = autoPlacement.maxRowEnd;

    std::vector<GridItem> resolvedAreas;
    resolvedAreas.reserve(autoPlacement.gridItems.size());

    BaselineItemGroups baselineGroups;
    auto alignItems = node->style().alignItems();

    for (auto& placement : autoPlacement.gridItems) {
      resolvedAreas.emplace_back(
          static_cast<size_t>(placement.columnStart - minColumnStart),
          static_cast<size_t>(placement.columnEnd - minColumnStart),
          static_cast<size_t>(placement.rowStart - minRowStart),
          static_cast<size_t>(placement.rowEnd - minRowStart),
          placement.node);

      auto& item = resolvedAreas.back();
      auto alignSelf = item.node->style().alignSelf();
      if (alignSelf == Align::Auto) {
        alignSelf = alignItems;
      }
      bool spansOneRow = (item.rowEnd - item.rowStart) == 1;
      if (alignSelf == Align::Baseline && spansOneRow) {
        baselineGroups[item.rowStart].push_back(&item);
      }

      // TODO: find a better place to call this
      placement.node->processDimensions();
    }

    return ResolvedAutoPlacement{
        .gridItems = std::move(resolvedAreas),
        .baselineItemGroups = std::move(baselineGroups),
        .minColumnStart = minColumnStart,
        .minRowStart = minRowStart,
        .maxColumnEnd = maxColumnEnd,
        .maxRowEnd = maxRowEnd};
  }
};

} // namespace facebook::yoga
