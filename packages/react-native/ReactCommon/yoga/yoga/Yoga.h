/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <stdarg.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <yoga/YGEnums.h>
#include <yoga/YGMacros.h>
#include <yoga/YGValue.h>

YG_EXTERN_C_BEGIN

typedef struct YGSize {
  float width;
  float height;
} YGSize;

typedef struct YGConfig* YGConfigRef;
typedef const struct YGConfig* YGConfigConstRef;

typedef struct YGNode* YGNodeRef;
typedef const struct YGNode* YGNodeConstRef;

typedef YGSize (*YGMeasureFunc)(
    YGNodeConstRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode);
typedef float (*YGBaselineFunc)(YGNodeConstRef node, float width, float height);
typedef void (*YGDirtiedFunc)(YGNodeConstRef node);
typedef void (*YGPrintFunc)(YGNodeConstRef node);
typedef void (*YGNodeCleanupFunc)(YGNodeConstRef node);
typedef int (*YGLogger)(
    YGConfigConstRef config,
    YGNodeConstRef node,
    YGLogLevel level,
    const char* format,
    va_list args);
typedef YGNodeRef (*YGCloneNodeFunc)(
    YGNodeConstRef oldNode,
    YGNodeConstRef owner,
    size_t childIndex);

// YGNode
YG_EXPORT YGNodeRef YGNodeNew(void);
YG_EXPORT YGNodeRef YGNodeNewWithConfig(YGConfigConstRef config);
YG_EXPORT YGNodeRef YGNodeClone(YGNodeConstRef node);
YG_EXPORT void YGNodeFree(YGNodeRef node);
YG_EXPORT void YGNodeFreeRecursiveWithCleanupFunc(
    YGNodeRef node,
    YGNodeCleanupFunc cleanup);
YG_EXPORT void YGNodeFreeRecursive(YGNodeRef node);
YG_EXPORT void YGNodeReset(YGNodeRef node);

YG_EXPORT void YGNodeInsertChild(YGNodeRef node, YGNodeRef child, size_t index);

YG_EXPORT void YGNodeSwapChild(YGNodeRef node, YGNodeRef child, size_t index);

YG_EXPORT void YGNodeRemoveChild(YGNodeRef node, YGNodeRef child);
YG_EXPORT void YGNodeRemoveAllChildren(YGNodeRef node);
YG_EXPORT YGNodeRef YGNodeGetChild(YGNodeRef node, size_t index);
YG_EXPORT YGNodeRef YGNodeGetOwner(YGNodeRef node);
YG_EXPORT YGNodeRef YGNodeGetParent(YGNodeRef node);
YG_EXPORT size_t YGNodeGetChildCount(YGNodeConstRef node);
YG_EXPORT void
YGNodeSetChildren(YGNodeRef owner, const YGNodeRef* children, size_t count);

YG_EXPORT void YGNodeSetIsReferenceBaseline(
    YGNodeRef node,
    bool isReferenceBaseline);

YG_EXPORT bool YGNodeIsReferenceBaseline(YGNodeConstRef node);

