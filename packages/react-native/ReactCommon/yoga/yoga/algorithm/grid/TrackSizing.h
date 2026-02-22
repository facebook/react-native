/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/algorithm/Align.h>
#include <yoga/algorithm/Baseline.h>
#include <yoga/algorithm/BoundAxis.h>
#include <yoga/algorithm/CalculateLayout.h>
#include <yoga/algorithm/grid/GridLayout.h>
#include <yoga/numeric/Comparison.h>
#include <yoga/style/StyleSizeLength.h>
#include <map>
#include <unordered_map>
#include <unordered_set>

namespace facebook::yoga {

struct TrackSizing {
  enum class AffectedSize { BaseSize, GrowthLimit };

  struct ContentDistribution {
    float startOffset = 0.0f;
    float betweenTracksOffset = 0.0f;
    float effectiveGap = 0.0f;
  };

  struct ItemConstraint {
    float width;
    float height;
    SizingMode widthSizingMode;
    SizingMode heightSizingMode;
    float containingBlockWidth;
    float containingBlockHeight;
  };

  using CrossDimensionEstimator = std::function<float(const GridItem&)>;

  struct ItemSizeContribution {
    const GridItem* item;
    std::vector<GridTrackSize*> affectedTracks;
    float sizeContribution;

    ItemSizeContribution(
        const GridItem* item,
        const std::vector<GridTrackSize*>& affectedTracks,
        float sizeContribution)
        : item(item),
          affectedTracks(affectedTracks),
          sizeContribution(sizeContribution) {}
  };

  Node* node;
  std::vector<GridTrackSize>&
      columnTracks; // NOLINT(cppcoreguidelines-avoid-const-or-ref-data-members)
  std::vector<GridTrackSize>&
      rowTracks; // NOLINT(cppcoreguidelines-avoid-const-or-ref-data-members)
  float containerInnerWidth;
  float containerInnerHeight;
  std::vector<GridItem>&
      gridItems; // NOLINT(cppcoreguidelines-avoid-const-or-ref-data-members)
  SizingMode widthSizingMode;
  SizingMode heightSizingMode;
  Direction direction;
  float ownerWidth;
  float ownerHeight;
  LayoutData&
      layoutMarkerData; // NOLINT(cppcoreguidelines-avoid-const-or-ref-data-members)
  uint32_t depth;
  uint32_t generationCount;
  CrossDimensionEstimator crossDimensionEstimator;

  // below flags are used for optimization purposes
  bool hasPercentageColumnTracks = false;
  bool hasPercentageRowTracks = false;
  bool hasOnlyFixedTracks = false;
  bool hasIntrinsicTracks = false;
  bool hasFlexibleTracks = false;

  // Pre-computed baseline sharing groups
  BaselineItemGroups&
      baselineItemGroups; // NOLINT(cppcoreguidelines-avoid-const-or-ref-data-members)

  TrackSizing(
      yoga::Node* node,
      std::vector<GridTrackSize>& columnTracks,
      std::vector<GridTrackSize>& rowTracks,
      float containerInnerWidth,
      float containerInnerHeight,
      std::vector<GridItem>& gridItems,
      SizingMode widthSizingMode,
      SizingMode heightSizingMode,
      Direction direction,
      float ownerWidth,
      float ownerHeight,
      LayoutData& layoutMarkerData,
      uint32_t depth,
      uint32_t generationCount,
      BaselineItemGroups& baselineItemGroups)
      : node(node),
        columnTracks(columnTracks),
        rowTracks(rowTracks),
        containerInnerWidth(containerInnerWidth),
        containerInnerHeight(containerInnerHeight),
        gridItems(gridItems),
        widthSizingMode(widthSizingMode),
        heightSizingMode(heightSizingMode),
        direction(direction),
        ownerWidth(ownerWidth),
        ownerHeight(ownerHeight),
        layoutMarkerData(layoutMarkerData),
        depth(depth),
        generationCount(generationCount),
        baselineItemGroups(baselineItemGroups) {}

  // 11.1. Grid Sizing Algorithm
  // https://www.w3.org/TR/css-grid-1/#algo-grid-sizing
  void runGridSizingAlgorithm() {
    computeItemTrackCrossingFlags();

    // 1. First, the track sizing algorithm is used to resolve the sizes of the
    // grid columns.
    auto rowHeightFromFixedTracks = makeRowHeightEstimatorUsingFixedTracks(
        calculateEffectiveRowGapForEstimation());
    runTrackSizing(Dimension::Width, rowHeightFromFixedTracks);

    // 2. Next, the track sizing algorithm resolves the sizes of the grid rows.
    auto columnWidthFromBaseSizes = makeCrossDimensionEstimatorUsingBaseSize(
        Dimension::Width, calculateEffectiveGapFromBaseSizes(Dimension::Width));
    runTrackSizing(Dimension::Height, columnWidthFromBaseSizes);

    // 3. Then, if the min-content contribution of any grid item has changed
    // Only intrinsic tracks can affect the cross track size in above steps, so
    // this step is only needed if there are intrinsic tracks
    if (hasIntrinsicTracks) {
      auto rowHeightFromBaseSizes = makeCrossDimensionEstimatorUsingBaseSize(
          Dimension::Height,
          calculateEffectiveGapFromBaseSizes(Dimension::Height));
      if (contributionsChanged(
              Dimension::Width,
              rowHeightFromFixedTracks,
              rowHeightFromBaseSizes)) {
        runTrackSizing(Dimension::Width, rowHeightFromBaseSizes);
        // 4. Next, if the min-content contribution of any grid item has changed
        auto newColumnWidthFromBaseSizes =
            makeCrossDimensionEstimatorUsingBaseSize(
                Dimension::Width,
                calculateEffectiveGapFromBaseSizes(Dimension::Width));
        if (contributionsChanged(
                Dimension::Height,
                columnWidthFromBaseSizes,
                newColumnWidthFromBaseSizes)) {
          runTrackSizing(Dimension::Height, newColumnWidthFromBaseSizes);
        }
      }
    }
  }

  // 11.3. Track Sizing Algorithm
  // https://www.w3.org/TR/css-grid-1/#algo-track-sizing
  void runTrackSizing(
      Dimension dimension,
      CrossDimensionEstimator estimator = nullptr) {
    // Store the estimator for use in calculateItemConstraints
    crossDimensionEstimator = estimator;

    // Step 1: Initialize Track Sizes
    initializeTrackSizes(dimension);
    // Step 2: Resolve Intrinsic Track Sizes
    resolveIntrinsicTrackSizes(dimension);
    // Step 3: Maximize Track Sizes
    maximizeTrackSizes(dimension);
    // Step 4: Expand Flexible Tracks
    expandFlexibleTracks(dimension);
    // Step 5: Stretch Auto Tracks
    stretchAutoTracks(dimension);
  }

  // 11.4 Initialize Track Sizes
  // https://www.w3.org/TR/css-grid-1/#algo-init
  // Also sets some flags (hasPercentageTracks, hasOnlyFixedTracks) for
  // optimization purposes
  void initializeTrackSizes(Dimension dimension) {
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;
    bool& hasPercentageTracks = dimension == Dimension::Width
        ? hasPercentageColumnTracks
        : hasPercentageRowTracks;
    hasOnlyFixedTracks = true;
    hasIntrinsicTracks = false;
    hasFlexibleTracks = false;

    for (size_t i = 0; i < tracks.size(); i++) {
      auto& track = tracks[i];

      // detect percentage tracks for optimization purposes
      if (isPercentageSizingFunction(track.minSizingFunction) ||
          isPercentageSizingFunction(track.maxSizingFunction)) {
        hasPercentageTracks = true;
      }

      if (isFixedSizingFunction(track.minSizingFunction, containerSize)) {
        auto resolved = track.minSizingFunction.resolve(containerSize);
        track.baseSize = resolved.unwrap();
      } else if (isIntrinsicSizingFunction(
                     track.minSizingFunction, containerSize)) {
        track.baseSize = 0;
        hasOnlyFixedTracks = false;
        hasIntrinsicTracks = true;
      } else {
        // THIS SHOULD NEVER HAPPEN
        track.baseSize = 0;
      }

      if (isFixedSizingFunction(track.maxSizingFunction, containerSize)) {
        auto resolved = track.maxSizingFunction.resolve(containerSize);
        track.growthLimit = resolved.unwrap();
      } else if (isIntrinsicSizingFunction(
                     track.maxSizingFunction, containerSize)) {
        track.growthLimit = INFINITY;
        hasOnlyFixedTracks = false;
        hasIntrinsicTracks = true;
      } else if (isFlexibleSizingFunction(track.maxSizingFunction)) {
        track.growthLimit = INFINITY;
        hasOnlyFixedTracks = false;
        hasFlexibleTracks = true;
      } else {
        // THIS SHOULD NEVER HAPPEN
        track.growthLimit = INFINITY;
      }

      // In all cases, if the growth limit is less than the base size, increase
      // the growth limit to match the base size.
      if (track.growthLimit < track.baseSize) {
        track.growthLimit = track.baseSize;
      }

      // minmax(20px, 40px) type of tracks are not fixed tracks
      if (track.baseSize < track.growthLimit) {
        hasOnlyFixedTracks = false;
      }
    }
  }

