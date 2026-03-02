/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/YGMacros.h>
#include <yoga/YGNode.h>

YG_EXTERN_C_BEGIN

/**
 * Opaque handle to a grid track list for building grid-template-rows/columns.
 */
typedef struct YGGridTrackList* YGGridTrackListRef;

/**
 * Opaque handle to a grid track value.
 */
typedef struct YGGridTrackValue* YGGridTrackValueRef;

/**
 * Create a new grid track list.
 */
YG_EXPORT YGGridTrackListRef YGGridTrackListCreate(void);

/**
 * Free a grid track list.
 */
YG_EXPORT void YGGridTrackListFree(YGGridTrackListRef list);

/**
 * Add a track to the grid track list.
 */
YG_EXPORT void YGGridTrackListAddTrack(
    YGGridTrackListRef list,
    YGGridTrackValueRef trackValue);

/**
 * Create a grid track value with a points (px) length.
 */
YG_EXPORT YGGridTrackValueRef YGPoints(float points);

/**
 * Create a grid track value with a percentage length.
 */
YG_EXPORT YGGridTrackValueRef YGPercent(float percent);

/**
 * Create a grid track value with a flexible (fr) length.
 */
YG_EXPORT YGGridTrackValueRef YGFr(float fr);

/**
 * Create a grid track value with auto sizing.
 */
YG_EXPORT YGGridTrackValueRef YGAuto(void);

/**
 * Create a grid track value with minmax(min, max) sizing.
 */
YG_EXPORT YGGridTrackValueRef
YGMinMax(YGGridTrackValueRef min, YGGridTrackValueRef max);

/**
 * Set the grid-template-rows property on a node.
 */
YG_EXPORT void YGNodeStyleSetGridTemplateRows(
    YGNodeRef node,
    YGGridTrackListRef trackList);

/**
 * Set the grid-template-columns property on a node.
 */
YG_EXPORT void YGNodeStyleSetGridTemplateColumns(
    YGNodeRef node,
    YGGridTrackListRef trackList);

/**
 * Set the grid-auto-rows property on a node.
 */
YG_EXPORT void YGNodeStyleSetGridAutoRows(
    YGNodeRef node,
    YGGridTrackListRef trackList);

/**
 * Set the grid-auto-columns property on a node.
 */
YG_EXPORT void YGNodeStyleSetGridAutoColumns(
    YGNodeRef node,
    YGGridTrackListRef trackList);

YG_EXTERN_C_END