YG_EXPORT void YGNodeCalculateLayout(
    YGNodeRef node,
    float availableWidth,
    float availableHeight,
    YGDirection ownerDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
//
// Yoga knows when to mark all other nodes as dirty but because nodes with
// measure functions depend on information not known to Yoga they must perform
// this dirty marking manually.
YG_EXPORT void YGNodeMarkDirty(YGNodeRef node);

// Marks the current node and all its descendants as dirty.
//
// Intended to be used for Yoga benchmarks. Don't use in production, as calling
// `YGCalculateLayout` will cause the recalculation of each and every node.
YG_EXPORT void YGNodeMarkDirtyAndPropagateToDescendants(YGNodeRef node);

YG_EXPORT void YGNodePrint(YGNodeConstRef node, YGPrintOptions options);

YG_EXPORT bool YGFloatIsUndefined(float value);

// TODO: This should not be part of the public API. Remove after removing
// ComponentKit usage of it.
YG_EXPORT bool YGNodeCanUseCachedMeasurement(
    YGMeasureMode widthMode,
    float availableWidth,
    YGMeasureMode heightMode,
    float availableHeight,
    YGMeasureMode lastWidthMode,
    float lastAvailableWidth,
    YGMeasureMode lastHeightMode,
    float lastAvailableHeight,
    float lastComputedWidth,
    float lastComputedHeight,
    float marginRow,
    float marginColumn,
    YGConfigRef config);

YG_EXPORT void YGNodeCopyStyle(YGNodeRef dstNode, YGNodeConstRef srcNode);

YG_EXPORT void* YGNodeGetContext(YGNodeConstRef node);
YG_EXPORT void YGNodeSetContext(YGNodeRef node, void* context);

YG_EXPORT YGConfigConstRef YGNodeGetConfig(YGNodeRef node);
YG_EXPORT void YGNodeSetConfig(YGNodeRef node, YGConfigRef config);

YG_EXPORT void YGConfigSetPrintTreeFlag(YGConfigRef config, bool enabled);
YG_EXPORT bool YGNodeHasMeasureFunc(YGNodeConstRef node);
YG_EXPORT void YGNodeSetMeasureFunc(YGNodeRef node, YGMeasureFunc measureFunc);
YG_EXPORT bool YGNodeHasBaselineFunc(YGNodeConstRef node);
YG_EXPORT void YGNodeSetBaselineFunc(
    YGNodeRef node,
    YGBaselineFunc baselineFunc);
YG_EXPORT YGDirtiedFunc YGNodeGetDirtiedFunc(YGNodeConstRef node);
YG_EXPORT void YGNodeSetDirtiedFunc(YGNodeRef node, YGDirtiedFunc dirtiedFunc);
YG_EXPORT void YGNodeSetPrintFunc(YGNodeRef node, YGPrintFunc printFunc);
YG_EXPORT bool YGNodeGetHasNewLayout(YGNodeConstRef node);
YG_EXPORT void YGNodeSetHasNewLayout(YGNodeRef node, bool hasNewLayout);
YG_EXPORT YGNodeType YGNodeGetNodeType(YGNodeConstRef node);
YG_EXPORT void YGNodeSetNodeType(YGNodeRef node, YGNodeType nodeType);
YG_EXPORT bool YGNodeIsDirty(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetDirection(YGNodeRef node, YGDirection direction);
YG_EXPORT YGDirection YGNodeStyleGetDirection(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlexDirection(
    YGNodeRef node,
    YGFlexDirection flexDirection);
YG_EXPORT YGFlexDirection YGNodeStyleGetFlexDirection(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetJustifyContent(
    YGNodeRef node,
    YGJustify justifyContent);
YG_EXPORT YGJustify YGNodeStyleGetJustifyContent(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetAlignContent(YGNodeRef node, YGAlign alignContent);
YG_EXPORT YGAlign YGNodeStyleGetAlignContent(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetAlignItems(YGNodeRef node, YGAlign alignItems);
YG_EXPORT YGAlign YGNodeStyleGetAlignItems(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetAlignSelf(YGNodeRef node, YGAlign alignSelf);
YG_EXPORT YGAlign YGNodeStyleGetAlignSelf(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetPositionType(
    YGNodeRef node,
    YGPositionType positionType);
YG_EXPORT YGPositionType YGNodeStyleGetPositionType(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlexWrap(YGNodeRef node, YGWrap flexWrap);
YG_EXPORT YGWrap YGNodeStyleGetFlexWrap(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetOverflow(YGNodeRef node, YGOverflow overflow);
YG_EXPORT YGOverflow YGNodeStyleGetOverflow(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetDisplay(YGNodeRef node, YGDisplay display);
YG_EXPORT YGDisplay YGNodeStyleGetDisplay(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlex(YGNodeRef node, float flex);
YG_EXPORT float YGNodeStyleGetFlex(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlexGrow(YGNodeRef node, float flexGrow);
YG_EXPORT float YGNodeStyleGetFlexGrow(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlexShrink(YGNodeRef node, float flexShrink);
YG_EXPORT float YGNodeStyleGetFlexShrink(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlexBasis(YGNodeRef node, float flexBasis);
YG_EXPORT void YGNodeStyleSetFlexBasisPercent(YGNodeRef node, float flexBasis);
YG_EXPORT void YGNodeStyleSetFlexBasisAuto(YGNodeRef node);
YG_EXPORT YGValue YGNodeStyleGetFlexBasis(YGNodeConstRef node);

YG_EXPORT void
YGNodeStyleSetPosition(YGNodeRef node, YGEdge edge, float position);
YG_EXPORT void
YGNodeStyleSetPositionPercent(YGNodeRef node, YGEdge edge, float position);
YG_EXPORT YGValue YGNodeStyleGetPosition(YGNodeConstRef node, YGEdge edge);

YG_EXPORT void YGNodeStyleSetMargin(YGNodeRef node, YGEdge edge, float margin);
YG_EXPORT void
YGNodeStyleSetMarginPercent(YGNodeRef node, YGEdge edge, float margin);
YG_EXPORT void YGNodeStyleSetMarginAuto(YGNodeRef node, YGEdge edge);
YG_EXPORT YGValue YGNodeStyleGetMargin(YGNodeConstRef node, YGEdge edge);

YG_EXPORT void
YGNodeStyleSetPadding(YGNodeRef node, YGEdge edge, float padding);
YG_EXPORT void
YGNodeStyleSetPaddingPercent(YGNodeRef node, YGEdge edge, float padding);
YG_EXPORT YGValue YGNodeStyleGetPadding(YGNodeConstRef node, YGEdge edge);

YG_EXPORT void YGNodeStyleSetBorder(YGNodeRef node, YGEdge edge, float border);
YG_EXPORT float YGNodeStyleGetBorder(YGNodeConstRef node, YGEdge edge);

YG_EXPORT void
YGNodeStyleSetGap(YGNodeRef node, YGGutter gutter, float gapLength);
YG_EXPORT float YGNodeStyleGetGap(YGNodeConstRef node, YGGutter gutter);

YG_EXPORT void YGNodeStyleSetWidth(YGNodeRef node, float width);
YG_EXPORT void YGNodeStyleSetWidthPercent(YGNodeRef node, float width);
YG_EXPORT void YGNodeStyleSetWidthAuto(YGNodeRef node);
YG_EXPORT YGValue YGNodeStyleGetWidth(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetHeight(YGNodeRef node, float height);
YG_EXPORT void YGNodeStyleSetHeightPercent(YGNodeRef node, float height);
YG_EXPORT void YGNodeStyleSetHeightAuto(YGNodeRef node);
YG_EXPORT YGValue YGNodeStyleGetHeight(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetMinWidth(YGNodeRef node, float minWidth);
YG_EXPORT void YGNodeStyleSetMinWidthPercent(YGNodeRef node, float minWidth);
YG_EXPORT YGValue YGNodeStyleGetMinWidth(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetMinHeight(YGNodeRef node, float minHeight);
YG_EXPORT void YGNodeStyleSetMinHeightPercent(YGNodeRef node, float minHeight);
YG_EXPORT YGValue YGNodeStyleGetMinHeight(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetMaxWidth(YGNodeRef node, float maxWidth);
YG_EXPORT void YGNodeStyleSetMaxWidthPercent(YGNodeRef node, float maxWidth);
YG_EXPORT YGValue YGNodeStyleGetMaxWidth(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetMaxHeight(YGNodeRef node, float maxHeight);
YG_EXPORT void YGNodeStyleSetMaxHeightPercent(YGNodeRef node, float maxHeight);
YG_EXPORT YGValue YGNodeStyleGetMaxHeight(YGNodeConstRef node);

// Yoga specific properties, not compatible with flexbox specification Aspect
// ratio control the size of the undefined dimension of a node. Aspect ratio is
// encoded as a floating point value width/height. e.g. A value of 2 leads to a
// node with a width twice the size of its height while a value of 0.5 gives the
// opposite effect.
//
// - On a node with a set width/height aspect ratio control the size of the
//   unset dimension
// - On a node with a set flex basis aspect ratio controls the size of the node
//   in the cross axis if unset
// - On a node with a measure function aspect ratio works as though the measure
//   function measures the flex basis
// - On a node with flex grow/shrink aspect ratio controls the size of the node
//   in the cross axis if unset
// - Aspect ratio takes min/max dimensions into account
YG_EXPORT void YGNodeStyleSetAspectRatio(YGNodeRef node, float aspectRatio);
YG_EXPORT float YGNodeStyleGetAspectRatio(YGNodeConstRef node);

YG_EXPORT float YGNodeLayoutGetLeft(YGNodeConstRef node);
YG_EXPORT float YGNodeLayoutGetTop(YGNodeConstRef node);
YG_EXPORT float YGNodeLayoutGetRight(YGNodeConstRef node);
YG_EXPORT float YGNodeLayoutGetBottom(YGNodeConstRef node);
YG_EXPORT float YGNodeLayoutGetWidth(YGNodeConstRef node);
YG_EXPORT float YGNodeLayoutGetHeight(YGNodeConstRef node);
YG_EXPORT YGDirection YGNodeLayoutGetDirection(YGNodeConstRef node);
YG_EXPORT bool YGNodeLayoutGetHadOverflow(YGNodeConstRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
YG_EXPORT float YGNodeLayoutGetMargin(YGNodeConstRef node, YGEdge edge);
YG_EXPORT float YGNodeLayoutGetBorder(YGNodeConstRef node, YGEdge edge);
YG_EXPORT float YGNodeLayoutGetPadding(YGNodeConstRef node, YGEdge edge);

YG_EXPORT void YGConfigSetLogger(YGConfigRef config, YGLogger logger);
// Set this to number of pixels in 1 point to round calculation results If you
// want to avoid rounding - set PointScaleFactor to 0
YG_EXPORT void YGConfigSetPointScaleFactor(
    YGConfigRef config,
    float pixelsInPoint);
YG_EXPORT float YGConfigGetPointScaleFactor(YGConfigConstRef config);

// YGConfig
YG_EXPORT YGConfigRef YGConfigNew(void);
YG_EXPORT void YGConfigFree(YGConfigRef config);

YG_EXPORT void YGConfigSetExperimentalFeatureEnabled(
    YGConfigRef config,
    YGExperimentalFeature feature,
    bool enabled);
YG_EXPORT bool YGConfigIsExperimentalFeatureEnabled(
    YGConfigConstRef config,
    YGExperimentalFeature feature);

// Using the web defaults is the preferred configuration for new projects. Usage
// of non web defaults should be considered as legacy.
YG_EXPORT void YGConfigSetUseWebDefaults(YGConfigRef config, bool enabled);
YG_EXPORT bool YGConfigGetUseWebDefaults(YGConfigConstRef config);

YG_EXPORT void YGConfigSetCloneNodeFunc(
    YGConfigRef config,
    YGCloneNodeFunc callback);

YG_EXPORT YGConfigConstRef YGConfigGetDefault(void);

YG_EXPORT void YGConfigSetContext(YGConfigRef config, void* context);
YG_EXPORT void* YGConfigGetContext(YGConfigConstRef config);

YG_EXPORT void YGConfigSetErrata(YGConfigRef config, YGErrata errata);
YG_EXPORT YGErrata YGConfigGetErrata(YGConfigConstRef config);

YG_EXPORT float YGRoundValueToPixelGrid(
    double value,
    double pointScaleFactor,
    bool forceCeil,
    bool forceFloor);

YG_EXTERN_C_END
