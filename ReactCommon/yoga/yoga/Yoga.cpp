/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "Yoga.h"
#include <string.h>
#include <algorithm>
#include "YGNodePrint.h"
#include "Yoga-internal.h"

#ifdef _MSC_VER
#include <float.h>
#ifndef isnan
#define isnan _isnan
#endif
#ifndef __cplusplus
#define inline __inline
#endif

/* define fmaxf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) {
  return (a > b) ? a : b;
}
#endif
#endif

#ifdef ANDROID
static int YGAndroidLog(const YGConfigRef config,
                        const YGNodeRef node,
                        YGLogLevel level,
                        const char *format,
                        va_list args);
#else
static int YGDefaultLog(const YGConfigRef config,
                        const YGNodeRef node,
                        YGLogLevel level,
                        const char *format,
                        va_list args);
#endif

static YGConfig gYGConfigDefaults = {
    .experimentalFeatures =
        {
            [YGExperimentalFeatureWebFlexBasis] = false,
        },
    .useWebDefaults = false,
    .useLegacyStretchBehaviour = false,
    .pointScaleFactor = 1.0f,
#ifdef ANDROID
    .logger = &YGAndroidLog,
#else
    .logger = &YGDefaultLog,
#endif
    .cloneNodeCallback = nullptr,
    .context = nullptr,
};

static void YGNodeMarkDirtyInternal(const YGNodeRef node);

static YGValue YGValueZero = {.value = 0, .unit = YGUnitPoint};

static bool YGNodeListDelete(YGVector& list, const YGNodeRef node) {
  std::vector<YGNodeRef>::iterator p =
      std::find(list.begin(), list.end(), node);
  if (p != list.end()) {
    list.erase(p);
    return true;
  }
  return false;
}

#ifdef ANDROID
#include <android/log.h>
static int YGAndroidLog(const YGConfigRef config,
                        const YGNodeRef node,
                        YGLogLevel level,
                        const char *format,
                        va_list args) {
  int androidLevel = YGLogLevelDebug;
  switch (level) {
    case YGLogLevelFatal:
      androidLevel = ANDROID_LOG_FATAL;
      break;
    case YGLogLevelError:
      androidLevel = ANDROID_LOG_ERROR;
      break;
    case YGLogLevelWarn:
      androidLevel = ANDROID_LOG_WARN;
      break;
    case YGLogLevelInfo:
      androidLevel = ANDROID_LOG_INFO;
      break;
    case YGLogLevelDebug:
      androidLevel = ANDROID_LOG_DEBUG;
      break;
    case YGLogLevelVerbose:
      androidLevel = ANDROID_LOG_VERBOSE;
      break;
  }
  const int result = __android_log_vprint(androidLevel, "yoga", format, args);
  return result;
}
#else
#define YG_UNUSED(x) (void)(x);

static int YGDefaultLog(const YGConfigRef config,
                        const YGNodeRef node,
                        YGLogLevel level,
                        const char *format,
                        va_list args) {
  YG_UNUSED(config);
  YG_UNUSED(node);
  switch (level) {
    case YGLogLevelError:
    case YGLogLevelFatal:
      return vfprintf(stderr, format, args);
    case YGLogLevelWarn:
    case YGLogLevelInfo:
    case YGLogLevelDebug:
    case YGLogLevelVerbose:
    default:
      return vprintf(format, args);
  }
}

#undef YG_UNUSED
#endif

bool YGFloatIsUndefined(const float value) {
// TODO(gkm): Ugh! Some Android builds (r13b & clang-3.8) fail
// with the kludge below, so we must tailor it specifically for
// NDK r15c which has clang-5.0. NDK r16 will make it all better.
#if __ANDROID__ && __clang_major__ == 5 // TODO(gkm): remove for NDK >= 16
#undef isnan
#define isnan __builtin_isnan
#endif
  return isnan(value);
}

const YGValue* YGComputedEdgeValue(
    const YGValue edges[YGEdgeCount],
    const YGEdge edge,
    const YGValue* const defaultValue) {
  if (edges[edge].unit != YGUnitUndefined) {
    return &edges[edge];
  }

  if ((edge == YGEdgeTop || edge == YGEdgeBottom) &&
      edges[YGEdgeVertical].unit != YGUnitUndefined) {
    return &edges[YGEdgeVertical];
  }

  if ((edge == YGEdgeLeft || edge == YGEdgeRight || edge == YGEdgeStart || edge == YGEdgeEnd) &&
      edges[YGEdgeHorizontal].unit != YGUnitUndefined) {
    return &edges[YGEdgeHorizontal];
  }

  if (edges[YGEdgeAll].unit != YGUnitUndefined) {
    return &edges[YGEdgeAll];
  }

  if (edge == YGEdgeStart || edge == YGEdgeEnd) {
    return &YGValueUndefined;
  }

  return defaultValue;
}

static inline float YGResolveValue(const YGValue *const value, const float parentSize) {
  switch (value->unit) {
    case YGUnitUndefined:
    case YGUnitAuto:
      return YGUndefined;
    case YGUnitPoint:
      return value->value;
    case YGUnitPercent:
      return value->value * parentSize / 100.0f;
  }
  return YGUndefined;
}

static inline float YGResolveValueMargin(const YGValue *const value, const float parentSize) {
  return value->unit == YGUnitAuto ? 0 : YGResolveValue(value, parentSize);
}

int32_t gNodeInstanceCount = 0;
int32_t gConfigInstanceCount = 0;

WIN_EXPORT YGNodeRef YGNodeNewWithConfig(const YGConfigRef config) {
  const YGNodeRef node = (const YGNodeRef)malloc(sizeof(YGNode));
  YGAssertWithConfig(
      config, node != nullptr, "Could not allocate memory for node");
  gNodeInstanceCount++;

  memcpy(node, &gYGNodeDefaults, sizeof(YGNode));
  if (config->useWebDefaults) {
    node->style.flexDirection = YGFlexDirectionRow;
    node->style.alignContent = YGAlignStretch;
  }
  node->config = config;
  return node;
}

YGNodeRef YGNodeNew(void) {
  return YGNodeNewWithConfig(&gYGConfigDefaults);
}

YGNodeRef YGNodeClone(YGNodeRef oldNode) {
  YGNodeRef node = new YGNode(*oldNode);
  YGAssertWithConfig(
      oldNode->config, node != nullptr, "Could not allocate memory for node");
  gNodeInstanceCount++;
  node->parent = nullptr;
  return node;
}

void YGNodeFree(const YGNodeRef node) {
  if (node->parent) {
    YGNodeListDelete(node->parent->children, node);
    node->parent = nullptr;
  }

  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = YGNodeGetChild(node, i);
    child->parent = nullptr;
  }

  node->children.clear();
  node->children.shrink_to_fit();
  free(node);
  gNodeInstanceCount--;
}

void YGNodeFreeRecursive(const YGNodeRef root) {
  while (YGNodeGetChildCount(root) > 0) {
    const YGNodeRef child = YGNodeGetChild(root, 0);
    if (child->parent != root) {
      // Don't free shared nodes that we don't own.
      break;
    }
    YGNodeRemoveChild(root, child);
    YGNodeFreeRecursive(child);
  }
  YGNodeFree(root);
}

void YGNodeReset(const YGNodeRef node) {
  YGAssertWithNode(node,
                   YGNodeGetChildCount(node) == 0,
                   "Cannot reset a node which still has children attached");
  YGAssertWithNode(
      node,
      node->parent == nullptr,
      "Cannot reset a node still attached to a parent");

  node->children.clear();
  node->children.shrink_to_fit();

  const YGConfigRef config = node->config;
  memcpy(node, &gYGNodeDefaults, sizeof(YGNode));
  if (config->useWebDefaults) {
    node->style.flexDirection = YGFlexDirectionRow;
    node->style.alignContent = YGAlignStretch;
  }
  node->config = config;
}

int32_t YGNodeGetInstanceCount(void) {
  return gNodeInstanceCount;
}

int32_t YGConfigGetInstanceCount(void) {
  return gConfigInstanceCount;
}

// Export only for C#
YGConfigRef YGConfigGetDefault() {
  return &gYGConfigDefaults;
}

YGConfigRef YGConfigNew(void) {
  const YGConfigRef config = (const YGConfigRef)malloc(sizeof(YGConfig));
  YGAssert(config != nullptr, "Could not allocate memory for config");
  if (config == nullptr) {
    abort();
  }
  gConfigInstanceCount++;
  memcpy(config, &gYGConfigDefaults, sizeof(YGConfig));
  return config;
}

void YGConfigFree(const YGConfigRef config) {
  free(config);
  gConfigInstanceCount--;
}

void YGConfigCopy(const YGConfigRef dest, const YGConfigRef src) {
  memcpy(dest, src, sizeof(YGConfig));
}

static void YGNodeMarkDirtyInternal(const YGNodeRef node) {
  if (!node->isDirty) {
    node->isDirty = true;
    node->layout.computedFlexBasis = YGUndefined;
    if (node->parent) {
      YGNodeMarkDirtyInternal(node->parent);
    }
  }
}

void YGNodeSetMeasureFunc(const YGNodeRef node, YGMeasureFunc measureFunc) {
  if (measureFunc == nullptr) {
    node->measure = nullptr;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate places in Litho
    node->nodeType = YGNodeTypeDefault;
  } else {
    YGAssertWithNode(
        node,
        YGNodeGetChildCount(node) == 0,
        "Cannot set measure function: Nodes with measure functions cannot have children.");
    node->measure = measureFunc;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate places in Litho
    node->nodeType = YGNodeTypeText;
  }
}

YGMeasureFunc YGNodeGetMeasureFunc(const YGNodeRef node) {
  return node->measure;
}

void YGNodeSetBaselineFunc(const YGNodeRef node, YGBaselineFunc baselineFunc) {
  node->baseline = baselineFunc;
}

YGBaselineFunc YGNodeGetBaselineFunc(const YGNodeRef node) {
  return node->baseline;
}

static void YGCloneChildrenIfNeeded(const YGNodeRef parent) {
  // YGNodeRemoveChild has a forked variant of this algorithm optimized for deletions.
  const uint32_t childCount = YGNodeGetChildCount(parent);
  if (childCount == 0) {
    // This is an empty set. Nothing to clone.
    return;
  }

  const YGNodeRef firstChild = YGNodeGetChild(parent, 0);
  if (firstChild->parent == parent) {
    // If the first child has this node as its parent, we assume that it is already unique.
    // We can do this because if we have it has a child, that means that its parent was at some
    // point cloned which made that subtree immutable.
    // We also assume that all its sibling are cloned as well.
    return;
  }

  const YGNodeClonedFunc cloneNodeCallback = parent->config->cloneNodeCallback;
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef oldChild = parent->children[i];
    const YGNodeRef newChild = YGNodeClone(oldChild);
    parent->children[i] = newChild;
    newChild->parent = parent;
    if (cloneNodeCallback) {
      cloneNodeCallback(oldChild, newChild, parent, i);
    }
  }
}

void YGNodeInsertChild(const YGNodeRef node, const YGNodeRef child, const uint32_t index) {
  YGAssertWithNode(
      node,
      child->parent == nullptr,
      "Child already has a parent, it must be removed first.");
  YGAssertWithNode(
      node,
      node->measure == nullptr,
      "Cannot add child: Nodes with measure functions cannot have children.");

  YGCloneChildrenIfNeeded(node);
  node->children.insert(node->children.begin() + index, child);
  child->parent = node;
  YGNodeMarkDirtyInternal(node);
}

void YGNodeRemoveChild(const YGNodeRef parent, const YGNodeRef excludedChild) {
  // This algorithm is a forked variant from YGCloneChildrenIfNeeded that excludes a child.
  const uint32_t childCount = YGNodeGetChildCount(parent);

  if (childCount == 0) {
    // This is an empty set. Nothing to remove.
    return;
  }
  const YGNodeRef firstChild = YGNodeGetChild(parent, 0);
  if (firstChild->parent == parent) {
    // If the first child has this node as its parent, we assume that it is already unique.
    // We can now try to delete a child in this list.
    if (YGNodeListDelete(parent->children, excludedChild)) {
      excludedChild->layout = gYGNodeDefaults.layout; // layout is no longer valid
      excludedChild->parent = nullptr;
      YGNodeMarkDirtyInternal(parent);
    }
    return;
  }
  // Otherwise we have to clone the node list except for the child we're trying to delete.
  // We don't want to simply clone all children, because then the host will need to free
  // the clone of the child that was just deleted.
  const YGNodeClonedFunc cloneNodeCallback = parent->config->cloneNodeCallback;
  uint32_t nextInsertIndex = 0;
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef oldChild = parent->children[i];
    if (excludedChild == oldChild) {
      // Ignore the deleted child. Don't reset its layout or parent since it is still valid
      // in the other parent. However, since this parent has now changed, we need to mark it
      // as dirty.
      YGNodeMarkDirtyInternal(parent);
      continue;
    }
    const YGNodeRef newChild = YGNodeClone(oldChild);
    parent->children[nextInsertIndex] = newChild;
    newChild->parent = parent;
    if (cloneNodeCallback) {
      cloneNodeCallback(oldChild, newChild, parent, nextInsertIndex);
    }
    nextInsertIndex++;
  }
  while (nextInsertIndex < childCount) {
    parent->children.erase(parent->children.begin() + nextInsertIndex);
    nextInsertIndex++;
  }
}

void YGNodeRemoveAllChildren(const YGNodeRef parent) {
  const uint32_t childCount = YGNodeGetChildCount(parent);
  if (childCount == 0) {
    // This is an empty set already. Nothing to do.
    return;
  }
  const YGNodeRef firstChild = YGNodeGetChild(parent, 0);
  if (firstChild->parent == parent) {
    // If the first child has this node as its parent, we assume that this child set is unique.
    for (uint32_t i = 0; i < childCount; i++) {
      const YGNodeRef oldChild = YGNodeGetChild(parent, i);
      oldChild->layout = gYGNodeDefaults.layout; // layout is no longer valid
      oldChild->parent = nullptr;
    }
    parent->children.clear();
    parent->children.shrink_to_fit();
    YGNodeMarkDirtyInternal(parent);
    return;
  }
  // Otherwise, we are not the owner of the child set. We don't have to do anything to clear it.
  parent->children = YGVector();
  YGNodeMarkDirtyInternal(parent);
}

YGNodeRef YGNodeGetChild(const YGNodeRef node, const uint32_t index) {
  if (index < node->children.size()) {
    return node->children[index];
  }
  return nullptr;
}

YGNodeRef YGNodeGetParent(const YGNodeRef node) {
  return node->parent;
}

uint32_t YGNodeGetChildCount(const YGNodeRef node) {
  return static_cast<uint32_t>(node->children.size());
}

void YGNodeMarkDirty(const YGNodeRef node) {
  YGAssertWithNode(
      node,
      node->measure != nullptr,
      "Only leaf nodes with custom measure functions"
      "should manually mark themselves as dirty");

  YGNodeMarkDirtyInternal(node);
}

bool YGNodeIsDirty(const YGNodeRef node) {
  return node->isDirty;
}

void YGNodeCopyStyle(const YGNodeRef dstNode, const YGNodeRef srcNode) {
  if (memcmp(&dstNode->style, &srcNode->style, sizeof(YGStyle)) != 0) {
    memcpy(&dstNode->style, &srcNode->style, sizeof(YGStyle));
    YGNodeMarkDirtyInternal(dstNode);
  }
}

static inline float YGResolveFlexGrow(const YGNodeRef node) {
  // Root nodes flexGrow should always be 0
  if (node->parent == nullptr) {
    return 0.0;
  }
  if (!YGFloatIsUndefined(node->style.flexGrow)) {
    return node->style.flexGrow;
  }
  if (!YGFloatIsUndefined(node->style.flex) && node->style.flex > 0.0f) {
    return node->style.flex;
  }
  return kDefaultFlexGrow;
}

float YGNodeStyleGetFlexGrow(const YGNodeRef node) {
  return YGFloatIsUndefined(node->style.flexGrow) ? kDefaultFlexGrow : node->style.flexGrow;
}

float YGNodeStyleGetFlexShrink(const YGNodeRef node) {
  return YGFloatIsUndefined(node->style.flexShrink)
             ? (node->config->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink)
             : node->style.flexShrink;
}

static inline float YGNodeResolveFlexShrink(const YGNodeRef node) {
  // Root nodes flexShrink should always be 0
  if (node->parent == nullptr) {
    return 0.0;
  }
  if (!YGFloatIsUndefined(node->style.flexShrink)) {
    return node->style.flexShrink;
  }
  if (!node->config->useWebDefaults && !YGFloatIsUndefined(node->style.flex) &&
      node->style.flex < 0.0f) {
    return -node->style.flex;
  }
  return node->config->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink;
}

static inline const YGValue *YGNodeResolveFlexBasisPtr(const YGNodeRef node) {
  if (node->style.flexBasis.unit != YGUnitAuto && node->style.flexBasis.unit != YGUnitUndefined) {
    return &node->style.flexBasis;
  }
  if (!YGFloatIsUndefined(node->style.flex) && node->style.flex > 0.0f) {
    return node->config->useWebDefaults ? &YGValueAuto : &YGValueZero;
  }
  return &YGValueAuto;
}

#define YG_NODE_PROPERTY_IMPL(type, name, paramName, instanceName) \
  void YGNodeSet##name(const YGNodeRef node, type paramName) {     \
    node->instanceName = paramName;                                \
  }                                                                \
                                                                   \
  type YGNodeGet##name(const YGNodeRef node) {                     \
    return node->instanceName;                                     \
  }

#define YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
  void YGNodeStyleSet##name(const YGNodeRef node, const type paramName) {       \
    if (node->style.instanceName != paramName) {                                \
      node->style.instanceName = paramName;                                     \
      YGNodeMarkDirtyInternal(node);                                            \
    }                                                                           \
  }

#define YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(                               \
    type, name, paramName, instanceName)                                       \
  void YGNodeStyleSet##name(const YGNodeRef node, const type paramName) {      \
    YGValue value = {                                                          \
        .value = paramName,                                                    \
        .unit = YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPoint, \
    };                                                                         \
    if ((node->style.instanceName.value != value.value &&                      \
         value.unit != YGUnitUndefined) ||                                     \
        node->style.instanceName.unit != value.unit) {                         \
      node->style.instanceName = value;                                        \
      YGNodeMarkDirtyInternal(node);                                           \
    }                                                                          \
  }                                                                            \
                                                                               \
  void YGNodeStyleSet##name##Percent(                                          \
      const YGNodeRef node, const type paramName) {                            \
    YGValue value = {                                                          \
        .value = paramName,                                                    \
        .unit =                                                                \
            YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPercent,   \
    };                                                                         \
    if ((node->style.instanceName.value != value.value &&                      \
         value.unit != YGUnitUndefined) ||                                     \
        node->style.instanceName.unit != value.unit) {                         \
      node->style.instanceName = value;                                        \
      YGNodeMarkDirtyInternal(node);                                           \
    }                                                                          \
  }

#define YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(                          \
    type, name, paramName, instanceName)                                       \
  void YGNodeStyleSet##name(const YGNodeRef node, const type paramName) {      \
    YGValue value = {                                                          \
        .value = paramName,                                                    \
        .unit = YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPoint, \
    };                                                                         \
    if ((node->style.instanceName.value != value.value &&                      \
         value.unit != YGUnitUndefined) ||                                     \
        node->style.instanceName.unit != value.unit) {                         \
      node->style.instanceName = value;                                        \
      YGNodeMarkDirtyInternal(node);                                           \
    }                                                                          \
  }                                                                            \
                                                                               \
  void YGNodeStyleSet##name##Percent(                                          \
      const YGNodeRef node, const type paramName) {                            \
    if (node->style.instanceName.value != paramName ||                         \
        node->style.instanceName.unit != YGUnitPercent) {                      \
      node->style.instanceName.value = paramName;                              \
      node->style.instanceName.unit =                                          \
          YGFloatIsUndefined(paramName) ? YGUnitAuto : YGUnitPercent;          \
      YGNodeMarkDirtyInternal(node);                                           \
    }                                                                          \
  }                                                                            \
                                                                               \
  void YGNodeStyleSet##name##Auto(const YGNodeRef node) {                      \
    if (node->style.instanceName.unit != YGUnitAuto) {                         \
      node->style.instanceName.value = YGUndefined;                            \
      node->style.instanceName.unit = YGUnitAuto;                              \
      YGNodeMarkDirtyInternal(node);                                           \
    }                                                                          \
  }

#define YG_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName)  \
  YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
                                                                          \
  type YGNodeStyleGet##name(const YGNodeRef node) {                       \
    return node->style.instanceName;                                      \
  }

#define YG_NODE_STYLE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName)   \
  YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(float, name, paramName, instanceName) \
                                                                                \
  type YGNodeStyleGet##name(const YGNodeRef node) {                             \
    return node->style.instanceName;                                            \
  }

#define YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(type, name, paramName, instanceName)   \
  YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(float, name, paramName, instanceName) \
                                                                                     \
  type YGNodeStyleGet##name(const YGNodeRef node) {                                  \
    return node->style.instanceName;                                                 \
  }

#define YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(type, name, instanceName) \
  void YGNodeStyleSet##name##Auto(const YGNodeRef node, const YGEdge edge) { \
    if (node->style.instanceName[edge].unit != YGUnitAuto) {                 \
      node->style.instanceName[edge].value = YGUndefined;                    \
      node->style.instanceName[edge].unit = YGUnitAuto;                      \
      YGNodeMarkDirtyInternal(node);                                         \
    }                                                                        \
  }

#define YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(                                 \
    type, name, paramName, instanceName)                                       \
  void YGNodeStyleSet##name(                                                   \
      const YGNodeRef node, const YGEdge edge, const float paramName) {        \
    YGValue value = {                                                          \
        .value = paramName,                                                    \
        .unit = YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPoint, \
    };                                                                         \
    if ((node->style.instanceName[edge].value != value.value &&                \
         value.unit != YGUnitUndefined) ||                                     \
        node->style.instanceName[edge].unit != value.unit) {                   \
      node->style.instanceName[edge] = value;                                  \
      YGNodeMarkDirtyInternal(node);                                           \
    }                                                                          \
  }                                                                            \
                                                                               \
  void YGNodeStyleSet##name##Percent(                                          \
      const YGNodeRef node, const YGEdge edge, const float paramName) {        \
    YGValue value = {                                                          \
        .value = paramName,                                                    \
        .unit =                                                                \
            YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPercent,   \
    };                                                                         \
    if ((node->style.instanceName[edge].value != value.value &&                \
         value.unit != YGUnitUndefined) ||                                     \
        node->style.instanceName[edge].unit != value.unit) {                   \
      node->style.instanceName[edge] = value;                                  \
      YGNodeMarkDirtyInternal(node);                                           \
    }                                                                          \
  }                                                                            \
                                                                               \
  WIN_STRUCT(type)                                                             \
  YGNodeStyleGet##name(const YGNodeRef node, const YGEdge edge) {              \
    return WIN_STRUCT_REF(node->style.instanceName[edge]);                     \
  }

#define YG_NODE_STYLE_EDGE_PROPERTY_IMPL(type, name, paramName, instanceName)  \
  void YGNodeStyleSet##name(                                                   \
      const YGNodeRef node, const YGEdge edge, const float paramName) {        \
    YGValue value = {                                                          \
        .value = paramName,                                                    \
        .unit = YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPoint, \
    };                                                                         \
    if ((node->style.instanceName[edge].value != value.value &&                \
         value.unit != YGUnitUndefined) ||                                     \
        node->style.instanceName[edge].unit != value.unit) {                   \
      node->style.instanceName[edge] = value;                                  \
      YGNodeMarkDirtyInternal(node);                                           \
    }                                                                          \
  }                                                                            \
                                                                               \
  float YGNodeStyleGet##name(const YGNodeRef node, const YGEdge edge) {        \
    return node->style.instanceName[edge].value;                               \
  }

#define YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type YGNodeLayoutGet##name(const YGNodeRef node) {           \
    return node->layout.instanceName;                          \
  }

#define YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName) \
  type YGNodeLayoutGet##name(const YGNodeRef node, const YGEdge edge) { \
    YGAssertWithNode(                                                   \
        node,                                                           \
        edge <= YGEdgeEnd,                                              \
        "Cannot get layout properties of multi-edge shorthands");       \
                                                                        \
    if (edge == YGEdgeLeft) {                                           \
      if (node->layout.direction == YGDirectionRTL) {                   \
        return node->layout.instanceName[YGEdgeEnd];                    \
      } else {                                                          \
        return node->layout.instanceName[YGEdgeStart];                  \
      }                                                                 \
    }                                                                   \
                                                                        \
    if (edge == YGEdgeRight) {                                          \
      if (node->layout.direction == YGDirectionRTL) {                   \
        return node->layout.instanceName[YGEdgeStart];                  \
      } else {                                                          \
        return node->layout.instanceName[YGEdgeEnd];                    \
      }                                                                 \
    }                                                                   \
                                                                        \
    return node->layout.instanceName[edge];                             \
  }

YG_NODE_PROPERTY_IMPL(void *, Context, context, context);
YG_NODE_PROPERTY_IMPL(YGPrintFunc, PrintFunc, printFunc, print);
YG_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);
YG_NODE_PROPERTY_IMPL(YGNodeType, NodeType, nodeType, nodeType);

YG_NODE_STYLE_PROPERTY_IMPL(YGDirection, Direction, direction, direction);
YG_NODE_STYLE_PROPERTY_IMPL(YGFlexDirection, FlexDirection, flexDirection, flexDirection);
YG_NODE_STYLE_PROPERTY_IMPL(YGJustify, JustifyContent, justifyContent, justifyContent);
YG_NODE_STYLE_PROPERTY_IMPL(YGAlign, AlignContent, alignContent, alignContent);
YG_NODE_STYLE_PROPERTY_IMPL(YGAlign, AlignItems, alignItems, alignItems);
YG_NODE_STYLE_PROPERTY_IMPL(YGAlign, AlignSelf, alignSelf, alignSelf);
YG_NODE_STYLE_PROPERTY_IMPL(YGPositionType, PositionType, positionType, positionType);
YG_NODE_STYLE_PROPERTY_IMPL(YGWrap, FlexWrap, flexWrap, flexWrap);
YG_NODE_STYLE_PROPERTY_IMPL(YGOverflow, Overflow, overflow, overflow);
YG_NODE_STYLE_PROPERTY_IMPL(YGDisplay, Display, display, display);

YG_NODE_STYLE_PROPERTY_IMPL(float, Flex, flex, flex);
YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexGrow, flexGrow, flexGrow);
YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexShrink, flexShrink, flexShrink);
YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(YGValue, FlexBasis, flexBasis, flexBasis);

YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(YGValue, Position, position, position);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(YGValue, Margin, margin, margin);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(YGValue, Margin, margin);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(YGValue, Padding, padding, padding);
YG_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Border, border, border);

YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(YGValue, Width, width, dimensions[YGDimensionWidth]);
YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(YGValue, Height, height, dimensions[YGDimensionHeight]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MinWidth, minWidth, minDimensions[YGDimensionWidth]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MinHeight, minHeight, minDimensions[YGDimensionHeight]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MaxWidth, maxWidth, maxDimensions[YGDimensionWidth]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MaxHeight, maxHeight, maxDimensions[YGDimensionHeight]);

// Yoga specific properties, not compatible with flexbox specification
YG_NODE_STYLE_PROPERTY_IMPL(float, AspectRatio, aspectRatio, aspectRatio);

YG_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[YGEdgeLeft]);
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[YGEdgeTop]);
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[YGEdgeRight]);
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[YGEdgeBottom]);
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[YGDimensionWidth]);
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[YGDimensionHeight]);
YG_NODE_LAYOUT_PROPERTY_IMPL(YGDirection, Direction, direction);
YG_NODE_LAYOUT_PROPERTY_IMPL(bool, HadOverflow, hadOverflow);

YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Margin, margin);
YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Border, border);
YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Padding, padding);

uint32_t gCurrentGenerationCount = 0;

bool YGLayoutNodeInternal(const YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const YGDirection parentDirection,
                          const YGMeasureMode widthMeasureMode,
                          const YGMeasureMode heightMeasureMode,
                          const float parentWidth,
                          const float parentHeight,
                          const bool performLayout,
                          const char *reason,
                          const YGConfigRef config);

bool YGValueEqual(const YGValue a, const YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == YGUnitUndefined) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

static inline void YGResolveDimensions(YGNodeRef node) {
  for (uint32_t dim = YGDimensionWidth; dim < YGDimensionCount; dim++) {
    if (node->style.maxDimensions[dim].unit != YGUnitUndefined &&
        YGValueEqual(node->style.maxDimensions[dim], node->style.minDimensions[dim])) {
      node->resolvedDimensions[dim] = &node->style.maxDimensions[dim];
    } else {
      node->resolvedDimensions[dim] = &node->style.dimensions[dim];
    }
  }
}

bool YGFloatsEqual(const float a, const float b) {
  if (YGFloatIsUndefined(a)) {
    return YGFloatIsUndefined(b);
  }
  return fabs(a - b) < 0.0001f;
}

static void YGNodePrintInternal(const YGNodeRef node,
                                const YGPrintOptions options) {
  std::string str;
  facebook::yoga::YGNodeToString(&str, node, options, 0);
  YGLog(node, YGLogLevelDebug, str.c_str());
}

void YGNodePrint(const YGNodeRef node, const YGPrintOptions options) {
  YGNodePrintInternal(node, options);
}

static const YGEdge leading[4] = {
        [YGFlexDirectionColumn] = YGEdgeTop,
        [YGFlexDirectionColumnReverse] = YGEdgeBottom,
        [YGFlexDirectionRow] = YGEdgeLeft,
        [YGFlexDirectionRowReverse] = YGEdgeRight,
};
static const YGEdge trailing[4] = {
        [YGFlexDirectionColumn] = YGEdgeBottom,
        [YGFlexDirectionColumnReverse] = YGEdgeTop,
        [YGFlexDirectionRow] = YGEdgeRight,
        [YGFlexDirectionRowReverse] = YGEdgeLeft,
};
static const YGEdge pos[4] = {
        [YGFlexDirectionColumn] = YGEdgeTop,
        [YGFlexDirectionColumnReverse] = YGEdgeBottom,
        [YGFlexDirectionRow] = YGEdgeLeft,
        [YGFlexDirectionRowReverse] = YGEdgeRight,
};
static const YGDimension dim[4] = {
        [YGFlexDirectionColumn] = YGDimensionHeight,
        [YGFlexDirectionColumnReverse] = YGDimensionHeight,
        [YGFlexDirectionRow] = YGDimensionWidth,
        [YGFlexDirectionRowReverse] = YGDimensionWidth,
};

static inline bool YGFlexDirectionIsRow(const YGFlexDirection flexDirection) {
  return flexDirection == YGFlexDirectionRow || flexDirection == YGFlexDirectionRowReverse;
}

static inline bool YGFlexDirectionIsColumn(const YGFlexDirection flexDirection) {
  return flexDirection == YGFlexDirectionColumn || flexDirection == YGFlexDirectionColumnReverse;
}

static inline float YGNodeLeadingMargin(const YGNodeRef node,
                                        const YGFlexDirection axis,
                                        const float widthSize) {
  if (YGFlexDirectionIsRow(axis) && node->style.margin[YGEdgeStart].unit != YGUnitUndefined) {
    return YGResolveValueMargin(&node->style.margin[YGEdgeStart], widthSize);
  }

  return YGResolveValueMargin(YGComputedEdgeValue(node->style.margin, leading[axis], &YGValueZero),
                              widthSize);
}

static float YGNodeTrailingMargin(const YGNodeRef node,
                                  const YGFlexDirection axis,
                                  const float widthSize) {
  if (YGFlexDirectionIsRow(axis) && node->style.margin[YGEdgeEnd].unit != YGUnitUndefined) {
    return YGResolveValueMargin(&node->style.margin[YGEdgeEnd], widthSize);
  }

  return YGResolveValueMargin(YGComputedEdgeValue(node->style.margin, trailing[axis], &YGValueZero),
                              widthSize);
}

static float YGNodeLeadingPadding(const YGNodeRef node,
                                  const YGFlexDirection axis,
                                  const float widthSize) {
  if (YGFlexDirectionIsRow(axis) && node->style.padding[YGEdgeStart].unit != YGUnitUndefined &&
      YGResolveValue(&node->style.padding[YGEdgeStart], widthSize) >= 0.0f) {
    return YGResolveValue(&node->style.padding[YGEdgeStart], widthSize);
  }

  return fmaxf(YGResolveValue(YGComputedEdgeValue(node->style.padding, leading[axis], &YGValueZero),
                              widthSize),
               0.0f);
}

static float YGNodeTrailingPadding(const YGNodeRef node,
                                   const YGFlexDirection axis,
                                   const float widthSize) {
  if (YGFlexDirectionIsRow(axis) && node->style.padding[YGEdgeEnd].unit != YGUnitUndefined &&
      YGResolveValue(&node->style.padding[YGEdgeEnd], widthSize) >= 0.0f) {
    return YGResolveValue(&node->style.padding[YGEdgeEnd], widthSize);
  }

  return fmaxf(YGResolveValue(YGComputedEdgeValue(node->style.padding, trailing[axis], &YGValueZero),
                              widthSize),
               0.0f);
}

static float YGNodeLeadingBorder(const YGNodeRef node, const YGFlexDirection axis) {
  if (YGFlexDirectionIsRow(axis) && node->style.border[YGEdgeStart].unit != YGUnitUndefined &&
      node->style.border[YGEdgeStart].value >= 0.0f) {
    return node->style.border[YGEdgeStart].value;
  }

  return fmaxf(YGComputedEdgeValue(node->style.border, leading[axis], &YGValueZero)->value, 0.0f);
}

static float YGNodeTrailingBorder(const YGNodeRef node, const YGFlexDirection axis) {
  if (YGFlexDirectionIsRow(axis) && node->style.border[YGEdgeEnd].unit != YGUnitUndefined &&
      node->style.border[YGEdgeEnd].value >= 0.0f) {
    return node->style.border[YGEdgeEnd].value;
  }

  return fmaxf(YGComputedEdgeValue(node->style.border, trailing[axis], &YGValueZero)->value, 0.0f);
}

static inline float YGNodeLeadingPaddingAndBorder(const YGNodeRef node,
                                                  const YGFlexDirection axis,
                                                  const float widthSize) {
  return YGNodeLeadingPadding(node, axis, widthSize) + YGNodeLeadingBorder(node, axis);
}

static inline float YGNodeTrailingPaddingAndBorder(const YGNodeRef node,
                                                   const YGFlexDirection axis,
                                                   const float widthSize) {
  return YGNodeTrailingPadding(node, axis, widthSize) + YGNodeTrailingBorder(node, axis);
}

static inline float YGNodeMarginForAxis(const YGNodeRef node,
                                        const YGFlexDirection axis,
                                        const float widthSize) {
  return YGNodeLeadingMargin(node, axis, widthSize) + YGNodeTrailingMargin(node, axis, widthSize);
}

static inline float YGNodePaddingAndBorderForAxis(const YGNodeRef node,
                                                  const YGFlexDirection axis,
                                                  const float widthSize) {
  return YGNodeLeadingPaddingAndBorder(node, axis, widthSize) +
         YGNodeTrailingPaddingAndBorder(node, axis, widthSize);
}

static inline YGAlign YGNodeAlignItem(const YGNodeRef node, const YGNodeRef child) {
  const YGAlign align =
      child->style.alignSelf == YGAlignAuto ? node->style.alignItems : child->style.alignSelf;
  if (align == YGAlignBaseline && YGFlexDirectionIsColumn(node->style.flexDirection)) {
    return YGAlignFlexStart;
  }
  return align;
}

static inline YGDirection YGNodeResolveDirection(const YGNodeRef node,
                                                 const YGDirection parentDirection) {
  if (node->style.direction == YGDirectionInherit) {
    return parentDirection > YGDirectionInherit ? parentDirection : YGDirectionLTR;
  } else {
    return node->style.direction;
  }
}

static float YGBaseline(const YGNodeRef node) {
  if (node->baseline != nullptr) {
    const float baseline = node->baseline(node,
                                          node->layout.measuredDimensions[YGDimensionWidth],
                                          node->layout.measuredDimensions[YGDimensionHeight]);
    YGAssertWithNode(node,
                     !YGFloatIsUndefined(baseline),
                     "Expect custom baseline function to not return NaN");
    return baseline;
  }

  YGNodeRef baselineChild = nullptr;
  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = YGNodeGetChild(node, i);
    if (child->lineIndex > 0) {
      break;
    }
    if (child->style.positionType == YGPositionTypeAbsolute) {
      continue;
    }
    if (YGNodeAlignItem(node, child) == YGAlignBaseline) {
      baselineChild = child;
      break;
    }

    if (baselineChild == nullptr) {
      baselineChild = child;
    }
  }

  if (baselineChild == nullptr) {
    return node->layout.measuredDimensions[YGDimensionHeight];
  }

  const float baseline = YGBaseline(baselineChild);
  return baseline + baselineChild->layout.position[YGEdgeTop];
}

static inline YGFlexDirection YGResolveFlexDirection(const YGFlexDirection flexDirection,
                                                     const YGDirection direction) {
  if (direction == YGDirectionRTL) {
    if (flexDirection == YGFlexDirectionRow) {
      return YGFlexDirectionRowReverse;
    } else if (flexDirection == YGFlexDirectionRowReverse) {
      return YGFlexDirectionRow;
    }
  }

  return flexDirection;
}

static YGFlexDirection YGFlexDirectionCross(const YGFlexDirection flexDirection,
                                            const YGDirection direction) {
  return YGFlexDirectionIsColumn(flexDirection)
             ? YGResolveFlexDirection(YGFlexDirectionRow, direction)
             : YGFlexDirectionColumn;
}

static inline bool YGNodeIsFlex(const YGNodeRef node) {
  return (node->style.positionType == YGPositionTypeRelative &&
          (YGResolveFlexGrow(node) != 0 || YGNodeResolveFlexShrink(node) != 0));
}

static bool YGIsBaselineLayout(const YGNodeRef node) {
  if (YGFlexDirectionIsColumn(node->style.flexDirection)) {
    return false;
  }
  if (node->style.alignItems == YGAlignBaseline) {
    return true;
  }
  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = YGNodeGetChild(node, i);
    if (child->style.positionType == YGPositionTypeRelative &&
        child->style.alignSelf == YGAlignBaseline) {
      return true;
    }
  }

  return false;
}

static inline float YGNodeDimWithMargin(const YGNodeRef node,
                                        const YGFlexDirection axis,
                                        const float widthSize) {
  return node->layout.measuredDimensions[dim[axis]] + YGNodeLeadingMargin(node, axis, widthSize) +
         YGNodeTrailingMargin(node, axis, widthSize);
}

static inline bool YGNodeIsStyleDimDefined(const YGNodeRef node,
                                           const YGFlexDirection axis,
                                           const float parentSize) {
  return !(node->resolvedDimensions[dim[axis]]->unit == YGUnitAuto ||
           node->resolvedDimensions[dim[axis]]->unit == YGUnitUndefined ||
           (node->resolvedDimensions[dim[axis]]->unit == YGUnitPoint &&
            node->resolvedDimensions[dim[axis]]->value < 0.0f) ||
           (node->resolvedDimensions[dim[axis]]->unit == YGUnitPercent &&
            (node->resolvedDimensions[dim[axis]]->value < 0.0f || YGFloatIsUndefined(parentSize))));
}

static inline bool YGNodeIsLayoutDimDefined(const YGNodeRef node, const YGFlexDirection axis) {
  const float value = node->layout.measuredDimensions[dim[axis]];
  return !YGFloatIsUndefined(value) && value >= 0.0f;
}

static inline bool YGNodeIsLeadingPosDefined(const YGNodeRef node, const YGFlexDirection axis) {
  return (YGFlexDirectionIsRow(axis) &&
          YGComputedEdgeValue(node->style.position, YGEdgeStart, &YGValueUndefined)->unit !=
              YGUnitUndefined) ||
         YGComputedEdgeValue(node->style.position, leading[axis], &YGValueUndefined)->unit !=
             YGUnitUndefined;
}

static inline bool YGNodeIsTrailingPosDefined(const YGNodeRef node, const YGFlexDirection axis) {
  return (YGFlexDirectionIsRow(axis) &&
          YGComputedEdgeValue(node->style.position, YGEdgeEnd, &YGValueUndefined)->unit !=
              YGUnitUndefined) ||
         YGComputedEdgeValue(node->style.position, trailing[axis], &YGValueUndefined)->unit !=
             YGUnitUndefined;
}

static float YGNodeLeadingPosition(const YGNodeRef node,
                                   const YGFlexDirection axis,
                                   const float axisSize) {
  if (YGFlexDirectionIsRow(axis)) {
    const YGValue *leadingPosition =
        YGComputedEdgeValue(node->style.position, YGEdgeStart, &YGValueUndefined);
    if (leadingPosition->unit != YGUnitUndefined) {
      return YGResolveValue(leadingPosition, axisSize);
    }
  }

  const YGValue *leadingPosition =
      YGComputedEdgeValue(node->style.position, leading[axis], &YGValueUndefined);

  return leadingPosition->unit == YGUnitUndefined ? 0.0f
                                                  : YGResolveValue(leadingPosition, axisSize);
}

static float YGNodeTrailingPosition(const YGNodeRef node,
                                    const YGFlexDirection axis,
                                    const float axisSize) {
  if (YGFlexDirectionIsRow(axis)) {
    const YGValue *trailingPosition =
        YGComputedEdgeValue(node->style.position, YGEdgeEnd, &YGValueUndefined);
    if (trailingPosition->unit != YGUnitUndefined) {
      return YGResolveValue(trailingPosition, axisSize);
    }
  }

  const YGValue *trailingPosition =
      YGComputedEdgeValue(node->style.position, trailing[axis], &YGValueUndefined);

  return trailingPosition->unit == YGUnitUndefined ? 0.0f
                                                   : YGResolveValue(trailingPosition, axisSize);
}

static float YGNodeBoundAxisWithinMinAndMax(const YGNodeRef node,
                                            const YGFlexDirection axis,
                                            const float value,
                                            const float axisSize) {
  float min = YGUndefined;
  float max = YGUndefined;

  if (YGFlexDirectionIsColumn(axis)) {
    min = YGResolveValue(&node->style.minDimensions[YGDimensionHeight], axisSize);
    max = YGResolveValue(&node->style.maxDimensions[YGDimensionHeight], axisSize);
  } else if (YGFlexDirectionIsRow(axis)) {
    min = YGResolveValue(&node->style.minDimensions[YGDimensionWidth], axisSize);
    max = YGResolveValue(&node->style.maxDimensions[YGDimensionWidth], axisSize);
  }

  float boundValue = value;

  if (!YGFloatIsUndefined(max) && max >= 0.0f && boundValue > max) {
    boundValue = max;
  }

  if (!YGFloatIsUndefined(min) && min >= 0.0f && boundValue < min) {
    boundValue = min;
  }

  return boundValue;
}

static inline YGValue *YGMarginLeadingValue(const YGNodeRef node, const YGFlexDirection axis) {
  if (YGFlexDirectionIsRow(axis) && node->style.margin[YGEdgeStart].unit != YGUnitUndefined) {
    return &node->style.margin[YGEdgeStart];
  } else {
    return &node->style.margin[leading[axis]];
  }
}

static inline YGValue *YGMarginTrailingValue(const YGNodeRef node, const YGFlexDirection axis) {
  if (YGFlexDirectionIsRow(axis) && node->style.margin[YGEdgeEnd].unit != YGUnitUndefined) {
    return &node->style.margin[YGEdgeEnd];
  } else {
    return &node->style.margin[trailing[axis]];
  }
}

// Like YGNodeBoundAxisWithinMinAndMax but also ensures that the value doesn't go
// below the
// padding and border amount.
static inline float YGNodeBoundAxis(const YGNodeRef node,
                                    const YGFlexDirection axis,
                                    const float value,
                                    const float axisSize,
                                    const float widthSize) {
  return fmaxf(YGNodeBoundAxisWithinMinAndMax(node, axis, value, axisSize),
               YGNodePaddingAndBorderForAxis(node, axis, widthSize));
}

static void YGNodeSetChildTrailingPosition(const YGNodeRef node,
                                           const YGNodeRef child,
                                           const YGFlexDirection axis) {
  const float size = child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]] =
      node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float YGNodeRelativePosition(const YGNodeRef node,
                                    const YGFlexDirection axis,
                                    const float axisSize) {
  return YGNodeIsLeadingPosDefined(node, axis) ? YGNodeLeadingPosition(node, axis, axisSize)
                                               : -YGNodeTrailingPosition(node, axis, axisSize);
}

static void YGConstrainMaxSizeForMode(const YGNodeRef node,
                                      const enum YGFlexDirection axis,
                                      const float parentAxisSize,
                                      const float parentWidth,
                                      YGMeasureMode *mode,
                                      float *size) {
  const float maxSize = YGResolveValue(&node->style.maxDimensions[dim[axis]], parentAxisSize) +
                        YGNodeMarginForAxis(node, axis, parentWidth);
  switch (*mode) {
    case YGMeasureModeExactly:
    case YGMeasureModeAtMost:
      *size = (YGFloatIsUndefined(maxSize) || *size < maxSize) ? *size : maxSize;
      break;
    case YGMeasureModeUndefined:
      if (!YGFloatIsUndefined(maxSize)) {
        *mode = YGMeasureModeAtMost;
        *size = maxSize;
      }
      break;
  }
}

static void YGNodeSetPosition(const YGNodeRef node,
                              const YGDirection direction,
                              const float mainSize,
                              const float crossSize,
                              const float parentWidth) {
  /* Root nodes should be always layouted as LTR, so we don't return negative values. */
  const YGDirection directionRespectingRoot =
      node->parent != nullptr ? direction : YGDirectionLTR;
  const YGFlexDirection mainAxis =
      YGResolveFlexDirection(node->style.flexDirection, directionRespectingRoot);
  const YGFlexDirection crossAxis = YGFlexDirectionCross(mainAxis, directionRespectingRoot);

  const float relativePositionMain = YGNodeRelativePosition(node, mainAxis, mainSize);
  const float relativePositionCross = YGNodeRelativePosition(node, crossAxis, crossSize);

  node->layout.position[leading[mainAxis]] =
      YGNodeLeadingMargin(node, mainAxis, parentWidth) + relativePositionMain;
  node->layout.position[trailing[mainAxis]] =
      YGNodeTrailingMargin(node, mainAxis, parentWidth) + relativePositionMain;
  node->layout.position[leading[crossAxis]] =
      YGNodeLeadingMargin(node, crossAxis, parentWidth) + relativePositionCross;
  node->layout.position[trailing[crossAxis]] =
      YGNodeTrailingMargin(node, crossAxis, parentWidth) + relativePositionCross;
}