  // 11.5 Resolve Intrinsic Track Sizes
  // https://www.w3.org/TR/css-grid-1/#algo-content
  void resolveIntrinsicTrackSizes(Dimension dimension) {
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;

    // Step 1: Shim baseline-aligned items (only for height dimension i.e.
    // align-items/align-self)
    if (dimension == Dimension::Height) {
      shimBaselineAlignedItems();
    }

    // Fast path - if tracks are fixed-sized, skip below steps
    if (hasOnlyFixedTracks) {
      return;
    }

    // Step 2. and Step 3 Increase sizes to accommodate spanning items
    accomodateSpanningItemsCrossingContentSizedTracks(dimension);
    // Step 4. Increase sizes to accommodate spanning items crossing flexible
    // tracks
    accomodateSpanningItemsCrossingFlexibleTracks(dimension);
    // Step 5. If any track still has an infinite growth limit (because, for
    // example, it had no items placed in it or it is a flexible track), set its
    // growth limit to its base size.
    for (auto& track : tracks) {
      if (track.growthLimit == INFINITY) {
        track.growthLimit = track.baseSize;
      }
    }
  }

  // https://www.w3.org/TR/css-grid-1/#algo-baseline-shims
  void shimBaselineAlignedItems() {
    for (const auto& [rowIndex, items] : baselineItemGroups) {
      float maxBaselineWithMargin = 0.0f;
      std::vector<std::pair<GridItem*, float>> itemBaselines;
      itemBaselines.reserve(items.size());

      for (auto* itemPtr : items) {
        const auto& item = *itemPtr;

        if (itemSizeDependsOnIntrinsicTracks(item)) {
          continue;
        }

        float containingBlockWidth = crossDimensionEstimator
            ? crossDimensionEstimator(item)
            : YGUndefined;
        float containingBlockHeight = YGUndefined;

        auto itemConstraints = calculateItemConstraints(
            item, containingBlockWidth, containingBlockHeight);

        calculateLayoutInternal(
            item.node,
            itemConstraints.width,
            itemConstraints.height,
            node->getLayout().direction(),
            SizingMode::MaxContent,
            itemConstraints.heightSizingMode,
            itemConstraints.containingBlockWidth,
            itemConstraints.containingBlockHeight,
            true,
            LayoutPassReason::kGridLayout,
            layoutMarkerData,
            depth + 1,
            generationCount);

        const float baseline = calculateBaseline(item.node);
        const float marginTop = item.node->style().computeInlineStartMargin(
            FlexDirection::Column,
            direction,
            itemConstraints.containingBlockWidth);
        const float baselineWithMargin = baseline + marginTop;

        itemBaselines.emplace_back(itemPtr, baselineWithMargin);
        maxBaselineWithMargin =
            std::max(maxBaselineWithMargin, baselineWithMargin);
      }

      for (auto& [itemPtr, baselineWithMargin] : itemBaselines) {
        itemPtr->baselineShim = maxBaselineWithMargin - baselineWithMargin;
      }
    }
  }

  // https://www.w3.org/TR/css-grid-1/#algo-single-span-items
  // https://www.w3.org/TR/css-grid-1/#algo-spanning-items
  void accomodateSpanningItemsCrossingContentSizedTracks(Dimension dimension) {
    if (!hasIntrinsicTracks) {
      return;
    }
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;
    auto sizingMode =
        dimension == Dimension::Width ? widthSizingMode : heightSizingMode;

    auto startIndexKey = dimension == Dimension::Width ? &GridItem::columnStart
                                                       : &GridItem::rowStart;
    auto endIndexKey = dimension == Dimension::Width ? &GridItem::columnEnd
                                                     : &GridItem::rowEnd;

    // 2. Size tracks to fit non-spanning items (span = 1 items)
    // https://www.w3.org/TR/css-grid-1/#algo-single-span-items
    std::vector<size_t> spanningItemIndices;
    spanningItemIndices.reserve(gridItems.size());
    for (size_t index = 0; index < gridItems.size(); index++) {
      const auto& item = gridItems[index];
      if (item.crossesFlexibleTrack(dimension)) {
        continue;
      }
      auto startIndex = item.*startIndexKey;
      auto endIndex = item.*endIndexKey;
      size_t span = endIndex - startIndex;
      if (span == 1) {
        auto& track = tracks[startIndex];
        auto itemConstraints = calculateItemConstraints(item, dimension);
        // For auto minimums:
        if (isAutoSizingFunction(track.minSizingFunction, containerSize)) {
          float contribution = sizingMode == SizingMode::MaxContent
              ? limitedMinContentContribution(item, dimension, itemConstraints)
              : minimumContribution(item, dimension, itemConstraints);
          track.baseSize = std::max(track.baseSize, contribution);
        }

        // For max-content maximums:
        if (isAutoSizingFunction(track.maxSizingFunction, containerSize)) {
          float contribution =
              maxContentContribution(item, dimension, itemConstraints);
          if (track.growthLimit == INFINITY) {
            track.growthLimit = contribution;
          } else {
            track.growthLimit = std::max(track.growthLimit, contribution);
          }
        }
        // In all cases, if a track's growth limit is now less than its base
        // size, increase the growth limit to match the base size.
        if (track.growthLimit < track.baseSize) {
          track.growthLimit = track.baseSize;
        }
      } else {
        spanningItemIndices.push_back(index);
      }
    }

    // 3. Increase sizes to accommodate spanning items crossing content-sized
    // tracks: https://www.w3.org/TR/css-grid-1/#algo-spanning-items
    if (spanningItemIndices.empty()) {
      return;
    }

    std::sort(
        spanningItemIndices.begin(),
        spanningItemIndices.end(),
        [&](size_t i, size_t j) {
          const auto& a = gridItems[i];
          const auto& b = gridItems[j];
          return (a.*endIndexKey - a.*startIndexKey) <
              (b.*endIndexKey - b.*startIndexKey);
        });

    size_t previousSpan = 1;
    std::vector<ItemSizeContribution> itemsForIntrinsicMin;
    std::vector<ItemSizeContribution> itemsForIntrinsicMax;
    std::vector<ItemSizeContribution> itemsForMaxContentMax;

    auto distributeSpaceToTracksForItemsWithTheSameSpan = [&]() {
      // Step 1: For intrinsic minimums
      if (!itemsForIntrinsicMin.empty()) {
        distributeExtraSpaceAcrossSpannedTracks(
            dimension, itemsForIntrinsicMin, AffectedSize::BaseSize);
        itemsForIntrinsicMin.clear();
      }

      // Step 2 and Step 3 are skipped since we're not supporting min-content
      // and max-content yet

      // Step 4: If at this point any track's growth limit is now less than its
      // base size, increase its growth limit to match its base size
      for (auto& track : tracks) {
        if (track.growthLimit < track.baseSize) {
          track.growthLimit = track.baseSize;
        }

        // https://www.w3.org/TR/css-grid-1/#infinitely-growable
        // reset infinitely growable flag for each track
        // This flag gets set in Step 5 and used in Step 6, so we need to reset
        // it before running Step 5.
        track.infinitelyGrowable = false;
      }

      // Step 5: For intrinsic maximums
      if (!itemsForIntrinsicMax.empty()) {
        distributeExtraSpaceAcrossSpannedTracks(
            dimension, itemsForIntrinsicMax, AffectedSize::GrowthLimit);
        itemsForIntrinsicMax.clear();
      }

      // Step 6: For max-content maximums
      if (!itemsForMaxContentMax.empty()) {
        distributeExtraSpaceAcrossSpannedTracks(
            dimension, itemsForMaxContentMax, AffectedSize::GrowthLimit);
        itemsForMaxContentMax.clear();
      }
    };

    for (auto& index : spanningItemIndices) {
      const auto& item = gridItems[index];

      if (item.crossesFlexibleTrack(dimension)) {
        continue;
      }

      auto startIndex = item.*startIndexKey;
      auto endIndex = item.*endIndexKey;
      size_t span = endIndex - startIndex;

      if (span > previousSpan) {
        distributeSpaceToTracksForItemsWithTheSameSpan();
        previousSpan = span;
      }

      std::vector<GridTrackSize*> intrinsicMinimumSizingFunctionTracks;
      std::vector<GridTrackSize*> intrinsicMaximumSizingFunctionTracks;
      std::vector<GridTrackSize*> maxContentMaximumSizingFunctionTracks;

      for (size_t i = startIndex; i < endIndex; i++) {
        if (isIntrinsicSizingFunction(
                tracks[i].minSizingFunction, containerSize)) {
          intrinsicMinimumSizingFunctionTracks.push_back(&tracks[i]);
        }

        if (isIntrinsicSizingFunction(
                tracks[i].maxSizingFunction, containerSize)) {
          intrinsicMaximumSizingFunctionTracks.push_back(&tracks[i]);
        }

        // auto as max sizing function is treated as max-content sizing function
        if (isAutoSizingFunction(tracks[i].maxSizingFunction, containerSize)) {
          maxContentMaximumSizingFunctionTracks.push_back(&tracks[i]);
        }
      }

      auto itemConstraints = calculateItemConstraints(item, dimension);
      if (!intrinsicMinimumSizingFunctionTracks.empty()) {
        auto minContribution = sizingMode == SizingMode::MaxContent
            ? limitedMinContentContribution(item, dimension, itemConstraints)
            : minimumContribution(item, dimension, itemConstraints);
        itemsForIntrinsicMin.emplace_back(
            &item,
            std::move(intrinsicMinimumSizingFunctionTracks),
            minContribution);
      }

      if (!intrinsicMaximumSizingFunctionTracks.empty()) {
        auto minContentContrib =
            minContentContribution(item, dimension, itemConstraints);
        itemsForIntrinsicMax.emplace_back(
            &item,
            std::move(intrinsicMaximumSizingFunctionTracks),
            minContentContrib);
      }

      if (!maxContentMaximumSizingFunctionTracks.empty()) {
        auto maxContentContrib =
            maxContentContribution(item, dimension, itemConstraints);
        itemsForMaxContentMax.emplace_back(
            &item,
            std::move(maxContentMaximumSizingFunctionTracks),
            maxContentContrib);
      }
    }

    // Process last span
    distributeSpaceToTracksForItemsWithTheSameSpan();
  };

