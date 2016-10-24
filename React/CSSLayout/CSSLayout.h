/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

// Not defined in MSVC++
#ifndef NAN
static const unsigned long __nan[2] = {0xffffffff, 0x7fffffff};
#define NAN (*(const float *) __nan)
#endif

#define CSSUndefined NAN

#include "CSSMacros.h"

CSS_EXTERN_C_BEGIN

typedef enum CSSDirection {
  CSSDirectionInherit,
  CSSDirectionLTR,
  CSSDirectionRTL,
} CSSDirection;

typedef enum CSSFlexDirection {
  CSSFlexDirectionColumn,
  CSSFlexDirectionColumnReverse,
  CSSFlexDirectionRow,
  CSSFlexDirectionRowReverse,
} CSSFlexDirection;

typedef enum CSSJustify {
  CSSJustifyFlexStart,
  CSSJustifyCenter,
  CSSJustifyFlexEnd,
  CSSJustifySpaceBetween,
  CSSJustifySpaceAround,
} CSSJustify;

typedef enum CSSOverflow {
  CSSOverflowVisible,
  CSSOverflowHidden,
  CSSOverflowScroll,
} CSSOverflow;

// Note: auto is only a valid value for alignSelf. It is NOT a valid value for
// alignItems.
typedef enum CSSAlign {
  CSSAlignAuto,
  CSSAlignFlexStart,
  CSSAlignCenter,
  CSSAlignFlexEnd,
  CSSAlignStretch,
} CSSAlign;

typedef enum CSSPositionType {
  CSSPositionTypeRelative,
  CSSPositionTypeAbsolute,
} CSSPositionType;

typedef enum CSSWrapType {
  CSSWrapTypeNoWrap,
  CSSWrapTypeWrap,
} CSSWrapType;

typedef enum CSSMeasureMode {
  CSSMeasureModeUndefined,
  CSSMeasureModeExactly,
  CSSMeasureModeAtMost,
  CSSMeasureModeCount,
} CSSMeasureMode;

typedef enum CSSDimension {
  CSSDimensionWidth,
  CSSDimensionHeight,
} CSSDimension;

typedef enum CSSEdge {
  CSSEdgeLeft,
  CSSEdgeTop,
  CSSEdgeRight,
  CSSEdgeBottom,
  CSSEdgeStart,
  CSSEdgeEnd,
  CSSEdgeHorizontal,
  CSSEdgeVertical,
  CSSEdgeAll,
  CSSEdgeCount,
} CSSEdge;

typedef enum CSSPrintOptions {
  CSSPrintOptionsLayout = 1,
  CSSPrintOptionsStyle = 2,
  CSSPrintOptionsChildren = 4,
} CSSPrintOptions;

typedef struct CSSSize {
  float width;
  float height;
} CSSSize;

typedef struct CSSNode *CSSNodeRef;
typedef CSSSize (*CSSMeasureFunc)(void *context,
                                  float width,
                                  CSSMeasureMode widthMode,
                                  float height,
                                  CSSMeasureMode heightMode);
typedef void (*CSSPrintFunc)(void *context);
typedef int (*CSSLogger)(const char *format, ...);

#ifdef CSS_ASSERT_FAIL_ENABLED
typedef void (*CSSAssertFailFunc)(const char *message);
#endif

// CSSNode
WIN_EXPORT CSSNodeRef CSSNodeNew(void);
WIN_EXPORT void CSSNodeInit(const CSSNodeRef node);
WIN_EXPORT void CSSNodeFree(const CSSNodeRef node);
WIN_EXPORT void CSSNodeFreeRecursive(const CSSNodeRef node);
WIN_EXPORT void CSSNodeReset(const CSSNodeRef node);
WIN_EXPORT int32_t CSSNodeGetInstanceCount(void);

WIN_EXPORT void CSSNodeInsertChild(const CSSNodeRef node,
                                   const CSSNodeRef child,
                                   const uint32_t index);
WIN_EXPORT void CSSNodeRemoveChild(const CSSNodeRef node, const CSSNodeRef child);
WIN_EXPORT CSSNodeRef CSSNodeGetChild(const CSSNodeRef node, const uint32_t index);
WIN_EXPORT uint32_t CSSNodeChildCount(const CSSNodeRef node);