static void YGNodeComputeFlexBasisForChild(const YGNodeRef node,
                                           const YGNodeRef child,
                                           const float width,
                                           const YGMeasureMode widthMode,
                                           const float height,
                                           const float parentWidth,
                                           const float parentHeight,
                                           const YGMeasureMode heightMode,
                                           const YGDirection direction,
                                           const YGConfigRef config) {
  const YGFlexDirection mainAxis = YGResolveFlexDirection(node->style.flexDirection, direction);
  const bool isMainAxisRow = YGFlexDirectionIsRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisParentSize = isMainAxisRow ? parentWidth : parentHeight;

  float childWidth;
  float childHeight;
  YGMeasureMode childWidthMeasureMode;
  YGMeasureMode childHeightMeasureMode;

  const float resolvedFlexBasis =
      YGResolveValue(YGNodeResolveFlexBasisPtr(child), mainAxisParentSize);
  const bool isRowStyleDimDefined = YGNodeIsStyleDimDefined(child, YGFlexDirectionRow, parentWidth);
  const bool isColumnStyleDimDefined =
      YGNodeIsStyleDimDefined(child, YGFlexDirectionColumn, parentHeight);

  if (!YGFloatIsUndefined(resolvedFlexBasis) && !YGFloatIsUndefined(mainAxisSize)) {
    if (YGFloatIsUndefined(child->layout.computedFlexBasis) ||
        (YGConfigIsExperimentalFeatureEnabled(child->config, YGExperimentalFeatureWebFlexBasis) &&
         child->layout.computedFlexBasisGeneration != gCurrentGenerationCount)) {
      child->layout.computedFlexBasis =
          fmaxf(resolvedFlexBasis, YGNodePaddingAndBorderForAxis(child, mainAxis, parentWidth));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(YGResolveValue(child->resolvedDimensions[YGDimensionWidth], parentWidth),
              YGNodePaddingAndBorderForAxis(child, YGFlexDirectionRow, parentWidth));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(YGResolveValue(child->resolvedDimensions[YGDimensionHeight], parentHeight),
              YGNodePaddingAndBorderForAxis(child, YGFlexDirectionColumn, parentWidth));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped
    // flex basis).
    childWidth = YGUndefined;
    childHeight = YGUndefined;
    childWidthMeasureMode = YGMeasureModeUndefined;
    childHeightMeasureMode = YGMeasureModeUndefined;

    const float marginRow = YGNodeMarginForAxis(child, YGFlexDirectionRow, parentWidth);
    const float marginColumn = YGNodeMarginForAxis(child, YGFlexDirectionColumn, parentWidth);

    if (isRowStyleDimDefined) {
      childWidth =
          YGResolveValue(child->resolvedDimensions[YGDimensionWidth], parentWidth) + marginRow;
      childWidthMeasureMode = YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          YGResolveValue(child->resolvedDimensions[YGDimensionHeight], parentHeight) + marginColumn;
      childHeightMeasureMode = YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property,
    // but all major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->style.overflow == YGOverflowScroll) ||
        node->style.overflow != YGOverflowScroll) {
      if (YGFloatIsUndefined(childWidth) && !YGFloatIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->style.overflow == YGOverflowScroll) ||
        node->style.overflow != YGOverflowScroll) {
      if (YGFloatIsUndefined(childHeight) && !YGFloatIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = YGMeasureModeAtMost;
      }
    }

    if (!YGFloatIsUndefined(child->style.aspectRatio)) {
      if (!isMainAxisRow && childWidthMeasureMode == YGMeasureModeExactly) {
        childHeight = (childWidth - marginRow) / child->style.aspectRatio;
        childHeightMeasureMode = YGMeasureModeExactly;
      } else if (isMainAxisRow && childHeightMeasureMode == YGMeasureModeExactly) {
        childWidth = (childHeight - marginColumn) * child->style.aspectRatio;
        childWidthMeasureMode = YGMeasureModeExactly;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch,
    // set the cross
    // axis to be measured exactly with the available inner width

    const bool hasExactWidth = !YGFloatIsUndefined(width) && widthMode == YGMeasureModeExactly;
    const bool childWidthStretch = YGNodeAlignItem(node, child) == YGAlignStretch &&
                                   childWidthMeasureMode != YGMeasureModeExactly;
    if (!isMainAxisRow && !isRowStyleDimDefined && hasExactWidth && childWidthStretch) {
      childWidth = width;
      childWidthMeasureMode = YGMeasureModeExactly;
      if (!YGFloatIsUndefined(child->style.aspectRatio)) {
        childHeight = (childWidth - marginRow) / child->style.aspectRatio;
        childHeightMeasureMode = YGMeasureModeExactly;
      }
    }

    const bool hasExactHeight = !YGFloatIsUndefined(height) && heightMode == YGMeasureModeExactly;
    const bool childHeightStretch = YGNodeAlignItem(node, child) == YGAlignStretch &&
                                    childHeightMeasureMode != YGMeasureModeExactly;
    if (isMainAxisRow && !isColumnStyleDimDefined && hasExactHeight && childHeightStretch) {
      childHeight = height;
      childHeightMeasureMode = YGMeasureModeExactly;

      if (!YGFloatIsUndefined(child->style.aspectRatio)) {
        childWidth = (childHeight - marginColumn) * child->style.aspectRatio;
        childWidthMeasureMode = YGMeasureModeExactly;
      }
    }

    YGConstrainMaxSizeForMode(
        child, YGFlexDirectionRow, parentWidth, parentWidth, &childWidthMeasureMode, &childWidth);
    YGConstrainMaxSizeForMode(child,
                              YGFlexDirectionColumn,
                              parentHeight,
                              parentWidth,
                              &childHeightMeasureMode,
                              &childHeight);

    // Measure the child
    YGLayoutNodeInternal(child,
                         childWidth,
                         childHeight,
                         direction,
                         childWidthMeasureMode,
                         childHeightMeasureMode,
                         parentWidth,
                         parentHeight,
                         false,
                         "measure",
                         config);

    child->layout.computedFlexBasis =
        fmaxf(child->layout.measuredDimensions[dim[mainAxis]],
              YGNodePaddingAndBorderForAxis(child, mainAxis, parentWidth));
  }

  child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
}

static void YGNodeAbsoluteLayoutChild(const YGNodeRef node,
                                      const YGNodeRef child,
                                      const float width,
                                      const YGMeasureMode widthMode,
                                      const float height,
                                      const YGDirection direction,
                                      const YGConfigRef config) {
  const YGFlexDirection mainAxis = YGResolveFlexDirection(node->style.flexDirection, direction);
  const YGFlexDirection crossAxis = YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = YGFlexDirectionIsRow(mainAxis);

  float childWidth = YGUndefined;
  float childHeight = YGUndefined;
  YGMeasureMode childWidthMeasureMode = YGMeasureModeUndefined;
  YGMeasureMode childHeightMeasureMode = YGMeasureModeUndefined;

  const float marginRow = YGNodeMarginForAxis(child, YGFlexDirectionRow, width);
  const float marginColumn = YGNodeMarginForAxis(child, YGFlexDirectionColumn, width);

  if (YGNodeIsStyleDimDefined(child, YGFlexDirectionRow, width)) {
    childWidth = YGResolveValue(child->resolvedDimensions[YGDimensionWidth], width) + marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based
    // on the left/right
    // offsets if they're defined.
    if (YGNodeIsLeadingPosDefined(child, YGFlexDirectionRow) &&
        YGNodeIsTrailingPosDefined(child, YGFlexDirectionRow)) {
      childWidth = node->layout.measuredDimensions[YGDimensionWidth] -
                   (YGNodeLeadingBorder(node, YGFlexDirectionRow) +
                    YGNodeTrailingBorder(node, YGFlexDirectionRow)) -
                   (YGNodeLeadingPosition(child, YGFlexDirectionRow, width) +
                    YGNodeTrailingPosition(child, YGFlexDirectionRow, width));
      childWidth = YGNodeBoundAxis(child, YGFlexDirectionRow, childWidth, width, width);
    }
  }

  if (YGNodeIsStyleDimDefined(child, YGFlexDirectionColumn, height)) {
    childHeight =
        YGResolveValue(child->resolvedDimensions[YGDimensionHeight], height) + marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height
    // based on the top/bottom
    // offsets if they're defined.
    if (YGNodeIsLeadingPosDefined(child, YGFlexDirectionColumn) &&
        YGNodeIsTrailingPosDefined(child, YGFlexDirectionColumn)) {
      childHeight = node->layout.measuredDimensions[YGDimensionHeight] -
                    (YGNodeLeadingBorder(node, YGFlexDirectionColumn) +
                     YGNodeTrailingBorder(node, YGFlexDirectionColumn)) -
                    (YGNodeLeadingPosition(child, YGFlexDirectionColumn, height) +
                     YGNodeTrailingPosition(child, YGFlexDirectionColumn, height));
      childHeight = YGNodeBoundAxis(child, YGFlexDirectionColumn, childHeight, height, width);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect ratio
  // calculation. One dimension being the anchor and the other being flexible.
  if (YGFloatIsUndefined(childWidth) ^ YGFloatIsUndefined(childHeight)) {
    if (!YGFloatIsUndefined(child->style.aspectRatio)) {
      if (YGFloatIsUndefined(childWidth)) {
        childWidth = marginRow + (childHeight - marginColumn) * child->style.aspectRatio;
      } else if (YGFloatIsUndefined(childHeight)) {
        childHeight = marginColumn + (childWidth - marginRow) / child->style.aspectRatio;
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (YGFloatIsUndefined(childWidth) || YGFloatIsUndefined(childHeight)) {
    childWidthMeasureMode =
        YGFloatIsUndefined(childWidth) ? YGMeasureModeUndefined : YGMeasureModeExactly;
    childHeightMeasureMode =
        YGFloatIsUndefined(childHeight) ? YGMeasureModeUndefined : YGMeasureModeExactly;

    // If the size of the parent is defined then try to constrain the absolute child to that size
    // as well. This allows text within the absolute child to wrap to the size of its parent.
    // This is the same behavior as many browsers implement.
    if (!isMainAxisRow && YGFloatIsUndefined(childWidth) && widthMode != YGMeasureModeUndefined &&
        width > 0) {
      childWidth = width;
      childWidthMeasureMode = YGMeasureModeAtMost;
    }

    YGLayoutNodeInternal(child,
                         childWidth,
                         childHeight,
                         direction,
                         childWidthMeasureMode,
                         childHeightMeasureMode,
                         childWidth,
                         childHeight,
                         false,
                         "abs-measure",
                         config);
    childWidth = child->layout.measuredDimensions[YGDimensionWidth] +
                 YGNodeMarginForAxis(child, YGFlexDirectionRow, width);
    childHeight = child->layout.measuredDimensions[YGDimensionHeight] +
                  YGNodeMarginForAxis(child, YGFlexDirectionColumn, width);
  }

  YGLayoutNodeInternal(child,
                       childWidth,
                       childHeight,
                       direction,
                       YGMeasureModeExactly,
                       YGMeasureModeExactly,
                       childWidth,
                       childHeight,
                       true,
                       "abs-layout",
                       config);

  if (YGNodeIsTrailingPosDefined(child, mainAxis) && !YGNodeIsLeadingPosDefined(child, mainAxis)) {
    child->layout.position[leading[mainAxis]] =
        node->layout.measuredDimensions[dim[mainAxis]] -
        child->layout.measuredDimensions[dim[mainAxis]] - YGNodeTrailingBorder(node, mainAxis) -
        YGNodeTrailingMargin(child, mainAxis, width) -
        YGNodeTrailingPosition(child, mainAxis, isMainAxisRow ? width : height);
  } else if (!YGNodeIsLeadingPosDefined(child, mainAxis) &&
             node->style.justifyContent == YGJustifyCenter) {
    child->layout.position[leading[mainAxis]] = (node->layout.measuredDimensions[dim[mainAxis]] -
                                                 child->layout.measuredDimensions[dim[mainAxis]]) /
                                                2.0f;
  } else if (!YGNodeIsLeadingPosDefined(child, mainAxis) &&
             node->style.justifyContent == YGJustifyFlexEnd) {
    child->layout.position[leading[mainAxis]] = (node->layout.measuredDimensions[dim[mainAxis]] -
                                                 child->layout.measuredDimensions[dim[mainAxis]]);
  }

  if (YGNodeIsTrailingPosDefined(child, crossAxis) &&
      !YGNodeIsLeadingPosDefined(child, crossAxis)) {
    child->layout.position[leading[crossAxis]] =
        node->layout.measuredDimensions[dim[crossAxis]] -
        child->layout.measuredDimensions[dim[crossAxis]] - YGNodeTrailingBorder(node, crossAxis) -
        YGNodeTrailingMargin(child, crossAxis, width) -
        YGNodeTrailingPosition(child, crossAxis, isMainAxisRow ? height : width);
  } else if (!YGNodeIsLeadingPosDefined(child, crossAxis) &&
             YGNodeAlignItem(node, child) == YGAlignCenter) {
    child->layout.position[leading[crossAxis]] =
        (node->layout.measuredDimensions[dim[crossAxis]] -
         child->layout.measuredDimensions[dim[crossAxis]]) /
        2.0f;
  } else if (!YGNodeIsLeadingPosDefined(child, crossAxis) &&
             ((YGNodeAlignItem(node, child) == YGAlignFlexEnd) ^
              (node->style.flexWrap == YGWrapWrapReverse))) {
    child->layout.position[leading[crossAxis]] = (node->layout.measuredDimensions[dim[crossAxis]] -
                                                  child->layout.measuredDimensions[dim[crossAxis]]);
  }
}

static void YGNodeWithMeasureFuncSetMeasuredDimensions(const YGNodeRef node,
                                                       const float availableWidth,
                                                       const float availableHeight,
                                                       const YGMeasureMode widthMeasureMode,
                                                       const YGMeasureMode heightMeasureMode,
                                                       const float parentWidth,
                                                       const float parentHeight) {
  YGAssertWithNode(
      node,
      node->measure != nullptr,
      "Expected node to have custom measure function");

  const float paddingAndBorderAxisRow =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionRow, availableWidth);
  const float paddingAndBorderAxisColumn =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionColumn, availableWidth);
  const float marginAxisRow = YGNodeMarginForAxis(node, YGFlexDirectionRow, availableWidth);
  const float marginAxisColumn = YGNodeMarginForAxis(node, YGFlexDirectionColumn, availableWidth);

  // We want to make sure we don't call measure with negative size
  const float innerWidth = YGFloatIsUndefined(availableWidth)
                               ? availableWidth
                               : fmaxf(0, availableWidth - marginAxisRow - paddingAndBorderAxisRow);
  const float innerHeight =
      YGFloatIsUndefined(availableHeight)
          ? availableHeight
          : fmaxf(0, availableHeight - marginAxisColumn - paddingAndBorderAxisColumn);

  if (widthMeasureMode == YGMeasureModeExactly && heightMeasureMode == YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->layout.measuredDimensions[YGDimensionWidth] = YGNodeBoundAxis(
        node, YGFlexDirectionRow, availableWidth - marginAxisRow, parentWidth, parentWidth);
    node->layout.measuredDimensions[YGDimensionHeight] = YGNodeBoundAxis(
        node, YGFlexDirectionColumn, availableHeight - marginAxisColumn, parentHeight, parentWidth);
  } else {
    // Measure the text under the current constraints.
    const YGSize measuredSize =
        node->measure(node, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    node->layout.measuredDimensions[YGDimensionWidth] =
        YGNodeBoundAxis(node,
                        YGFlexDirectionRow,
                        (widthMeasureMode == YGMeasureModeUndefined ||
                         widthMeasureMode == YGMeasureModeAtMost)
                            ? measuredSize.width + paddingAndBorderAxisRow
                            : availableWidth - marginAxisRow,
                        parentWidth,
                        parentWidth);
    node->layout.measuredDimensions[YGDimensionHeight] =
        YGNodeBoundAxis(node,
                        YGFlexDirectionColumn,
                        (heightMeasureMode == YGMeasureModeUndefined ||
                         heightMeasureMode == YGMeasureModeAtMost)
                            ? measuredSize.height + paddingAndBorderAxisColumn
                            : availableHeight - marginAxisColumn,
                        parentHeight,
                        parentWidth);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void YGNodeEmptyContainerSetMeasuredDimensions(const YGNodeRef node,
                                                      const float availableWidth,
                                                      const float availableHeight,
                                                      const YGMeasureMode widthMeasureMode,
                                                      const YGMeasureMode heightMeasureMode,
                                                      const float parentWidth,
                                                      const float parentHeight) {
  const float paddingAndBorderAxisRow =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionRow, parentWidth);
  const float paddingAndBorderAxisColumn =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionColumn, parentWidth);
  const float marginAxisRow = YGNodeMarginForAxis(node, YGFlexDirectionRow, parentWidth);
  const float marginAxisColumn = YGNodeMarginForAxis(node, YGFlexDirectionColumn, parentWidth);

  node->layout.measuredDimensions[YGDimensionWidth] =
      YGNodeBoundAxis(node,
                      YGFlexDirectionRow,
                      (widthMeasureMode == YGMeasureModeUndefined ||
                       widthMeasureMode == YGMeasureModeAtMost)
                          ? paddingAndBorderAxisRow
                          : availableWidth - marginAxisRow,
                      parentWidth,
                      parentWidth);
  node->layout.measuredDimensions[YGDimensionHeight] =
      YGNodeBoundAxis(node,
                      YGFlexDirectionColumn,
                      (heightMeasureMode == YGMeasureModeUndefined ||
                       heightMeasureMode == YGMeasureModeAtMost)
                          ? paddingAndBorderAxisColumn
                          : availableHeight - marginAxisColumn,
                      parentHeight,
                      parentWidth);
}

static bool YGNodeFixedSizeSetMeasuredDimensions(const YGNodeRef node,
                                                 const float availableWidth,
                                                 const float availableHeight,
                                                 const YGMeasureMode widthMeasureMode,
                                                 const YGMeasureMode heightMeasureMode,
                                                 const float parentWidth,
                                                 const float parentHeight) {
  if ((widthMeasureMode == YGMeasureModeAtMost && availableWidth <= 0.0f) ||
      (heightMeasureMode == YGMeasureModeAtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == YGMeasureModeExactly && heightMeasureMode == YGMeasureModeExactly)) {
    const float marginAxisColumn = YGNodeMarginForAxis(node, YGFlexDirectionColumn, parentWidth);
    const float marginAxisRow = YGNodeMarginForAxis(node, YGFlexDirectionRow, parentWidth);

    node->layout.measuredDimensions[YGDimensionWidth] =
        YGNodeBoundAxis(node,
                        YGFlexDirectionRow,
                        YGFloatIsUndefined(availableWidth) ||
                                (widthMeasureMode == YGMeasureModeAtMost && availableWidth < 0.0f)
                            ? 0.0f
                            : availableWidth - marginAxisRow,
                        parentWidth,
                        parentWidth);

    node->layout.measuredDimensions[YGDimensionHeight] =
        YGNodeBoundAxis(node,
                        YGFlexDirectionColumn,
                        YGFloatIsUndefined(availableHeight) ||
                                (heightMeasureMode == YGMeasureModeAtMost && availableHeight < 0.0f)
                            ? 0.0f
                            : availableHeight - marginAxisColumn,
                        parentHeight,
                        parentWidth);

    return true;
  }

  return false;
}

static void YGZeroOutLayoutRecursivly(const YGNodeRef node) {
  memset(&(node->layout), 0, sizeof(YGLayout));
  node->hasNewLayout = true;
  YGCloneChildrenIfNeeded(node);
  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = node->children[i];
    YGZeroOutLayoutRecursivly(child);
  }
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm
// described in the W3C YG documentation: https://www.w3.org/TR/YG3-flexbox/.
//
// Limitations of this algorithm, compared to the full standard:
//  * Display property is always assumed to be 'flex' except for Text nodes,
//  which
//    are assumed to be 'inline-flex'.
//  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes
//  are
//    stacked in document order.
//  * The 'order' property is not supported. The order of flex items is always
//  defined
//    by document order.
//  * The 'visibility' property is always assumed to be 'visible'. Values of
//  'collapse'
//    and 'hidden' are not supported.
//  * There is no support for forced breaks.
//  * It does not support vertical inline directions (top-to-bottom or
//  bottom-to-top text).
//
// Deviations from standard:
//  * Section 4.5 of the spec indicates that all flex items have a default
//  minimum
//    main size. For text blocks, for example, this is the width of the widest
//    word.
//    Calculating the minimum width is expensive, so we forego it and assume a
//    default
//    minimum main size of 0.
//  * Min/Max sizes in the main axis are not honored when resolving flexible
//  lengths.
//  * The spec indicates that the default value for 'flexDirection' is 'row',
//  but
//    the algorithm below assumes a default of 'column'.
//
// Input parameters:
//    - node: current node to be sized and layed out
//    - availableWidth & availableHeight: available size to be used for sizing
//    the node
//      or YGUndefined if the size is not available; interpretation depends on
//      layout
//      flags
//    - parentDirection: the inline (text) direction within the parent
//    (left-to-right or
//      right-to-left)
//    - widthMeasureMode: indicates the sizing rules for the width (see below
//    for explanation)
//    - heightMeasureMode: indicates the sizing rules for the height (see below
//    for explanation)
//    - performLayout: specifies whether the caller is interested in just the
//    dimensions
//      of the node or it requires the entire node and its subtree to be layed
//      out
//      (with final positions)
//
// Details:
//    This routine is called recursively to lay out subtrees of flexbox
//    elements. It uses the
//    information in node.style, which is treated as a read-only input. It is
//    responsible for
//    setting the layout.direction and layout.measuredDimensions fields for the
//    input node as well
//    as the layout.position and layout.lineIndex fields for its child nodes.
//    The
//    layout.measuredDimensions field includes any border or padding for the
//    node but does
//    not include margins.
//
//    The spec describes four different layout modes: "fill available", "max
//    content", "min
//    content",
//    and "fit content". Of these, we don't use "min content" because we don't
//    support default
//    minimum main sizes (see above for details). Each of our measure modes maps
//    to a layout mode
//    from the spec (https://www.w3.org/TR/YG3-sizing/#terms):
//      - YGMeasureModeUndefined: max content
//      - YGMeasureModeExactly: fill available
//      - YGMeasureModeAtMost: fit content
//
//    When calling YGNodelayoutImpl and YGLayoutNodeInternal, if the caller passes
//    an available size of
//    undefined then it must also pass a measure mode of YGMeasureModeUndefined
//    in that dimension.
//
static void YGNodelayoutImpl(const YGNodeRef node,
                             const float availableWidth,
                             const float availableHeight,
                             const YGDirection parentDirection,
                             const YGMeasureMode widthMeasureMode,
                             const YGMeasureMode heightMeasureMode,
                             const float parentWidth,
                             const float parentHeight,
                             const bool performLayout,
                             const YGConfigRef config) {
  YGAssertWithNode(node,
                   YGFloatIsUndefined(availableWidth) ? widthMeasureMode == YGMeasureModeUndefined
                                                      : true,
                   "availableWidth is indefinite so widthMeasureMode must be "
                   "YGMeasureModeUndefined");
  YGAssertWithNode(node,
                   YGFloatIsUndefined(availableHeight) ? heightMeasureMode == YGMeasureModeUndefined
                                                       : true,
                   "availableHeight is indefinite so heightMeasureMode must be "
                   "YGMeasureModeUndefined");

  // Set the resolved resolution in the node's layout.
  const YGDirection direction = YGNodeResolveDirection(node, parentDirection);
  node->layout.direction = direction;

  const YGFlexDirection flexRowDirection = YGResolveFlexDirection(YGFlexDirectionRow, direction);
  const YGFlexDirection flexColumnDirection =
      YGResolveFlexDirection(YGFlexDirectionColumn, direction);

  node->layout.margin[YGEdgeStart] = YGNodeLeadingMargin(node, flexRowDirection, parentWidth);
  node->layout.margin[YGEdgeEnd] = YGNodeTrailingMargin(node, flexRowDirection, parentWidth);
  node->layout.margin[YGEdgeTop] = YGNodeLeadingMargin(node, flexColumnDirection, parentWidth);
  node->layout.margin[YGEdgeBottom] = YGNodeTrailingMargin(node, flexColumnDirection, parentWidth);

  node->layout.border[YGEdgeStart] = YGNodeLeadingBorder(node, flexRowDirection);
  node->layout.border[YGEdgeEnd] = YGNodeTrailingBorder(node, flexRowDirection);
  node->layout.border[YGEdgeTop] = YGNodeLeadingBorder(node, flexColumnDirection);
  node->layout.border[YGEdgeBottom] = YGNodeTrailingBorder(node, flexColumnDirection);

  node->layout.padding[YGEdgeStart] = YGNodeLeadingPadding(node, flexRowDirection, parentWidth);
  node->layout.padding[YGEdgeEnd] = YGNodeTrailingPadding(node, flexRowDirection, parentWidth);
  node->layout.padding[YGEdgeTop] = YGNodeLeadingPadding(node, flexColumnDirection, parentWidth);
  node->layout.padding[YGEdgeBottom] =
      YGNodeTrailingPadding(node, flexColumnDirection, parentWidth);

  if (node->measure) {
    YGNodeWithMeasureFuncSetMeasuredDimensions(node,
                                               availableWidth,
                                               availableHeight,
                                               widthMeasureMode,
                                               heightMeasureMode,
                                               parentWidth,
                                               parentHeight);
    return;
  }

  const uint32_t childCount = YGNodeGetChildCount(node);
  if (childCount == 0) {
    YGNodeEmptyContainerSetMeasuredDimensions(node,
                                              availableWidth,
                                              availableHeight,
                                              widthMeasureMode,
                                              heightMeasureMode,
                                              parentWidth,
                                              parentHeight);
    return;
  }

  // If we're not being asked to perform a full layout we can skip the algorithm if we already know
  // the size
  if (!performLayout && YGNodeFixedSizeSetMeasuredDimensions(node,
                                                             availableWidth,
                                                             availableHeight,
                                                             widthMeasureMode,
                                                             heightMeasureMode,
                                                             parentWidth,
                                                             parentHeight)) {
    return;
  }

  // At this point we know we're going to perform work. Ensure that each child has a mutable copy.
  YGCloneChildrenIfNeeded(node);

  // Reset layout flags, as they could have changed.
  node->layout.hadOverflow = false;

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const YGFlexDirection mainAxis = YGResolveFlexDirection(node->style.flexDirection, direction);
  const YGFlexDirection crossAxis = YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = YGFlexDirectionIsRow(mainAxis);
  const YGJustify justifyContent = node->style.justifyContent;
  const bool isNodeFlexWrap = node->style.flexWrap != YGWrapNoWrap;

  const float mainAxisParentSize = isMainAxisRow ? parentWidth : parentHeight;
  const float crossAxisParentSize = isMainAxisRow ? parentHeight : parentWidth;

  YGNodeRef firstAbsoluteChild = nullptr;
  YGNodeRef currentAbsoluteChild = nullptr;

  const float leadingPaddingAndBorderMain =
      YGNodeLeadingPaddingAndBorder(node, mainAxis, parentWidth);
  const float trailingPaddingAndBorderMain =
      YGNodeTrailingPaddingAndBorder(node, mainAxis, parentWidth);
  const float leadingPaddingAndBorderCross =
      YGNodeLeadingPaddingAndBorder(node, crossAxis, parentWidth);
  const float paddingAndBorderAxisMain = YGNodePaddingAndBorderForAxis(node, mainAxis, parentWidth);
  const float paddingAndBorderAxisCross =
      YGNodePaddingAndBorderForAxis(node, crossAxis, parentWidth);

  YGMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  YGMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow =
      isMainAxisRow ? paddingAndBorderAxisMain : paddingAndBorderAxisCross;
  const float paddingAndBorderAxisColumn =
      isMainAxisRow ? paddingAndBorderAxisCross : paddingAndBorderAxisMain;

  const float marginAxisRow = YGNodeMarginForAxis(node, YGFlexDirectionRow, parentWidth);
  const float marginAxisColumn = YGNodeMarginForAxis(node, YGFlexDirectionColumn, parentWidth);

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  const float minInnerWidth =
      YGResolveValue(&node->style.minDimensions[YGDimensionWidth], parentWidth) -
      paddingAndBorderAxisRow;
  const float maxInnerWidth =
      YGResolveValue(&node->style.maxDimensions[YGDimensionWidth], parentWidth) -
      paddingAndBorderAxisRow;
  const float minInnerHeight =
      YGResolveValue(&node->style.minDimensions[YGDimensionHeight], parentHeight) -
      paddingAndBorderAxisColumn;
  const float maxInnerHeight =
      YGResolveValue(&node->style.maxDimensions[YGDimensionHeight], parentHeight) -
      paddingAndBorderAxisColumn;
  const float minInnerMainDim = isMainAxisRow ? minInnerWidth : minInnerHeight;
  const float maxInnerMainDim = isMainAxisRow ? maxInnerWidth : maxInnerHeight;

  // Max dimension overrides predefined dimension value; Min dimension in turn overrides both of the
  // above
  float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  if (!YGFloatIsUndefined(availableInnerWidth)) {
    // We want to make sure our available width does not violate min and max constraints
    availableInnerWidth = fmaxf(fminf(availableInnerWidth, maxInnerWidth), minInnerWidth);
  }

  float availableInnerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  if (!YGFloatIsUndefined(availableInnerHeight)) {
    // We want to make sure our available height does not violate min and max constraints
    availableInnerHeight = fmaxf(fminf(availableInnerHeight, maxInnerHeight), minInnerHeight);
  }

  float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // If there is only one child with flexGrow + flexShrink it means we can set the
  // computedFlexBasis to 0 instead of measuring and shrinking / flexing the child to exactly
  // match the remaining space
  YGNodeRef singleFlexChild = nullptr;
  if (measureModeMainDim == YGMeasureModeExactly) {
    for (uint32_t i = 0; i < childCount; i++) {
      const YGNodeRef child = YGNodeGetChild(node, i);
      if (singleFlexChild) {
        if (YGNodeIsFlex(child)) {
          // There is already a flexible child, abort.
          singleFlexChild = nullptr;
          break;
        }
      } else if (YGResolveFlexGrow(child) > 0.0f && YGNodeResolveFlexShrink(child) > 0.0f) {
        singleFlexChild = child;
      }
    }
  }

  float totalOuterFlexBasis = 0;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = node->children[i];
    if (child->style.display == YGDisplayNone) {
      YGZeroOutLayoutRecursivly(child);
      child->hasNewLayout = true;
      child->isDirty = false;
      continue;
    }
    YGResolveDimensions(child);
    if (performLayout) {
      // Set the initial position (relative to the parent).
      const YGDirection childDirection = YGNodeResolveDirection(child, direction);
      YGNodeSetPosition(child,
                        childDirection,
                        availableInnerMainDim,
                        availableInnerCrossDim,
                        availableInnerWidth);
    }

    // Absolute-positioned children don't participate in flex layout. Add them
    // to a list that we can process later.
    if (child->style.positionType == YGPositionTypeAbsolute) {
      // Store a private linked list of absolutely positioned children
      // so that we can efficiently traverse them later.
      if (firstAbsoluteChild == nullptr) {
        firstAbsoluteChild = child;
      }
      if (currentAbsoluteChild != nullptr) {
        currentAbsoluteChild->nextChild = child;
      }
      currentAbsoluteChild = child;
      child->nextChild = nullptr;
    } else {
      if (child == singleFlexChild) {
        child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
        child->layout.computedFlexBasis = 0;
      } else {
        YGNodeComputeFlexBasisForChild(node,
                                       child,
                                       availableInnerWidth,
                                       widthMeasureMode,
                                       availableInnerHeight,
                                       availableInnerWidth,
                                       availableInnerHeight,
                                       heightMeasureMode,
                                       direction,
                                       config);
      }
    }

    totalOuterFlexBasis +=
        child->layout.computedFlexBasis + YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);
    ;
  }

  const bool flexBasisOverflows = measureModeMainDim == YGMeasureModeUndefined
                                      ? false
                                      : totalOuterFlexBasis > availableInnerMainDim;
  if (isNodeFlexWrap && flexBasisOverflows && measureModeMainDim == YGMeasureModeAtMost) {
    measureModeMainDim = YGMeasureModeExactly;
  }

  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Indexes of children that represent the first and last items in the line.
  uint32_t startOfLineIndex = 0;
  uint32_t endOfLineIndex = 0;

  // Number of lines.
  uint32_t lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  float totalLineCrossDim = 0;

  // Max main dimension of all the lines.
  float maxLineMainDim = 0;

  for (; endOfLineIndex < childCount; lineCount++, startOfLineIndex = endOfLineIndex) {
    // Number of items on the currently line. May be different than the
    // difference
    // between start and end indicates because we skip over absolute-positioned
    // items.
    uint32_t itemsOnLine = 0;

    // sizeConsumedOnCurrentLine is accumulation of the dimensions and margin
    // of all the children on the current line. This will be used in order to
    // either set the dimensions of the node if none already exist or to compute
    // the remaining space left for the flexible children.
    float sizeConsumedOnCurrentLine = 0;
    float sizeConsumedOnCurrentLineIncludingMinConstraint = 0;

    float totalFlexGrowFactors = 0;
    float totalFlexShrinkScaledFactors = 0;

    // Maintain a linked list of the child nodes that can shrink and/or grow.
    YGNodeRef firstRelativeChild = nullptr;
    YGNodeRef currentRelativeChild = nullptr;

    // Add items to the current line until it's full or we run out of items.
    for (uint32_t i = startOfLineIndex; i < childCount; i++, endOfLineIndex++) {
      const YGNodeRef child = node->children[i];
      if (child->style.display == YGDisplayNone) {
        continue;
      }
      child->lineIndex = lineCount;

      if (child->style.positionType != YGPositionTypeAbsolute) {
        const float childMarginMainAxis = YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);
        const float flexBasisWithMaxConstraints =
            fminf(YGResolveValue(&child->style.maxDimensions[dim[mainAxis]], mainAxisParentSize),
                  child->layout.computedFlexBasis);
        const float flexBasisWithMinAndMaxConstraints =
            fmaxf(YGResolveValue(&child->style.minDimensions[dim[mainAxis]], mainAxisParentSize),
                  flexBasisWithMaxConstraints);

        // If this is a multi-line flow and this item pushes us over the
        // available size, we've
        // hit the end of the current line. Break out of the loop and lay out
        // the current line.
        if (sizeConsumedOnCurrentLineIncludingMinConstraint + flexBasisWithMinAndMaxConstraints +
                    childMarginMainAxis >
                availableInnerMainDim &&
            isNodeFlexWrap && itemsOnLine > 0) {
          break;
        }

        sizeConsumedOnCurrentLineIncludingMinConstraint +=
            flexBasisWithMinAndMaxConstraints + childMarginMainAxis;
        sizeConsumedOnCurrentLine += flexBasisWithMinAndMaxConstraints + childMarginMainAxis;
        itemsOnLine++;

        if (YGNodeIsFlex(child)) {
          totalFlexGrowFactors += YGResolveFlexGrow(child);

          // Unlike the grow factor, the shrink factor is scaled relative to the child dimension.
          totalFlexShrinkScaledFactors +=
              -YGNodeResolveFlexShrink(child) * child->layout.computedFlexBasis;
        }

        // Store a private linked list of children that need to be layed out.
        if (firstRelativeChild == nullptr) {
          firstRelativeChild = child;
        }
        if (currentRelativeChild != nullptr) {
          currentRelativeChild->nextChild = child;
        }
        currentRelativeChild = child;
        child->nextChild = nullptr;
      }
    }

    // The total flex factor needs to be floored to 1.
    if (totalFlexGrowFactors > 0 && totalFlexGrowFactors < 1) {
      totalFlexGrowFactors = 1;
    }

    // The total flex shrink factor needs to be floored to 1.
    if (totalFlexShrinkScaledFactors > 0 && totalFlexShrinkScaledFactors < 1) {
      totalFlexShrinkScaledFactors = 1;
    }

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    const bool canSkipFlex = !performLayout && measureModeCrossDim == YGMeasureModeExactly;

    // In order to position the elements in the main axis, we have two
    // controls. The space between the beginning and the first element
    // and the space between each two elements.
    float leadingMainDim = 0;
    float betweenMainDim = 0;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated.
    // If the main dimension size isn't known, it is computed based on
    // the line length, so there's no more space left to distribute.

    bool sizeBasedOnContent = false;
    // If we don't measure with exact main dimension we want to ensure we don't violate min and max
    if (measureModeMainDim != YGMeasureModeExactly) {
      if (!YGFloatIsUndefined(minInnerMainDim) && sizeConsumedOnCurrentLine < minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (!YGFloatIsUndefined(maxInnerMainDim) &&
                 sizeConsumedOnCurrentLine > maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else {
        if (!node->config->useLegacyStretchBehaviour &&
            (totalFlexGrowFactors == 0 || YGResolveFlexGrow(node) == 0)) {
          // If we don't have any children to flex or we can't flex the node itself,
          // space we've used is all space we need. Root node also should be shrunk to minimum
          availableInnerMainDim = sizeConsumedOnCurrentLine;
        }
        sizeBasedOnContent = !node->config->useLegacyStretchBehaviour;
      }
    }

    float remainingFreeSpace = 0;
    if (!sizeBasedOnContent && !YGFloatIsUndefined(availableInnerMainDim)) {
      remainingFreeSpace = availableInnerMainDim - sizeConsumedOnCurrentLine;
    } else if (sizeConsumedOnCurrentLine < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized based on its
      // content.
      // sizeConsumedOnCurrentLine is negative which means the node will allocate 0 points for
      // its content. Consequently, remainingFreeSpace is 0 - sizeConsumedOnCurrentLine.
      remainingFreeSpace = -sizeConsumedOnCurrentLine;
    }

    const float originalRemainingFreeSpace = remainingFreeSpace;
    float deltaFreeSpace = 0;

    if (!canSkipFlex) {
      float childFlexBasis;
      float flexShrinkScaledFactor;
      float flexGrowFactor;
      float baseMainSize;
      float boundMainSize;

      // Do two passes over the flex items to figure out how to distribute the
      // remaining space.
      // The first pass finds the items whose min/max constraints trigger,
      // freezes them at those
      // sizes, and excludes those sizes from the remaining space. The second
      // pass sets the size
      // of each flexible item. It distributes the remaining space amongst the
      // items whose min/max
      // constraints didn't trigger in pass 1. For the other items, it sets
      // their sizes by forcing
      // their min/max constraints to trigger again.
      //
      // This two pass approach for resolving min/max constraints deviates from
      // the spec. The
      // spec (https://www.w3.org/TR/YG-flexbox-1/#resolve-flexible-lengths)
      // describes a process
      // that needs to be repeated a variable number of times. The algorithm
      // implemented here
      // won't handle all cases but it was simpler to implement and it mitigates
      // performance
      // concerns because we know exactly how many passes it'll do.

      // First pass: detect the flex items whose min/max constraints trigger
      float deltaFlexShrinkScaledFactors = 0;
      float deltaFlexGrowFactors = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != nullptr) {
        childFlexBasis =
            fminf(YGResolveValue(&currentRelativeChild->style.maxDimensions[dim[mainAxis]],
                                 mainAxisParentSize),
                  fmaxf(YGResolveValue(&currentRelativeChild->style.minDimensions[dim[mainAxis]],
                                       mainAxisParentSize),
                        currentRelativeChild->layout.computedFlexBasis));

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = -YGNodeResolveFlexShrink(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize =
                childFlexBasis +
                remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
            boundMainSize = YGNodeBoundAxis(currentRelativeChild,
                                            mainAxis,
                                            baseMainSize,
                                            availableInnerMainDim,
                                            availableInnerWidth);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining,
              // this item's
              // min/max constraints should also trigger in the second pass
              // resulting in the
              // item's size calculation being identical in the first and second
              // passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexShrinkScaledFactors -= flexShrinkScaledFactor;
            }
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = YGResolveFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize =
                childFlexBasis + remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
            boundMainSize = YGNodeBoundAxis(currentRelativeChild,
                                            mainAxis,
                                            baseMainSize,
                                            availableInnerMainDim,
                                            availableInnerWidth);

            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining,
              // this item's
              // min/max constraints should also trigger in the second pass
              // resulting in the
              // item's size calculation being identical in the first and second
              // passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexGrowFactors -= flexGrowFactor;
            }
          }
        }

        currentRelativeChild = currentRelativeChild->nextChild;
      }

      totalFlexShrinkScaledFactors += deltaFlexShrinkScaledFactors;
      totalFlexGrowFactors += deltaFlexGrowFactors;
      remainingFreeSpace += deltaFreeSpace;

      // Second pass: resolve the sizes of the flexible items
      deltaFreeSpace = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != nullptr) {
        childFlexBasis =
            fminf(YGResolveValue(&currentRelativeChild->style.maxDimensions[dim[mainAxis]],
                                 mainAxisParentSize),
                  fmaxf(YGResolveValue(&currentRelativeChild->style.minDimensions[dim[mainAxis]],
                                       mainAxisParentSize),
                        currentRelativeChild->layout.computedFlexBasis));
        float updatedMainSize = childFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = -YGNodeResolveFlexShrink(currentRelativeChild) * childFlexBasis;
          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            float childSize;

            if (totalFlexShrinkScaledFactors == 0) {
              childSize = childFlexBasis + flexShrinkScaledFactor;
            } else {
              childSize =
                  childFlexBasis +
                  (remainingFreeSpace / totalFlexShrinkScaledFactors) * flexShrinkScaledFactor;
            }

            updatedMainSize = YGNodeBoundAxis(currentRelativeChild,
                                              mainAxis,
                                              childSize,
                                              availableInnerMainDim,
                                              availableInnerWidth);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = YGResolveFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize =
                YGNodeBoundAxis(currentRelativeChild,
                                mainAxis,
                                childFlexBasis +
                                    remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor,
                                availableInnerMainDim,
                                availableInnerWidth);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        const float marginMain =
            YGNodeMarginForAxis(currentRelativeChild, mainAxis, availableInnerWidth);
        const float marginCross =
            YGNodeMarginForAxis(currentRelativeChild, crossAxis, availableInnerWidth);

        float childCrossSize;
        float childMainSize = updatedMainSize + marginMain;
        YGMeasureMode childCrossMeasureMode;
        YGMeasureMode childMainMeasureMode = YGMeasureModeExactly;

        if (!YGFloatIsUndefined(currentRelativeChild->style.aspectRatio)) {
          childCrossSize =
              isMainAxisRow
                  ? (childMainSize - marginMain) / currentRelativeChild->style.aspectRatio
                  : (childMainSize - marginMain) * currentRelativeChild->style.aspectRatio;
          childCrossMeasureMode = YGMeasureModeExactly;

          childCrossSize += marginCross;
        } else if (!YGFloatIsUndefined(availableInnerCrossDim) &&
                   !YGNodeIsStyleDimDefined(currentRelativeChild,
                                            crossAxis,
                                            availableInnerCrossDim) &&
                   measureModeCrossDim == YGMeasureModeExactly &&
                   !(isNodeFlexWrap && flexBasisOverflows) &&
                   YGNodeAlignItem(node, currentRelativeChild) == YGAlignStretch &&
                   YGMarginLeadingValue(currentRelativeChild, crossAxis)->unit != YGUnitAuto &&
                   YGMarginTrailingValue(currentRelativeChild, crossAxis)->unit != YGUnitAuto) {
          childCrossSize = availableInnerCrossDim;
          childCrossMeasureMode = YGMeasureModeExactly;
        } else if (!YGNodeIsStyleDimDefined(currentRelativeChild,
                                            crossAxis,
                                            availableInnerCrossDim)) {
          childCrossSize = availableInnerCrossDim;
          childCrossMeasureMode =
              YGFloatIsUndefined(childCrossSize) ? YGMeasureModeUndefined : YGMeasureModeAtMost;
        } else {
          childCrossSize = YGResolveValue(currentRelativeChild->resolvedDimensions[dim[crossAxis]],
                                          availableInnerCrossDim) +
                           marginCross;
          const bool isLoosePercentageMeasurement =
              currentRelativeChild->resolvedDimensions[dim[crossAxis]]->unit == YGUnitPercent &&
              measureModeCrossDim != YGMeasureModeExactly;
          childCrossMeasureMode = YGFloatIsUndefined(childCrossSize) || isLoosePercentageMeasurement
                                      ? YGMeasureModeUndefined
                                      : YGMeasureModeExactly;
        }

        YGConstrainMaxSizeForMode(currentRelativeChild,
                                  mainAxis,
                                  availableInnerMainDim,
                                  availableInnerWidth,
                                  &childMainMeasureMode,
                                  &childMainSize);
        YGConstrainMaxSizeForMode(currentRelativeChild,
                                  crossAxis,
                                  availableInnerCrossDim,
                                  availableInnerWidth,
                                  &childCrossMeasureMode,
                                  &childCrossSize);

        const bool requiresStretchLayout =
            !YGNodeIsStyleDimDefined(currentRelativeChild, crossAxis, availableInnerCrossDim) &&
            YGNodeAlignItem(node, currentRelativeChild) == YGAlignStretch &&
            YGMarginLeadingValue(currentRelativeChild, crossAxis)->unit != YGUnitAuto &&
            YGMarginTrailingValue(currentRelativeChild, crossAxis)->unit != YGUnitAuto;

        const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
        const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

        const YGMeasureMode childWidthMeasureMode =
            isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;
        const YGMeasureMode childHeightMeasureMode =
            !isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;

        // Recursively call the layout algorithm for this child with the updated
        // main size.
        YGLayoutNodeInternal(currentRelativeChild,
                             childWidth,
                             childHeight,
                             direction,
                             childWidthMeasureMode,
                             childHeightMeasureMode,
                             availableInnerWidth,
                             availableInnerHeight,
                             performLayout && !requiresStretchLayout,
                             "flex",
                             config);
        node->layout.hadOverflow |= currentRelativeChild->layout.hadOverflow;

        currentRelativeChild = currentRelativeChild->nextChild;
      }
    }

    remainingFreeSpace = originalRemainingFreeSpace + deltaFreeSpace;
    node->layout.hadOverflow |= (remainingFreeSpace < 0);

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis.
    // Their dimensions are also set in the cross axis with the exception of
    // items
    // that are aligned "stretch". We need to compute these stretch values and
    // set the final positions.

    // If we are using "at most" rules in the main axis. Calculate the remaining space when
    // constraint by the min size defined for the main axis.

    if (measureModeMainDim == YGMeasureModeAtMost && remainingFreeSpace > 0) {
      if (node->style.minDimensions[dim[mainAxis]].unit != YGUnitUndefined &&
          YGResolveValue(&node->style.minDimensions[dim[mainAxis]], mainAxisParentSize) >= 0) {
        remainingFreeSpace =
            fmaxf(0,
                  YGResolveValue(&node->style.minDimensions[dim[mainAxis]], mainAxisParentSize) -
                      (availableInnerMainDim - remainingFreeSpace));
      } else {
        remainingFreeSpace = 0;
      }
    }

    int numberOfAutoMarginsOnCurrentLine = 0;
    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const YGNodeRef child = node->children[i];
      if (child->style.positionType == YGPositionTypeRelative) {
        if (YGMarginLeadingValue(child, mainAxis)->unit == YGUnitAuto) {
          numberOfAutoMarginsOnCurrentLine++;
        }
        if (YGMarginTrailingValue(child, mainAxis)->unit == YGUnitAuto) {
          numberOfAutoMarginsOnCurrentLine++;
        }
      }
    }

    if (numberOfAutoMarginsOnCurrentLine == 0) {
      switch (justifyContent) {
        case YGJustifyCenter:
          leadingMainDim = remainingFreeSpace / 2;
          break;
        case YGJustifyFlexEnd:
          leadingMainDim = remainingFreeSpace;
          break;
        case YGJustifySpaceBetween:
          if (itemsOnLine > 1) {
            betweenMainDim = fmaxf(remainingFreeSpace, 0) / (itemsOnLine - 1);
          } else {
            betweenMainDim = 0;
          }
          break;
        case YGJustifySpaceEvenly:
          // Space is distributed evenly across all elements
          betweenMainDim = remainingFreeSpace / (itemsOnLine + 1);
          leadingMainDim = betweenMainDim;
          break;
        case YGJustifySpaceAround:
          // Space on the edges is half of the space between elements
          betweenMainDim = remainingFreeSpace / itemsOnLine;
          leadingMainDim = betweenMainDim / 2;
          break;
        case YGJustifyFlexStart:
          break;
      }
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const YGNodeRef child = node->children[i];
      if (child->style.display == YGDisplayNone) {
        continue;
      }
      if (child->style.positionType == YGPositionTypeAbsolute &&
          YGNodeIsLeadingPosDefined(child, mainAxis)) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] =
              YGNodeLeadingPosition(child, mainAxis, availableInnerMainDim) +
              YGNodeLeadingBorder(node, mainAxis) +
              YGNodeLeadingMargin(child, mainAxis, availableInnerWidth);
        }
      } else {
        // Now that we placed the element, we need to update the variables.
        // We need to do that only for relative elements. Absolute elements
        // do not take part in that phase.
        if (child->style.positionType == YGPositionTypeRelative) {
          if (YGMarginLeadingValue(child, mainAxis)->unit == YGUnitAuto) {
            mainDim += remainingFreeSpace / numberOfAutoMarginsOnCurrentLine;
          }

          if (performLayout) {
            child->layout.position[pos[mainAxis]] += mainDim;
          }

          if (YGMarginTrailingValue(child, mainAxis)->unit == YGUnitAuto) {
            mainDim += remainingFreeSpace / numberOfAutoMarginsOnCurrentLine;
          }

          if (canSkipFlex) {
            // If we skipped the flex step, then we can't rely on the
            // measuredDims because
            // they weren't computed. This means we can't call YGNodeDimWithMargin.
            mainDim += betweenMainDim + YGNodeMarginForAxis(child, mainAxis, availableInnerWidth) +
                       child->layout.computedFlexBasis;
            crossDim = availableInnerCrossDim;
          } else {
            // The main dimension is the sum of all the elements dimension plus the spacing.
            mainDim += betweenMainDim + YGNodeDimWithMargin(child, mainAxis, availableInnerWidth);

            // The cross dimension is the max of the elements dimension since
            // there can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, YGNodeDimWithMargin(child, crossAxis, availableInnerWidth));
          }
        } else if (performLayout) {
          child->layout.position[pos[mainAxis]] +=
              YGNodeLeadingBorder(node, mainAxis) + leadingMainDim;
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == YGMeasureModeUndefined ||
        measureModeCrossDim == YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = YGNodeBoundAxis(node,
                                           crossAxis,
                                           crossDim + paddingAndBorderAxisCross,
                                           crossAxisParentSize,
                                           parentWidth) -
                           paddingAndBorderAxisCross;
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == YGMeasureModeExactly) {
      crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    crossDim = YGNodeBoundAxis(node,
                               crossAxis,
                               crossDim + paddingAndBorderAxisCross,
                               crossAxisParentSize,
                               parentWidth) -
               paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const YGNodeRef child = node->children[i];
        if (child->style.display == YGDisplayNone) {
          continue;
        }
        if (child->style.positionType == YGPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right
          // set, override all the previously computed positions to set it
          // correctly.
          const bool isChildLeadingPosDefined = YGNodeIsLeadingPosDefined(child, crossAxis);
          if (isChildLeadingPosDefined) {
            child->layout.position[pos[crossAxis]] =
                YGNodeLeadingPosition(child, crossAxis, availableInnerCrossDim) +
                YGNodeLeadingBorder(node, crossAxis) +
                YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
          }
          // If leading position is not defined or calculations result in Nan, default to border + margin
          if (!isChildLeadingPosDefined || YGFloatIsUndefined(child->layout.position[pos[crossAxis]])) {
            child->layout.position[pos[crossAxis]] =
                YGNodeLeadingBorder(node, crossAxis) +
                YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const YGAlign alignItem = YGNodeAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == YGAlignStretch &&
              YGMarginLeadingValue(child, crossAxis)->unit != YGUnitAuto &&
              YGMarginTrailingValue(child, crossAxis)->unit != YGUnitAuto) {
            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!YGNodeIsStyleDimDefined(child, crossAxis, availableInnerCrossDim)) {
              float childMainSize = child->layout.measuredDimensions[dim[mainAxis]];
              float childCrossSize =
                  !YGFloatIsUndefined(child->style.aspectRatio)
                      ? ((YGNodeMarginForAxis(child, crossAxis, availableInnerWidth) +
                          (isMainAxisRow ? childMainSize / child->style.aspectRatio
                                         : childMainSize * child->style.aspectRatio)))
                      : crossDim;

              childMainSize += YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);

              YGMeasureMode childMainMeasureMode = YGMeasureModeExactly;
              YGMeasureMode childCrossMeasureMode = YGMeasureModeExactly;
              YGConstrainMaxSizeForMode(child,
                                        mainAxis,
                                        availableInnerMainDim,
                                        availableInnerWidth,
                                        &childMainMeasureMode,
                                        &childMainSize);
              YGConstrainMaxSizeForMode(child,
                                        crossAxis,
                                        availableInnerCrossDim,
                                        availableInnerWidth,
                                        &childCrossMeasureMode,
                                        &childCrossSize);

              const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
              const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

              const YGMeasureMode childWidthMeasureMode =
                  YGFloatIsUndefined(childWidth) ? YGMeasureModeUndefined : YGMeasureModeExactly;
              const YGMeasureMode childHeightMeasureMode =
                  YGFloatIsUndefined(childHeight) ? YGMeasureModeUndefined : YGMeasureModeExactly;

              YGLayoutNodeInternal(child,
                                   childWidth,
                                   childHeight,
                                   direction,
                                   childWidthMeasureMode,
                                   childHeightMeasureMode,
                                   availableInnerWidth,
                                   availableInnerHeight,
                                   true,
                                   "stretch",
                                   config);
            }
          } else {
            const float remainingCrossDim =
                containerCrossAxis - YGNodeDimWithMargin(child, crossAxis, availableInnerWidth);

            if (YGMarginLeadingValue(child, crossAxis)->unit == YGUnitAuto &&
                YGMarginTrailingValue(child, crossAxis)->unit == YGUnitAuto) {
              leadingCrossDim += fmaxf(0.0f, remainingCrossDim / 2);
            } else if (YGMarginTrailingValue(child, crossAxis)->unit == YGUnitAuto) {
              // No-Op
            } else if (YGMarginLeadingValue(child, crossAxis)->unit == YGUnitAuto) {
              leadingCrossDim += fmaxf(0.0f, remainingCrossDim);
            } else if (alignItem == YGAlignFlexStart) {
              // No-Op
            } else if (alignItem == YGAlignCenter) {
              leadingCrossDim += remainingCrossDim / 2;
            } else {
              leadingCrossDim += remainingCrossDim;
            }
          }
          // And we apply the position
          child->layout.position[pos[crossAxis]] += totalLineCrossDim + leadingCrossDim;
        }
      }
    }

    totalLineCrossDim += crossDim;
    maxLineMainDim = fmaxf(maxLineMainDim, mainDim);
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  if (performLayout && (lineCount > 1 || YGIsBaselineLayout(node)) &&
      !YGFloatIsUndefined(availableInnerCrossDim)) {
    const float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    switch (node->style.alignContent) {
      case YGAlignFlexEnd:
        currentLead += remainingAlignContentDim;
        break;
      case YGAlignCenter:
        currentLead += remainingAlignContentDim / 2;
        break;
      case YGAlignStretch:
        if (availableInnerCrossDim > totalLineCrossDim) {
          crossDimLead = remainingAlignContentDim / lineCount;
        }
        break;
      case YGAlignSpaceAround:
        if (availableInnerCrossDim > totalLineCrossDim) {
          currentLead += remainingAlignContentDim / (2 * lineCount);
          if (lineCount > 1) {
            crossDimLead = remainingAlignContentDim / lineCount;
          }
        } else {
          currentLead += remainingAlignContentDim / 2;
        }
        break;
      case YGAlignSpaceBetween:
        if (availableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
          crossDimLead = remainingAlignContentDim / (lineCount - 1);
        }
        break;
      case YGAlignAuto:
      case YGAlignFlexStart:
      case YGAlignBaseline:
        break;
    }

    uint32_t endIndex = 0;
    for (uint32_t i = 0; i < lineCount; i++) {
      const uint32_t startIndex = endIndex;
      uint32_t ii;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      float maxAscentForCurrentLine = 0;
      float maxDescentForCurrentLine = 0;
      for (ii = startIndex; ii < childCount; ii++) {
        const YGNodeRef child = node->children[ii];
        if (child->style.display == YGDisplayNone) {
          continue;
        }
        if (child->style.positionType == YGPositionTypeRelative) {
          if (child->lineIndex != i) {
            break;
          }
          if (YGNodeIsLayoutDimDefined(child, crossAxis)) {
            lineHeight = fmaxf(lineHeight,
                               child->layout.measuredDimensions[dim[crossAxis]] +
                                   YGNodeMarginForAxis(child, crossAxis, availableInnerWidth));
          }
          if (YGNodeAlignItem(node, child) == YGAlignBaseline) {
            const float ascent =
                YGBaseline(child) +
                YGNodeLeadingMargin(child, YGFlexDirectionColumn, availableInnerWidth);
            const float descent =
                child->layout.measuredDimensions[YGDimensionHeight] +
                YGNodeMarginForAxis(child, YGFlexDirectionColumn, availableInnerWidth) - ascent;
            maxAscentForCurrentLine = fmaxf(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine = fmaxf(maxDescentForCurrentLine, descent);
            lineHeight = fmaxf(lineHeight, maxAscentForCurrentLine + maxDescentForCurrentLine);
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const YGNodeRef child = node->children[ii];
          if (child->style.display == YGDisplayNone) {
            continue;
          }
          if (child->style.positionType == YGPositionTypeRelative) {
            switch (YGNodeAlignItem(node, child)) {
              case YGAlignFlexStart: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
                break;
              }
              case YGAlignFlexEnd: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + lineHeight -
                    YGNodeTrailingMargin(child, crossAxis, availableInnerWidth) -
                    child->layout.measuredDimensions[dim[crossAxis]];
                break;
              }
              case YGAlignCenter: {
                float childHeight = child->layout.measuredDimensions[dim[crossAxis]];
                child->layout.position[pos[crossAxis]] =
                    currentLead + (lineHeight - childHeight) / 2;
                break;
              }
              case YGAlignStretch: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);

                // Remeasure child with the line height as it as been only measured with the
                // parents height yet.
                if (!YGNodeIsStyleDimDefined(child, crossAxis, availableInnerCrossDim)) {
                  const float childWidth =
                      isMainAxisRow ? (child->layout.measuredDimensions[YGDimensionWidth] +
                                       YGNodeMarginForAxis(child, mainAxis, availableInnerWidth))
                                    : lineHeight;

                  const float childHeight =
                      !isMainAxisRow ? (child->layout.measuredDimensions[YGDimensionHeight] +
                                        YGNodeMarginForAxis(child, crossAxis, availableInnerWidth))
                                     : lineHeight;

                  if (!(YGFloatsEqual(childWidth,
                                      child->layout.measuredDimensions[YGDimensionWidth]) &&
                        YGFloatsEqual(childHeight,
                                      child->layout.measuredDimensions[YGDimensionHeight]))) {
                    YGLayoutNodeInternal(child,
                                         childWidth,
                                         childHeight,
                                         direction,
                                         YGMeasureModeExactly,
                                         YGMeasureModeExactly,
                                         availableInnerWidth,
                                         availableInnerHeight,
                                         true,
                                         "multiline-stretch",
                                         config);
                  }
                }
                break;
              }
              case YGAlignBaseline: {
                child->layout.position[YGEdgeTop] =
                    currentLead + maxAscentForCurrentLine - YGBaseline(child) +
                    YGNodeLeadingPosition(child, YGFlexDirectionColumn, availableInnerCrossDim);
                break;
              }
              case YGAlignAuto:
              case YGAlignSpaceBetween:
              case YGAlignSpaceAround:
                break;
            }
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[YGDimensionWidth] = YGNodeBoundAxis(
      node, YGFlexDirectionRow, availableWidth - marginAxisRow, parentWidth, parentWidth);
  node->layout.measuredDimensions[YGDimensionHeight] = YGNodeBoundAxis(
      node, YGFlexDirectionColumn, availableHeight - marginAxisColumn, parentHeight, parentWidth);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == YGMeasureModeUndefined ||
      (node->style.overflow != YGOverflowScroll && measureModeMainDim == YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] =
        YGNodeBoundAxis(node, mainAxis, maxLineMainDim, mainAxisParentSize, parentWidth);
  } else if (measureModeMainDim == YGMeasureModeAtMost &&
             node->style.overflow == YGOverflowScroll) {
    node->layout.measuredDimensions[dim[mainAxis]] = fmaxf(
        fminf(availableInnerMainDim + paddingAndBorderAxisMain,
              YGNodeBoundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim, mainAxisParentSize)),
        paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == YGMeasureModeUndefined ||
      (node->style.overflow != YGOverflowScroll && measureModeCrossDim == YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]] =
        YGNodeBoundAxis(node,
                        crossAxis,
                        totalLineCrossDim + paddingAndBorderAxisCross,
                        crossAxisParentSize,
                        parentWidth);
  } else if (measureModeCrossDim == YGMeasureModeAtMost &&
             node->style.overflow == YGOverflowScroll) {
    node->layout.measuredDimensions[dim[crossAxis]] =
        fmaxf(fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
                    YGNodeBoundAxisWithinMinAndMax(node,
                                                   crossAxis,
                                                   totalLineCrossDim + paddingAndBorderAxisCross,
                                                   crossAxisParentSize)),
              paddingAndBorderAxisCross);
  }

  // As we only wrapped in normal direction yet, we need to reverse the positions on wrap-reverse.
  if (performLayout && node->style.flexWrap == YGWrapWrapReverse) {
    for (uint32_t i = 0; i < childCount; i++) {
      const YGNodeRef child = YGNodeGetChild(node, i);
      if (child->style.positionType == YGPositionTypeRelative) {
        child->layout.position[pos[crossAxis]] = node->layout.measuredDimensions[dim[crossAxis]] -
                                                 child->layout.position[pos[crossAxis]] -
                                                 child->layout.measuredDimensions[dim[crossAxis]];
      }
    }
  }

  if (performLayout) {
    // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
    for (currentAbsoluteChild = firstAbsoluteChild;
         currentAbsoluteChild != nullptr;
         currentAbsoluteChild = currentAbsoluteChild->nextChild) {
      YGNodeAbsoluteLayoutChild(node,
                                currentAbsoluteChild,
                                availableInnerWidth,
                                isMainAxisRow ? measureModeMainDim : measureModeCrossDim,
                                availableInnerHeight,
                                direction,
                                config);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos =
        mainAxis == YGFlexDirectionRowReverse || mainAxis == YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos =
        crossAxis == YGFlexDirectionRowReverse || crossAxis == YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const YGNodeRef child = node->children[i];
        if (child->style.display == YGDisplayNone) {
          continue;
        }
        if (needsMainTrailingPos) {
          YGNodeSetChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          YGNodeSetChildTrailingPosition(node, child, crossAxis);
        }
      }
    }
  }
}