  // https://www.w3.org/TR/css-grid-1/#algo-spanning-flex-items
  void accomodateSpanningItemsCrossingFlexibleTracks(Dimension dimension) {
    if (!hasFlexibleTracks) {
      return;
    }
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    auto sizingMode =
        dimension == Dimension::Width ? widthSizingMode : heightSizingMode;
    auto startIndexkey = dimension == Dimension::Width ? &GridItem::columnStart
                                                       : &GridItem::rowStart;
    auto endIndexKey = dimension == Dimension::Width ? &GridItem::columnEnd
                                                     : &GridItem::rowEnd;

    std::vector<ItemSizeContribution> itemsSpanningFlexible;

    for (const auto& item : gridItems) {
      if (!item.crossesFlexibleTrack(dimension)) {
        continue;
      }

      auto start = item.*startIndexkey;
      auto end = item.*endIndexKey;
      std::vector<GridTrackSize*> flexibleTracks;

      for (size_t i = start; i < end && i < tracks.size(); i++) {
        auto& track = tracks[i];
        if (isFlexibleSizingFunction(track.maxSizingFunction)) {
          flexibleTracks.push_back(&track);
        }
      }

      if (!flexibleTracks.empty()) {
        auto itemConstraints = calculateItemConstraints(item, dimension);
        auto minContribution = sizingMode == SizingMode::MaxContent
            ? limitedMinContentContribution(item, dimension, itemConstraints)
            : minimumContribution(item, dimension, itemConstraints);

        itemsSpanningFlexible.emplace_back(
            &item, std::move(flexibleTracks), minContribution);
      }
    }

    if (!itemsSpanningFlexible.empty()) {
      distributeSpaceToFlexibleTracksForItems(dimension, itemsSpanningFlexible);
    }
  };

  // https://www.w3.org/TR/css-grid-1/#extra-space
  void distributeExtraSpaceAcrossSpannedTracks(
      Dimension dimension,
      std::vector<ItemSizeContribution>& gridItemSizeContributions,
      AffectedSize affectedSizeType) {
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    auto startIndexKey = dimension == Dimension::Width ? &GridItem::columnStart
                                                       : &GridItem::rowStart;
    auto endIndexKey = dimension == Dimension::Width ? &GridItem::columnEnd
                                                     : &GridItem::rowEnd;
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;
    auto gap = node->style().computeGapForDimension(dimension, containerSize);
    std::unordered_map<GridTrackSize*, float> plannedIncrease;
    plannedIncrease.reserve(gridItemSizeContributions.size());

    // 1. Maintain separately for each affected track a planned increase,
    // initially set to 0. (This prevents the size increases from becoming
    // order-dependent.)
    for (const auto& itemSizeContribution : gridItemSizeContributions) {
      for (auto& track : itemSizeContribution.affectedTracks) {
        plannedIncrease[track] = 0.0f;
      }
    }

    // 2. For each accommodated item, considering only tracks the item spans:
    for (const auto& itemSizeContribution : gridItemSizeContributions) {
      std::unordered_map<GridTrackSize*, float> itemIncurredIncrease;
      itemIncurredIncrease.reserve(itemSizeContribution.affectedTracks.size());
      for (auto& track : itemSizeContribution.affectedTracks) {
        itemIncurredIncrease[track] = 0.0f;
      }

      // 2.1 Find the space to distribute
      auto start = itemSizeContribution.item->*startIndexKey;
      auto end = itemSizeContribution.item->*endIndexKey;
      float totalSpannedTracksSize = 0.0f;
      for (size_t i = start; i < end && i < tracks.size(); i++) {
        auto& track = tracks[i];
        if (affectedSizeType == AffectedSize::BaseSize) {
          totalSpannedTracksSize += track.baseSize;
        } else {
          // For infinite growth limits, substitute the track's base size
          totalSpannedTracksSize += track.growthLimit == INFINITY
              ? track.baseSize
              : track.growthLimit;
        }
        if (i < end - 1) {
          // gaps are treated as tracks of fixed size. Item can span over gaps.
          totalSpannedTracksSize += gap;
        }
      }

      float spaceToDistribute = std::max(
          0.0f, itemSizeContribution.sizeContribution - totalSpannedTracksSize);
      std::unordered_set<GridTrackSize*> frozenTracks;
      frozenTracks.reserve(itemSizeContribution.affectedTracks.size());

      // 2.2. Distribute space up to limits
      while (frozenTracks.size() < itemSizeContribution.affectedTracks.size() &&
             spaceToDistribute > 0.0f &&
             !yoga::inexactEquals(spaceToDistribute, 0.0f)) {
        auto unfrozenTrackCount =
            itemSizeContribution.affectedTracks.size() - frozenTracks.size();
        auto distributionPerTrack =
            spaceToDistribute / static_cast<float>(unfrozenTrackCount);

        for (auto& track : itemSizeContribution.affectedTracks) {
          if (frozenTracks.contains(track)) {
            continue;
          }

          float limit;
          float affectedSize;

          if (affectedSizeType == AffectedSize::BaseSize) {
            affectedSize = track->baseSize;
            limit = track->growthLimit;
          } else {
            affectedSize = track->growthLimit;
            limit = INFINITY;
            if (track->growthLimit != INFINITY && !track->infinitelyGrowable) {
              limit = track->growthLimit;
            }

            // If the affected size was a growth limit and the track is not
            // marked infinitely growable, then each item-incurred increase will
            // be zero.
            if (!track->infinitelyGrowable) {
              frozenTracks.insert(track);
              continue;
            }
          }

          if (affectedSize + distributionPerTrack +
                  itemIncurredIncrease[track] >
              limit) {
            frozenTracks.insert(track);
            auto increase = limit - affectedSize - itemIncurredIncrease[track];
            itemIncurredIncrease[track] += increase;
            spaceToDistribute -= increase;
          } else {
            itemIncurredIncrease[track] += distributionPerTrack;
            spaceToDistribute -= distributionPerTrack;
          }
        }
      }

      // 2.3. Distribute space to non-affected tracks:
      // Currently, browsers do not implement this step.
      // https://github.com/w3c/csswg-drafts/issues/3648

      // 2.4. Distribute space beyond limits
      if (spaceToDistribute > 0.0f &&
          !yoga::inexactEquals(spaceToDistribute, 0.0f)) {
        std::vector<GridTrackSize*> tracksToGrowBeyondLimits;
        for (auto& track : itemSizeContribution.affectedTracks) {
          if (isIntrinsicSizingFunction(
                  track->maxSizingFunction, containerSize)) {
            tracksToGrowBeyondLimits.push_back(track);
          }
        }

        // if there are no such tracks, then all affected tracks.
        if (affectedSizeType == AffectedSize::BaseSize &&
            tracksToGrowBeyondLimits.empty()) {
          tracksToGrowBeyondLimits = itemSizeContribution.affectedTracks;
        }

        while (spaceToDistribute > 0.0f &&
               !yoga::inexactEquals(spaceToDistribute, 0.0f) &&
               !tracksToGrowBeyondLimits.empty()) {
          auto unfrozenTrackCount = tracksToGrowBeyondLimits.size();
          auto distributionPerTrack =
              spaceToDistribute / static_cast<float>(unfrozenTrackCount);
          for (auto& track : tracksToGrowBeyondLimits) {
            itemIncurredIncrease[track] += distributionPerTrack;
            spaceToDistribute -= distributionPerTrack;
          }
        }
      }

      // 2.5. For each affected track, if the track's item-incurred increase is
      // larger than the track's planned increase set the track's planned
      // increase to that value.
      for (auto& track : itemSizeContribution.affectedTracks) {
        if (itemIncurredIncrease[track] > plannedIncrease[track]) {
          plannedIncrease[track] = itemIncurredIncrease[track];
        }
      }
    }

    // 3. Update the tracks affected sizes
    for (const auto& [track, increase] : plannedIncrease) {
      if (affectedSizeType == AffectedSize::BaseSize) {
        track->baseSize += increase;
      } else {
        if (track->growthLimit == INFINITY) {
          track->growthLimit = track->baseSize + increase;
          track->infinitelyGrowable = true;
        } else {
          track->growthLimit += increase;
        }
      }
    }
  }

