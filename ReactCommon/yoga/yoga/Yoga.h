/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#pragma once

#include <assert.h>
#include <math.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

/** Large positive number signifies that the property(float) is undefined.
 *Earlier we used to have YGundefined as NAN, but the downside of this is that
 *we can't use -ffast-math compiler flag as it assumes all floating-point
 *calculation involve and result into finite numbers. For more information
 *regarding -ffast-math compiler flag in clang, have a look at
 *https://clang.llvm.org/docs/UsersManual.html#cmdoption-ffast-math
 **/
#define YGUndefined 10E20F

#include "YGEnums.h"
#include "YGMacros.h"

YG_EXTERN_C_BEGIN

typedef struct YGSize {
  float width;
  float height;
} YGSize;

typedef struct YGValue {
  float value;
  YGUnit unit;
} YGValue;

extern const YGValue YGValueUndefined;
extern const YGValue YGValueAuto;

typedef struct YGConfig* YGConfigRef;

typedef struct YGNode* YGNodeRef;

typedef YGSize (*YGMeasureFunc)(
    YGNodeRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode);
typedef float (
    *YGBaselineFunc)(YGNodeRef node, const float width, const float height);
typedef void (*YGDirtiedFunc)(YGNodeRef node);
typedef void (*YGPrintFunc)(YGNodeRef node);
typedef int (*YGLogger)(
    const YGConfigRef config,
    const YGNodeRef node,
    YGLogLevel level,
    const char* format,
    va_list args);
typedef YGNodeRef (
    *YGCloneNodeFunc)(YGNodeRef oldNode, YGNodeRef owner, int childIndex);

// YGNode
WIN_EXPORT YGNodeRef YGNodeNew(void);
WIN_EXPORT YGNodeRef YGNodeNewWithConfig(const YGConfigRef config);
WIN_EXPORT YGNodeRef YGNodeClone(const YGNodeRef node);
WIN_EXPORT void YGNodeFree(const YGNodeRef node);
WIN_EXPORT void YGNodeFreeRecursive(const YGNodeRef node);
WIN_EXPORT void YGNodeReset(const YGNodeRef node);
WIN_EXPORT int32_t YGNodeGetInstanceCount(void);

WIN_EXPORT void YGNodeInsertChild(
    const YGNodeRef node,
    const YGNodeRef child,
    const uint32_t index);

// This function inserts the child YGNodeRef as a children of the node received
// by parameter and set the Owner of the child object to null. This function is
// expected to be called when using Yoga in persistent mode in order to share a
// YGNodeRef object as a child of two different Yoga trees. The child YGNodeRef
// is expected to be referenced from its original owner and from a clone of its
// original owner.
WIN_EXPORT void YGNodeInsertSharedChild(
    const YGNodeRef node,
    const YGNodeRef child,
    const uint32_t index);
WIN_EXPORT void YGNodeRemoveChild(const YGNodeRef node, const YGNodeRef child);
WIN_EXPORT void YGNodeRemoveAllChildren(const YGNodeRef node);
WIN_EXPORT YGNodeRef YGNodeGetChild(const YGNodeRef node, const uint32_t index);
WIN_EXPORT YGNodeRef YGNodeGetOwner(const YGNodeRef node);
WIN_EXPORT YGNodeRef YGNodeGetParent(const YGNodeRef node);
WIN_EXPORT uint32_t YGNodeGetChildCount(const YGNodeRef node);
WIN_EXPORT void YGNodeSetChildren(
    YGNodeRef const owner,
    const YGNodeRef children[],
    const uint32_t count);

