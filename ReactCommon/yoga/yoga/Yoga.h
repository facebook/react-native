/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

typedef struct YGConfig *YGConfigRef;

typedef struct YGNode* YGNodeRef;

typedef YGSize (*YGMeasureFunc)(YGNodeRef node,
                                float width,
                                YGMeasureMode widthMode,
                                float height,
                                YGMeasureMode heightMode);
typedef float (*YGBaselineFunc)(YGNodeRef node, const float width, const float height);
typedef void (*YGDirtiedFunc)(YGNodeRef node);
typedef void (*YGPrintFunc)(YGNodeRef node);
typedef int (*YGLogger)(const YGConfigRef config,
                        const YGNodeRef node,
                        YGLogLevel level,
                        const char *format,
                        va_list args);
typedef YGNodeRef (*YGCloneNodeFunc)(YGNodeRef oldNode,
                                 YGNodeRef parent,
                                 int childIndex);

// YGNode
WIN_EXPORT YGNodeRef YGNodeNew(void);
WIN_EXPORT YGNodeRef YGNodeNewWithConfig(const YGConfigRef config);
WIN_EXPORT YGNodeRef YGNodeClone(const YGNodeRef node);
WIN_EXPORT void YGNodeFree(const YGNodeRef node);
WIN_EXPORT void YGNodeFreeRecursive(const YGNodeRef node);
WIN_EXPORT void YGNodeReset(const YGNodeRef node);
WIN_EXPORT int32_t YGNodeGetInstanceCount(void);

WIN_EXPORT void YGNodeInsertChild(const YGNodeRef node,
                                  const YGNodeRef child,
                                  const uint32_t index);
WIN_EXPORT void YGNodeRemoveChild(const YGNodeRef node, const YGNodeRef child);
WIN_EXPORT void YGNodeRemoveAllChildren(const YGNodeRef node);
WIN_EXPORT YGNodeRef YGNodeGetChild(const YGNodeRef node, const uint32_t index);
WIN_EXPORT YGNodeRef YGNodeGetParent(const YGNodeRef node);
WIN_EXPORT uint32_t YGNodeGetChildCount(const YGNodeRef node);
WIN_EXPORT void YGNodeSetChildren(YGNodeRef const parent, const YGNodeRef children[], const uint32_t count);

WIN_EXPORT void YGNodeCalculateLayout(const YGNodeRef node,
                                      const float availableWidth,
                                      const float availableHeight,
                                      const YGDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// YG knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to YG they must perform this dirty
// marking manually.
WIN_EXPORT void YGNodeMarkDirty(const YGNodeRef node);

// This function marks the current node and all its descendants as dirty. This function is added to test yoga benchmarks.
// This function is not expected to be used in production as calling `YGCalculateLayout` will cause the recalculation of each and every node.
WIN_EXPORT void YGNodeMarkDirtyAndPropogateToDescendants(const YGNodeRef node);

WIN_EXPORT void YGNodePrint(const YGNodeRef node, const YGPrintOptions options);

WIN_EXPORT bool YGFloatIsUndefined(const float value);

WIN_EXPORT bool YGNodeCanUseCachedMeasurement(const YGMeasureMode widthMode,
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

WIN_EXPORT void YGNodeCopyStyle(const YGNodeRef dstNode, const YGNodeRef srcNode);

#define YG_NODE_PROPERTY(type, name, paramName)                          \
  WIN_EXPORT void YGNodeSet##name(const YGNodeRef node, type paramName); \
  WIN_EXPORT type YGNodeGet##name(const YGNodeRef node);

#define YG_NODE_STYLE_PROPERTY(type, name, paramName)                               \
  WIN_EXPORT void YGNodeStyleSet##name(const YGNodeRef node, const type paramName); \
  WIN_EXPORT type YGNodeStyleGet##name(const YGNodeRef node);

#define YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)                                    \
  WIN_EXPORT void YGNodeStyleSet##name(const YGNodeRef node, const float paramName);          \
  WIN_EXPORT void YGNodeStyleSet##name##Percent(const YGNodeRef node, const float paramName); \
  WIN_EXPORT type YGNodeStyleGet##name(const YGNodeRef node);

#define YG_NODE_STYLE_PROPERTY_UNIT_AUTO(type, name, paramName) \
  YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)            \
  WIN_EXPORT void YGNodeStyleSet##name##Auto(const YGNodeRef node);

#define YG_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)    \
  WIN_EXPORT void YGNodeStyleSet##name(const YGNodeRef node,  \
                                       const YGEdge edge,     \
                                       const type paramName); \
  WIN_EXPORT type YGNodeStyleGet##name(const YGNodeRef node, const YGEdge edge);