  // https://www.w3.org/TR/css-grid-1/#extra-space
  // Similar to distribute extra space for content sized tracks, but distributes
  // space considering flex factors.
  void distributeSpaceToFlexibleTracksForItems(
      Dimension dimension,
      const std::vector<ItemSizeContribution>& gridItemSizeContributions) {
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;
    auto gap = node->style().computeGapForDimension(dimension, containerSize);
    auto startIndexKey = dimension == Dimension::Width ? &GridItem::columnStart
                                                       : &GridItem::rowStart;
    auto endIndexKey = dimension == Dimension::Width ? &GridItem::columnEnd
                                                     : &GridItem::rowEnd;

    // Step 1: Maintain planned increase for each affected track
    std::unordered_map<GridTrackSize*, float> plannedIncrease;
    for (const auto& itemSizeContribution : gridItemSizeContributions) {
      for (auto& track : itemSizeContribution.affectedTracks) {
        plannedIncrease[track] = 0.0f;
      }
    }

    // Step 2: For each item
    for (const auto& itemSizeContribution : gridItemSizeContributions) {
      std::unordered_map<GridTrackSize*, float> itemIncurredIncrease;
      for (auto& track : itemSizeContribution.affectedTracks) {
        itemIncurredIncrease[track] = 0.0f;
      }

      // 2.1 Find space to distribute
      auto start = itemSizeContribution.item->*startIndexKey;
      auto end = itemSizeContribution.item->*endIndexKey;
      float totalSpannedTracksSize = 0.0f;
      for (size_t i = start; i < end && i < tracks.size(); i++) {
        totalSpannedTracksSize += tracks[i].baseSize;
        if (i < end - 1) {
          // gaps are treated as tracks of fixed size. Item can span over gaps.
          totalSpannedTracksSize += gap;
        }
      }

      float spaceToDistribute = std::max(
          0.0f, itemSizeContribution.sizeContribution - totalSpannedTracksSize);

      float sumOfFlexFactors = 0.0f;
      for (auto& track : itemSizeContribution.affectedTracks) {
        sumOfFlexFactors += track->maxSizingFunction.value().unwrap();
      }

      if (sumOfFlexFactors > 0.0f) {
        // Distribute space by flex ratios (normalized)
        for (auto& track : itemSizeContribution.affectedTracks) {
          auto flexFactor = track->maxSizingFunction.value().unwrap();
          auto increase = spaceToDistribute * flexFactor / sumOfFlexFactors;
          itemIncurredIncrease[track] += increase;
        }
      } else {
        // All flex factors are zero, distribute equally
        auto equalShare = spaceToDistribute /
            static_cast<float>(itemSizeContribution.affectedTracks.size());
        for (auto& track : itemSizeContribution.affectedTracks) {
          itemIncurredIncrease[track] += equalShare;
        }
      }

      for (auto& track : itemSizeContribution.affectedTracks) {
        if (itemIncurredIncrease[track] > plannedIncrease[track]) {
          plannedIncrease[track] = itemIncurredIncrease[track];
        }
      }
    }

    // Step 3: Update the tracks' affected sizes by adding in the planned
    // increase
    for (const auto& [track, increase] : plannedIncrease) {
      track->baseSize += increase;
    }
  };

  // 11.6. Maximize Tracks
  // https://www.w3.org/TR/css-grid-1/#algo-grow-tracks
  void maximizeTrackSizes(Dimension dimension) {
    // Fast path - if tracks are fixed-sized, skip below steps
    if (hasOnlyFixedTracks) {
      return;
    }

    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;

    // Save original base sizes before maximization
    std::vector<float> originalBaseSizes;
    originalBaseSizes.reserve(tracks.size());
    for (auto& track : tracks) {
      originalBaseSizes.push_back(track.baseSize);
    }

    // First attempt with the original container inner size
    distributeFreeSpaceToTracks(dimension, containerSize);

    // Check if this would cause the grid to be larger than the grid container's
    // inner size as limited by its max-width/height
    auto totalGridSize = getTotalBaseSize(dimension);

    // Get the max constraint for this dimension
    const float paddingAndBorder = dimension == Dimension::Width
        ? paddingAndBorderForAxis(
              node, FlexDirection::Row, direction, ownerWidth)
        : paddingAndBorderForAxis(
              node, FlexDirection::Column, direction, ownerWidth);

    auto maxContainerBorderBoxSize = node->style().resolvedMaxDimension(
        direction,
        dimension,
        dimension == Dimension::Width ? ownerWidth : ownerHeight,
        ownerWidth);

    auto maxContainerInnerSize = maxContainerBorderBoxSize.isDefined()
        ? maxContainerBorderBoxSize.unwrap() - paddingAndBorder
        : YGUndefined;

    if (yoga::isDefined(maxContainerInnerSize)) {
      if (totalGridSize > maxContainerInnerSize) {
        // Redo this step, treating the available grid space as equal to the
        // grid container's inner size when it's sized to its max-width/height
        // Reset base sizes to their values before this maximize step
        for (size_t i = 0; i < tracks.size(); i++) {
          tracks[i].baseSize = originalBaseSizes[i];
        }

        distributeFreeSpaceToTracks(dimension, maxContainerInnerSize);
      }
    }
  }

  // Distribute space in maximizeTrackSizes step
  // https://www.w3.org/TR/css-grid-1/#algo-grow-tracks
  void distributeFreeSpaceToTracks(
      Dimension dimension,
      float targetAvailableSize) {
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    auto sizingMode =
        dimension == Dimension::Width ? widthSizingMode : heightSizingMode;
    float freeSpace = 0.0f;
    if (yoga::isDefined(targetAvailableSize)) {
      auto totalBaseSize = getTotalBaseSize(dimension);
      freeSpace = std::max(0.0f, targetAvailableSize - totalBaseSize);
    }

    // For the purpose of this step: if sizing the grid container under a
    // max-content constraint, the free space is infinite; if sizing under a
    // min-content constraint, the free space is zero.
    if (sizingMode == SizingMode::MaxContent) {
      freeSpace = INFINITY;
    }

    // If the free space is positive, distribute it equally to the base sizes of
    // all tracks, freezing tracks as they reach their growth limits (and
    // continuing to grow the unfrozen tracks as needed).
    if (freeSpace > 0.0f && !yoga::inexactEquals(freeSpace, 0.0f)) {
      // growth limit will not be Infinite in maximizeTrackSizes step since we
      // had set Infinite growth limit to base size in
      // resolveIntrinsicTrackSizes's last step -
      // https://www.w3.org/TR/css-grid-1/#algo-finite-growth
      if (freeSpace == INFINITY) {
        for (auto& track : tracks) {
          track.baseSize = track.growthLimit;
        }
      } else {
        std::unordered_set<GridTrackSize*> frozenTracks;
        frozenTracks.reserve(tracks.size());
        auto extraSpace = freeSpace;

        while (frozenTracks.size() < tracks.size() && extraSpace > 0.0f &&
               !yoga::inexactEquals(extraSpace, 0.0f)) {
          auto unfrozenTrackCount = tracks.size() - frozenTracks.size();
          auto distributionPerTrack =
              extraSpace / static_cast<float>(unfrozenTrackCount);

          for (auto& track : tracks) {
            GridTrackSize* trackPtr = &track;
            if (frozenTracks.contains(trackPtr)) {
              continue;
            }

            // Check if adding this distribution would exceed the growth limit
            if (track.baseSize + distributionPerTrack > track.growthLimit) {
              auto increase =
                  std::max(0.0f, track.growthLimit - track.baseSize);
              track.baseSize += increase;
              extraSpace -= increase;
              frozenTracks.insert(trackPtr);
            } else {
              track.baseSize += distributionPerTrack;
              extraSpace -= distributionPerTrack;
            }
          }
        }
      }
    }
  }