WIN_EXPORT void CSSNodeCalculateLayout(const CSSNodeRef node,
                                       const float availableWidth,
                                       const float availableHeight,
                                       const CSSDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// CSSLayout knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to CSSLayout they must perform this dirty
// marking manually.
WIN_EXPORT void CSSNodeMarkDirty(const CSSNodeRef node);
WIN_EXPORT bool CSSNodeIsDirty(const CSSNodeRef node);

WIN_EXPORT void CSSNodePrint(const CSSNodeRef node, const CSSPrintOptions options);

WIN_EXPORT bool CSSValueIsUndefined(const float value);

#define CSS_NODE_PROPERTY(type, name, paramName)                           \
  WIN_EXPORT void CSSNodeSet##name(const CSSNodeRef node, type paramName); \
  WIN_EXPORT type CSSNodeGet##name(const CSSNodeRef node);

#define CSS_NODE_STYLE_PROPERTY(type, name, paramName)                                \
  WIN_EXPORT void CSSNodeStyleSet##name(const CSSNodeRef node, const type paramName); \
  WIN_EXPORT type CSSNodeStyleGet##name(const CSSNodeRef node);

#define CSS_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)    \
  WIN_EXPORT void CSSNodeStyleSet##name(const CSSNodeRef node, \
                                        const CSSEdge edge,    \
                                        const type paramName); \
  WIN_EXPORT type CSSNodeStyleGet##name(const CSSNodeRef node, const CSSEdge edge);

#define CSS_NODE_LAYOUT_PROPERTY(type, name) \
  WIN_EXPORT type CSSNodeLayoutGet##name(const CSSNodeRef node);

CSS_NODE_PROPERTY(void *, Context, context);
CSS_NODE_PROPERTY(CSSMeasureFunc, MeasureFunc, measureFunc);
CSS_NODE_PROPERTY(CSSPrintFunc, PrintFunc, printFunc);
CSS_NODE_PROPERTY(bool, IsTextnode, isTextNode);
CSS_NODE_PROPERTY(bool, HasNewLayout, hasNewLayout);

CSS_NODE_STYLE_PROPERTY(CSSDirection, Direction, direction);
CSS_NODE_STYLE_PROPERTY(CSSFlexDirection, FlexDirection, flexDirection);
CSS_NODE_STYLE_PROPERTY(CSSJustify, JustifyContent, justifyContent);
CSS_NODE_STYLE_PROPERTY(CSSAlign, AlignContent, alignContent);
CSS_NODE_STYLE_PROPERTY(CSSAlign, AlignItems, alignItems);
CSS_NODE_STYLE_PROPERTY(CSSAlign, AlignSelf, alignSelf);
CSS_NODE_STYLE_PROPERTY(CSSPositionType, PositionType, positionType);
CSS_NODE_STYLE_PROPERTY(CSSWrapType, FlexWrap, flexWrap);
CSS_NODE_STYLE_PROPERTY(CSSOverflow, Overflow, overflow);

WIN_EXPORT void CSSNodeStyleSetFlex(const CSSNodeRef node, const float flex);
CSS_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
CSS_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
CSS_NODE_STYLE_PROPERTY(float, FlexBasis, flexBasis);

CSS_NODE_STYLE_EDGE_PROPERTY(float, Position, position);
CSS_NODE_STYLE_EDGE_PROPERTY(float, Margin, margin);
CSS_NODE_STYLE_EDGE_PROPERTY(float, Padding, padding);
CSS_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

CSS_NODE_STYLE_PROPERTY(float, Width, width);
CSS_NODE_STYLE_PROPERTY(float, Height, height);
CSS_NODE_STYLE_PROPERTY(float, MinWidth, minWidth);
CSS_NODE_STYLE_PROPERTY(float, MinHeight, minHeight);
CSS_NODE_STYLE_PROPERTY(float, MaxWidth, maxWidth);
CSS_NODE_STYLE_PROPERTY(float, MaxHeight, maxHeight);

CSS_NODE_LAYOUT_PROPERTY(float, Left);
CSS_NODE_LAYOUT_PROPERTY(float, Top);
CSS_NODE_LAYOUT_PROPERTY(float, Right);
CSS_NODE_LAYOUT_PROPERTY(float, Bottom);
CSS_NODE_LAYOUT_PROPERTY(float, Width);
CSS_NODE_LAYOUT_PROPERTY(float, Height);
CSS_NODE_LAYOUT_PROPERTY(CSSDirection, Direction);

WIN_EXPORT void CSSLayoutSetLogger(CSSLogger logger);

#ifdef CSS_ASSERT_FAIL_ENABLED
// Assert
WIN_EXPORT void CSSAssertSetFailFunc(CSSAssertFailFunc func);
WIN_EXPORT void CSSAssertFail(const char *message);
#endif

CSS_EXTERN_C_END