uint32_t gDepth = 0;
bool gPrintTree = false;
bool gPrintChanges = false;
bool gPrintSkips = false;

static const char *spacer = "                                                            ";

static const char *YGSpacer(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char *YGMeasureModeName(const YGMeasureMode mode, const bool performLayout) {
  const char *kMeasureModeNames[YGMeasureModeCount] = {"UNDEFINED", "EXACTLY", "AT_MOST"};
  const char *kLayoutModeNames[YGMeasureModeCount] = {"LAY_UNDEFINED",
                                                      "LAY_EXACTLY",
                                                      "LAY_AT_"
                                                      "MOST"};

  if (mode >= YGMeasureModeCount) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static inline bool YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(YGMeasureMode sizeMode,
                                                                     float size,
                                                                     float lastComputedSize) {
  return sizeMode == YGMeasureModeExactly && YGFloatsEqual(size, lastComputedSize);
}

static inline bool YGMeasureModeOldSizeIsUnspecifiedAndStillFits(YGMeasureMode sizeMode,
                                                                 float size,
                                                                 YGMeasureMode lastSizeMode,
                                                                 float lastComputedSize) {
  return sizeMode == YGMeasureModeAtMost && lastSizeMode == YGMeasureModeUndefined &&
         (size >= lastComputedSize || YGFloatsEqual(size, lastComputedSize));
}

static inline bool YGMeasureModeNewMeasureSizeIsStricterAndStillValid(YGMeasureMode sizeMode,
                                                                      float size,
                                                                      YGMeasureMode lastSizeMode,
                                                                      float lastSize,
                                                                      float lastComputedSize) {
  return lastSizeMode == YGMeasureModeAtMost && sizeMode == YGMeasureModeAtMost &&
         lastSize > size && (lastComputedSize <= size || YGFloatsEqual(size, lastComputedSize));
}

float YGRoundValueToPixelGrid(const float value,
                              const float pointScaleFactor,
                              const bool forceCeil,
                              const bool forceFloor) {
  float scaledValue = value * pointScaleFactor;
  float fractial = fmodf(scaledValue, 1.0);
  if (YGFloatsEqual(fractial, 0)) {
    // First we check if the value is already rounded
    scaledValue = scaledValue - fractial;
  } else if (YGFloatsEqual(fractial, 1.0)) {
    scaledValue = scaledValue - fractial + 1.0;
  } else if (forceCeil) {
    // Next we check if we need to use forced rounding
    scaledValue = scaledValue - fractial + 1.0f;
  } else if (forceFloor) {
    scaledValue = scaledValue - fractial;
  } else {
    // Finally we just round the value
    scaledValue = scaledValue - fractial +
        (fractial > 0.5f || YGFloatsEqual(fractial, 0.5f) ? 1.0f : 0.0f);
  }
  return scaledValue / pointScaleFactor;
}

bool YGNodeCanUseCachedMeasurement(const YGMeasureMode widthMode,
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
                                   const YGConfigRef config) {
  if (lastComputedHeight < 0 || lastComputedWidth < 0) {
    return false;
  }
  bool useRoundedComparison =
      config != nullptr && config->pointScaleFactor != 0;
  const float effectiveWidth =
      useRoundedComparison ? YGRoundValueToPixelGrid(width, config->pointScaleFactor, false, false)
                           : width;
  const float effectiveHeight =
      useRoundedComparison ? YGRoundValueToPixelGrid(height, config->pointScaleFactor, false, false)
                           : height;
  const float effectiveLastWidth =
      useRoundedComparison
          ? YGRoundValueToPixelGrid(lastWidth, config->pointScaleFactor, false, false)
          : lastWidth;
  const float effectiveLastHeight =
      useRoundedComparison
          ? YGRoundValueToPixelGrid(lastHeight, config->pointScaleFactor, false, false)
          : lastHeight;

  const bool hasSameWidthSpec =
      lastWidthMode == widthMode && YGFloatsEqual(effectiveLastWidth, effectiveWidth);
  const bool hasSameHeightSpec =
      lastHeightMode == heightMode && YGFloatsEqual(effectiveLastHeight, effectiveHeight);

  const bool widthIsCompatible =
      hasSameWidthSpec || YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(widthMode,
                                                                            width - marginRow,
                                                                            lastComputedWidth) ||
      YGMeasureModeOldSizeIsUnspecifiedAndStillFits(widthMode,
                                                    width - marginRow,
                                                    lastWidthMode,
                                                    lastComputedWidth) ||
      YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          widthMode, width - marginRow, lastWidthMode, lastWidth, lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec || YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(heightMode,
                                                                             height - marginColumn,
                                                                             lastComputedHeight) ||
      YGMeasureModeOldSizeIsUnspecifiedAndStillFits(heightMode,
                                                    height - marginColumn,
                                                    lastHeightMode,
                                                    lastComputedHeight) ||
      YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          heightMode, height - marginColumn, lastHeightMode, lastHeight, lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

//
// This is a wrapper around the YGNodelayoutImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as YGNodelayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool YGLayoutNodeInternal(const YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const YGDirection parentDirection,
                          const YGMeasureMode widthMeasureMode,
                          const YGMeasureMode heightMeasureMode,
                          const float parentWidth,
                          const float parentHeight,
                          const bool performLayout,
                          const char *reason,
                          const YGConfigRef config) {
  YGLayout *layout = &node->layout;

  gDepth++;

  const bool needToVisitNode =
      (node->isDirty && layout->generationCount != gCurrentGenerationCount) ||
      layout->lastParentDirection != parentDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.widthMeasureMode = (YGMeasureMode) -1;
    layout->cachedLayout.heightMeasureMode = (YGMeasureMode) -1;
    layout->cachedLayout.computedWidth = -1;
    layout->cachedLayout.computedHeight = -1;
  }

  YGCachedMeasurement* cachedResults = nullptr;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the
  // positions
  // and dimensions for nodes in the subtree. The algorithm assumes that each
  // node
  // gets layed out a maximum of one time per tree layout, but multiple
  // measurements
  // may be required to resolve all of the flex dimensions.
  // We handle nodes with measure functions specially here because they are the
  // most
  // expensive to measure, so it's worth avoiding redundant measurements if at
  // all possible.
  if (node->measure) {
    const float marginAxisRow = YGNodeMarginForAxis(node, YGFlexDirectionRow, parentWidth);
    const float marginAxisColumn = YGNodeMarginForAxis(node, YGFlexDirectionColumn, parentWidth);

    // First, try to use the layout cache.
    if (YGNodeCanUseCachedMeasurement(widthMeasureMode,
                                      availableWidth,
                                      heightMeasureMode,
                                      availableHeight,
                                      layout->cachedLayout.widthMeasureMode,
                                      layout->cachedLayout.availableWidth,
                                      layout->cachedLayout.heightMeasureMode,
                                      layout->cachedLayout.availableHeight,
                                      layout->cachedLayout.computedWidth,
                                      layout->cachedLayout.computedHeight,
                                      marginAxisRow,
                                      marginAxisColumn,
                                      config)) {
      cachedResults = &layout->cachedLayout;
    } else {
      // Try to use the measurement cache.
      for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
        if (YGNodeCanUseCachedMeasurement(widthMeasureMode,
                                          availableWidth,
                                          heightMeasureMode,
                                          availableHeight,
                                          layout->cachedMeasurements[i].widthMeasureMode,
                                          layout->cachedMeasurements[i].availableWidth,
                                          layout->cachedMeasurements[i].heightMeasureMode,
                                          layout->cachedMeasurements[i].availableHeight,
                                          layout->cachedMeasurements[i].computedWidth,
                                          layout->cachedMeasurements[i].computedHeight,
                                          marginAxisRow,
                                          marginAxisColumn,
                                          config)) {
          cachedResults = &layout->cachedMeasurements[i];
          break;
        }
      }
    }
  } else if (performLayout) {
    if (YGFloatsEqual(layout->cachedLayout.availableWidth, availableWidth) &&
        YGFloatsEqual(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (YGFloatsEqual(layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          YGFloatsEqual(layout->cachedMeasurements[i].availableHeight, availableHeight) &&
          layout->cachedMeasurements[i].widthMeasureMode == widthMeasureMode &&
          layout->cachedMeasurements[i].heightMeasureMode == heightMeasureMode) {
        cachedResults = &layout->cachedMeasurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != nullptr) {
    layout->measuredDimensions[YGDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[YGDimensionHeight] = cachedResults->computedHeight;

    if (gPrintChanges && gPrintSkips) {
      YGLog(node, YGLogLevelVerbose, "%s%d.{[skipped] ", YGSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node);
      }
      YGLog(
          node,
          YGLogLevelVerbose,
          "wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
          YGMeasureModeName(widthMeasureMode, performLayout),
          YGMeasureModeName(heightMeasureMode, performLayout),
          availableWidth,
          availableHeight,
          cachedResults->computedWidth,
          cachedResults->computedHeight,
          reason);
    }
  } else {
    if (gPrintChanges) {
      YGLog(
          node,
          YGLogLevelVerbose,
          "%s%d.{%s",
          YGSpacer(gDepth),
          gDepth,
          needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      YGLog(
          node,
          YGLogLevelVerbose,
          "wm: %s, hm: %s, aw: %f ah: %f %s\n",
          YGMeasureModeName(widthMeasureMode, performLayout),
          YGMeasureModeName(heightMeasureMode, performLayout),
          availableWidth,
          availableHeight,
          reason);
    }

    YGNodelayoutImpl(node,
                     availableWidth,
                     availableHeight,
                     parentDirection,
                     widthMeasureMode,
                     heightMeasureMode,
                     parentWidth,
                     parentHeight,
                     performLayout,
                     config);

    if (gPrintChanges) {
      YGLog(
          node,
          YGLogLevelVerbose,
          "%s%d.}%s",
          YGSpacer(gDepth),
          gDepth,
          needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      YGLog(
          node,
          YGLogLevelVerbose,
          "wm: %s, hm: %s, d: (%f, %f) %s\n",
          YGMeasureModeName(widthMeasureMode, performLayout),
          YGMeasureModeName(heightMeasureMode, performLayout),
          layout->measuredDimensions[YGDimensionWidth],
          layout->measuredDimensions[YGDimensionHeight],
          reason);
    }

    layout->lastParentDirection = parentDirection;

    if (cachedResults == nullptr) {
      if (layout->nextCachedMeasurementsIndex == YG_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          YGLog(node, YGLogLevelVerbose, "Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      YGCachedMeasurement *newCacheEntry;
      if (performLayout) {
        // Use the single layout cache entry.
        newCacheEntry = &layout->cachedLayout;
      } else {
        // Allocate a new measurement cache entry.
        newCacheEntry = &layout->cachedMeasurements[layout->nextCachedMeasurementsIndex];
        layout->nextCachedMeasurementsIndex++;
      }

      newCacheEntry->availableWidth = availableWidth;
      newCacheEntry->availableHeight = availableHeight;
      newCacheEntry->widthMeasureMode = widthMeasureMode;
      newCacheEntry->heightMeasureMode = heightMeasureMode;
      newCacheEntry->computedWidth = layout->measuredDimensions[YGDimensionWidth];
      newCacheEntry->computedHeight = layout->measuredDimensions[YGDimensionHeight];
    }
  }

  if (performLayout) {
    node->layout.dimensions[YGDimensionWidth] = node->layout.measuredDimensions[YGDimensionWidth];
    node->layout.dimensions[YGDimensionHeight] = node->layout.measuredDimensions[YGDimensionHeight];
    node->hasNewLayout = true;
    node->isDirty = false;
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == nullptr);
}

void YGConfigSetPointScaleFactor(const YGConfigRef config, const float pixelsInPoint) {
  YGAssertWithConfig(config, pixelsInPoint >= 0.0f, "Scale factor should not be less than zero");

  // We store points for Pixel as we will use it for rounding
  if (pixelsInPoint == 0.0f) {
    // Zero is used to skip rounding
    config->pointScaleFactor = 0.0f;
  } else {
    config->pointScaleFactor = pixelsInPoint;
  }
}

static void YGRoundToPixelGrid(const YGNodeRef node,
                               const float pointScaleFactor,
                               const float absoluteLeft,
                               const float absoluteTop) {
  if (pointScaleFactor == 0.0f) {
    return;
  }

  const float nodeLeft = node->layout.position[YGEdgeLeft];
  const float nodeTop = node->layout.position[YGEdgeTop];

  const float nodeWidth = node->layout.dimensions[YGDimensionWidth];
  const float nodeHeight = node->layout.dimensions[YGDimensionHeight];

  const float absoluteNodeLeft = absoluteLeft + nodeLeft;
  const float absoluteNodeTop = absoluteTop + nodeTop;

  const float absoluteNodeRight = absoluteNodeLeft + nodeWidth;
  const float absoluteNodeBottom = absoluteNodeTop + nodeHeight;

  // If a node has a custom measure function we never want to round down its size as this could
  // lead to unwanted text truncation.
  const bool textRounding = node->nodeType == YGNodeTypeText;

  node->layout.position[YGEdgeLeft] =
      YGRoundValueToPixelGrid(nodeLeft, pointScaleFactor, false, textRounding);
  node->layout.position[YGEdgeTop] =
      YGRoundValueToPixelGrid(nodeTop, pointScaleFactor, false, textRounding);

  // We multiply dimension by scale factor and if the result is close to the whole number, we don't
  // have any fraction
  // To verify if the result is close to whole number we want to check both floor and ceil numbers
  const bool hasFractionalWidth = !YGFloatsEqual(fmodf(nodeWidth * pointScaleFactor, 1.0), 0) &&
                                  !YGFloatsEqual(fmodf(nodeWidth * pointScaleFactor, 1.0), 1.0);
  const bool hasFractionalHeight = !YGFloatsEqual(fmodf(nodeHeight * pointScaleFactor, 1.0), 0) &&
                                   !YGFloatsEqual(fmodf(nodeHeight * pointScaleFactor, 1.0), 1.0);

  node->layout.dimensions[YGDimensionWidth] =
      YGRoundValueToPixelGrid(absoluteNodeRight,
                              pointScaleFactor,
                              (textRounding && hasFractionalWidth),
                              (textRounding && !hasFractionalWidth)) -
      YGRoundValueToPixelGrid(absoluteNodeLeft, pointScaleFactor, false, textRounding);
  node->layout.dimensions[YGDimensionHeight] =
      YGRoundValueToPixelGrid(absoluteNodeBottom,
                              pointScaleFactor,
                              (textRounding && hasFractionalHeight),
                              (textRounding && !hasFractionalHeight)) -
      YGRoundValueToPixelGrid(absoluteNodeTop, pointScaleFactor, false, textRounding);

  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    YGRoundToPixelGrid(YGNodeGetChild(node, i), pointScaleFactor, absoluteNodeLeft, absoluteNodeTop);
  }
}

void YGNodeCalculateLayout(const YGNodeRef node,
                           const float parentWidth,
                           const float parentHeight,
                           const YGDirection parentDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;

  YGResolveDimensions(node);

  float width = YGUndefined;
  YGMeasureMode widthMeasureMode = YGMeasureModeUndefined;
  if (YGNodeIsStyleDimDefined(node, YGFlexDirectionRow, parentWidth)) {
    width = YGResolveValue(node->resolvedDimensions[dim[YGFlexDirectionRow]], parentWidth) +
            YGNodeMarginForAxis(node, YGFlexDirectionRow, parentWidth);
    widthMeasureMode = YGMeasureModeExactly;
  } else if (YGResolveValue(&node->style.maxDimensions[YGDimensionWidth], parentWidth) >= 0.0f) {
    width = YGResolveValue(&node->style.maxDimensions[YGDimensionWidth], parentWidth);
    widthMeasureMode = YGMeasureModeAtMost;
  } else {
    width = parentWidth;
    widthMeasureMode = YGFloatIsUndefined(width) ? YGMeasureModeUndefined : YGMeasureModeExactly;
  }

  float height = YGUndefined;
  YGMeasureMode heightMeasureMode = YGMeasureModeUndefined;
  if (YGNodeIsStyleDimDefined(node, YGFlexDirectionColumn, parentHeight)) {
    height = YGResolveValue(node->resolvedDimensions[dim[YGFlexDirectionColumn]], parentHeight) +
             YGNodeMarginForAxis(node, YGFlexDirectionColumn, parentWidth);
    heightMeasureMode = YGMeasureModeExactly;
  } else if (YGResolveValue(&node->style.maxDimensions[YGDimensionHeight], parentHeight) >= 0.0f) {
    height = YGResolveValue(&node->style.maxDimensions[YGDimensionHeight], parentHeight);
    heightMeasureMode = YGMeasureModeAtMost;
  } else {
    height = parentHeight;
    heightMeasureMode = YGFloatIsUndefined(height) ? YGMeasureModeUndefined : YGMeasureModeExactly;
  }

  if (YGLayoutNodeInternal(node,
                           width,
                           height,
                           parentDirection,
                           widthMeasureMode,
                           heightMeasureMode,
                           parentWidth,
                           parentHeight,
                           true,
                           "initial",
                           node->config)) {
    YGNodeSetPosition(node, node->layout.direction, parentWidth, parentHeight, parentWidth);
    YGRoundToPixelGrid(node, node->config->pointScaleFactor, 0.0f, 0.0f);

    if (gPrintTree) {
      YGNodePrint(
          node,
          (YGPrintOptions)(
              YGPrintOptionsLayout | YGPrintOptionsChildren |
              YGPrintOptionsStyle));
    }
  }
}

void YGConfigSetLogger(const YGConfigRef config, YGLogger logger) {
  if (logger != nullptr) {
    config->logger = logger;
  } else {
#ifdef ANDROID
    config->logger = &YGAndroidLog;
#else
    config->logger = &YGDefaultLog;
#endif
  }
}

static void YGVLog(const YGConfigRef config,
                   const YGNodeRef node,
                   YGLogLevel level,
                   const char *format,
                   va_list args) {
  const YGConfigRef logConfig = config != nullptr ? config : &gYGConfigDefaults;
  logConfig->logger(logConfig, node, level, format, args);

  if (level == YGLogLevelFatal) {
    abort();
  }
}

void YGLogWithConfig(const YGConfigRef config, YGLogLevel level, const char *format, ...) {
  va_list args;
  va_start(args, format);
  YGVLog(config, nullptr, level, format, args);
  va_end(args);
}

void YGLog(const YGNodeRef node, YGLogLevel level, const char *format, ...) {
  va_list args;
  va_start(args, format);
  YGVLog(node == nullptr ? nullptr : node->config, node, level, format, args);
  va_end(args);
}

void YGAssert(const bool condition, const char *message) {
  if (!condition) {
    YGLog(nullptr, YGLogLevelFatal, "%s\n", message);
  }
}

void YGAssertWithNode(const YGNodeRef node, const bool condition, const char *message) {
  if (!condition) {
    YGLog(node, YGLogLevelFatal, "%s\n", message);
  }
}

void YGAssertWithConfig(const YGConfigRef config, const bool condition, const char *message) {
  if (!condition) {
    YGLogWithConfig(config, YGLogLevelFatal, "%s\n", message);
  }
}

void YGConfigSetExperimentalFeatureEnabled(const YGConfigRef config,
                                           const YGExperimentalFeature feature,
                                           const bool enabled) {
  config->experimentalFeatures[feature] = enabled;
}

inline bool YGConfigIsExperimentalFeatureEnabled(const YGConfigRef config,
                                                 const YGExperimentalFeature feature) {
  return config->experimentalFeatures[feature];
}

void YGConfigSetUseWebDefaults(const YGConfigRef config, const bool enabled) {
  config->useWebDefaults = enabled;
}

void YGConfigSetUseLegacyStretchBehaviour(const YGConfigRef config,
                                          const bool useLegacyStretchBehaviour) {
  config->useLegacyStretchBehaviour = useLegacyStretchBehaviour;
}

bool YGConfigGetUseWebDefaults(const YGConfigRef config) {
  return config->useWebDefaults;
}

void YGConfigSetContext(const YGConfigRef config, void *context) {
  config->context = context;
}

void *YGConfigGetContext(const YGConfigRef config) {
  return config->context;
}

void YGConfigSetNodeClonedFunc(const YGConfigRef config, const YGNodeClonedFunc callback) {
  config->cloneNodeCallback = callback;
}