  // 11.7. Expand Flexible Tracks
  // https://www.w3.org/TR/css-grid-1/#algo-flex-tracks
  void expandFlexibleTracks(Dimension dimension) {
    if (!hasFlexibleTracks) {
      return;
    }

    auto& gridTracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;
    auto gap = node->style().computeGapForDimension(dimension, containerSize);

    float freeSpace = calculateFreeSpace(dimension);

    float flexFraction = 0.0f;
    // If the free space is zero or if sizing the grid container under a
    // min-content constraint:
    if (yoga::inexactEquals(freeSpace, 0.0f)) {
      flexFraction = 0.0f;
    }
    // Otherwise, if the free space is a definite length:
    // The used flex fraction is the result of finding the size of an fr using
    // all of the grid tracks and a space to fill of the available grid space.
    else if (yoga::isDefined(freeSpace)) {
      flexFraction = findFrSize(
          dimension,
          0,
          gridTracks.size(),
          containerSize,
          std::unordered_set<GridTrackSize*>());
    }
    // Otherwise, if the free space is an indefinite length:
    // The used flex fraction is the maximum of:
    // For each flexible track, if the flexible track's flex factor is greater
    // than one, the result of dividing the track's base size by its flex
    // factor; otherwise, the track's base size. For each grid item that crosses
    // a flexible track, the result of finding the size of an fr using all the
    // grid tracks that the item crosses and a space to fill of the item’s
    // max-content contribution.
    else {
      for (auto& track : gridTracks) {
        if (isFlexibleSizingFunction(track.maxSizingFunction) &&
            track.maxSizingFunction.value().isDefined()) {
          float flexFactor = track.maxSizingFunction.value().unwrap();
          if (flexFactor > 1.0f) {
            flexFraction = std::max(flexFraction, track.baseSize / flexFactor);
          } else {
            flexFraction = std::max(flexFraction, track.baseSize);
          }
        }
      }

      auto startIndexKey = dimension == Dimension::Width
          ? &GridItem::columnStart
          : &GridItem::rowStart;
      auto endIndexKey = dimension == Dimension::Width ? &GridItem::columnEnd
                                                       : &GridItem::rowEnd;

      for (auto& item : gridItems) {
        if (!item.crossesFlexibleTrack(dimension)) {
          continue;
        }
        auto itemConstraints = calculateItemConstraints(item, dimension);
        auto itemMaxContentContribution =
            maxContentContribution(item, dimension, itemConstraints);
        flexFraction = std::max(
            flexFraction,
            findFrSize(
                dimension,
                item.*startIndexKey,
                item.*endIndexKey,
                itemMaxContentContribution,
                std::unordered_set<GridTrackSize*>()));
      }
    }

    // If using this flex fraction would cause the grid to be smaller than the
    // grid container's min-width/height (or larger than the grid container's
    // max-width/height), then redo this step, treating the free space as
    // definite and the available grid space as equal to the grid container's
    // inner size when it's sized to its min-width/height (max-width/height).

    // Calculate what the grid size would be with this flex fraction
    float newTotalSize = 0.0f;
    for (size_t i = 0; i < gridTracks.size(); i++) {
      auto& track = gridTracks[i];
      if (isFlexibleSizingFunction(track.maxSizingFunction) &&
          track.maxSizingFunction.value().isDefined()) {
        float flexFactor = track.maxSizingFunction.value().unwrap();
        newTotalSize += std::max(track.baseSize, flexFraction * flexFactor);
      } else {
        newTotalSize += track.baseSize;
      }
      if (i < gridTracks.size() - 1) {
        newTotalSize += gap;
      }
    }

    // Check min constraint for this dimension
    const float paddingAndBorder = dimension == Dimension::Width
        ? paddingAndBorderForAxis(
              node, FlexDirection::Row, direction, ownerWidth)
        : paddingAndBorderForAxis(
              node, FlexDirection::Column, direction, ownerWidth);
    auto minContainerOuter = node->style().resolvedMinDimension(
        direction,
        dimension,
        dimension == Dimension::Width ? ownerWidth : ownerHeight,
        ownerWidth);
    auto minContainerSize = minContainerOuter.isDefined()
        ? minContainerOuter.unwrap() - paddingAndBorder
        : YGUndefined;

    if (yoga::isDefined(minContainerSize)) {
      if (newTotalSize < minContainerSize) {
        // Redo with min constraint
        flexFraction = findFrSize(
            dimension,
            0,
            gridTracks.size(),
            minContainerSize,
            std::unordered_set<GridTrackSize*>());
      }
    }

    // Get the max constraint for this dimension
    auto maxContainerOuter = node->style().resolvedMaxDimension(
        direction,
        dimension,
        dimension == Dimension::Width ? ownerWidth : ownerHeight,
        ownerWidth);

    auto maxContainerSize = maxContainerOuter.isDefined()
        ? maxContainerOuter.unwrap() - paddingAndBorder
        : YGUndefined;

    if (yoga::isDefined(maxContainerSize)) {
      if (newTotalSize > maxContainerSize) {
        // Redo with max constraint
        flexFraction = findFrSize(
            dimension,
            0,
            gridTracks.size(),
            maxContainerSize,
            std::unordered_set<GridTrackSize*>());
      }
    }

    // For each flexible track, if the product of the used flex fraction and the
    // track's flex factor is greater than the track's base size, set its base
    // size to that product.
    for (auto& track : gridTracks) {
      if (isFlexibleSizingFunction(track.maxSizingFunction) &&
          track.maxSizingFunction.value().isDefined()) {
        float flexFactor = track.maxSizingFunction.value().unwrap();
        float newSize = flexFraction * flexFactor;
        if (newSize > track.baseSize) {
          track.baseSize = newSize;
        }
      }
    }
  };

  // 11.7.1. Find the Size of an fr
  // https://www.w3.org/TR/css-grid-1/#algo-find-fr-size
  float findFrSize(
      Dimension dimension,
      size_t startIndex,
      size_t endIndex,
      float spaceToFill,
      const std::unordered_set<GridTrackSize*>& nonFlexibleTracks) {
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;
    auto gap = node->style().computeGapForDimension(dimension, containerSize);
    auto leftoverSpace = spaceToFill;
    auto flexFactorSum = 0.0f;
    std::vector<GridTrackSize*> flexibleTracks;
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;

    for (size_t i = startIndex; i < endIndex; i++) {
      auto& track = tracks[i];
      // Let leftover space be the space to fill minus the base sizes of the
      // non-flexible grid tracks.
      if (i < endIndex - 1) {
        // gap is treated as a non-flexible track
        leftoverSpace -= gap;
      }

      if (!isFlexibleSizingFunction(track.maxSizingFunction) ||
          nonFlexibleTracks.contains(&track)) {
        leftoverSpace -= track.baseSize;
      }
      // Let flex factor sum be the sum of the flex factors of the flexible
      // tracks.
      else if (
          track.maxSizingFunction.isStretch() &&
          track.maxSizingFunction.value().isDefined()) {
        flexFactorSum += track.maxSizingFunction.value().unwrap();
        flexibleTracks.push_back(&track);
      }
    }

    // If this value is less than 1, set it to 1 instead.
    if (flexFactorSum < 1.0f) {
      flexFactorSum = 1.0f;
    }

    // Let the hypothetical fr size be the leftover space divided by the flex
    // factor sum.
    auto hypotheticalFrSize = leftoverSpace / flexFactorSum;
    // If the product of the hypothetical fr size and a flexible track's flex
    // factor is less than the track's base size, restart this algorithm
    // treating all such tracks as inflexible.
    std::unordered_set<GridTrackSize*> inflexibleTracks;
    for (auto& track : flexibleTracks) {
      if (track->maxSizingFunction.isStretch() &&
          track->maxSizingFunction.value().isDefined()) {
        float flexFactor = track->maxSizingFunction.value().unwrap();
        if (hypotheticalFrSize * flexFactor < track->baseSize) {
          inflexibleTracks.insert(track);
        }
      }
    }

    // restart this algorithm treating all such tracks as inflexible.
    if (!inflexibleTracks.empty()) {
      inflexibleTracks.insert(
          nonFlexibleTracks.begin(), nonFlexibleTracks.end());
      return findFrSize(
          dimension, startIndex, endIndex, spaceToFill, inflexibleTracks);
    }

    return hypotheticalFrSize;
  }

  // 11.8. Stretch auto Tracks
  // https://www.w3.org/TR/css-grid-1/#algo-stretch
  void stretchAutoTracks(Dimension dimension) {
    // Fast path - if tracks are fixed-sized, skip below steps
    if (hasOnlyFixedTracks) {
      return;
    }

    auto& gridTracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;

    // When the content-distribution property of the grid container is normal or
    // stretch in this axis, this step expands tracks that have an auto max
    // track sizing function by dividing any remaining positive, definite free
    // space equally amongst them. If the free space is indefinite, but the grid
    // container has a definite min-width/height, use that size to calculate the
    // free space for this step instead.
    auto shouldStretch = false;
    if (dimension == Dimension::Width) {
      shouldStretch = node->style().justifyContent() == Justify::Stretch;
    } else {
      shouldStretch = node->style().alignContent() == Align::Stretch;
    }

    if (shouldStretch) {
      // Count only auto tracks for distribution
      std::vector<GridTrackSize*> autoTracks;
      for (auto& track : gridTracks) {
        if (isAutoSizingFunction(track.maxSizingFunction, containerSize)) {
          autoTracks.push_back(&track);
        }
      }

      if (autoTracks.empty()) {
        return;
      }

      float freeSpace = calculateFreeSpace(dimension);

      // If the free space is indefinite, but the grid container has a definite
      // min-width/height, use that size to calculate the free space for this
      // step instead.
      if (!yoga::isDefined(freeSpace)) {
        const float paddingAndBorder = dimension == Dimension::Width
            ? paddingAndBorderForAxis(
                  node, FlexDirection::Row, direction, ownerWidth)
            : paddingAndBorderForAxis(
                  node, FlexDirection::Column, direction, ownerWidth);

        auto minContainerBorderBoxSize = node->style().resolvedMinDimension(
            direction,
            dimension,
            dimension == Dimension::Width ? ownerWidth : ownerHeight,
            ownerWidth);
        auto minContainerInnerSize = minContainerBorderBoxSize.isDefined()
            ? minContainerBorderBoxSize.unwrap() - paddingAndBorder
            : YGUndefined;

        if (yoga::isDefined(minContainerInnerSize)) {
          auto totalBaseSize = getTotalBaseSize(dimension);
          freeSpace = std::max(0.0f, minContainerInnerSize - totalBaseSize);
        }
      }

      if (yoga::isDefined(freeSpace) && freeSpace > 0.0f &&
          !yoga::inexactEquals(freeSpace, 0.0f)) {
        // Divide free space equally among auto tracks only
        auto freeSpacePerAutoTrack =
            freeSpace / static_cast<float>(autoTracks.size());
        for (auto& track : autoTracks) {
          track->baseSize += freeSpacePerAutoTrack;
        }
      }
    }
  };