WIN_EXPORT void YGNodeCalculateLayout(
    const YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const YGDirection ownerDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// YG knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to YG they must perform this dirty
// marking manually.
WIN_EXPORT void YGNodeMarkDirty(const YGNodeRef node);

// This function marks the current node and all its descendants as dirty. This
// function is added to test yoga benchmarks. This function is not expected to
// be used in production as calling `YGCalculateLayout` will cause the
// recalculation of each and every node.
WIN_EXPORT void YGNodeMarkDirtyAndPropogateToDescendants(const YGNodeRef node);

WIN_EXPORT void YGNodePrint(const YGNodeRef node, const YGPrintOptions options);

WIN_EXPORT bool YGFloatIsUndefined(const float value);

WIN_EXPORT bool YGNodeCanUseCachedMeasurement(
    const YGMeasureMode widthMode,
    const float width,
    const YGMeasureMode heightMode,
    const float height,
    const YGMeasureMode lastWidthMode,
    const float lastWidth,
    const YGMeasureMode lastHeightMode,
    const float lastHeight,
    const float lastComputedWidth,
    const float lastComputedHeight,
    const float marginRow,
    const float marginColumn,
    const YGConfigRef config);

WIN_EXPORT void YGNodeCopyStyle(
    const YGNodeRef dstNode,
    const YGNodeRef srcNode);

void* YGNodeGetContext(YGNodeRef node);
void YGNodeSetContext(YGNodeRef node, void* context);
YGMeasureFunc YGNodeGetMeasureFunc(YGNodeRef node);
void YGNodeSetMeasureFunc(YGNodeRef node, YGMeasureFunc measureFunc);
YGBaselineFunc YGNodeGetBaselineFunc(YGNodeRef node);
void YGNodeSetBaselineFunc(YGNodeRef node, YGBaselineFunc baselineFunc);
YGDirtiedFunc YGNodeGetDirtiedFunc(YGNodeRef node);
void YGNodeSetDirtiedFunc(YGNodeRef node, YGDirtiedFunc dirtiedFunc);
YGPrintFunc YGNodeGetPrintFunc(YGNodeRef node);
void YGNodeSetPrintFunc(YGNodeRef node, YGPrintFunc printFunc);
bool YGNodeGetHasNewLayout(YGNodeRef node);
void YGNodeSetHasNewLayout(YGNodeRef node, bool hasNewLayout);
YGNodeType YGNodeGetNodeType(YGNodeRef node);
void YGNodeSetNodeType(YGNodeRef node, YGNodeType nodeType);
bool YGNodeIsDirty(YGNodeRef node);
bool YGNodeLayoutGetDidUseLegacyFlag(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetDirection(
    const YGNodeRef node,
    const YGDirection direction);
WIN_EXPORT YGDirection YGNodeStyleGetDirection(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetFlexDirection(
    const YGNodeRef node,
    const YGFlexDirection flexDirection);
WIN_EXPORT YGFlexDirection YGNodeStyleGetFlexDirection(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetJustifyContent(
    const YGNodeRef node,
    const YGJustify justifyContent);
WIN_EXPORT YGJustify YGNodeStyleGetJustifyContent(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetAlignContent(
    const YGNodeRef node,
    const YGAlign alignContent);
WIN_EXPORT YGAlign YGNodeStyleGetAlignContent(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetAlignItems(
    const YGNodeRef node,
    const YGAlign alignItems);
WIN_EXPORT YGAlign YGNodeStyleGetAlignItems(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetAlignSelf(
    const YGNodeRef node,
    const YGAlign alignSelf);
WIN_EXPORT YGAlign YGNodeStyleGetAlignSelf(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetPositionType(
    const YGNodeRef node,
    const YGPositionType positionType);
WIN_EXPORT YGPositionType YGNodeStyleGetPositionType(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetFlexWrap(
    const YGNodeRef node,
    const YGWrap flexWrap);
WIN_EXPORT YGWrap YGNodeStyleGetFlexWrap(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetOverflow(
    const YGNodeRef node,
    const YGOverflow overflow);
WIN_EXPORT YGOverflow YGNodeStyleGetOverflow(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetDisplay(
    const YGNodeRef node,
    const YGDisplay display);
WIN_EXPORT YGDisplay YGNodeStyleGetDisplay(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetFlex(const YGNodeRef node, const float flex);
WIN_EXPORT float YGNodeStyleGetFlex(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetFlexGrow(
    const YGNodeRef node,
    const float flexGrow);
WIN_EXPORT float YGNodeStyleGetFlexGrow(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetFlexShrink(
    const YGNodeRef node,
    const float flexShrink);
WIN_EXPORT float YGNodeStyleGetFlexShrink(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetFlexBasis(
    const YGNodeRef node,
    const float flexBasis);
WIN_EXPORT void YGNodeStyleSetFlexBasisPercent(
    const YGNodeRef node,
    const float flexBasis);
WIN_EXPORT void YGNodeStyleSetFlexBasisAuto(const YGNodeRef node);
WIN_EXPORT YGValue YGNodeStyleGetFlexBasis(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetPosition(
    const YGNodeRef node,
    const YGEdge edge,
    const float position);
WIN_EXPORT void YGNodeStyleSetPositionPercent(
    const YGNodeRef node,
    const YGEdge edge,
    const float position);
WIN_EXPORT WIN_STRUCT(YGValue)
    YGNodeStyleGetPosition(const YGNodeRef node, const YGEdge edge);

WIN_EXPORT void YGNodeStyleSetMargin(
    const YGNodeRef node,
    const YGEdge edge,
    const float margin);
WIN_EXPORT void YGNodeStyleSetMarginPercent(
    const YGNodeRef node,
    const YGEdge edge,
    const float margin);
WIN_EXPORT void YGNodeStyleSetMarginAuto(
    const YGNodeRef node,
    const YGEdge edge);
WIN_EXPORT YGValue
YGNodeStyleGetMargin(const YGNodeRef node, const YGEdge edge);

WIN_EXPORT void YGNodeStyleSetPadding(
    const YGNodeRef node,
    const YGEdge edge,
    const float padding);
WIN_EXPORT void YGNodeStyleSetPaddingPercent(
    const YGNodeRef node,
    const YGEdge edge,
    const float padding);
WIN_EXPORT YGValue
YGNodeStyleGetPadding(const YGNodeRef node, const YGEdge edge);

WIN_EXPORT void YGNodeStyleSetBorder(
    const YGNodeRef node,
    const YGEdge edge,
    const float border);
WIN_EXPORT float YGNodeStyleGetBorder(const YGNodeRef node, const YGEdge edge);

WIN_EXPORT void YGNodeStyleSetWidth(const YGNodeRef node, const float width);
WIN_EXPORT void YGNodeStyleSetWidthPercent(
    const YGNodeRef node,
    const float width);
WIN_EXPORT void YGNodeStyleSetWidthAuto(const YGNodeRef node);
WIN_EXPORT YGValue YGNodeStyleGetWidth(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetHeight(const YGNodeRef node, const float height);
WIN_EXPORT void YGNodeStyleSetHeightPercent(
    const YGNodeRef node,
    const float height);
WIN_EXPORT void YGNodeStyleSetHeightAuto(const YGNodeRef node);
WIN_EXPORT YGValue YGNodeStyleGetHeight(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetMinWidth(
    const YGNodeRef node,
    const float minWidth);
WIN_EXPORT void YGNodeStyleSetMinWidthPercent(
    const YGNodeRef node,
    const float minWidth);
WIN_EXPORT YGValue YGNodeStyleGetMinWidth(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetMinHeight(
    const YGNodeRef node,
    const float minHeight);
WIN_EXPORT void YGNodeStyleSetMinHeightPercent(
    const YGNodeRef node,
    const float minHeight);
WIN_EXPORT YGValue YGNodeStyleGetMinHeight(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetMaxWidth(
    const YGNodeRef node,
    const float maxWidth);
WIN_EXPORT void YGNodeStyleSetMaxWidthPercent(
    const YGNodeRef node,
    const float maxWidth);
WIN_EXPORT YGValue YGNodeStyleGetMaxWidth(const YGNodeRef node);

WIN_EXPORT void YGNodeStyleSetMaxHeight(
    const YGNodeRef node,
    const float maxHeight);
WIN_EXPORT void YGNodeStyleSetMaxHeightPercent(
    const YGNodeRef node,
    const float maxHeight);
WIN_EXPORT YGValue YGNodeStyleGetMaxHeight(const YGNodeRef node);

// Yoga specific properties, not compatible with flexbox specification
// Aspect ratio control the size of the undefined dimension of a node.
// Aspect ratio is encoded as a floating point value width/height. e.g. A value
// of 2 leads to a node with a width twice the size of its height while a value
// of 0.5 gives the opposite effect.
//
// - On a node with a set width/height aspect ratio control the size of the
// unset dimension
// - On a node with a set flex basis aspect ratio controls the size of the node
// in the cross axis if unset
// - On a node with a measure function aspect ratio works as though the measure
// function measures the flex basis
// - On a node with flex grow/shrink aspect ratio controls the size of the node
// in the cross axis if unset
// - Aspect ratio takes min/max dimensions into account
WIN_EXPORT void YGNodeStyleSetAspectRatio(
    const YGNodeRef node,
    const float aspectRatio);
WIN_EXPORT float YGNodeStyleGetAspectRatio(const YGNodeRef node);

WIN_EXPORT float YGNodeLayoutGetLeft(const YGNodeRef node);
WIN_EXPORT float YGNodeLayoutGetTop(const YGNodeRef node);
WIN_EXPORT float YGNodeLayoutGetRight(const YGNodeRef node);
WIN_EXPORT float YGNodeLayoutGetBottom(const YGNodeRef node);
WIN_EXPORT float YGNodeLayoutGetWidth(const YGNodeRef node);
WIN_EXPORT float YGNodeLayoutGetHeight(const YGNodeRef node);
WIN_EXPORT YGDirection YGNodeLayoutGetDirection(const YGNodeRef node);
WIN_EXPORT bool YGNodeLayoutGetHadOverflow(const YGNodeRef node);
bool YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(const YGNodeRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
WIN_EXPORT float YGNodeLayoutGetMargin(const YGNodeRef node, const YGEdge edge);
WIN_EXPORT float YGNodeLayoutGetBorder(const YGNodeRef node, const YGEdge edge);
WIN_EXPORT float YGNodeLayoutGetPadding(
    const YGNodeRef node,
    const YGEdge edge);

WIN_EXPORT void YGConfigSetLogger(const YGConfigRef config, YGLogger logger);
WIN_EXPORT void
YGLog(const YGNodeRef node, YGLogLevel level, const char* message, ...);
WIN_EXPORT void YGLogWithConfig(
    const YGConfigRef config,
    YGLogLevel level,
    const char* format,
    ...);
WIN_EXPORT void YGAssert(const bool condition, const char* message);
WIN_EXPORT void YGAssertWithNode(
    const YGNodeRef node,
    const bool condition,
    const char* message);
WIN_EXPORT void YGAssertWithConfig(
    const YGConfigRef config,
    const bool condition,
    const char* message);
// Set this to number of pixels in 1 point to round calculation results
// If you want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void YGConfigSetPointScaleFactor(
    const YGConfigRef config,
    const float pixelsInPoint);
void YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    const YGConfigRef config,
    const bool shouldDiffLayout);

// Yoga previously had an error where containers would take the maximum space
// possible instead of the minimum like they are supposed to. In practice this
// resulted in implicit behaviour similar to align-self: stretch; Because this
// was such a long-standing bug we must allow legacy users to switch back to
// this behaviour.
WIN_EXPORT void YGConfigSetUseLegacyStretchBehaviour(
    const YGConfigRef config,
    const bool useLegacyStretchBehaviour);

// YGConfig
WIN_EXPORT YGConfigRef YGConfigNew(void);
WIN_EXPORT void YGConfigFree(const YGConfigRef config);
WIN_EXPORT void YGConfigCopy(const YGConfigRef dest, const YGConfigRef src);
WIN_EXPORT int32_t YGConfigGetInstanceCount(void);

WIN_EXPORT void YGConfigSetExperimentalFeatureEnabled(
    const YGConfigRef config,
    const YGExperimentalFeature feature,
    const bool enabled);
WIN_EXPORT bool YGConfigIsExperimentalFeatureEnabled(
    const YGConfigRef config,
    const YGExperimentalFeature feature);

// Using the web defaults is the prefered configuration for new projects.
// Usage of non web defaults should be considered as legacy.
WIN_EXPORT void YGConfigSetUseWebDefaults(
    const YGConfigRef config,
    const bool enabled);
WIN_EXPORT bool YGConfigGetUseWebDefaults(const YGConfigRef config);

WIN_EXPORT void YGConfigSetCloneNodeFunc(
    const YGConfigRef config,
    const YGCloneNodeFunc callback);

// Export only for C#
WIN_EXPORT YGConfigRef YGConfigGetDefault(void);

WIN_EXPORT void YGConfigSetContext(const YGConfigRef config, void* context);
WIN_EXPORT void* YGConfigGetContext(const YGConfigRef config);

WIN_EXPORT float YGRoundValueToPixelGrid(
    const float value,
    const float pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor);

YG_EXTERN_C_END

#ifdef __cplusplus

#include <functional>
#include <vector>

// Calls f on each node in the tree including the given node argument.
extern void YGTraversePreOrder(
    YGNodeRef const node,
    std::function<void(YGNodeRef node)>&& f);

extern void YGNodeSetChildren(
    YGNodeRef const owner,
    const std::vector<YGNodeRef>& children);

#endif