#define YG_NODE_STYLE_EDGE_PROPERTY_UNIT(type, name, paramName)         \
  WIN_EXPORT void YGNodeStyleSet##name(const YGNodeRef node,            \
                                       const YGEdge edge,               \
                                       const float paramName);          \
  WIN_EXPORT void YGNodeStyleSet##name##Percent(const YGNodeRef node,   \
                                                const YGEdge edge,      \
                                                const float paramName); \
  WIN_EXPORT WIN_STRUCT(type) YGNodeStyleGet##name(const YGNodeRef node, const YGEdge edge);

#define YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO(type, name) \
  WIN_EXPORT void YGNodeStyleSet##name##Auto(const YGNodeRef node, const YGEdge edge);

#define YG_NODE_LAYOUT_PROPERTY(type, name) \
  WIN_EXPORT type YGNodeLayoutGet##name(const YGNodeRef node);

#define YG_NODE_LAYOUT_EDGE_PROPERTY(type, name) \
  WIN_EXPORT type YGNodeLayoutGet##name(const YGNodeRef node, const YGEdge edge);

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

YG_NODE_STYLE_PROPERTY(YGDirection, Direction, direction);
YG_NODE_STYLE_PROPERTY(YGFlexDirection, FlexDirection, flexDirection);
YG_NODE_STYLE_PROPERTY(YGJustify, JustifyContent, justifyContent);
YG_NODE_STYLE_PROPERTY(YGAlign, AlignContent, alignContent);
YG_NODE_STYLE_PROPERTY(YGAlign, AlignItems, alignItems);
YG_NODE_STYLE_PROPERTY(YGAlign, AlignSelf, alignSelf);
YG_NODE_STYLE_PROPERTY(YGPositionType, PositionType, positionType);
YG_NODE_STYLE_PROPERTY(YGWrap, FlexWrap, flexWrap);
YG_NODE_STYLE_PROPERTY(YGOverflow, Overflow, overflow);
YG_NODE_STYLE_PROPERTY(YGDisplay, Display, display);
YG_NODE_STYLE_PROPERTY(float, Flex, flex);
YG_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
YG_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
YG_NODE_STYLE_PROPERTY_UNIT_AUTO(YGValue, FlexBasis, flexBasis);

YG_NODE_STYLE_EDGE_PROPERTY_UNIT(YGValue, Position, position);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT(YGValue, Margin, margin);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO(YGValue, Margin);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT(YGValue, Padding, padding);
YG_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

YG_NODE_STYLE_PROPERTY_UNIT_AUTO(YGValue, Width, width);
YG_NODE_STYLE_PROPERTY_UNIT_AUTO(YGValue, Height, height);
YG_NODE_STYLE_PROPERTY_UNIT(YGValue, MinWidth, minWidth);
YG_NODE_STYLE_PROPERTY_UNIT(YGValue, MinHeight, minHeight);
YG_NODE_STYLE_PROPERTY_UNIT(YGValue, MaxWidth, maxWidth);
YG_NODE_STYLE_PROPERTY_UNIT(YGValue, MaxHeight, maxHeight);

// Yoga specific properties, not compatible with flexbox specification
// Aspect ratio control the size of the undefined dimension of a node.
// Aspect ratio is encoded as a floating point value width/height. e.g. A value of 2 leads to a node
// with a width twice the size of its height while a value of 0.5 gives the opposite effect.
//
// - On a node with a set width/height aspect ratio control the size of the unset dimension
// - On a node with a set flex basis aspect ratio controls the size of the node in the cross axis if
// unset
// - On a node with a measure function aspect ratio works as though the measure function measures
// the flex basis
// - On a node with flex grow/shrink aspect ratio controls the size of the node in the cross axis if
// unset
// - Aspect ratio takes min/max dimensions into account
YG_NODE_STYLE_PROPERTY(float, AspectRatio, aspectRatio);