  // https://www.w3.org/TR/css-grid-1/#free-space
  float calculateFreeSpace(Dimension dimension) {
    float freeSpace = YGUndefined;
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;
    if (yoga::isDefined(containerSize)) {
      auto totalBaseSize = getTotalBaseSize(dimension);
      freeSpace = std::max(0.0f, containerSize - totalBaseSize);
    }

    return freeSpace;
  }

  float measureItem(
      const GridItem& item,
      Dimension dimension,
      const ItemConstraint& constraints) {
    calculateLayoutInternal(
        item.node,
        constraints.width,
        constraints.height,
        node->getLayout().direction(),
        constraints.widthSizingMode,
        constraints.heightSizingMode,
        constraints.containingBlockWidth,
        constraints.containingBlockHeight,
        false,
        LayoutPassReason::kMeasureChild,
        layoutMarkerData,
        depth + 1,
        generationCount);

    return item.node->getLayout().measuredDimension(dimension);
  }

  // There are 4 size contribution types used for intrinsic track sizing
  // 1. minContentContribution - item's min-content size + margins
  // 2. maxContentContribution - item's max-content size + margins
  // 3. minimumContribution - smallest outer size
  // 4. limitedMinContentContribution - min-content clamped by fixed track
  // limits

  // TODO: Yoga does not support min-content constraint yet so we use the
  // max-content size contributions here
  float minContentContribution(
      const GridItem& item,
      Dimension dimension,
      const ItemConstraint& itemConstraints) {
    auto marginForAxis = item.node->style().computeMarginForAxis(
        dimension == Dimension::Width ? FlexDirection::Row
                                      : FlexDirection::Column,
        itemConstraints.containingBlockWidth);

    float contribution =
        measureItem(item, dimension, itemConstraints) + marginForAxis;

    if (dimension == Dimension::Height) {
      contribution += item.baselineShim;
    }
    return contribution;
  }

  float maxContentContribution(
      const GridItem& item,
      Dimension dimension,
      const ItemConstraint& itemConstraints) {
    auto marginForAxis = item.node->style().computeMarginForAxis(
        dimension == Dimension::Width ? FlexDirection::Row
                                      : FlexDirection::Column,
        itemConstraints.containingBlockWidth);

    float contribution =
        measureItem(item, dimension, itemConstraints) + marginForAxis;

    if (dimension == Dimension::Height) {
      contribution += item.baselineShim;
    }
    return contribution;
  }

  // Minimum contribution: the smallest outer size the item can have
  // https://www.w3.org/TR/css-grid-1/#minimum-contribution
  float minimumContribution(
      const GridItem& item,
      Dimension dimension,
      const ItemConstraint& itemConstraints) {
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    float containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                        : containerInnerHeight;
    auto containingBlockSize = dimension == Dimension::Width
        ? itemConstraints.containingBlockWidth
        : itemConstraints.containingBlockHeight;

    auto marginForAxis = item.node->style().computeMarginForAxis(
        dimension == Dimension::Width ? FlexDirection::Row
                                      : FlexDirection::Column,
        itemConstraints.containingBlockWidth);

    auto preferredSize = item.node->style().dimension(dimension);
    auto minSize = item.node->style().minDimension(dimension);

    float contribution = 0.0f;

    // If preferred size is definite (not auto/percent), use min-content
    // contribution
    if (!preferredSize.isAuto() && !preferredSize.isPercent()) {
      return minContentContribution(item, dimension, itemConstraints);
    }

    // If explicit min-size is set, use it
    if (minSize.isDefined() && !minSize.isAuto()) {
      auto resolvedMinSize = minSize.resolve(containingBlockSize);
      contribution = resolvedMinSize.unwrap() + marginForAxis;
    }
    // Otherwise compute automatic minimum size
    else {
      contribution =
          automaticMinimumSize(
              item, dimension, itemConstraints, tracks, containerSize) +
          marginForAxis;
    }

    if (dimension == Dimension::Height) {
      contribution += item.baselineShim;
    }
    return contribution;
  }

  // https://www.w3.org/TR/css-grid-1/#min-size-auto
  float automaticMinimumSize(
      const GridItem& item,
      Dimension dimension,
      const ItemConstraint& itemConstraints,
      const std::vector<GridTrackSize>& tracks,
      float containerSize) {
    auto overflow = item.node->style().overflow();
    size_t startIndex =
        dimension == Dimension::Width ? item.columnStart : item.rowStart;
    size_t endIndex =
        dimension == Dimension::Width ? item.columnEnd : item.rowEnd;

    // Check its computed overflow is not a scrollable overflow value
    bool isScrollContainer =
        overflow == Overflow::Scroll || overflow == Overflow::Hidden;
    if (isScrollContainer) {
      return 0.0f;
    }

    // Check if it spans at least one track in that axis whose min track sizing
    // function is auto
    bool spansAutoMinTrack = false;
    for (size_t i = startIndex; i < endIndex; i++) {
      // TODO: check if this should also consider percentage auto behaving
      // tracks
      if (tracks[i].minSizingFunction.isAuto()) {
        spansAutoMinTrack = true;
        break;
      }
    }
    if (!spansAutoMinTrack) {
      return 0.0f;
    }

    // Check if it spans more than one track in that axis, none of those tracks
    // are flexible
    bool spansMultipleTracks = (endIndex - startIndex) > 1;
    if (spansMultipleTracks && item.crossesFlexibleTrack(dimension)) {
      return 0.0f;
    }

    return contentBasedMinimum(
        item, dimension, itemConstraints, tracks, containerSize);
  }

  // https://www.w3.org/TR/css-grid-1/#content-based-minimum-size
  float contentBasedMinimum(
      const GridItem& item,
      Dimension dimension,
      const ItemConstraint& itemConstraints,
      const std::vector<GridTrackSize>& tracks,
      float containerSize) {
    float result = measureItem(item, dimension, itemConstraints);
    // Clamp by fixed track limit if all spanned tracks have fixed max sizing
    // function
    auto fixedLimit =
        computeFixedTracksLimit(item, dimension, tracks, containerSize);
    if (yoga::isDefined(fixedLimit)) {
      result = std::min(result, fixedLimit);
    }

    // Clamp by max-size if definite
    auto containingBlockSize = dimension == Dimension::Width
        ? itemConstraints.containingBlockWidth
        : itemConstraints.containingBlockHeight;
    auto maxSize = item.node->style().maxDimension(dimension);
    if (maxSize.isDefined()) {
      auto resolvedMaxSize = maxSize.resolve(containingBlockSize);
      if (resolvedMaxSize.isDefined()) {
        result = std::min(result, resolvedMaxSize.unwrap());
      }
    }

    return result;
  }

  // https://www.w3.org/TR/css-grid-1/#limited-contribution
  float limitedMinContentContribution(
      const GridItem& item,
      Dimension dimension,
      const ItemConstraint& itemConstraints) {
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    float containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                        : containerInnerHeight;

    auto fixedLimit =
        computeFixedTracksLimit(item, dimension, tracks, containerSize);
    auto minContent = minContentContribution(item, dimension, itemConstraints);
    auto minimum = minimumContribution(item, dimension, itemConstraints);

    if (yoga::isDefined(fixedLimit)) {
      return std::max(std::min(minContent, fixedLimit), minimum);
    }

    return std::max(minContent, minimum);
  }

  float computeFixedTracksLimit(
      const GridItem& item,
      Dimension dimension,
      const std::vector<GridTrackSize>& tracks,
      float containerSize) {
    size_t startIndex =
        dimension == Dimension::Width ? item.columnStart : item.rowStart;
    size_t endIndex =
        dimension == Dimension::Width ? item.columnEnd : item.rowEnd;
    auto gap = node->style().computeGapForDimension(dimension, containerSize);

    float limit = 0.0f;
    for (size_t i = startIndex; i < endIndex; i++) {
      if (!isFixedSizingFunction(tracks[i].maxSizingFunction, containerSize)) {
        return YGUndefined;
      }
      auto resolved = tracks[i].maxSizingFunction.resolve(containerSize);
      if (resolved.isDefined()) {
        limit += resolved.unwrap();
      }
      if (i < endIndex - 1) {
        limit += gap;
      }
    }
    return limit;
  }

  static bool isFixedSizingFunction(
      const StyleSizeLength& sizingFunction,
      float referenceLength) {
    return sizingFunction.isDefined() &&
        sizingFunction.resolve(referenceLength).isDefined();
  }

  static bool isIntrinsicSizingFunction(
      const StyleSizeLength& sizingFunction,
      float referenceLength) {
    return isAutoSizingFunction(sizingFunction, referenceLength);
  }

  static bool isAutoSizingFunction(
      const StyleSizeLength& sizingFunction,
      float referenceLength) {
    return sizingFunction.isAuto() ||
        (sizingFunction.isPercent() && !yoga::isDefined(referenceLength));
  }

  static bool isFlexibleSizingFunction(const StyleSizeLength& sizingFunction) {
    return sizingFunction.isStretch();
  }

  static bool isPercentageSizingFunction(
      const StyleSizeLength& sizingFunction) {
    return sizingFunction.isPercent();
  }

  float getTotalBaseSize(Dimension dimension) {
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;
    const auto& tracks =
        dimension == Dimension::Width ? columnTracks : rowTracks;
    auto gap = node->style().computeGapForDimension(dimension, containerSize);

    float totalBaseSize = 0.0f;
    for (size_t i = 0; i < tracks.size(); i++) {
      totalBaseSize += tracks[i].baseSize;
      if (i < tracks.size() - 1) {
        totalBaseSize += gap;
      }
    }
    return totalBaseSize;
  }

  bool hasPercentageTracks(Dimension dimension) const {
    return dimension == Dimension::Width ? hasPercentageColumnTracks
                                         : hasPercentageRowTracks;
  }

  ContentDistribution calculateContentDistribution(
      Dimension dimension,
      float freeSpace) {
    auto numTracks = static_cast<float>(
        dimension == Dimension::Width ? columnTracks.size() : rowTracks.size());
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;
    auto baseGap =
        node->style().computeGapForDimension(dimension, containerSize);

    ContentDistribution result;
    result.effectiveGap = baseGap;

    if (yoga::inexactEquals(freeSpace, 0.0f)) {
      return result;
    }

    if (dimension == Dimension::Width) {
      const Justify justifyContent = freeSpace > 0.0f
          ? node->style().justifyContent()
          : fallbackAlignment(node->style().justifyContent());

      switch (justifyContent) {
        case Justify::Center:
          result.startOffset = freeSpace / 2.0f;
          break;

        case Justify::End:
          result.startOffset = freeSpace;
          break;

        case Justify::SpaceBetween:
          if (numTracks > 1) {
            result.betweenTracksOffset = freeSpace / (numTracks - 1);
          }
          break;

        case Justify::SpaceAround:
          if (numTracks > 0) {
            result.betweenTracksOffset = freeSpace / numTracks;
            result.startOffset = result.betweenTracksOffset / 2.0f;
          }
          break;

        case Justify::SpaceEvenly:
          result.betweenTracksOffset = freeSpace / (numTracks + 1);
          result.startOffset = result.betweenTracksOffset;
          break;

        case Justify::Start:
        case Justify::FlexStart:
        case Justify::FlexEnd:
        case Justify::Stretch:
        case Justify::Auto:
        default:
          break;
      }
    } else {
      const auto alignContent = freeSpace > 0.0f
          ? node->style().alignContent()
          : fallbackAlignment(node->style().alignContent());
      switch (alignContent) {
        case Align::Center:
          // content center works with negative free space too
          // refer grid_align_content_center_negative_space_gap fixture
          result.startOffset = freeSpace / 2.0f;
          break;
        case Align::End:
          result.startOffset = freeSpace;
          break;
        case Align::SpaceBetween:
          if (numTracks > 1) {
            // negative free space is not distributed with space between,
            // checkout grid_align_content_space_between_negative_space_gap
            // fixture
            result.betweenTracksOffset =
                std::max(0.0f, freeSpace / (numTracks - 1));
          }
          break;

        case Align::SpaceAround:
          if (numTracks > 0) {
            result.betweenTracksOffset = freeSpace / numTracks;
            result.startOffset = result.betweenTracksOffset / 2.0f;
          }
          break;

        case Align::SpaceEvenly:
          result.betweenTracksOffset = freeSpace / (numTracks + 1);
          result.startOffset = result.betweenTracksOffset;
          break;

        case Align::Auto:
        case Align::FlexStart:
        case Align::FlexEnd:
        case Align::Stretch:
        case Align::Baseline:
        case Align::Start:
        default:
          break;
      }
    }

    result.effectiveGap = baseGap + result.betweenTracksOffset;
    return result;
  }

  ItemConstraint calculateItemConstraints(
      const GridItem& item,
      Dimension dimension) {
    float containingBlockWidth = YGUndefined;
    float containingBlockHeight = YGUndefined;
    if (dimension == Dimension::Width) {
      containingBlockHeight = crossDimensionEstimator(item);
    } else {
      containingBlockWidth = crossDimensionEstimator(item);
    }

    return calculateItemConstraints(
        item, containingBlockWidth, containingBlockHeight);
  }

  ItemConstraint calculateItemConstraints(
      const GridItem& item,
      float containingBlockWidth,
      float containingBlockHeight) {
    auto availableWidth = YGUndefined;
    auto availableHeight = YGUndefined;
    auto itemWidthSizingMode = SizingMode::MaxContent;
    auto itemHeightSizingMode = SizingMode::MaxContent;
    auto hasDefiniteWidth =
        item.node->hasDefiniteLength(Dimension::Width, containingBlockWidth);
    auto hasDefiniteHeight =
        item.node->hasDefiniteLength(Dimension::Height, containingBlockHeight);

    if (yoga::isDefined(containingBlockWidth)) {
      itemWidthSizingMode = SizingMode::FitContent;
      availableWidth = containingBlockWidth;
    }

    if (yoga::isDefined(containingBlockHeight)) {
      itemHeightSizingMode = SizingMode::FitContent;
      availableHeight = containingBlockHeight;
    }

    const auto marginInline = item.node->style().computeMarginForAxis(
        FlexDirection::Row, containingBlockWidth);
    if (hasDefiniteWidth) {
      itemWidthSizingMode = SizingMode::StretchFit;
      auto resolvedWidth = item.node
                               ->getResolvedDimension(
                                   direction,
                                   Dimension::Width,
                                   containingBlockWidth,
                                   containingBlockWidth)
                               .unwrap();
      resolvedWidth = boundAxis(
          item.node,
          FlexDirection::Row,
          direction,
          resolvedWidth,
          containingBlockWidth,
          containingBlockWidth);
      availableWidth = resolvedWidth + marginInline;
    }

    const auto marginBlock = item.node->style().computeMarginForAxis(
        FlexDirection::Column, containingBlockWidth);
    if (hasDefiniteHeight) {
      itemHeightSizingMode = SizingMode::StretchFit;
      auto resolvedHeight = item.node
                                ->getResolvedDimension(
                                    direction,
                                    Dimension::Height,
                                    containingBlockHeight,
                                    containingBlockWidth)
                                .unwrap();
      resolvedHeight = boundAxis(
          item.node,
          FlexDirection::Column,
          direction,
          resolvedHeight,
          containingBlockHeight,
          containingBlockWidth);
      availableHeight = resolvedHeight + marginBlock;
    }

    auto justifySelf = resolveChildJustification(node, item.node);
    auto alignSelf = resolveChildAlignment(node, item.node);

    bool hasMarginInlineAuto = item.node->style().inlineStartMarginIsAuto(
                                   FlexDirection::Row, direction) ||
        item.node->style().inlineEndMarginIsAuto(FlexDirection::Row, direction);
    bool hasMarginBlockAuto = item.node->style().inlineStartMarginIsAuto(
                                  FlexDirection::Column, direction) ||
        item.node->style().inlineEndMarginIsAuto(
            FlexDirection::Column, direction);

    // For stretch-aligned items with a definite containing block size and no
    // auto margins, treat the item as having a definite size in that axis (it
    // will stretch to fill).
    const auto& itemStyle = item.node->style();

    if (yoga::isDefined(containingBlockWidth) && !hasDefiniteWidth &&
        justifySelf == Justify::Stretch && !hasMarginInlineAuto) {
      itemWidthSizingMode = SizingMode::StretchFit;
      availableWidth = containingBlockWidth;
    }

    if (yoga::isDefined(containingBlockHeight) &&
        !item.node->hasDefiniteLength(
            Dimension::Height, containingBlockHeight) &&
        alignSelf == Align::Stretch && !hasMarginBlockAuto) {
      itemHeightSizingMode = SizingMode::StretchFit;
      availableHeight = containingBlockHeight;
    }

    if (itemStyle.aspectRatio().isDefined() &&
        !yoga::inexactEquals(itemStyle.aspectRatio().unwrap(), 0.0f)) {
      const float aspectRatio = itemStyle.aspectRatio().unwrap();
      if (itemWidthSizingMode == SizingMode::StretchFit &&
          itemHeightSizingMode == SizingMode::StretchFit) {
        if (!hasDefiniteWidth && !hasDefiniteHeight) {
          auto resolvedWidth = (availableHeight - marginBlock) * aspectRatio;
          resolvedWidth = boundAxis(
              item.node,
              FlexDirection::Row,
              direction,
              resolvedWidth,
              containingBlockWidth,
              containingBlockWidth);
          availableWidth = resolvedWidth + marginInline;
        }
      } else if (
          itemWidthSizingMode == SizingMode::StretchFit &&
          itemHeightSizingMode != SizingMode::StretchFit) {
        auto resolvedHeight = (availableWidth - marginInline) / aspectRatio;
        resolvedHeight = boundAxis(
            item.node,
            FlexDirection::Column,
            direction,
            resolvedHeight,
            containingBlockHeight,
            containingBlockWidth);
        availableHeight = resolvedHeight + marginBlock;
        itemHeightSizingMode = SizingMode::StretchFit;
      } else if (
          itemHeightSizingMode == SizingMode::StretchFit &&
          itemWidthSizingMode != SizingMode::StretchFit) {
        auto resolvedWidth = (availableHeight - marginBlock) * aspectRatio;
        resolvedWidth = boundAxis(
            item.node,
            FlexDirection::Row,
            direction,
            resolvedWidth,
            containingBlockWidth,
            containingBlockWidth);
        availableWidth = resolvedWidth + marginInline;
        itemWidthSizingMode = SizingMode::StretchFit;
      }
    }

    constrainMaxSizeForMode(
        item.node,
        direction,
        FlexDirection::Row,
        containingBlockWidth,
        containingBlockWidth,
        &itemWidthSizingMode,
        &availableWidth);
    constrainMaxSizeForMode(
        item.node,
        direction,
        FlexDirection::Column,
        containingBlockHeight,
        containingBlockWidth,
        &itemHeightSizingMode,
        &availableHeight);

    return ItemConstraint{
        .width = availableWidth,
        .height = availableHeight,
        .widthSizingMode = itemWidthSizingMode,
        .heightSizingMode = itemHeightSizingMode,
        .containingBlockWidth = containingBlockWidth,
        .containingBlockHeight = containingBlockHeight};
  }