YG_NODE_LAYOUT_PROPERTY(float, Left);
YG_NODE_LAYOUT_PROPERTY(float, Top);
YG_NODE_LAYOUT_PROPERTY(float, Right);
YG_NODE_LAYOUT_PROPERTY(float, Bottom);
YG_NODE_LAYOUT_PROPERTY(float, Width);
YG_NODE_LAYOUT_PROPERTY(float, Height);
YG_NODE_LAYOUT_PROPERTY(YGDirection, Direction);
YG_NODE_LAYOUT_PROPERTY(bool, HadOverflow);
bool YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(const YGNodeRef node);

// Get the computed values for these nodes after performing layout. If they were set using
// point values then the returned value will be the same as YGNodeStyleGetXXX. However if
// they were set using a percentage value then the returned value is the computed value used
// during layout.
YG_NODE_LAYOUT_EDGE_PROPERTY(float, Margin);
YG_NODE_LAYOUT_EDGE_PROPERTY(float, Border);
YG_NODE_LAYOUT_EDGE_PROPERTY(float, Padding);

WIN_EXPORT void YGConfigSetLogger(const YGConfigRef config, YGLogger logger);
WIN_EXPORT void YGLog(const YGNodeRef node, YGLogLevel level, const char *message, ...);
WIN_EXPORT void YGLogWithConfig(const YGConfigRef config, YGLogLevel level, const char *format, ...);
WIN_EXPORT void YGAssert(const bool condition, const char *message);
WIN_EXPORT void YGAssertWithNode(const YGNodeRef node, const bool condition, const char *message);
WIN_EXPORT void YGAssertWithConfig(const YGConfigRef config,
                                   const bool condition,
                                   const char *message);
// Set this to number of pixels in 1 point to round calculation results
// If you want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void YGConfigSetPointScaleFactor(const YGConfigRef config, const float pixelsInPoint);
void YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    const YGConfigRef config,
    const bool shouldDiffLayout);

// Yoga previously had an error where containers would take the maximum space possible instead of
// the minimum
// like they are supposed to. In practice this resulted in implicit behaviour similar to align-self:
// stretch;
// Because this was such a long-standing bug we must allow legacy users to switch back to this
// behaviour.
WIN_EXPORT void YGConfigSetUseLegacyStretchBehaviour(const YGConfigRef config,
                                                     const bool useLegacyStretchBehaviour);

// YGConfig
WIN_EXPORT YGConfigRef YGConfigNew(void);
WIN_EXPORT void YGConfigFree(const YGConfigRef config);
WIN_EXPORT void YGConfigCopy(const YGConfigRef dest, const YGConfigRef src);
WIN_EXPORT int32_t YGConfigGetInstanceCount(void);

WIN_EXPORT void YGConfigSetExperimentalFeatureEnabled(const YGConfigRef config,
                                                      const YGExperimentalFeature feature,
                                                      const bool enabled);
WIN_EXPORT bool YGConfigIsExperimentalFeatureEnabled(const YGConfigRef config,
                                                     const YGExperimentalFeature feature);

// Using the web defaults is the prefered configuration for new projects.
// Usage of non web defaults should be considered as legacy.
WIN_EXPORT void YGConfigSetUseWebDefaults(const YGConfigRef config, const bool enabled);
WIN_EXPORT bool YGConfigGetUseWebDefaults(const YGConfigRef config);

WIN_EXPORT void YGConfigSetCloneNodeFunc(const YGConfigRef config,
                                          const YGCloneNodeFunc callback);

// Export only for C#
WIN_EXPORT YGConfigRef YGConfigGetDefault(void);

WIN_EXPORT void YGConfigSetContext(const YGConfigRef config, void *context);
WIN_EXPORT void *YGConfigGetContext(const YGConfigRef config);

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
extern void YGTraversePreOrder(YGNodeRef const node, std::function<void(YGNodeRef node)>&& f);

extern void YGNodeSetChildren(YGNodeRef const parent, const std::vector<YGNodeRef> &children);

#endif