  float calculateEffectiveRowGapForEstimation() {
    auto rowGap = node->style().computeGapForDimension(
        Dimension::Height, containerInnerHeight);

    if (!yoga::isDefined(containerInnerHeight)) {
      return rowGap;
    }

    float totalTrackSize = 0.0f;
    for (auto& track : rowTracks) {
      if (isFixedSizingFunction(
              track.maxSizingFunction, containerInnerHeight)) {
        totalTrackSize +=
            track.maxSizingFunction.resolve(containerInnerHeight).unwrap();
      } else {
        return rowGap;
      }
    }

    float totalGapSize = rowTracks.size() > 1
        ? rowGap * static_cast<float>(rowTracks.size() - 1)
        : 0.0f;
    float freeSpace = containerInnerHeight - totalTrackSize - totalGapSize;

    auto distribution =
        calculateContentDistribution(Dimension::Height, freeSpace);

    return distribution.effectiveGap;
  }

  float calculateEffectiveGapFromBaseSizes(Dimension dimension) {
    auto containerSize = dimension == Dimension::Width ? containerInnerWidth
                                                       : containerInnerHeight;
    auto gap = node->style().computeGapForDimension(dimension, containerSize);
    const auto& tracks =
        dimension == Dimension::Width ? columnTracks : rowTracks;

    if (!yoga::isDefined(containerSize)) {
      return gap;
    }

    float totalTrackSize = 0.0f;
    for (auto& track : tracks) {
      totalTrackSize += track.baseSize;
    }

    float totalGapSize =
        tracks.size() > 1 ? gap * static_cast<float>(tracks.size() - 1) : 0.0f;
    float freeSpace = containerSize - totalTrackSize - totalGapSize;

    auto distribution = calculateContentDistribution(dimension, freeSpace);

    return distribution.effectiveGap;
  }

  bool contributionsChanged(
      Dimension dimension,
      CrossDimensionEstimator estimatorBefore,
      CrossDimensionEstimator estimatorAfter) {
    for (const auto& item : gridItems) {
      if (!item.crossesIntrinsicTrack(dimension)) {
        continue;
      }

      float crossDimBefore =
          estimatorBefore ? estimatorBefore(item) : YGUndefined;
      float crossDimAfter = estimatorAfter ? estimatorAfter(item) : YGUndefined;

      // If cross dimension hasn't changed, contribution depending on it won't
      // change
      if (yoga::inexactEquals(crossDimBefore, crossDimAfter)) {
        continue;
      }

      float containingBlockWidth =
          dimension == Dimension::Width ? YGUndefined : crossDimBefore;
      float containingBlockHeight =
          dimension == Dimension::Width ? crossDimBefore : YGUndefined;
      auto constraintsBefore = calculateItemConstraints(
          item, containingBlockWidth, containingBlockHeight);
      float contributionBefore =
          minContentContribution(item, dimension, constraintsBefore);

      containingBlockWidth =
          dimension == Dimension::Width ? YGUndefined : crossDimAfter;
      containingBlockHeight =
          dimension == Dimension::Width ? crossDimAfter : YGUndefined;
      auto constraintsAfter = calculateItemConstraints(
          item, containingBlockWidth, containingBlockHeight);
      float contributionAfter =
          minContentContribution(item, dimension, constraintsAfter);

      if (!yoga::inexactEquals(contributionBefore, contributionAfter)) {
        return true;
      }
    }
    return false;
  }

  bool itemSizeDependsOnIntrinsicTracks(const GridItem& item) const {
    auto heightStyle = item.node->style().dimension(Dimension::Height);
    if (heightStyle.isPercent()) {
      for (size_t i = item.rowStart; i < item.rowEnd && i < rowTracks.size();
           i++) {
        if (isIntrinsicSizingFunction(
                rowTracks[i].minSizingFunction, containerInnerHeight) ||
            isIntrinsicSizingFunction(
                rowTracks[i].maxSizingFunction, containerInnerHeight)) {
          return true;
        }
      }
    }
    return false;
  }

  void computeItemTrackCrossingFlags() {
    for (auto& item : gridItems) {
      item.crossesFlexibleColumn = false;
      item.crossesIntrinsicColumn = false;
      item.crossesFlexibleRow = false;
      item.crossesIntrinsicRow = false;

      for (size_t i = item.columnStart; i < item.columnEnd; i++) {
        if (isFlexibleSizingFunction(columnTracks[i].maxSizingFunction)) {
          item.crossesFlexibleColumn = true;
        } else if (isIntrinsicSizingFunction(
                       columnTracks[i].maxSizingFunction,
                       containerInnerWidth)) {
          item.crossesIntrinsicColumn = true;
        }
        if (isIntrinsicSizingFunction(
                columnTracks[i].minSizingFunction, containerInnerWidth)) {
          item.crossesIntrinsicColumn = true;
        }
      }

      for (size_t i = item.rowStart; i < item.rowEnd; i++) {
        if (isFlexibleSizingFunction(rowTracks[i].maxSizingFunction)) {
          item.crossesFlexibleRow = true;
        } else if (isIntrinsicSizingFunction(
                       rowTracks[i].maxSizingFunction, containerInnerHeight)) {
          item.crossesIntrinsicRow = true;
        }
        if (isIntrinsicSizingFunction(
                rowTracks[i].minSizingFunction, containerInnerHeight)) {
          item.crossesIntrinsicRow = true;
        }
      }
    }
  }

  CrossDimensionEstimator makeRowHeightEstimatorUsingFixedTracks(float gap) {
    auto& tracks = rowTracks;
    auto containerHeight = containerInnerHeight;
    return [&tracks, containerHeight, gap](const GridItem& item) -> float {
      float height = 0.0f;
      for (size_t i = item.rowStart; i < item.rowEnd && i < tracks.size();
           i++) {
        if (isFixedSizingFunction(
                tracks[i].maxSizingFunction, containerHeight)) {
          height +=
              tracks[i].maxSizingFunction.resolve(containerHeight).unwrap();
          if (i < item.rowEnd - 1) {
            height += gap;
          }
        } else {
          return YGUndefined;
        }
      }
      return height;
    };
  }

  CrossDimensionEstimator makeCrossDimensionEstimatorUsingBaseSize(
      Dimension dimension,
      float gap) {
    std::vector<float> baseSizes;
    auto& tracks = dimension == Dimension::Width ? columnTracks : rowTracks;
    baseSizes.reserve(tracks.size());
    for (const auto& track : tracks) {
      baseSizes.push_back(track.baseSize);
    }
    auto startIndexKey = dimension == Dimension::Width ? &GridItem::columnStart
                                                       : &GridItem::rowStart;
    auto endIndexKey = dimension == Dimension::Width ? &GridItem::columnEnd
                                                     : &GridItem::rowEnd;
    return [baseSizes = std::move(baseSizes), gap, startIndexKey, endIndexKey](
               const GridItem& item) -> float {
      float width = 0.0f;
      for (size_t i = item.*startIndexKey;
           i < item.*endIndexKey && i < baseSizes.size();
           i++) {
        width += baseSizes[i];
        if (i < item.*endIndexKey - 1) {
          width += gap;
        }
      }
      return width;
    };
  }
};

} // namespace facebook::yoga
