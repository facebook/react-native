/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#include "Yoga.h"
#include <float.h>
#include <string.h>
#include <algorithm>
#include "Utils.h"
#include "YGNode.h"
#include "YGNodePrint.h"
#include "Yoga-internal.h"
#ifdef _MSC_VER
#include <float.h>

/* define fmaxf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) {
  if (!YGFloatIsUndefined(a) && !YGFloatIsUndefined(b)) {
    return (a > b) ? a : b;
  }
  return YGFloatIsUndefined(a) ? b : a;
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

const YGValue YGValueZero = {0, YGUnitPoint};
const YGValue YGValueUndefined = {YGUndefined, YGUnitUndefined};
const YGValue YGValueAuto = {YGUndefined, YGUnitAuto};

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
  // Value of a float in the case of it being not defined is 10.1E20. Earlier
  // it used to be NAN, the benefit of which was that if NAN is involved in any
  // mathematical expression the result was NAN. But since we want to have
  // `-ffast-math` flag being used by compiler which assumes that the floating
  // point values are not NAN and Inf, we represent YGUndefined as 10.1E20. But
  // now if YGUndefined is involved in any mathematical operations this
  // value(10.1E20) would change. So the following check makes sure that if the
  // value is outside a range (-10E8, 10E8) then it is undefined.
  return value >= 10E8 || value <= -10E8;
}

const YGValue* YGComputedEdgeValue(
    const std::array<YGValue, YGEdgeCount>& edges,
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

void* YGNodeGetContext(YGNodeRef node) {
  return node->getContext();
}

void YGNodeSetContext(YGNodeRef node, void* context) {
  return node->setContext(context);
}

YGMeasureFunc YGNodeGetMeasureFunc(YGNodeRef node) {
  return node->getMeasure();
}

void YGNodeSetMeasureFunc(YGNodeRef node, YGMeasureFunc measureFunc) {
  node->setMeasureFunc(measureFunc);
}

YGBaselineFunc YGNodeGetBaselineFunc(YGNodeRef node) {
  return node->getBaseline();
}

void YGNodeSetBaselineFunc(YGNodeRef node, YGBaselineFunc baselineFunc) {
  node->setBaseLineFunc(baselineFunc);
}

YGDirtiedFunc YGNodeGetDirtiedFunc(YGNodeRef node) {
  return node->getDirtied();
}

void YGNodeSetDirtiedFunc(YGNodeRef node, YGDirtiedFunc dirtiedFunc) {
  node->setDirtiedFunc(dirtiedFunc);
}

YGPrintFunc YGNodeGetPrintFunc(YGNodeRef node) {
  return node->getPrintFunc();
}

void YGNodeSetPrintFunc(YGNodeRef node, YGPrintFunc printFunc) {
  node->setPrintFunc(printFunc);
}

bool YGNodeGetHasNewLayout(YGNodeRef node) {
  return node->getHasNewLayout();
}

void YGNodeSetHasNewLayout(YGNodeRef node, bool hasNewLayout) {
  node->setHasNewLayout(hasNewLayout);
}

YGNodeType YGNodeGetNodeType(YGNodeRef node) {
  return node->getNodeType();
}

void YGNodeSetNodeType(YGNodeRef node, YGNodeType nodeType) {
  return node->setNodeType(nodeType);
}

bool YGNodeIsDirty(YGNodeRef node) {
  return node->isDirty();
}

bool YGNodeLayoutGetDidUseLegacyFlag(const YGNodeRef node) {
  return node->didUseLegacyFlag();
}

void YGNodeMarkDirtyAndPropogateToDescendants(const YGNodeRef node) {
  return node->markDirtyAndPropogateDownwards();
}

int32_t gNodeInstanceCount = 0;
int32_t gConfigInstanceCount = 0;

WIN_EXPORT YGNodeRef YGNodeNewWithConfig(const YGConfigRef config) {
  const YGNodeRef node = new YGNode();
  YGAssertWithConfig(
      config, node != nullptr, "Could not allocate memory for node");
  gNodeInstanceCount++;

  if (config->useWebDefaults) {
    node->setStyleFlexDirection(YGFlexDirectionRow);
    node->setStyleAlignContent(YGAlignStretch);
  }
  node->setConfig(config);
  return node;
}

YGConfigRef YGConfigGetDefault() {
  static YGConfigRef defaultConfig = YGConfigNew();
  return defaultConfig;
}

YGNodeRef YGNodeNew(void) {
  return YGNodeNewWithConfig(YGConfigGetDefault());
}

YGNodeRef YGNodeClone(YGNodeRef oldNode) {
  YGNodeRef node = new YGNode(*oldNode);
  YGAssertWithConfig(
      oldNode->getConfig(),
      node != nullptr,
      "Could not allocate memory for node");
  for (auto &item : oldNode->getChildren()) {
    item->setOwner(nullptr);
  }
  gNodeInstanceCount++;
  node->setOwner(nullptr);
  return node;
}

static YGConfigRef YGConfigClone(const YGConfig& oldConfig) {
  const YGConfigRef config = new YGConfig(oldConfig);
  YGAssert(config != nullptr, "Could not allocate memory for config");
  if (config == nullptr) {
    abort();
  }
  gConfigInstanceCount++;
  return config;
}

static YGNodeRef YGNodeDeepClone(YGNodeRef oldNode) {
  YGNodeRef node = YGNodeClone(oldNode);
  YGVector vec = YGVector();
  vec.reserve(oldNode->getChildren().size());
  YGNodeRef childNode = nullptr;
  for (auto& item : oldNode->getChildren()) {
    childNode = YGNodeDeepClone(item);
    childNode->setOwner(node);
    vec.push_back(childNode);
  }
  node->setChildren(vec);

  if (oldNode->getConfig() != nullptr) {
    node->setConfig(YGConfigClone(*(oldNode->getConfig())));
  }

  if (oldNode->getNextChild() != nullptr) {
    node->setNextChild(YGNodeDeepClone(oldNode->getNextChild()));
  }

  return node;
}

void YGNodeFree(const YGNodeRef node) {
  if (YGNodeRef owner = node->getOwner()) {
    owner->removeChild(node);
    node->setOwner(nullptr);
  }

  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = YGNodeGetChild(node, i);
    child->setOwner(nullptr);
  }

  node->clearChildren();
  delete node;
  gNodeInstanceCount--;
}

static void YGConfigFreeRecursive(const YGNodeRef root) {
  if (root->getConfig() != nullptr) {
    gConfigInstanceCount--;
    delete root->getConfig();
  }
  // Delete configs recursively for childrens
  for (uint32_t i = 0; i < root->getChildrenCount(); ++i) {
    YGConfigFreeRecursive(root->getChild(i));
  }
}

void YGNodeFreeRecursive(const YGNodeRef root) {
  while (YGNodeGetChildCount(root) > 0) {
    const YGNodeRef child = YGNodeGetChild(root, 0);
    if (child->getOwner() != root) {
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
      node->getOwner() == nullptr,
      "Cannot reset a node still attached to a owner");

  node->clearChildren();

  const YGConfigRef config = node->getConfig();
  *node = YGNode();
  if (config->useWebDefaults) {
    node->setStyleFlexDirection(YGFlexDirectionRow);
    node->setStyleAlignContent(YGAlignStretch);
  }
  node->setConfig(config);
}

int32_t YGNodeGetInstanceCount(void) {
  return gNodeInstanceCount;
}

int32_t YGConfigGetInstanceCount(void) {
  return gConfigInstanceCount;
}

YGConfigRef YGConfigNew(void) {
  #ifdef ANDROID
  const YGConfigRef config = new YGConfig(YGAndroidLog);
  #else
  const YGConfigRef config = new YGConfig(YGDefaultLog);
  #endif
  gConfigInstanceCount++;
  return config;
}

void YGConfigFree(const YGConfigRef config) {
  free(config);
  gConfigInstanceCount--;
}

void YGConfigCopy(const YGConfigRef dest, const YGConfigRef src) {
  memcpy(dest, src, sizeof(YGConfig));
}

void YGNodeInsertChild(const YGNodeRef node, const YGNodeRef child, const uint32_t index) {
  YGAssertWithNode(
      node,
      child->getOwner() == nullptr,
      "Child already has a owner, it must be removed first.");

  YGAssertWithNode(
      node,
      node->getMeasure() == nullptr,
      "Cannot add child: Nodes with measure functions cannot have children.");

  node->cloneChildrenIfNeeded();
  node->insertChild(child, index);
  YGNodeRef owner = child->getOwner() ? nullptr : node;
  child->setOwner(owner);
  node->markDirtyAndPropogate();
}

void YGNodeInsertSharedChild(
    const YGNodeRef node,
    const YGNodeRef child,
    const uint32_t index) {
  YGAssertWithNode(
      node,
      node->getMeasure() == nullptr,
      "Cannot add child: Nodes with measure functions cannot have children.");

  node->insertChild(child, index);
  child->setOwner(nullptr);
  node->markDirtyAndPropogate();
}

void YGNodeRemoveChild(const YGNodeRef owner, const YGNodeRef excludedChild) {
  // This algorithm is a forked variant from cloneChildrenIfNeeded in YGNode
  // that excludes a child.
  const uint32_t childCount = YGNodeGetChildCount(owner);

  if (childCount == 0) {
    // This is an empty set. Nothing to remove.
    return;
  }
  const YGNodeRef firstChild = YGNodeGetChild(owner, 0);
  if (firstChild->getOwner() == owner) {
    // If the first child has this node as its owner, we assume that it is already unique.
    // We can now try to delete a child in this list.
    if (owner->removeChild(excludedChild)) {
      excludedChild->setLayout(
          YGNode().getLayout()); // layout is no longer valid
      excludedChild->setOwner(nullptr);
      owner->markDirtyAndPropogate();
    }
    return;
  }
  // Otherwise we have to clone the node list except for the child we're trying to delete.
  // We don't want to simply clone all children, because then the host will need to free
  // the clone of the child that was just deleted.
  const YGCloneNodeFunc cloneNodeCallback =
      owner->getConfig()->cloneNodeCallback;
  uint32_t nextInsertIndex = 0;
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef oldChild = owner->getChild(i);
    if (excludedChild == oldChild) {
      // Ignore the deleted child. Don't reset its layout or owner since it is still valid
      // in the other owner. However, since this owner has now changed, we need to mark it
      // as dirty.
      owner->markDirtyAndPropogate();
      continue;
    }
    YGNodeRef newChild = nullptr;
    if (cloneNodeCallback) {
      newChild = cloneNodeCallback(oldChild, owner, nextInsertIndex);
    }
    if (newChild == nullptr) {
      newChild = YGNodeClone(oldChild);
    }
    owner->replaceChild(newChild, nextInsertIndex);
    newChild->setOwner(owner);

    nextInsertIndex++;
  }
  while (nextInsertIndex < childCount) {
    owner->removeChild(nextInsertIndex);
    nextInsertIndex++;
  }
}

void YGNodeRemoveAllChildren(const YGNodeRef owner) {
  const uint32_t childCount = YGNodeGetChildCount(owner);
  if (childCount == 0) {
    // This is an empty set already. Nothing to do.
    return;
  }
  const YGNodeRef firstChild = YGNodeGetChild(owner, 0);
  if (firstChild->getOwner() == owner) {
    // If the first child has this node as its owner, we assume that this child set is unique.
    for (uint32_t i = 0; i < childCount; i++) {
      const YGNodeRef oldChild = YGNodeGetChild(owner, i);
      oldChild->setLayout(YGNode().getLayout()); // layout is no longer valid
      oldChild->setOwner(nullptr);
    }
    owner->clearChildren();
    owner->markDirtyAndPropogate();
    return;
  }
  // Otherwise, we are not the owner of the child set. We don't have to do anything to clear it.
  owner->setChildren(YGVector());
  owner->markDirtyAndPropogate();
}

static void YGNodeSetChildrenInternal(YGNodeRef const owner, const std::vector<YGNodeRef> &children)
{
  if (!owner) {
    return;
  }
  if (children.size() == 0) {
    if (YGNodeGetChildCount(owner) > 0) {
      for (YGNodeRef const child : owner->getChildren()) {
        child->setLayout(YGLayout());
        child->setOwner(nullptr);
      }
      owner->setChildren(YGVector());
      owner->markDirtyAndPropogate();
    }
  } else {
    if (YGNodeGetChildCount(owner) > 0) {
      for (YGNodeRef const oldChild : owner->getChildren()) {
        // Our new children may have nodes in common with the old children. We don't reset these common nodes.
        if (std::find(children.begin(), children.end(), oldChild) == children.end()) {
          oldChild->setLayout(YGLayout());
          oldChild->setOwner(nullptr);
        }
      }
    }
    owner->setChildren(children);
    for (YGNodeRef child : children) {
      child->setOwner(owner);
    }
    owner->markDirtyAndPropogate();
  }
}

void YGNodeSetChildren(YGNodeRef const owner, const YGNodeRef c[], const uint32_t count) {
  const YGVector children = {c, c + count};
  YGNodeSetChildrenInternal(owner, children);
}

void YGNodeSetChildren(YGNodeRef const owner, const std::vector<YGNodeRef> &children)
{
  YGNodeSetChildrenInternal(owner, children);
}

YGNodeRef YGNodeGetChild(const YGNodeRef node, const uint32_t index) {
  if (index < node->getChildren().size()) {
    return node->getChild(index);
  }
  return nullptr;
}

uint32_t YGNodeGetChildCount(const YGNodeRef node) {
  return static_cast<uint32_t>(node->getChildren().size());
}

YGNodeRef YGNodeGetOwner(const YGNodeRef node) {
  return node->getOwner();
}

YGNodeRef YGNodeGetParent(const YGNodeRef node) {
  return node->getOwner();
}

void YGNodeMarkDirty(const YGNodeRef node) {
  YGAssertWithNode(
      node,
      node->getMeasure() != nullptr,
      "Only leaf nodes with custom measure functions"
      "should manually mark themselves as dirty");

  node->markDirtyAndPropogate();
}

void YGNodeCopyStyle(const YGNodeRef dstNode, const YGNodeRef srcNode) {
  if (!(dstNode->getStyle() == srcNode->getStyle())) {
    dstNode->setStyle(srcNode->getStyle());
    dstNode->markDirtyAndPropogate();
  }
}

float YGNodeStyleGetFlexGrow(const YGNodeRef node) {
  return node->getStyle().flexGrow.isUndefined()
      ? kDefaultFlexGrow
      : node->getStyle().flexGrow.getValue();
}

float YGNodeStyleGetFlexShrink(const YGNodeRef node) {
  return node->getStyle().flexShrink.isUndefined()
      ? (node->getConfig()->useWebDefaults ? kWebDefaultFlexShrink
                                           : kDefaultFlexShrink)
      : node->getStyle().flexShrink.getValue();
}

#define YG_NODE_STYLE_PROPERTY_SETTER_IMPL(                               \
    type, name, paramName, instanceName)                                  \
  void YGNodeStyleSet##name(const YGNodeRef node, const type paramName) { \
    if (node->getStyle().instanceName != paramName) {                     \
      YGStyle style = node->getStyle();                                   \
      style.instanceName = paramName;                                     \
      node->setStyle(style);                                              \
      node->markDirtyAndPropogate();                                      \
    }                                                                     \
  }

#define YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(                          \
    type, name, paramName, instanceName)                                  \
  void YGNodeStyleSet##name(const YGNodeRef node, const type paramName) { \
    YGValue value = {                                                     \
        YGFloatSanitize(paramName),                                       \
        YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPoint,    \
    };                                                                    \
    if ((node->getStyle().instanceName.value != value.value &&            \
         value.unit != YGUnitUndefined) ||                                \
        node->getStyle().instanceName.unit != value.unit) {               \
      YGStyle style = node->getStyle();                                   \
      style.instanceName = value;                                         \
      node->setStyle(style);                                              \
      node->markDirtyAndPropogate();                                      \
    }                                                                     \
  }                                                                       \
                                                                          \
  void YGNodeStyleSet##name##Percent(                                     \
      const YGNodeRef node, const type paramName) {                       \
    YGValue value = {                                                     \
        YGFloatSanitize(paramName),                                       \
        YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPercent,  \
    };                                                                    \
    if ((node->getStyle().instanceName.value != value.value &&            \
         value.unit != YGUnitUndefined) ||                                \
        node->getStyle().instanceName.unit != value.unit) {               \
      YGStyle style = node->getStyle();                                   \
                                                                          \
      style.instanceName = value;                                         \
      node->setStyle(style);                                              \
      node->markDirtyAndPropogate();                                      \
    }                                                                     \
  }

#define YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(                        \
    type, name, paramName, instanceName)                                     \
  void YGNodeStyleSet##name(const YGNodeRef node, const type paramName) {    \
    YGValue value = {                                                        \
        YGFloatSanitize(paramName),                                          \
        YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPoint,       \
    };                                                                       \
    if ((node->getStyle().instanceName.value != value.value &&               \
         value.unit != YGUnitUndefined) ||                                   \
        node->getStyle().instanceName.unit != value.unit) {                  \
      YGStyle style = node->getStyle();                                      \
      style.instanceName = value;                                            \
      node->setStyle(style);                                                 \
      node->markDirtyAndPropogate();                                         \
    }                                                                        \
  }                                                                          \
                                                                             \
  void YGNodeStyleSet##name##Percent(                                        \
      const YGNodeRef node, const type paramName) {                          \
    if (node->getStyle().instanceName.value != YGFloatSanitize(paramName) || \
        node->getStyle().instanceName.unit != YGUnitPercent) {               \
      YGStyle style = node->getStyle();                                      \
      style.instanceName.value = YGFloatSanitize(paramName);                 \
      style.instanceName.unit =                                              \
          YGFloatIsUndefined(paramName) ? YGUnitAuto : YGUnitPercent;        \
      node->setStyle(style);                                                 \
      node->markDirtyAndPropogate();                                         \
    }                                                                        \
  }                                                                          \
                                                                             \
  void YGNodeStyleSet##name##Auto(const YGNodeRef node) {                    \
    if (node->getStyle().instanceName.unit != YGUnitAuto) {                  \
      YGStyle style = node->getStyle();                                      \
      style.instanceName.value = 0;                                          \
      style.instanceName.unit = YGUnitAuto;                                  \
      node->setStyle(style);                                                 \
      node->markDirtyAndPropogate();                                         \
    }                                                                        \
  }

#define YG_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName)  \
  YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
                                                                          \
  type YGNodeStyleGet##name(const YGNodeRef node) {                       \
    return node->getStyle().instanceName;                                 \
  }

#define YG_NODE_STYLE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName) \
  YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(                                    \
      float, name, paramName, instanceName)                                   \
                                                                              \
  type YGNodeStyleGet##name(const YGNodeRef node) {                           \
    YGValue value = node->getStyle().instanceName;                            \
    if (value.unit == YGUnitUndefined || value.unit == YGUnitAuto) {          \
      value.value = YGUndefined;                                              \
    }                                                                         \
    return value;                                                             \
  }

#define YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(                       \
    type, name, paramName, instanceName)                             \
  YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(                      \
      float, name, paramName, instanceName)                          \
                                                                     \
  type YGNodeStyleGet##name(const YGNodeRef node) {                  \
    YGValue value = node->getStyle().instanceName;                   \
    if (value.unit == YGUnitUndefined || value.unit == YGUnitAuto) { \
      value.value = YGUndefined;                                     \
    }                                                                \
    return value;                                                    \
  }

#define YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(type, name, instanceName) \
  void YGNodeStyleSet##name##Auto(const YGNodeRef node, const YGEdge edge) { \
    if (node->getStyle().instanceName[edge].unit != YGUnitAuto) {            \
      YGStyle style = node->getStyle();                                      \
      style.instanceName[edge].value = 0;                                    \
      style.instanceName[edge].unit = YGUnitAuto;                            \
      node->setStyle(style);                                                 \
      node->markDirtyAndPropogate();                                         \
    }                                                                        \
  }

#define YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(                           \
    type, name, paramName, instanceName)                                 \
  void YGNodeStyleSet##name(                                             \
      const YGNodeRef node, const YGEdge edge, const float paramName) {  \
    YGValue value = {                                                    \
        YGFloatSanitize(paramName),                                      \
        YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPoint,   \
    };                                                                   \
    if ((node->getStyle().instanceName[edge].value != value.value &&     \
         value.unit != YGUnitUndefined) ||                               \
        node->getStyle().instanceName[edge].unit != value.unit) {        \
      YGStyle style = node->getStyle();                                  \
      style.instanceName[edge] = value;                                  \
      node->setStyle(style);                                             \
      node->markDirtyAndPropogate();                                     \
    }                                                                    \
  }                                                                      \
                                                                         \
  void YGNodeStyleSet##name##Percent(                                    \
      const YGNodeRef node, const YGEdge edge, const float paramName) {  \
    YGValue value = {                                                    \
        YGFloatSanitize(paramName),                                      \
        YGFloatIsUndefined(paramName) ? YGUnitUndefined : YGUnitPercent, \
    };                                                                   \
    if ((node->getStyle().instanceName[edge].value != value.value &&     \
         value.unit != YGUnitUndefined) ||                               \
        node->getStyle().instanceName[edge].unit != value.unit) {        \
      YGStyle style = node->getStyle();                                  \
      style.instanceName[edge] = value;                                  \
      node->setStyle(style);                                             \
      node->markDirtyAndPropogate();                                     \
    }                                                                    \
  }                                                                      \
                                                                         \
  WIN_STRUCT(type)                                                       \
  YGNodeStyleGet##name(const YGNodeRef node, const YGEdge edge) {        \
    YGValue value = node->getStyle().instanceName[edge];                 \
    if (value.unit == YGUnitUndefined || value.unit == YGUnitAuto) {     \
      value.value = YGUndefined;                                         \
    }                                                                    \
    return WIN_STRUCT_REF(value);                                        \
  }

#define YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type YGNodeLayoutGet##name(const YGNodeRef node) {           \
    return node->getLayout().instanceName;                     \
  }

#define YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName) \
  type YGNodeLayoutGet##name(const YGNodeRef node, const YGEdge edge) { \
    YGAssertWithNode(                                                   \
        node,                                                           \
        edge <= YGEdgeEnd,                                              \
        "Cannot get layout properties of multi-edge shorthands");       \
                                                                        \
    if (edge == YGEdgeLeft) {                                           \
      if (node->getLayout().direction == YGDirectionRTL) {              \
        return node->getLayout().instanceName[YGEdgeEnd];               \
      } else {                                                          \
        return node->getLayout().instanceName[YGEdgeStart];             \
      }                                                                 \
    }                                                                   \
                                                                        \
    if (edge == YGEdgeRight) {                                          \
      if (node->getLayout().direction == YGDirectionRTL) {              \
        return node->getLayout().instanceName[YGEdgeStart];             \
      } else {                                                          \
        return node->getLayout().instanceName[YGEdgeEnd];               \
      }                                                                 \
    }                                                                   \
                                                                        \
    return node->getLayout().instanceName[edge];                        \
  }

// YG_NODE_PROPERTY_IMPL(void *, Context, context, context);
// YG_NODE_PROPERTY_IMPL(YGPrintFunc, PrintFunc, printFunc, print);
// YG_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);
// YG_NODE_PROPERTY_IMPL(YGNodeType, NodeType, nodeType, nodeType);

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

// TODO(T26792433): Change the API to accept YGFloatOptional.
void YGNodeStyleSetFlex(const YGNodeRef node, const float flex) {
  if (node->getStyle().flex != flex) {
    YGStyle style = node->getStyle();
    if (YGFloatIsUndefined(flex)) {
      style.flex = YGFloatOptional();
    } else {
      style.flex = YGFloatOptional(flex);
    }
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

// TODO(T26792433): Change the API to accept YGFloatOptional.
float YGNodeStyleGetFlex(const YGNodeRef node) {
  return node->getStyle().flex.isUndefined() ? YGUndefined
                                             : node->getStyle().flex.getValue();
}

// TODO(T26792433): Change the API to accept YGFloatOptional.
void YGNodeStyleSetFlexGrow(const YGNodeRef node, const float flexGrow) {
  if (node->getStyle().flexGrow != flexGrow) {
    YGStyle style = node->getStyle();
    if (YGFloatIsUndefined(flexGrow)) {
      style.flexGrow = YGFloatOptional();
    } else {
      style.flexGrow = YGFloatOptional(flexGrow);
    }
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

// TODO(T26792433): Change the API to accept YGFloatOptional.
void YGNodeStyleSetFlexShrink(const YGNodeRef node, const float flexShrink) {
  if (node->getStyle().flexShrink != flexShrink) {
    YGStyle style = node->getStyle();
    if (YGFloatIsUndefined(flexShrink)) {
      style.flexShrink = YGFloatOptional();
    } else {
      style.flexShrink = YGFloatOptional(flexShrink);
    }
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

YGValue YGNodeStyleGetFlexBasis(const YGNodeRef node) {
  YGValue flexBasis = node->getStyle().flexBasis;
  if (flexBasis.unit == YGUnitUndefined || flexBasis.unit == YGUnitAuto) {
    // TODO(T26792433): Get rid off the use of YGUndefined at client side
    flexBasis.value = YGUndefined;
  }
  return flexBasis;
}

void YGNodeStyleSetFlexBasis(const YGNodeRef node, const float flexBasis) {
  YGValue value = {
      YGFloatSanitize(flexBasis),
      YGFloatIsUndefined(flexBasis) ? YGUnitUndefined : YGUnitPoint,
  };
  if ((node->getStyle().flexBasis.value != value.value &&
       value.unit != YGUnitUndefined) ||
      node->getStyle().flexBasis.unit != value.unit) {
    YGStyle style = node->getStyle();
    style.flexBasis = value;
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

void YGNodeStyleSetFlexBasisPercent(
    const YGNodeRef node,
    const float flexBasisPercent) {
  if (node->getStyle().flexBasis.value != flexBasisPercent ||
      node->getStyle().flexBasis.unit != YGUnitPercent) {
    YGStyle style = node->getStyle();
    style.flexBasis.value = YGFloatSanitize(flexBasisPercent);
    style.flexBasis.unit =
        YGFloatIsUndefined(flexBasisPercent) ? YGUnitAuto : YGUnitPercent;
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

void YGNodeStyleSetFlexBasisAuto(const YGNodeRef node) {
  if (node->getStyle().flexBasis.unit != YGUnitAuto) {
    YGStyle style = node->getStyle();
    style.flexBasis.value = 0;
    style.flexBasis.unit = YGUnitAuto;
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(YGValue, Position, position, position);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(YGValue, Margin, margin, margin);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(YGValue, Margin, margin);
YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(YGValue, Padding, padding, padding);

// TODO(T26792433): Change the API to accept YGFloatOptional.
void YGNodeStyleSetBorder(
    const YGNodeRef node,
    const YGEdge edge,
    const float border) {
  YGValue value = {
      YGFloatSanitize(border),
      YGFloatIsUndefined(border) ? YGUnitUndefined : YGUnitPoint,
  };
  if ((node->getStyle().border[edge].value != value.value &&
       value.unit != YGUnitUndefined) ||
      node->getStyle().border[edge].unit != value.unit) {
    YGStyle style = node->getStyle();
    style.border[edge] = value;
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

float YGNodeStyleGetBorder(const YGNodeRef node, const YGEdge edge) {
  if (node->getStyle().border[edge].unit == YGUnitUndefined ||
      node->getStyle().border[edge].unit == YGUnitAuto) {
    // TODO(T26792433): Rather than returning YGUndefined, change the api to
    // return YGFloatOptional.
    return YGUndefined;
  }

  return node->getStyle().border[edge].value;
}

// Yoga specific properties, not compatible with flexbox specification

// TODO(T26792433): Change the API to accept YGFloatOptional.
float YGNodeStyleGetAspectRatio(const YGNodeRef node) {
  const YGFloatOptional op = node->getStyle().aspectRatio;
  return op.isUndefined() ? YGUndefined : op.getValue();
}

// TODO(T26792433): Change the API to accept YGFloatOptional.
void YGNodeStyleSetAspectRatio(const YGNodeRef node, const float aspectRatio) {
  if (node->getStyle().aspectRatio != aspectRatio) {
    YGStyle style = node->getStyle();
    style.aspectRatio = YGFloatOptional(aspectRatio);
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(YGValue, Width, width, dimensions[YGDimensionWidth]);
YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(YGValue, Height, height, dimensions[YGDimensionHeight]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MinWidth, minWidth, minDimensions[YGDimensionWidth]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MinHeight, minHeight, minDimensions[YGDimensionHeight]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MaxWidth, maxWidth, maxDimensions[YGDimensionWidth]);
YG_NODE_STYLE_PROPERTY_UNIT_IMPL(YGValue, MaxHeight, maxHeight, maxDimensions[YGDimensionHeight]);
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

bool YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(const YGNodeRef node) {
  return node->getLayout().doesLegacyStretchFlagAffectsLayout;
}

uint32_t gCurrentGenerationCount = 0;

bool YGLayoutNodeInternal(const YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const YGDirection ownerDirection,
                          const YGMeasureMode widthMeasureMode,
                          const YGMeasureMode heightMeasureMode,
                          const float ownerWidth,
                          const float ownerHeight,
                          const bool performLayout,
                          const char *reason,
                          const YGConfigRef config);

static void YGNodePrintInternal(const YGNodeRef node,
                                const YGPrintOptions options) {
  std::string str;
  facebook::yoga::YGNodeToString(&str, node, options, 0);
  YGLog(node, YGLogLevelDebug, str.c_str());
}

void YGNodePrint(const YGNodeRef node, const YGPrintOptions options) {
  YGNodePrintInternal(node, options);
}

const std::array<YGEdge, 4> leading = {
    {YGEdgeTop, YGEdgeBottom, YGEdgeLeft, YGEdgeRight}};

const std::array<YGEdge, 4> trailing = {
    {YGEdgeBottom, YGEdgeTop, YGEdgeRight, YGEdgeLeft}};
static const std::array<YGEdge, 4> pos = {{
    YGEdgeTop,
    YGEdgeBottom,
    YGEdgeLeft,
    YGEdgeRight,
}};

static const std::array<YGDimension, 4> dim = {
    {YGDimensionHeight, YGDimensionHeight, YGDimensionWidth, YGDimensionWidth}};

static inline float YGNodePaddingAndBorderForAxis(const YGNodeRef node,
                                                  const YGFlexDirection axis,
                                                  const float widthSize) {
  return YGUnwrapFloatOptional(
      node->getLeadingPaddingAndBorder(axis, widthSize) +
      node->getTrailingPaddingAndBorder(axis, widthSize));
}

static inline YGAlign YGNodeAlignItem(const YGNodeRef node, const YGNodeRef child) {
  const YGAlign align = child->getStyle().alignSelf == YGAlignAuto
      ? node->getStyle().alignItems
      : child->getStyle().alignSelf;
  if (align == YGAlignBaseline &&
      YGFlexDirectionIsColumn(node->getStyle().flexDirection)) {
    return YGAlignFlexStart;
  }
  return align;
}

static float YGBaseline(const YGNodeRef node) {
  if (node->getBaseline() != nullptr) {
    const float baseline = node->getBaseline()(
        node,
        node->getLayout().measuredDimensions[YGDimensionWidth],
        node->getLayout().measuredDimensions[YGDimensionHeight]);
    YGAssertWithNode(node,
                     !YGFloatIsUndefined(baseline),
                     "Expect custom baseline function to not return NaN");
    return baseline;
  }

  YGNodeRef baselineChild = nullptr;
  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = YGNodeGetChild(node, i);
    if (child->getLineIndex() > 0) {
      break;
    }
    if (child->getStyle().positionType == YGPositionTypeAbsolute) {
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
    return node->getLayout().measuredDimensions[YGDimensionHeight];
  }

  const float baseline = YGBaseline(baselineChild);
  return baseline + baselineChild->getLayout().position[YGEdgeTop];
}

static bool YGIsBaselineLayout(const YGNodeRef node) {
  if (YGFlexDirectionIsColumn(node->getStyle().flexDirection)) {
    return false;
  }
  if (node->getStyle().alignItems == YGAlignBaseline) {
    return true;
  }
  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = YGNodeGetChild(node, i);
    if (child->getStyle().positionType == YGPositionTypeRelative &&
        child->getStyle().alignSelf == YGAlignBaseline) {
      return true;
    }
  }

  return false;
}

static inline float YGNodeDimWithMargin(const YGNodeRef node,
                                        const YGFlexDirection axis,
                                        const float widthSize) {
  return node->getLayout().measuredDimensions[dim[axis]] +
      YGUnwrapFloatOptional(
             node->getLeadingMargin(axis, widthSize) +
             node->getTrailingMargin(axis, widthSize));
}

static inline bool YGNodeIsStyleDimDefined(const YGNodeRef node,
                                           const YGFlexDirection axis,
                                           const float ownerSize) {
  bool isUndefined =
      YGFloatIsUndefined(node->getResolvedDimension(dim[axis]).value);
  return !(
      node->getResolvedDimension(dim[axis]).unit == YGUnitAuto ||
      node->getResolvedDimension(dim[axis]).unit == YGUnitUndefined ||
      (node->getResolvedDimension(dim[axis]).unit == YGUnitPoint &&
       !isUndefined && node->getResolvedDimension(dim[axis]).value < 0.0f) ||
      (node->getResolvedDimension(dim[axis]).unit == YGUnitPercent &&
       !isUndefined &&
       (node->getResolvedDimension(dim[axis]).value < 0.0f ||
        YGFloatIsUndefined(ownerSize))));
}

static inline bool YGNodeIsLayoutDimDefined(const YGNodeRef node, const YGFlexDirection axis) {
  const float value = node->getLayout().measuredDimensions[dim[axis]];
  return !YGFloatIsUndefined(value) && value >= 0.0f;
}

static YGFloatOptional YGNodeBoundAxisWithinMinAndMax(
    const YGNodeRef node,
    const YGFlexDirection& axis,
    const float& value,
    const float& axisSize) {
  YGFloatOptional min;
  YGFloatOptional max;

  if (YGFlexDirectionIsColumn(axis)) {
    min = YGResolveValue(
        node->getStyle().minDimensions[YGDimensionHeight], axisSize);
    max = YGResolveValue(
        node->getStyle().maxDimensions[YGDimensionHeight], axisSize);
  } else if (YGFlexDirectionIsRow(axis)) {
    min = YGResolveValue(
        node->getStyle().minDimensions[YGDimensionWidth], axisSize);
    max = YGResolveValue(
        node->getStyle().maxDimensions[YGDimensionWidth], axisSize);
  }

  if (!max.isUndefined() && max.getValue() >= 0 && value > max.getValue()) {
    return max;
  }

  if (!min.isUndefined() && min.getValue() >= 0 && value < min.getValue()) {
    return min;
  }

  return YGFloatOptional(value);
}

// Like YGNodeBoundAxisWithinMinAndMax but also ensures that the value doesn't go
// below the
// padding and border amount.
static inline float YGNodeBoundAxis(const YGNodeRef node,
                                    const YGFlexDirection axis,
                                    const float value,
                                    const float axisSize,
                                    const float widthSize) {
  return YGFloatMax(
      YGUnwrapFloatOptional(
          YGNodeBoundAxisWithinMinAndMax(node, axis, value, axisSize)),
      YGNodePaddingAndBorderForAxis(node, axis, widthSize));
}

static void YGNodeSetChildTrailingPosition(const YGNodeRef node,
                                           const YGNodeRef child,
                                           const YGFlexDirection axis) {
  const float size = child->getLayout().measuredDimensions[dim[axis]];
  child->setLayoutPosition(
      node->getLayout().measuredDimensions[dim[axis]] - size -
          child->getLayout().position[pos[axis]],
      trailing[axis]);
}

static void YGConstrainMaxSizeForMode(const YGNodeRef node,
                                      const enum YGFlexDirection axis,
                                      const float ownerAxisSize,
                                      const float ownerWidth,
                                      YGMeasureMode *mode,
                                      float *size) {
  const YGFloatOptional maxSize =
      YGResolveValue(
          node->getStyle().maxDimensions[dim[axis]], ownerAxisSize) +
      YGFloatOptional(node->getMarginForAxis(axis, ownerWidth));
  switch (*mode) {
    case YGMeasureModeExactly:
    case YGMeasureModeAtMost:
      *size = (maxSize.isUndefined() || *size < maxSize.getValue())
          ? *size
          : maxSize.getValue();
      break;
    case YGMeasureModeUndefined:
      if (!maxSize.isUndefined()) {
        *mode = YGMeasureModeAtMost;
        *size = maxSize.getValue();
      }
      break;
  }
}

static void YGNodeComputeFlexBasisForChild(const YGNodeRef node,
                                           const YGNodeRef child,
                                           const float width,
                                           const YGMeasureMode widthMode,
                                           const float height,
                                           const float ownerWidth,
                                           const float ownerHeight,
                                           const YGMeasureMode heightMode,
                                           const YGDirection direction,
                                           const YGConfigRef config) {
  const YGFlexDirection mainAxis =
      YGResolveFlexDirection(node->getStyle().flexDirection, direction);
  const bool isMainAxisRow = YGFlexDirectionIsRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;

  float childWidth;
  float childHeight;
  YGMeasureMode childWidthMeasureMode;
  YGMeasureMode childHeightMeasureMode;

  const YGFloatOptional resolvedFlexBasis =
      YGResolveValue(child->resolveFlexBasisPtr(), mainAxisownerSize);
  const bool isRowStyleDimDefined = YGNodeIsStyleDimDefined(child, YGFlexDirectionRow, ownerWidth);
  const bool isColumnStyleDimDefined =
      YGNodeIsStyleDimDefined(child, YGFlexDirectionColumn, ownerHeight);

  if (!resolvedFlexBasis.isUndefined() && !YGFloatIsUndefined(mainAxisSize)) {
    if (child->getLayout().computedFlexBasis.isUndefined() ||
        (YGConfigIsExperimentalFeatureEnabled(
             child->getConfig(), YGExperimentalFeatureWebFlexBasis) &&
         child->getLayout().computedFlexBasisGeneration !=
             gCurrentGenerationCount)) {
      const YGFloatOptional& paddingAndBorder = YGFloatOptional(
          YGNodePaddingAndBorderForAxis(child, mainAxis, ownerWidth));
      child->setLayoutComputedFlexBasis(
          YGFloatOptionalMax(resolvedFlexBasis, paddingAndBorder));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    const YGFloatOptional& paddingAndBorder = YGFloatOptional(
        YGNodePaddingAndBorderForAxis(child, YGFlexDirectionRow, ownerWidth));

    child->setLayoutComputedFlexBasis(YGFloatOptionalMax(
        YGResolveValue(
            child->getResolvedDimension(YGDimensionWidth), ownerWidth),
        paddingAndBorder));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    const YGFloatOptional& paddingAndBorder =
        YGFloatOptional(YGNodePaddingAndBorderForAxis(
            child, YGFlexDirectionColumn, ownerWidth));
    child->setLayoutComputedFlexBasis(YGFloatOptionalMax(
        YGResolveValue(
            child->getResolvedDimension(YGDimensionHeight), ownerHeight),
        paddingAndBorder));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped
    // flex basis).
    childWidth = YGUndefined;
    childHeight = YGUndefined;
    childWidthMeasureMode = YGMeasureModeUndefined;
    childHeightMeasureMode = YGMeasureModeUndefined;

    const float& marginRow = YGUnwrapFloatOptional(
        child->getMarginForAxis(YGFlexDirectionRow, ownerWidth));
    const float& marginColumn = YGUnwrapFloatOptional(
        child->getMarginForAxis(YGFlexDirectionColumn, ownerWidth));

    if (isRowStyleDimDefined) {
      childWidth =
          YGUnwrapFloatOptional(YGResolveValue(
              child->getResolvedDimension(YGDimensionWidth), ownerWidth)) +
          marginRow;
      childWidthMeasureMode = YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          YGUnwrapFloatOptional(YGResolveValue(
              child->getResolvedDimension(YGDimensionHeight), ownerHeight)) +
          marginColumn;
      childHeightMeasureMode = YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property,
    // but all major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->getStyle().overflow == YGOverflowScroll) ||
        node->getStyle().overflow != YGOverflowScroll) {
      if (YGFloatIsUndefined(childWidth) && !YGFloatIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->getStyle().overflow == YGOverflowScroll) ||
        node->getStyle().overflow != YGOverflowScroll) {
      if (YGFloatIsUndefined(childHeight) && !YGFloatIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = YGMeasureModeAtMost;
      }
    }

    if (!child->getStyle().aspectRatio.isUndefined()) {
      if (!isMainAxisRow && childWidthMeasureMode == YGMeasureModeExactly) {
        childHeight = marginColumn +
            (childWidth - marginRow) / child->getStyle().aspectRatio.getValue();
        childHeightMeasureMode = YGMeasureModeExactly;
      } else if (isMainAxisRow && childHeightMeasureMode == YGMeasureModeExactly) {
        childWidth = marginRow +
            (childHeight - marginColumn) *
                child->getStyle().aspectRatio.getValue();
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
      if (!child->getStyle().aspectRatio.isUndefined()) {
        childHeight =
            (childWidth - marginRow) / child->getStyle().aspectRatio.getValue();
        childHeightMeasureMode = YGMeasureModeExactly;
      }
    }

    const bool hasExactHeight = !YGFloatIsUndefined(height) && heightMode == YGMeasureModeExactly;
    const bool childHeightStretch = YGNodeAlignItem(node, child) == YGAlignStretch &&
                                    childHeightMeasureMode != YGMeasureModeExactly;
    if (isMainAxisRow && !isColumnStyleDimDefined && hasExactHeight && childHeightStretch) {
      childHeight = height;
      childHeightMeasureMode = YGMeasureModeExactly;

      if (!child->getStyle().aspectRatio.isUndefined()) {
        childWidth = (childHeight - marginColumn) *
            child->getStyle().aspectRatio.getValue();
        childWidthMeasureMode = YGMeasureModeExactly;
      }
    }

    YGConstrainMaxSizeForMode(
        child, YGFlexDirectionRow, ownerWidth, ownerWidth, &childWidthMeasureMode, &childWidth);
    YGConstrainMaxSizeForMode(child,
                              YGFlexDirectionColumn,
                              ownerHeight,
                              ownerWidth,
                              &childHeightMeasureMode,
                              &childHeight);

    // Measure the child
    YGLayoutNodeInternal(child,
                         childWidth,
                         childHeight,
                         direction,
                         childWidthMeasureMode,
                         childHeightMeasureMode,
                         ownerWidth,
                         ownerHeight,
                         false,
                         "measure",
                         config);

    child->setLayoutComputedFlexBasis(YGFloatOptional(YGFloatMax(
        child->getLayout().measuredDimensions[dim[mainAxis]],
        YGNodePaddingAndBorderForAxis(child, mainAxis, ownerWidth))));
  }
  child->setLayoutComputedFlexBasisGeneration(gCurrentGenerationCount);
}

static void YGNodeAbsoluteLayoutChild(const YGNodeRef node,
                                      const YGNodeRef child,
                                      const float width,
                                      const YGMeasureMode widthMode,
                                      const float height,
                                      const YGDirection direction,
                                      const YGConfigRef config) {
  const YGFlexDirection mainAxis =
      YGResolveFlexDirection(node->getStyle().flexDirection, direction);
  const YGFlexDirection crossAxis = YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = YGFlexDirectionIsRow(mainAxis);

  float childWidth = YGUndefined;
  float childHeight = YGUndefined;
  YGMeasureMode childWidthMeasureMode = YGMeasureModeUndefined;
  YGMeasureMode childHeightMeasureMode = YGMeasureModeUndefined;

  const float& marginRow =
      YGUnwrapFloatOptional(child->getMarginForAxis(YGFlexDirectionRow, width));
  const float& marginColumn = YGUnwrapFloatOptional(
      child->getMarginForAxis(YGFlexDirectionColumn, width));

  if (YGNodeIsStyleDimDefined(child, YGFlexDirectionRow, width)) {
    childWidth =
        YGUnwrapFloatOptional(YGResolveValue(child->getResolvedDimension(YGDimensionWidth), width)) +
        marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based
    // on the left/right
    // offsets if they're defined.
    if (child->isLeadingPositionDefined(YGFlexDirectionRow) &&
        child->isTrailingPosDefined(YGFlexDirectionRow)) {
      childWidth = node->getLayout().measuredDimensions[YGDimensionWidth] -
          (node->getLeadingBorder(YGFlexDirectionRow) +
           node->getTrailingBorder(YGFlexDirectionRow)) -
          YGUnwrapFloatOptional(
                       child->getLeadingPosition(YGFlexDirectionRow, width) +
                       child->getTrailingPosition(YGFlexDirectionRow, width));
      childWidth = YGNodeBoundAxis(child, YGFlexDirectionRow, childWidth, width, width);
    }
  }

  if (YGNodeIsStyleDimDefined(child, YGFlexDirectionColumn, height)) {
    childHeight =
        YGUnwrapFloatOptional(YGResolveValue(child->getResolvedDimension(YGDimensionHeight), height)) +
        marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height
    // based on the top/bottom
    // offsets if they're defined.
    if (child->isLeadingPositionDefined(YGFlexDirectionColumn) &&
        child->isTrailingPosDefined(YGFlexDirectionColumn)) {
      childHeight =
          node->getLayout().measuredDimensions[YGDimensionHeight] -
          (node->getLeadingBorder(YGFlexDirectionColumn) +
           node->getTrailingBorder(YGFlexDirectionColumn)) -
          YGUnwrapFloatOptional(
              child->getLeadingPosition(YGFlexDirectionColumn, height) +
              child->getTrailingPosition(YGFlexDirectionColumn, height));
      childHeight = YGNodeBoundAxis(child, YGFlexDirectionColumn, childHeight, height, width);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect ratio
  // calculation. One dimension being the anchor and the other being flexible.
  if (YGFloatIsUndefined(childWidth) ^ YGFloatIsUndefined(childHeight)) {
    if (!child->getStyle().aspectRatio.isUndefined()) {
      if (YGFloatIsUndefined(childWidth)) {
        childWidth = marginRow +
            (childHeight - marginColumn) *
                child->getStyle().aspectRatio.getValue();
      } else if (YGFloatIsUndefined(childHeight)) {
        childHeight = marginColumn +
            (childWidth - marginRow) / child->getStyle().aspectRatio.getValue();
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (YGFloatIsUndefined(childWidth) || YGFloatIsUndefined(childHeight)) {
    childWidthMeasureMode =
        YGFloatIsUndefined(childWidth) ? YGMeasureModeUndefined : YGMeasureModeExactly;
    childHeightMeasureMode =
        YGFloatIsUndefined(childHeight) ? YGMeasureModeUndefined : YGMeasureModeExactly;

    // If the size of the owner is defined then try to constrain the absolute child to that size
    // as well. This allows text within the absolute child to wrap to the size of its owner.
    // This is the same behavior as many browsers implement.
    if (!isMainAxisRow && YGFloatIsUndefined(childWidth) &&
        widthMode != YGMeasureModeUndefined && !YGFloatIsUndefined(width) &&
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
    childWidth = child->getLayout().measuredDimensions[YGDimensionWidth] +
        YGUnwrapFloatOptional(
                     child->getMarginForAxis(YGFlexDirectionRow, width));
    childHeight = child->getLayout().measuredDimensions[YGDimensionHeight] +
        YGUnwrapFloatOptional(
                      child->getMarginForAxis(YGFlexDirectionColumn, width));
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

  if (child->isTrailingPosDefined(mainAxis) &&
      !child->isLeadingPositionDefined(mainAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimensions[dim[mainAxis]] -
            child->getLayout().measuredDimensions[dim[mainAxis]] -
            node->getTrailingBorder(mainAxis) -
            YGUnwrapFloatOptional(child->getTrailingMargin(mainAxis, width)) -
            YGUnwrapFloatOptional(child->getTrailingPosition(
                mainAxis, isMainAxisRow ? width : height)),
        leading[mainAxis]);
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent == YGJustifyCenter) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[mainAxis]] -
         child->getLayout().measuredDimensions[dim[mainAxis]]) /
            2.0f,
        leading[mainAxis]);
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent == YGJustifyFlexEnd) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[mainAxis]] -
         child->getLayout().measuredDimensions[dim[mainAxis]]),
        leading[mainAxis]);
  }

  if (child->isTrailingPosDefined(crossAxis) &&
      !child->isLeadingPositionDefined(crossAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimensions[dim[crossAxis]] -
            child->getLayout().measuredDimensions[dim[crossAxis]] -
            node->getTrailingBorder(crossAxis) -
            YGUnwrapFloatOptional(child->getTrailingMargin(crossAxis, width)) -
            YGUnwrapFloatOptional(child->getTrailingPosition(
                crossAxis, isMainAxisRow ? height : width)),
        leading[crossAxis]);

  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      YGNodeAlignItem(node, child) == YGAlignCenter) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[crossAxis]] -
         child->getLayout().measuredDimensions[dim[crossAxis]]) /
            2.0f,
        leading[crossAxis]);
  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      ((YGNodeAlignItem(node, child) == YGAlignFlexEnd) ^
       (node->getStyle().flexWrap == YGWrapWrapReverse))) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[crossAxis]] -
         child->getLayout().measuredDimensions[dim[crossAxis]]),
        leading[crossAxis]);
  }
}

static void YGNodeWithMeasureFuncSetMeasuredDimensions(const YGNodeRef node,
                                                       const float availableWidth,
                                                       const float availableHeight,
                                                       const YGMeasureMode widthMeasureMode,
                                                       const YGMeasureMode heightMeasureMode,
                                                       const float ownerWidth,
                                                       const float ownerHeight) {
  YGAssertWithNode(
      node,
      node->getMeasure() != nullptr,
      "Expected node to have custom measure function");

  const float paddingAndBorderAxisRow =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionRow, availableWidth);
  const float paddingAndBorderAxisColumn =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionColumn, availableWidth);
  const float marginAxisRow = YGUnwrapFloatOptional(
      node->getMarginForAxis(YGFlexDirectionRow, availableWidth));
  const float marginAxisColumn = YGUnwrapFloatOptional(
      node->getMarginForAxis(YGFlexDirectionColumn, availableWidth));

  // We want to make sure we don't call measure with negative size
  const float innerWidth = YGFloatIsUndefined(availableWidth)
      ? availableWidth
      : YGFloatMax(0, availableWidth - marginAxisRow - paddingAndBorderAxisRow);
  const float innerHeight = YGFloatIsUndefined(availableHeight)
      ? availableHeight
      : YGFloatMax(
            0, availableHeight - marginAxisColumn - paddingAndBorderAxisColumn);

  if (widthMeasureMode == YGMeasureModeExactly &&
      heightMeasureMode == YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->setLayoutMeasuredDimension(
        YGNodeBoundAxis(
            node,
            YGFlexDirectionRow,
            availableWidth - marginAxisRow,
            ownerWidth,
            ownerWidth),
        YGDimensionWidth);
    node->setLayoutMeasuredDimension(
        YGNodeBoundAxis(
            node,
            YGFlexDirectionColumn,
            availableHeight - marginAxisColumn,
            ownerHeight,
            ownerWidth),
        YGDimensionHeight);
  } else {
    // Measure the text under the current constraints.
    const YGSize measuredSize = node->getMeasure()(
        node, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    node->setLayoutMeasuredDimension(
        YGNodeBoundAxis(
            node,
            YGFlexDirectionRow,
            (widthMeasureMode == YGMeasureModeUndefined ||
             widthMeasureMode == YGMeasureModeAtMost)
                ? measuredSize.width + paddingAndBorderAxisRow
                : availableWidth - marginAxisRow,
            ownerWidth,
            ownerWidth),
        YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        YGNodeBoundAxis(
            node,
            YGFlexDirectionColumn,
            (heightMeasureMode == YGMeasureModeUndefined ||
             heightMeasureMode == YGMeasureModeAtMost)
                ? measuredSize.height + paddingAndBorderAxisColumn
                : availableHeight - marginAxisColumn,
            ownerHeight,
            ownerWidth),
        YGDimensionHeight);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void YGNodeEmptyContainerSetMeasuredDimensions(const YGNodeRef node,
                                                      const float availableWidth,
                                                      const float availableHeight,
                                                      const YGMeasureMode widthMeasureMode,
                                                      const YGMeasureMode heightMeasureMode,
                                                      const float ownerWidth,
                                                      const float ownerHeight) {
  const float paddingAndBorderAxisRow =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionRow, ownerWidth);
  const float paddingAndBorderAxisColumn =
      YGNodePaddingAndBorderForAxis(node, YGFlexDirectionColumn, ownerWidth);
  const float marginAxisRow = YGUnwrapFloatOptional(
      node->getMarginForAxis(YGFlexDirectionRow, ownerWidth));
  const float marginAxisColumn = YGUnwrapFloatOptional(
      node->getMarginForAxis(YGFlexDirectionColumn, ownerWidth));

  node->setLayoutMeasuredDimension(
      YGNodeBoundAxis(
          node,
          YGFlexDirectionRow,
          (widthMeasureMode == YGMeasureModeUndefined ||
           widthMeasureMode == YGMeasureModeAtMost)
              ? paddingAndBorderAxisRow
              : availableWidth - marginAxisRow,
          ownerWidth,
          ownerWidth),
      YGDimensionWidth);

  node->setLayoutMeasuredDimension(
      YGNodeBoundAxis(
          node,
          YGFlexDirectionColumn,
          (heightMeasureMode == YGMeasureModeUndefined ||
           heightMeasureMode == YGMeasureModeAtMost)
              ? paddingAndBorderAxisColumn
              : availableHeight - marginAxisColumn,
          ownerHeight,
          ownerWidth),
      YGDimensionHeight);
}

static bool YGNodeFixedSizeSetMeasuredDimensions(const YGNodeRef node,
                                                 const float availableWidth,
                                                 const float availableHeight,
                                                 const YGMeasureMode widthMeasureMode,
                                                 const YGMeasureMode heightMeasureMode,
                                                 const float ownerWidth,
                                                 const float ownerHeight) {
  if ((!YGFloatIsUndefined(availableWidth) &&
       widthMeasureMode == YGMeasureModeAtMost && availableWidth <= 0.0f) ||
      (!YGFloatIsUndefined(availableHeight) &&
       heightMeasureMode == YGMeasureModeAtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == YGMeasureModeExactly &&
       heightMeasureMode == YGMeasureModeExactly)) {
    const float& marginAxisColumn = YGUnwrapFloatOptional(
        node->getMarginForAxis(YGFlexDirectionColumn, ownerWidth));
    const float& marginAxisRow = YGUnwrapFloatOptional(
        node->getMarginForAxis(YGFlexDirectionRow, ownerWidth));

    node->setLayoutMeasuredDimension(
        YGNodeBoundAxis(
            node,
            YGFlexDirectionRow,
            YGFloatIsUndefined(availableWidth) ||
                    (widthMeasureMode == YGMeasureModeAtMost &&
                     availableWidth < 0.0f)
                ? 0.0f
                : availableWidth - marginAxisRow,
            ownerWidth,
            ownerWidth),
        YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        YGNodeBoundAxis(
            node,
            YGFlexDirectionColumn,
            YGFloatIsUndefined(availableHeight) ||
                    (heightMeasureMode == YGMeasureModeAtMost &&
                     availableHeight < 0.0f)
                ? 0.0f
                : availableHeight - marginAxisColumn,
            ownerHeight,
            ownerWidth),
        YGDimensionHeight);
    return true;
  }

  return false;
}

static void YGZeroOutLayoutRecursivly(const YGNodeRef node) {
  memset(&(node->getLayout()), 0, sizeof(YGLayout));
  node->setHasNewLayout(true);
  node->cloneChildrenIfNeeded();
  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const YGNodeRef child = node->getChild(i);
    YGZeroOutLayoutRecursivly(child);
  }
}

static float YGNodeCalculateAvailableInnerDim(
    const YGNodeRef node,
    YGFlexDirection axis,
    float availableDim,
    float ownerDim) {
  YGFlexDirection direction =
      YGFlexDirectionIsRow(axis) ? YGFlexDirectionRow : YGFlexDirectionColumn;
  YGDimension dimension =
      YGFlexDirectionIsRow(axis) ? YGDimensionWidth : YGDimensionHeight;

  const float margin =
      YGUnwrapFloatOptional(node->getMarginForAxis(direction, ownerDim));
  const float paddingAndBorder =
      YGNodePaddingAndBorderForAxis(node, direction, ownerDim);

  float availableInnerDim = availableDim - margin - paddingAndBorder;
  // Max dimension overrides predefined dimension value; Min dimension in turn
  // overrides both of the above
  if (!YGFloatIsUndefined(availableInnerDim)) {
    // We want to make sure our available height does not violate min and max
    // constraints
    const YGFloatOptional minDimensionOptional = YGResolveValue(node->getStyle().minDimensions[dimension], ownerDim);
    const float minInnerDim = minDimensionOptional.isUndefined()
        ? 0.0f
        : minDimensionOptional.getValue() - paddingAndBorder;

    const YGFloatOptional maxDimensionOptional = YGResolveValue(node->getStyle().maxDimensions[dimension], ownerDim) ;

    const float maxInnerDim = maxDimensionOptional.isUndefined()
        ? FLT_MAX
        : maxDimensionOptional.getValue() - paddingAndBorder;
    availableInnerDim =
        YGFloatMax(YGFloatMin(availableInnerDim, maxInnerDim), minInnerDim);
  }

  return availableInnerDim;
}

static void YGNodeComputeFlexBasisForChildren(
    const YGNodeRef node,
    const float availableInnerWidth,
    const float availableInnerHeight,
    YGMeasureMode widthMeasureMode,
    YGMeasureMode heightMeasureMode,
    YGDirection direction,
    YGFlexDirection mainAxis,
    const YGConfigRef config,
    bool performLayout,
    float& totalOuterFlexBasis) {
  YGNodeRef singleFlexChild = nullptr;
  YGVector children = node->getChildren();
  YGMeasureMode measureModeMainDim =
      YGFlexDirectionIsRow(mainAxis) ? widthMeasureMode : heightMeasureMode;
  // If there is only one child with flexGrow + flexShrink it means we can set
  // the computedFlexBasis to 0 instead of measuring and shrinking / flexing the
  // child to exactly match the remaining space
  if (measureModeMainDim == YGMeasureModeExactly) {
    for (auto child : children) {
      if (singleFlexChild != nullptr) {
        if (child->isNodeFlexible()) {
          // There is already a flexible child, abort
          singleFlexChild = nullptr;
          break;
        }
      } else if (
          child->resolveFlexGrow() > 0.0f &&
          child->resolveFlexShrink() > 0.0f) {
        singleFlexChild = child;
      }
    }
  }

  for (auto child : children) {
    child->resolveDimension();
    if (child->getStyle().display == YGDisplayNone) {
      YGZeroOutLayoutRecursivly(child);
      child->setHasNewLayout(true);
      child->setDirty(false);
      continue;
    }
    if (performLayout) {
      // Set the initial position (relative to the owner).
      const YGDirection childDirection = child->resolveDirection(direction);
      const float mainDim = YGFlexDirectionIsRow(mainAxis)
          ? availableInnerWidth
          : availableInnerHeight;
      const float crossDim = YGFlexDirectionIsRow(mainAxis)
          ? availableInnerHeight
          : availableInnerWidth;
      child->setPosition(
          childDirection, mainDim, crossDim, availableInnerWidth);
    }

    if (child->getStyle().positionType == YGPositionTypeAbsolute) {
      continue;
    }
    if (child == singleFlexChild) {
      child->setLayoutComputedFlexBasisGeneration(gCurrentGenerationCount);
      child->setLayoutComputedFlexBasis(YGFloatOptional(0));
    } else {
      YGNodeComputeFlexBasisForChild(
          node,
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

    totalOuterFlexBasis += YGUnwrapFloatOptional(
        child->getLayout().computedFlexBasis +
        child->getMarginForAxis(mainAxis, availableInnerWidth));
  }
}

// This function assumes that all the children of node have their
// computedFlexBasis properly computed(To do this use
// YGNodeComputeFlexBasisForChildren function).
// This function calculates YGCollectFlexItemsRowMeasurement
static YGCollectFlexItemsRowValues YGCalculateCollectFlexItemsRowValues(
    const YGNodeRef& node,
    const YGDirection ownerDirection,
    const float mainAxisownerSize,
    const float availableInnerWidth,
    const float availableInnerMainDim,
    const uint32_t startOfLineIndex,
    const uint32_t lineCount) {
  YGCollectFlexItemsRowValues flexAlgoRowMeasurement = {};
  flexAlgoRowMeasurement.relativeChildren.reserve(node->getChildren().size());

  float sizeConsumedOnCurrentLineIncludingMinConstraint = 0;
  const YGFlexDirection mainAxis = YGResolveFlexDirection(
      node->getStyle().flexDirection, node->resolveDirection(ownerDirection));
  const bool isNodeFlexWrap = node->getStyle().flexWrap != YGWrapNoWrap;

  // Add items to the current line until it's full or we run out of items.
  uint32_t endOfLineIndex = startOfLineIndex;
  for (; endOfLineIndex < node->getChildrenCount(); endOfLineIndex++) {
    const YGNodeRef child = node->getChild(endOfLineIndex);
    if (child->getStyle().display == YGDisplayNone ||
        child->getStyle().positionType == YGPositionTypeAbsolute) {
      continue;
    }
    child->setLineIndex(lineCount);
    const float childMarginMainAxis = YGUnwrapFloatOptional(
        child->getMarginForAxis(mainAxis, availableInnerWidth));
    const float flexBasisWithMinAndMaxConstraints =
        YGUnwrapFloatOptional(YGNodeBoundAxisWithinMinAndMax(
            child,
            mainAxis,
            YGUnwrapFloatOptional(child->getLayout().computedFlexBasis),
            mainAxisownerSize));

    // If this is a multi-line flow and this item pushes us over the
    // available size, we've
    // hit the end of the current line. Break out of the loop and lay out
    // the current line.
    if (sizeConsumedOnCurrentLineIncludingMinConstraint +
                flexBasisWithMinAndMaxConstraints + childMarginMainAxis >
            availableInnerMainDim &&
        isNodeFlexWrap && flexAlgoRowMeasurement.itemsOnLine > 0) {
      break;
    }

    sizeConsumedOnCurrentLineIncludingMinConstraint +=
        flexBasisWithMinAndMaxConstraints + childMarginMainAxis;
    flexAlgoRowMeasurement.sizeConsumedOnCurrentLine +=
        flexBasisWithMinAndMaxConstraints + childMarginMainAxis;
    flexAlgoRowMeasurement.itemsOnLine++;

    if (child->isNodeFlexible()) {
      flexAlgoRowMeasurement.totalFlexGrowFactors += child->resolveFlexGrow();

      // Unlike the grow factor, the shrink factor is scaled relative to the
      // child dimension.
      flexAlgoRowMeasurement.totalFlexShrinkScaledFactors +=
          -child->resolveFlexShrink() *
          YGUnwrapFloatOptional(child->getLayout().computedFlexBasis);
    }

    flexAlgoRowMeasurement.relativeChildren.push_back(child);
  }

  // The total flex factor needs to be floored to 1.
  if (flexAlgoRowMeasurement.totalFlexGrowFactors > 0 &&
      flexAlgoRowMeasurement.totalFlexGrowFactors < 1) {
    flexAlgoRowMeasurement.totalFlexGrowFactors = 1;
  }

  // The total flex shrink factor needs to be floored to 1.
  if (flexAlgoRowMeasurement.totalFlexShrinkScaledFactors > 0 &&
      flexAlgoRowMeasurement.totalFlexShrinkScaledFactors < 1) {
    flexAlgoRowMeasurement.totalFlexShrinkScaledFactors = 1;
  }
  flexAlgoRowMeasurement.endOfLineIndex = endOfLineIndex;
  return flexAlgoRowMeasurement;
}

// It distributes the free space to the flexible items and ensures that the size
// of the flex items abide the min and max constraints. At the end of this
// function the child nodes would have proper size. Prior using this function
// please ensure that YGDistributeFreeSpaceFirstPass is called.
static float YGDistributeFreeSpaceSecondPass(
    YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const YGNodeRef node,
    const YGFlexDirection mainAxis,
    const YGFlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool flexBasisOverflows,
    const YGMeasureMode measureModeCrossDim,
    const bool performLayout,
    const YGConfigRef config) {
  float childFlexBasis = 0;
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float deltaFreeSpace = 0;
  const bool isMainAxisRow = YGFlexDirectionIsRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap != YGWrapNoWrap;

  for (auto currentRelativeChild : collectedFlexItemsValues.relativeChildren) {
    childFlexBasis = YGUnwrapFloatOptional(YGNodeBoundAxisWithinMinAndMax(
        currentRelativeChild,
        mainAxis,
        YGUnwrapFloatOptional(
            currentRelativeChild->getLayout().computedFlexBasis),
        mainAxisownerSize));
    float updatedMainSize = childFlexBasis;

    if (!YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentRelativeChild->resolveFlexShrink() * childFlexBasis;
      // Is this child able to shrink?
      if (flexShrinkScaledFactor != 0) {
        float childSize;

        if (!YGFloatIsUndefined(
                collectedFlexItemsValues.totalFlexShrinkScaledFactors) &&
            collectedFlexItemsValues.totalFlexShrinkScaledFactors == 0) {
          childSize = childFlexBasis + flexShrinkScaledFactor;
        } else {
          childSize = childFlexBasis +
              (collectedFlexItemsValues.remainingFreeSpace /
               collectedFlexItemsValues.totalFlexShrinkScaledFactors) *
                  flexShrinkScaledFactor;
        }

        updatedMainSize = YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            childSize,
            availableInnerMainDim,
            availableInnerWidth);
      }
    } else if (
        !YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace > 0) {
      flexGrowFactor = currentRelativeChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!YGFloatIsUndefined(flexGrowFactor) && flexGrowFactor != 0) {
        updatedMainSize = YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            childFlexBasis +
                collectedFlexItemsValues.remainingFreeSpace /
                    collectedFlexItemsValues.totalFlexGrowFactors *
                    flexGrowFactor,
            availableInnerMainDim,
            availableInnerWidth);
      }
    }

    deltaFreeSpace += updatedMainSize - childFlexBasis;

    const float marginMain = YGUnwrapFloatOptional(
        currentRelativeChild->getMarginForAxis(mainAxis, availableInnerWidth));
    const float marginCross = YGUnwrapFloatOptional(
        currentRelativeChild->getMarginForAxis(crossAxis, availableInnerWidth));

    float childCrossSize;
    float childMainSize = updatedMainSize + marginMain;
    YGMeasureMode childCrossMeasureMode;
    YGMeasureMode childMainMeasureMode = YGMeasureModeExactly;

    if (!currentRelativeChild->getStyle().aspectRatio.isUndefined()) {
      childCrossSize = isMainAxisRow ? (childMainSize - marginMain) /
              currentRelativeChild->getStyle().aspectRatio.getValue()
                                     : (childMainSize - marginMain) *
              currentRelativeChild->getStyle().aspectRatio.getValue();
      childCrossMeasureMode = YGMeasureModeExactly;

      childCrossSize += marginCross;
    } else if (
        !YGFloatIsUndefined(availableInnerCrossDim) &&
        !YGNodeIsStyleDimDefined(
            currentRelativeChild, crossAxis, availableInnerCrossDim) &&
        measureModeCrossDim == YGMeasureModeExactly &&
        !(isNodeFlexWrap && flexBasisOverflows) &&
        YGNodeAlignItem(node, currentRelativeChild) == YGAlignStretch &&
        currentRelativeChild->marginLeadingValue(crossAxis).unit !=
            YGUnitAuto &&
        currentRelativeChild->marginTrailingValue(crossAxis).unit !=
            YGUnitAuto) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = YGMeasureModeExactly;
    } else if (!YGNodeIsStyleDimDefined(
                   currentRelativeChild, crossAxis, availableInnerCrossDim)) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = YGFloatIsUndefined(childCrossSize)
          ? YGMeasureModeUndefined
          : YGMeasureModeAtMost;
    } else {
      childCrossSize =
          YGUnwrapFloatOptional(YGResolveValue(
              currentRelativeChild->getResolvedDimension(dim[crossAxis]),
              availableInnerCrossDim)) +
          marginCross;
      const bool isLoosePercentageMeasurement =
          currentRelativeChild->getResolvedDimension(dim[crossAxis]).unit ==
              YGUnitPercent &&
          measureModeCrossDim != YGMeasureModeExactly;
      childCrossMeasureMode =
          YGFloatIsUndefined(childCrossSize) || isLoosePercentageMeasurement
          ? YGMeasureModeUndefined
          : YGMeasureModeExactly;
    }

    YGConstrainMaxSizeForMode(
        currentRelativeChild,
        mainAxis,
        availableInnerMainDim,
        availableInnerWidth,
        &childMainMeasureMode,
        &childMainSize);
    YGConstrainMaxSizeForMode(
        currentRelativeChild,
        crossAxis,
        availableInnerCrossDim,
        availableInnerWidth,
        &childCrossMeasureMode,
        &childCrossSize);

    const bool requiresStretchLayout =
        !YGNodeIsStyleDimDefined(
            currentRelativeChild, crossAxis, availableInnerCrossDim) &&
        YGNodeAlignItem(node, currentRelativeChild) == YGAlignStretch &&
        currentRelativeChild->marginLeadingValue(crossAxis).unit !=
            YGUnitAuto &&
        currentRelativeChild->marginTrailingValue(crossAxis).unit != YGUnitAuto;

    const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
    const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

    const YGMeasureMode childWidthMeasureMode =
        isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;
    const YGMeasureMode childHeightMeasureMode =
        !isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;

    // Recursively call the layout algorithm for this child with the updated
    // main size.
    YGLayoutNodeInternal(
        currentRelativeChild,
        childWidth,
        childHeight,
        node->getLayout().direction,
        childWidthMeasureMode,
        childHeightMeasureMode,
        availableInnerWidth,
        availableInnerHeight,
        performLayout && !requiresStretchLayout,
        "flex",
        config);
    node->setLayoutHadOverflow(
        node->getLayout().hadOverflow |
        currentRelativeChild->getLayout().hadOverflow);
  }
  return deltaFreeSpace;
}

// It distributes the free space to the flexible items.For those flexible items
// whose min and max constraints are triggered, those flex item's clamped size
// is removed from the remaingfreespace.
static void YGDistributeFreeSpaceFirstPass(
    YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const YGFlexDirection mainAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerWidth) {
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float baseMainSize = 0;
  float boundMainSize = 0;
  float deltaFreeSpace = 0;

  for (auto currentRelativeChild : collectedFlexItemsValues.relativeChildren) {
    float childFlexBasis = YGUnwrapFloatOptional(YGNodeBoundAxisWithinMinAndMax(
        currentRelativeChild,
        mainAxis,
        YGUnwrapFloatOptional(
            currentRelativeChild->getLayout().computedFlexBasis),
        mainAxisownerSize));

    if (collectedFlexItemsValues.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentRelativeChild->resolveFlexShrink() * childFlexBasis;

      // Is this child able to shrink?
      if (!YGFloatIsUndefined(flexShrinkScaledFactor) &&
          flexShrinkScaledFactor != 0) {
        baseMainSize = childFlexBasis +
            collectedFlexItemsValues.remainingFreeSpace /
                collectedFlexItemsValues.totalFlexShrinkScaledFactors *
                flexShrinkScaledFactor;
        boundMainSize = YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            baseMainSize,
            availableInnerMainDim,
            availableInnerWidth);
        if (!YGFloatIsUndefined(baseMainSize) &&
            !YGFloatIsUndefined(boundMainSize) &&
            baseMainSize != boundMainSize) {
          // By excluding this item's size and flex factor from remaining,
          // this item's
          // min/max constraints should also trigger in the second pass
          // resulting in the
          // item's size calculation being identical in the first and second
          // passes.
          deltaFreeSpace += boundMainSize - childFlexBasis;
          collectedFlexItemsValues.totalFlexShrinkScaledFactors -=
              flexShrinkScaledFactor;
        }
      }
    } else if (
        !YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace > 0) {
      flexGrowFactor = currentRelativeChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!YGFloatIsUndefined(flexGrowFactor) && flexGrowFactor != 0) {
        baseMainSize = childFlexBasis +
            collectedFlexItemsValues.remainingFreeSpace /
                collectedFlexItemsValues.totalFlexGrowFactors * flexGrowFactor;
        boundMainSize = YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            baseMainSize,
            availableInnerMainDim,
            availableInnerWidth);

        if (!YGFloatIsUndefined(baseMainSize) &&
            !YGFloatIsUndefined(boundMainSize) &&
            baseMainSize != boundMainSize) {
          // By excluding this item's size and flex factor from remaining,
          // this item's
          // min/max constraints should also trigger in the second pass
          // resulting in the
          // item's size calculation being identical in the first and second
          // passes.
          deltaFreeSpace += boundMainSize - childFlexBasis;
          collectedFlexItemsValues.totalFlexGrowFactors -= flexGrowFactor;
        }
      }
    }
  }
  collectedFlexItemsValues.remainingFreeSpace -= deltaFreeSpace;
}

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
//
// At the end of this function the child nodes would have the proper size
// assigned to them.
//
static void YGResolveFlexibleLength(
    const YGNodeRef node,
    YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const YGFlexDirection mainAxis,
    const YGFlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool flexBasisOverflows,
    const YGMeasureMode measureModeCrossDim,
    const bool performLayout,
    const YGConfigRef config) {
  const float originalFreeSpace = collectedFlexItemsValues.remainingFreeSpace;
  // First pass: detect the flex items whose min/max constraints trigger
  YGDistributeFreeSpaceFirstPass(
      collectedFlexItemsValues,
      mainAxis,
      mainAxisownerSize,
      availableInnerMainDim,
      availableInnerWidth);

  // Second pass: resolve the sizes of the flexible items
  const float distributedFreeSpace = YGDistributeFreeSpaceSecondPass(
      collectedFlexItemsValues,
      node,
      mainAxis,
      crossAxis,
      mainAxisownerSize,
      availableInnerMainDim,
      availableInnerCrossDim,
      availableInnerWidth,
      availableInnerHeight,
      flexBasisOverflows,
      measureModeCrossDim,
      performLayout,
      config);

  collectedFlexItemsValues.remainingFreeSpace =
      originalFreeSpace - distributedFreeSpace;
}

static void YGJustifyMainAxis(
    const YGNodeRef node,
    YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const uint32_t& startOfLineIndex,
    const YGFlexDirection& mainAxis,
    const YGFlexDirection& crossAxis,
    const YGMeasureMode& measureModeMainDim,
    const YGMeasureMode& measureModeCrossDim,
    const float& mainAxisownerSize,
    const float& ownerWidth,
    const float& availableInnerMainDim,
    const float& availableInnerCrossDim,
    const float& availableInnerWidth,
    const bool& performLayout) {
  const YGStyle style = node->getStyle();

  // If we are using "at most" rules in the main axis. Calculate the remaining
  // space when constraint by the min size defined for the main axis.
  if (measureModeMainDim == YGMeasureModeAtMost &&
      collectedFlexItemsValues.remainingFreeSpace > 0) {
    if (style.minDimensions[dim[mainAxis]].unit != YGUnitUndefined &&
        !YGResolveValue(style.minDimensions[dim[mainAxis]], mainAxisownerSize)
             .isUndefined()) {
      collectedFlexItemsValues.remainingFreeSpace = YGFloatMax(
          0,
          YGUnwrapFloatOptional(YGResolveValue(
              style.minDimensions[dim[mainAxis]], mainAxisownerSize)) -
              (availableInnerMainDim -
               collectedFlexItemsValues.remainingFreeSpace));
    } else {
      collectedFlexItemsValues.remainingFreeSpace = 0;
    }
  }

  int numberOfAutoMarginsOnCurrentLine = 0;
  for (uint32_t i = startOfLineIndex;
       i < collectedFlexItemsValues.endOfLineIndex;
       i++) {
    const YGNodeRef child = node->getChild(i);
    if (child->getStyle().positionType == YGPositionTypeRelative) {
      if (child->marginLeadingValue(mainAxis).unit == YGUnitAuto) {
        numberOfAutoMarginsOnCurrentLine++;
      }
      if (child->marginTrailingValue(mainAxis).unit == YGUnitAuto) {
        numberOfAutoMarginsOnCurrentLine++;
      }
    }
  }

  // In order to position the elements in the main axis, we have two
  // controls. The space between the beginning and the first element
  // and the space between each two elements.
  float leadingMainDim = 0;
  float betweenMainDim = 0;
  const YGJustify justifyContent = node->getStyle().justifyContent;

  if (numberOfAutoMarginsOnCurrentLine == 0) {
    switch (justifyContent) {
      case YGJustifyCenter:
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace / 2;
        break;
      case YGJustifyFlexEnd:
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace;
        break;
      case YGJustifySpaceBetween:
        if (collectedFlexItemsValues.itemsOnLine > 1) {
          betweenMainDim =
              YGFloatMax(collectedFlexItemsValues.remainingFreeSpace, 0) /
              (collectedFlexItemsValues.itemsOnLine - 1);
        } else {
          betweenMainDim = 0;
        }
        break;
      case YGJustifySpaceEvenly:
        // Space is distributed evenly across all elements
        betweenMainDim = collectedFlexItemsValues.remainingFreeSpace /
            (collectedFlexItemsValues.itemsOnLine + 1);
        leadingMainDim = betweenMainDim;
        break;
      case YGJustifySpaceAround:
        // Space on the edges is half of the space between elements
        betweenMainDim = collectedFlexItemsValues.remainingFreeSpace /
            collectedFlexItemsValues.itemsOnLine;
        leadingMainDim = betweenMainDim / 2;
        break;
      case YGJustifyFlexStart:
        break;
    }
  }

  const float leadingPaddingAndBorderMain = YGUnwrapFloatOptional(
      node->getLeadingPaddingAndBorder(mainAxis, ownerWidth));
  collectedFlexItemsValues.mainDim =
      leadingPaddingAndBorderMain + leadingMainDim;
  collectedFlexItemsValues.crossDim = 0;

  for (uint32_t i = startOfLineIndex;
       i < collectedFlexItemsValues.endOfLineIndex;
       i++) {
    const YGNodeRef child = node->getChild(i);
    const YGStyle childStyle = child->getStyle();
    const YGLayout childLayout = child->getLayout();
    if (childStyle.display == YGDisplayNone) {
      continue;
    }
    if (childStyle.positionType == YGPositionTypeAbsolute &&
        child->isLeadingPositionDefined(mainAxis)) {
      if (performLayout) {
        // In case the child is position absolute and has left/top being
        // defined, we override the position to whatever the user said
        // (and margin/border).
        child->setLayoutPosition(
            YGUnwrapFloatOptional(
                child->getLeadingPosition(mainAxis, availableInnerMainDim)) +
                node->getLeadingBorder(mainAxis) +
                YGUnwrapFloatOptional(
                    child->getLeadingMargin(mainAxis, availableInnerWidth)),
            pos[mainAxis]);
      }
    } else {
      // Now that we placed the element, we need to update the variables.
      // We need to do that only for relative elements. Absolute elements
      // do not take part in that phase.
      if (childStyle.positionType == YGPositionTypeRelative) {
        if (child->marginLeadingValue(mainAxis).unit == YGUnitAuto) {
          collectedFlexItemsValues.mainDim +=
              collectedFlexItemsValues.remainingFreeSpace /
              numberOfAutoMarginsOnCurrentLine;
        }

        if (performLayout) {
          child->setLayoutPosition(
              childLayout.position[pos[mainAxis]] +
                  collectedFlexItemsValues.mainDim,
              pos[mainAxis]);
        }

        if (child->marginTrailingValue(mainAxis).unit == YGUnitAuto) {
          collectedFlexItemsValues.mainDim +=
              collectedFlexItemsValues.remainingFreeSpace /
              numberOfAutoMarginsOnCurrentLine;
        }
        bool canSkipFlex =
            !performLayout && measureModeCrossDim == YGMeasureModeExactly;
        if (canSkipFlex) {
          // If we skipped the flex step, then we can't rely on the
          // measuredDims because
          // they weren't computed. This means we can't call
          // YGNodeDimWithMargin.
          collectedFlexItemsValues.mainDim += betweenMainDim +
              YGUnwrapFloatOptional(child->getMarginForAxis(
                  mainAxis, availableInnerWidth)) +
              YGUnwrapFloatOptional(childLayout.computedFlexBasis);
          collectedFlexItemsValues.crossDim = availableInnerCrossDim;
        } else {
          // The main dimension is the sum of all the elements dimension plus
          // the spacing.
          collectedFlexItemsValues.mainDim += betweenMainDim +
              YGNodeDimWithMargin(child, mainAxis, availableInnerWidth);

          // The cross dimension is the max of the elements dimension since
          // there can only be one element in that cross dimension.
          collectedFlexItemsValues.crossDim = YGFloatMax(
              collectedFlexItemsValues.crossDim,
              YGNodeDimWithMargin(child, crossAxis, availableInnerWidth));
        }
      } else if (performLayout) {
        child->setLayoutPosition(
            childLayout.position[pos[mainAxis]] +
                node->getLeadingBorder(mainAxis) + leadingMainDim,
            pos[mainAxis]);
      }
    }
  }
  collectedFlexItemsValues.mainDim += YGUnwrapFloatOptional(
      node->getTrailingPaddingAndBorder(mainAxis, ownerWidth));
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
//    - ownerDirection: the inline (text) direction within the owner
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
                             const YGDirection ownerDirection,
                             const YGMeasureMode widthMeasureMode,
                             const YGMeasureMode heightMeasureMode,
                             const float ownerWidth,
                             const float ownerHeight,
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
  const YGDirection direction = node->resolveDirection(ownerDirection);
  node->setLayoutDirection(direction);

  const YGFlexDirection flexRowDirection = YGResolveFlexDirection(YGFlexDirectionRow, direction);
  const YGFlexDirection flexColumnDirection =
      YGResolveFlexDirection(YGFlexDirectionColumn, direction);

  node->setLayoutMargin(
      YGUnwrapFloatOptional(
          node->getLeadingMargin(flexRowDirection, ownerWidth)),
      YGEdgeStart);
  node->setLayoutMargin(
      YGUnwrapFloatOptional(
          node->getTrailingMargin(flexRowDirection, ownerWidth)),
      YGEdgeEnd);
  node->setLayoutMargin(
      YGUnwrapFloatOptional(
          node->getLeadingMargin(flexColumnDirection, ownerWidth)),
      YGEdgeTop);
  node->setLayoutMargin(
      YGUnwrapFloatOptional(
          node->getTrailingMargin(flexColumnDirection, ownerWidth)),
      YGEdgeBottom);

  node->setLayoutBorder(node->getLeadingBorder(flexRowDirection), YGEdgeStart);
  node->setLayoutBorder(node->getTrailingBorder(flexRowDirection), YGEdgeEnd);
  node->setLayoutBorder(node->getLeadingBorder(flexColumnDirection), YGEdgeTop);
  node->setLayoutBorder(
      node->getTrailingBorder(flexColumnDirection), YGEdgeBottom);

  node->setLayoutPadding(
      YGUnwrapFloatOptional(
          node->getLeadingPadding(flexRowDirection, ownerWidth)),
      YGEdgeStart);
  node->setLayoutPadding(
      YGUnwrapFloatOptional(
          node->getTrailingPadding(flexRowDirection, ownerWidth)),
      YGEdgeEnd);
  node->setLayoutPadding(
      YGUnwrapFloatOptional(
          node->getLeadingPadding(flexColumnDirection, ownerWidth)),
      YGEdgeTop);
  node->setLayoutPadding(
      YGUnwrapFloatOptional(
          node->getTrailingPadding(flexColumnDirection, ownerWidth)),
      YGEdgeBottom);

  if (node->getMeasure() != nullptr) {
    YGNodeWithMeasureFuncSetMeasuredDimensions(node,
                                               availableWidth,
                                               availableHeight,
                                               widthMeasureMode,
                                               heightMeasureMode,
                                               ownerWidth,
                                               ownerHeight);
    return;
  }

  const uint32_t childCount = YGNodeGetChildCount(node);
  if (childCount == 0) {
    YGNodeEmptyContainerSetMeasuredDimensions(node,
                                              availableWidth,
                                              availableHeight,
                                              widthMeasureMode,
                                              heightMeasureMode,
                                              ownerWidth,
                                              ownerHeight);
    return;
  }

  // If we're not being asked to perform a full layout we can skip the algorithm if we already know
  // the size
  if (!performLayout && YGNodeFixedSizeSetMeasuredDimensions(node,
                                                             availableWidth,
                                                             availableHeight,
                                                             widthMeasureMode,
                                                             heightMeasureMode,
                                                             ownerWidth,
                                                             ownerHeight)) {
    return;
  }

  // At this point we know we're going to perform work. Ensure that each child has a mutable copy.
  node->cloneChildrenIfNeeded();
  // Reset layout flags, as they could have changed.
  node->setLayoutHadOverflow(false);

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const YGFlexDirection mainAxis =
      YGResolveFlexDirection(node->getStyle().flexDirection, direction);
  const YGFlexDirection crossAxis = YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = YGFlexDirectionIsRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap != YGWrapNoWrap;

  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;
  const float crossAxisownerSize = isMainAxisRow ? ownerHeight : ownerWidth;

  const float leadingPaddingAndBorderCross = YGUnwrapFloatOptional(
      node->getLeadingPaddingAndBorder(crossAxis, ownerWidth));
  const float paddingAndBorderAxisMain = YGNodePaddingAndBorderForAxis(node, mainAxis, ownerWidth);
  const float paddingAndBorderAxisCross =
      YGNodePaddingAndBorderForAxis(node, crossAxis, ownerWidth);

  YGMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  YGMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow =
      isMainAxisRow ? paddingAndBorderAxisMain : paddingAndBorderAxisCross;
  const float paddingAndBorderAxisColumn =
      isMainAxisRow ? paddingAndBorderAxisCross : paddingAndBorderAxisMain;

  const float marginAxisRow = YGUnwrapFloatOptional(
      node->getMarginForAxis(YGFlexDirectionRow, ownerWidth));
  const float marginAxisColumn = YGUnwrapFloatOptional(
      node->getMarginForAxis(YGFlexDirectionColumn, ownerWidth));

  const float minInnerWidth =
      YGUnwrapFloatOptional(YGResolveValue(node->getStyle().minDimensions[YGDimensionWidth], ownerWidth)) -
      paddingAndBorderAxisRow;
  const float maxInnerWidth =
      YGUnwrapFloatOptional(YGResolveValue(node->getStyle().maxDimensions[YGDimensionWidth], ownerWidth)) -
      paddingAndBorderAxisRow;
  const float minInnerHeight =
      YGUnwrapFloatOptional(YGResolveValue(node->getStyle().minDimensions[YGDimensionHeight], ownerHeight)) -
      paddingAndBorderAxisColumn;
  const float maxInnerHeight =
      YGUnwrapFloatOptional(YGResolveValue(
          node->getStyle().maxDimensions[YGDimensionHeight], ownerHeight)) -
      paddingAndBorderAxisColumn;

  const float minInnerMainDim = isMainAxisRow ? minInnerWidth : minInnerHeight;
  const float maxInnerMainDim = isMainAxisRow ? maxInnerWidth : maxInnerHeight;

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS

  float availableInnerWidth = YGNodeCalculateAvailableInnerDim(
      node, YGFlexDirectionRow, availableWidth, ownerWidth);
  float availableInnerHeight = YGNodeCalculateAvailableInnerDim(
      node, YGFlexDirectionColumn, availableHeight, ownerHeight);

  float availableInnerMainDim =
      isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim =
      isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  float totalOuterFlexBasis = 0;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM

  YGNodeComputeFlexBasisForChildren(
      node,
      availableInnerWidth,
      availableInnerHeight,
      widthMeasureMode,
      heightMeasureMode,
      direction,
      mainAxis,
      config,
      performLayout,
      totalOuterFlexBasis);

  const bool flexBasisOverflows = measureModeMainDim == YGMeasureModeUndefined
      ? false
      : totalOuterFlexBasis > availableInnerMainDim;
  if (isNodeFlexWrap && flexBasisOverflows &&
      measureModeMainDim == YGMeasureModeAtMost) {
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
  YGCollectFlexItemsRowValues collectedFlexItemsValues;
  for (; endOfLineIndex < childCount;
       lineCount++, startOfLineIndex = endOfLineIndex) {
    collectedFlexItemsValues = YGCalculateCollectFlexItemsRowValues(
        node,
        ownerDirection,
        mainAxisownerSize,
        availableInnerWidth,
        availableInnerMainDim,
        startOfLineIndex,
        lineCount);
    endOfLineIndex = collectedFlexItemsValues.endOfLineIndex;

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    const bool canSkipFlex =
        !performLayout && measureModeCrossDim == YGMeasureModeExactly;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated.
    // If the main dimension size isn't known, it is computed based on
    // the line length, so there's no more space left to distribute.

    bool sizeBasedOnContent = false;
    // If we don't measure with exact main dimension we want to ensure we don't violate min and max
    if (measureModeMainDim != YGMeasureModeExactly) {
      if (!YGFloatIsUndefined(minInnerMainDim) &&
          collectedFlexItemsValues.sizeConsumedOnCurrentLine <
              minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (
          !YGFloatIsUndefined(maxInnerMainDim) &&
          collectedFlexItemsValues.sizeConsumedOnCurrentLine >
              maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else {
        if (!node->getConfig()->useLegacyStretchBehaviour &&
            ((YGFloatIsUndefined(
                  collectedFlexItemsValues.totalFlexGrowFactors) &&
              collectedFlexItemsValues.totalFlexGrowFactors == 0) ||
             (YGFloatIsUndefined(node->resolveFlexGrow()) &&
              node->resolveFlexGrow() == 0))) {
          // If we don't have any children to flex or we can't flex the node
          // itself, space we've used is all space we need. Root node also
          // should be shrunk to minimum
          availableInnerMainDim =
              collectedFlexItemsValues.sizeConsumedOnCurrentLine;
        }

        if (node->getConfig()->useLegacyStretchBehaviour) {
          node->setLayoutDidUseLegacyFlag(true);
        }
        sizeBasedOnContent = !node->getConfig()->useLegacyStretchBehaviour;
      }
    }

    if (!sizeBasedOnContent && !YGFloatIsUndefined(availableInnerMainDim)) {
      collectedFlexItemsValues.remainingFreeSpace = availableInnerMainDim -
          collectedFlexItemsValues.sizeConsumedOnCurrentLine;
    } else if (collectedFlexItemsValues.sizeConsumedOnCurrentLine < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized based on its
      // content.
      // sizeConsumedOnCurrentLine is negative which means the node will allocate 0 points for
      // its content. Consequently, remainingFreeSpace is 0 - sizeConsumedOnCurrentLine.
      collectedFlexItemsValues.remainingFreeSpace =
          -collectedFlexItemsValues.sizeConsumedOnCurrentLine;
    }

    if (!canSkipFlex) {
      YGResolveFlexibleLength(
          node,
          collectedFlexItemsValues,
          mainAxis,
          crossAxis,
          mainAxisownerSize,
          availableInnerMainDim,
          availableInnerCrossDim,
          availableInnerWidth,
          availableInnerHeight,
          flexBasisOverflows,
          measureModeCrossDim,
          performLayout,
          config);
    }

    node->setLayoutHadOverflow(
        node->getLayout().hadOverflow |
        (collectedFlexItemsValues.remainingFreeSpace < 0));

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis.
    // Their dimensions are also set in the cross axis with the exception of
    // items
    // that are aligned "stretch". We need to compute these stretch values and
    // set the final positions.

    YGJustifyMainAxis(
        node,
        collectedFlexItemsValues,
        startOfLineIndex,
        mainAxis,
        crossAxis,
        measureModeMainDim,
        measureModeCrossDim,
        mainAxisownerSize,
        ownerWidth,
        availableInnerMainDim,
        availableInnerCrossDim,
        availableInnerWidth,
        performLayout);

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == YGMeasureModeUndefined ||
        measureModeCrossDim == YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis =
          YGNodeBoundAxis(
              node,
              crossAxis,
              collectedFlexItemsValues.crossDim + paddingAndBorderAxisCross,
              crossAxisownerSize,
              ownerWidth) -
          paddingAndBorderAxisCross;
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == YGMeasureModeExactly) {
      collectedFlexItemsValues.crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    collectedFlexItemsValues.crossDim =
        YGNodeBoundAxis(
            node,
            crossAxis,
            collectedFlexItemsValues.crossDim + paddingAndBorderAxisCross,
            crossAxisownerSize,
            ownerWidth) -
        paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const YGNodeRef child = node->getChild(i);
        if (child->getStyle().display == YGDisplayNone) {
          continue;
        }
        if (child->getStyle().positionType == YGPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right set, override
          // all the previously computed positions to set it correctly.
          const bool isChildLeadingPosDefined =
              child->isLeadingPositionDefined(crossAxis);
          if (isChildLeadingPosDefined) {
            child->setLayoutPosition(
                YGUnwrapFloatOptional(child->getLeadingPosition(
                    crossAxis, availableInnerCrossDim)) +
                    node->getLeadingBorder(crossAxis) +
                    YGUnwrapFloatOptional(child->getLeadingMargin(
                        crossAxis, availableInnerWidth)),
                pos[crossAxis]);
          }
          // If leading position is not defined or calculations result in Nan, default to border + margin
          if (!isChildLeadingPosDefined ||
              YGFloatIsUndefined(child->getLayout().position[pos[crossAxis]])) {
            child->setLayoutPosition(
                node->getLeadingBorder(crossAxis) +
                    YGUnwrapFloatOptional(child->getLeadingMargin(
                        crossAxis, availableInnerWidth)),
                pos[crossAxis]);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (owner) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const YGAlign alignItem = YGNodeAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == YGAlignStretch &&
              child->marginLeadingValue(crossAxis).unit != YGUnitAuto &&
              child->marginTrailingValue(crossAxis).unit != YGUnitAuto) {
            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!YGNodeIsStyleDimDefined(child, crossAxis, availableInnerCrossDim)) {
              float childMainSize =
                  child->getLayout().measuredDimensions[dim[mainAxis]];
              float childCrossSize =
                  !child->getStyle().aspectRatio.isUndefined()
                  ? ((YGUnwrapFloatOptional(child->getMarginForAxis(
                          crossAxis, availableInnerWidth)) +
                      (isMainAxisRow ? childMainSize /
                               child->getStyle().aspectRatio.getValue()
                                     : childMainSize *
                               child->getStyle().aspectRatio.getValue())))
                  : collectedFlexItemsValues.crossDim;

              childMainSize += YGUnwrapFloatOptional(
                  child->getMarginForAxis(mainAxis, availableInnerWidth));

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
                  YGFloatIsUndefined(childWidth) ? YGMeasureModeUndefined
                                                 : YGMeasureModeExactly;
              const YGMeasureMode childHeightMeasureMode =
                  YGFloatIsUndefined(childHeight) ? YGMeasureModeUndefined
                                                  : YGMeasureModeExactly;

              YGLayoutNodeInternal(
                  child,
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
            const float remainingCrossDim = containerCrossAxis -
                YGNodeDimWithMargin(child, crossAxis, availableInnerWidth);

            if (child->marginLeadingValue(crossAxis).unit == YGUnitAuto &&
                child->marginTrailingValue(crossAxis).unit == YGUnitAuto) {
              leadingCrossDim += YGFloatMax(0.0f, remainingCrossDim / 2);
            } else if (
                child->marginTrailingValue(crossAxis).unit == YGUnitAuto) {
              // No-Op
            } else if (
                child->marginLeadingValue(crossAxis).unit == YGUnitAuto) {
              leadingCrossDim += YGFloatMax(0.0f, remainingCrossDim);
            } else if (alignItem == YGAlignFlexStart) {
              // No-Op
            } else if (alignItem == YGAlignCenter) {
              leadingCrossDim += remainingCrossDim / 2;
            } else {
              leadingCrossDim += remainingCrossDim;
            }
          }
          // And we apply the position
          child->setLayoutPosition(
              child->getLayout().position[pos[crossAxis]] + totalLineCrossDim +
                  leadingCrossDim,
              pos[crossAxis]);
        }
      }
    }

    totalLineCrossDim += collectedFlexItemsValues.crossDim;
    maxLineMainDim =
        YGFloatMax(maxLineMainDim, collectedFlexItemsValues.mainDim);
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  if (performLayout && (lineCount > 1 || YGIsBaselineLayout(node)) &&
      !YGFloatIsUndefined(availableInnerCrossDim)) {
    const float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    switch (node->getStyle().alignContent) {
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
        const YGNodeRef child = node->getChild(ii);
        if (child->getStyle().display == YGDisplayNone) {
          continue;
        }
        if (child->getStyle().positionType == YGPositionTypeRelative) {
          if (child->getLineIndex() != i) {
            break;
          }
          if (YGNodeIsLayoutDimDefined(child, crossAxis)) {
            lineHeight = YGFloatMax(
                lineHeight,
                child->getLayout().measuredDimensions[dim[crossAxis]] +
                    YGUnwrapFloatOptional(child->getMarginForAxis(
                        crossAxis, availableInnerWidth)));
          }
          if (YGNodeAlignItem(node, child) == YGAlignBaseline) {
            const float ascent = YGBaseline(child) +
                YGUnwrapFloatOptional(child->getLeadingMargin(
                    YGFlexDirectionColumn, availableInnerWidth));
            const float descent =
                child->getLayout().measuredDimensions[YGDimensionHeight] +
                YGUnwrapFloatOptional(child->getMarginForAxis(
                    YGFlexDirectionColumn, availableInnerWidth)) -
                ascent;
            maxAscentForCurrentLine =
                YGFloatMax(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine =
                YGFloatMax(maxDescentForCurrentLine, descent);
            lineHeight = YGFloatMax(
                lineHeight, maxAscentForCurrentLine + maxDescentForCurrentLine);
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const YGNodeRef child = node->getChild(ii);
          if (child->getStyle().display == YGDisplayNone) {
            continue;
          }
          if (child->getStyle().positionType == YGPositionTypeRelative) {
            switch (YGNodeAlignItem(node, child)) {
              case YGAlignFlexStart: {
                child->setLayoutPosition(
                    currentLead +
                        YGUnwrapFloatOptional(child->getLeadingMargin(
                            crossAxis, availableInnerWidth)),
                    pos[crossAxis]);
                break;
              }
              case YGAlignFlexEnd: {
                child->setLayoutPosition(
                    currentLead + lineHeight -
                        YGUnwrapFloatOptional(child->getTrailingMargin(
                            crossAxis, availableInnerWidth)) -
                        child->getLayout().measuredDimensions[dim[crossAxis]],
                    pos[crossAxis]);
                break;
              }
              case YGAlignCenter: {
                float childHeight =
                    child->getLayout().measuredDimensions[dim[crossAxis]];

                child->setLayoutPosition(
                    currentLead + (lineHeight - childHeight) / 2,
                    pos[crossAxis]);
                break;
              }
              case YGAlignStretch: {
                child->setLayoutPosition(
                    currentLead +
                        YGUnwrapFloatOptional(child->getLeadingMargin(
                            crossAxis, availableInnerWidth)),
                    pos[crossAxis]);

                // Remeasure child with the line height as it as been only measured with the
                // owners height yet.
                if (!YGNodeIsStyleDimDefined(child, crossAxis, availableInnerCrossDim)) {
                  const float childWidth = isMainAxisRow
                      ? (child->getLayout()
                             .measuredDimensions[YGDimensionWidth] +
                         YGUnwrapFloatOptional(child->getMarginForAxis(
                             mainAxis, availableInnerWidth)))
                      : lineHeight;

                  const float childHeight = !isMainAxisRow
                      ? (child->getLayout()
                             .measuredDimensions[YGDimensionHeight] +
                         YGUnwrapFloatOptional(child->getMarginForAxis(
                             crossAxis, availableInnerWidth)))
                      : lineHeight;

                  if (!(YGFloatsEqual(
                            childWidth,
                            child->getLayout()
                                .measuredDimensions[YGDimensionWidth]) &&
                        YGFloatsEqual(
                            childHeight,
                            child->getLayout()
                                .measuredDimensions[YGDimensionHeight]))) {
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
                child->setLayoutPosition(
                    currentLead + maxAscentForCurrentLine - YGBaseline(child) +
                        YGUnwrapFloatOptional(child->getLeadingPosition(
                            YGFlexDirectionColumn, availableInnerCrossDim)),
                    YGEdgeTop);

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

  node->setLayoutMeasuredDimension(
      YGNodeBoundAxis(
          node,
          YGFlexDirectionRow,
          availableWidth - marginAxisRow,
          ownerWidth,
          ownerWidth),
      YGDimensionWidth);

  node->setLayoutMeasuredDimension(
      YGNodeBoundAxis(
          node,
          YGFlexDirectionColumn,
          availableHeight - marginAxisColumn,
          ownerHeight,
          ownerWidth),
      YGDimensionHeight);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == YGMeasureModeUndefined ||
      (node->getStyle().overflow != YGOverflowScroll &&
       measureModeMainDim == YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->setLayoutMeasuredDimension(
        YGNodeBoundAxis(
            node, mainAxis, maxLineMainDim, mainAxisownerSize, ownerWidth),
        dim[mainAxis]);

  } else if (
      measureModeMainDim == YGMeasureModeAtMost &&
      node->getStyle().overflow == YGOverflowScroll) {
    node->setLayoutMeasuredDimension(
        YGFloatMax(
            YGFloatMin(
                availableInnerMainDim + paddingAndBorderAxisMain,
                YGUnwrapFloatOptional(YGNodeBoundAxisWithinMinAndMax(
                    node, mainAxis, maxLineMainDim, mainAxisownerSize))),
            paddingAndBorderAxisMain),
        dim[mainAxis]);
  }

  if (measureModeCrossDim == YGMeasureModeUndefined ||
      (node->getStyle().overflow != YGOverflowScroll &&
       measureModeCrossDim == YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.

    node->setLayoutMeasuredDimension(
        YGNodeBoundAxis(
            node,
            crossAxis,
            totalLineCrossDim + paddingAndBorderAxisCross,
            crossAxisownerSize,
            ownerWidth),
        dim[crossAxis]);

  } else if (
      measureModeCrossDim == YGMeasureModeAtMost &&
      node->getStyle().overflow == YGOverflowScroll) {
    node->setLayoutMeasuredDimension(
        YGFloatMax(
            YGFloatMin(
                availableInnerCrossDim + paddingAndBorderAxisCross,
                YGUnwrapFloatOptional(YGNodeBoundAxisWithinMinAndMax(
                    node,
                    crossAxis,
                    totalLineCrossDim + paddingAndBorderAxisCross,
                    crossAxisownerSize))),
            paddingAndBorderAxisCross),
        dim[crossAxis]);
  }

  // As we only wrapped in normal direction yet, we need to reverse the positions on wrap-reverse.
  if (performLayout && node->getStyle().flexWrap == YGWrapWrapReverse) {
    for (uint32_t i = 0; i < childCount; i++) {
      const YGNodeRef child = YGNodeGetChild(node, i);
      if (child->getStyle().positionType == YGPositionTypeRelative) {
        child->setLayoutPosition(
            node->getLayout().measuredDimensions[dim[crossAxis]] -
                child->getLayout().position[pos[crossAxis]] -
                child->getLayout().measuredDimensions[dim[crossAxis]],
            pos[crossAxis]);
      }
    }
  }

  if (performLayout) {
    // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
    for (auto child : node->getChildren()) {
      if (child->getStyle().positionType != YGPositionTypeAbsolute) {
        continue;
      }
      YGNodeAbsoluteLayoutChild(
          node,
          child,
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
        const YGNodeRef child = node->getChild(i);
        if (child->getStyle().display == YGDisplayNone) {
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
  return lastSizeMode == YGMeasureModeAtMost &&
      sizeMode == YGMeasureModeAtMost && !YGFloatIsUndefined(lastSize) &&
      !YGFloatIsUndefined(size) && !YGFloatIsUndefined(lastComputedSize) &&
      lastSize > size &&
      (lastComputedSize <= size || YGFloatsEqual(size, lastComputedSize));
}

float YGRoundValueToPixelGrid(const float value,
                              const float pointScaleFactor,
                              const bool forceCeil,
                              const bool forceFloor) {
  float scaledValue = value * pointScaleFactor;
  float fractial = fmodf(scaledValue, 1.0f);
  if (YGFloatsEqual(fractial, 0)) {
    // First we check if the value is already rounded
    scaledValue = scaledValue - fractial;
  } else if (YGFloatsEqual(fractial, 1.0f)) {
    scaledValue = scaledValue - fractial + 1.0f;
  } else if (forceCeil) {
    // Next we check if we need to use forced rounding
    scaledValue = scaledValue - fractial + 1.0f;
  } else if (forceFloor) {
    scaledValue = scaledValue - fractial;
  } else {
    // Finally we just round the value
    scaledValue = scaledValue - fractial +
        (!YGFloatIsUndefined(fractial) &&
                 (fractial > 0.5f || YGFloatsEqual(fractial, 0.5f))
             ? 1.0f
             : 0.0f);
  }
  return (YGFloatIsUndefined(scaledValue) ||
          YGFloatIsUndefined(pointScaleFactor))
      ? YGUndefined
      : scaledValue / pointScaleFactor;
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
  if ((!YGFloatIsUndefined(lastComputedHeight) && lastComputedHeight < 0) ||
      (!YGFloatIsUndefined(lastComputedWidth) && lastComputedWidth < 0)) {
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
                          const YGDirection ownerDirection,
                          const YGMeasureMode widthMeasureMode,
                          const YGMeasureMode heightMeasureMode,
                          const float ownerWidth,
                          const float ownerHeight,
                          const bool performLayout,
                          const char *reason,
                          const YGConfigRef config) {
  YGLayout* layout = &node->getLayout();

  gDepth++;

  const bool needToVisitNode =
      (node->isDirty() && layout->generationCount != gCurrentGenerationCount) ||
      layout->lastOwnerDirection != ownerDirection;

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
  if (node->getMeasure() != nullptr) {
    const float marginAxisRow = YGUnwrapFloatOptional(
        node->getMarginForAxis(YGFlexDirectionRow, ownerWidth));
    const float marginAxisColumn = YGUnwrapFloatOptional(
        node->getMarginForAxis(YGFlexDirectionColumn, ownerWidth));

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
      if (node->getPrintFunc() != nullptr) {
        node->getPrintFunc()(node);
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
      if (node->getPrintFunc() != nullptr) {
        node->getPrintFunc()(node);
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
                     ownerDirection,
                     widthMeasureMode,
                     heightMeasureMode,
                     ownerWidth,
                     ownerHeight,
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
      if (node->getPrintFunc() != nullptr) {
        node->getPrintFunc()(node);
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

    layout->lastOwnerDirection = ownerDirection;

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
    node->setLayoutDimension(
        node->getLayout().measuredDimensions[YGDimensionWidth],
        YGDimensionWidth);
    node->setLayoutDimension(
        node->getLayout().measuredDimensions[YGDimensionHeight],
        YGDimensionHeight);

    node->setHasNewLayout(true);
    node->setDirty(false);
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

  const float nodeLeft = node->getLayout().position[YGEdgeLeft];
  const float nodeTop = node->getLayout().position[YGEdgeTop];

  const float nodeWidth = node->getLayout().dimensions[YGDimensionWidth];
  const float nodeHeight = node->getLayout().dimensions[YGDimensionHeight];

  const float absoluteNodeLeft = absoluteLeft + nodeLeft;
  const float absoluteNodeTop = absoluteTop + nodeTop;

  const float absoluteNodeRight = absoluteNodeLeft + nodeWidth;
  const float absoluteNodeBottom = absoluteNodeTop + nodeHeight;

  // If a node has a custom measure function we never want to round down its size as this could
  // lead to unwanted text truncation.
  const bool textRounding = node->getNodeType() == YGNodeTypeText;

  node->setLayoutPosition(
      YGRoundValueToPixelGrid(nodeLeft, pointScaleFactor, false, textRounding),
      YGEdgeLeft);

  node->setLayoutPosition(
      YGRoundValueToPixelGrid(nodeTop, pointScaleFactor, false, textRounding),
      YGEdgeTop);

  // We multiply dimension by scale factor and if the result is close to the whole number, we don't
  // have any fraction
  // To verify if the result is close to whole number we want to check both floor and ceil numbers
  const bool hasFractionalWidth = !YGFloatsEqual(fmodf(nodeWidth * pointScaleFactor, 1.0), 0) &&
                                  !YGFloatsEqual(fmodf(nodeWidth * pointScaleFactor, 1.0), 1.0);
  const bool hasFractionalHeight = !YGFloatsEqual(fmodf(nodeHeight * pointScaleFactor, 1.0), 0) &&
                                   !YGFloatsEqual(fmodf(nodeHeight * pointScaleFactor, 1.0), 1.0);

  node->setLayoutDimension(
      YGRoundValueToPixelGrid(
          absoluteNodeRight,
          pointScaleFactor,
          (textRounding && hasFractionalWidth),
          (textRounding && !hasFractionalWidth)) -
          YGRoundValueToPixelGrid(
              absoluteNodeLeft, pointScaleFactor, false, textRounding),
      YGDimensionWidth);

  node->setLayoutDimension(
      YGRoundValueToPixelGrid(
          absoluteNodeBottom,
          pointScaleFactor,
          (textRounding && hasFractionalHeight),
          (textRounding && !hasFractionalHeight)) -
          YGRoundValueToPixelGrid(
              absoluteNodeTop, pointScaleFactor, false, textRounding),
      YGDimensionHeight);

  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    YGRoundToPixelGrid(
        YGNodeGetChild(node, i),
        pointScaleFactor,
        absoluteNodeLeft,
        absoluteNodeTop);
  }
}

void YGNodeCalculateLayout(
    const YGNodeRef node,
    const float ownerWidth,
    const float ownerHeight,
    const YGDirection ownerDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;
  node->resolveDimension();
  float width = YGUndefined;
  YGMeasureMode widthMeasureMode = YGMeasureModeUndefined;
  if (YGNodeIsStyleDimDefined(node, YGFlexDirectionRow, ownerWidth)) {
    width = YGUnwrapFloatOptional(
        YGResolveValue(
            node->getResolvedDimension(dim[YGFlexDirectionRow]), ownerWidth) +
        node->getMarginForAxis(YGFlexDirectionRow, ownerWidth));
    widthMeasureMode = YGMeasureModeExactly;
  } else if (!YGResolveValue(
                  node->getStyle().maxDimensions[YGDimensionWidth], ownerWidth)
                  .isUndefined()) {
    width = YGUnwrapFloatOptional(YGResolveValue(
        node->getStyle().maxDimensions[YGDimensionWidth], ownerWidth));
    widthMeasureMode = YGMeasureModeAtMost;
  } else {
    width = ownerWidth;
    widthMeasureMode = YGFloatIsUndefined(width) ? YGMeasureModeUndefined
                                                 : YGMeasureModeExactly;
  }

  float height = YGUndefined;
  YGMeasureMode heightMeasureMode = YGMeasureModeUndefined;
  if (YGNodeIsStyleDimDefined(node, YGFlexDirectionColumn, ownerHeight)) {
    height = YGUnwrapFloatOptional(
        YGResolveValue(
            node->getResolvedDimension(dim[YGFlexDirectionColumn]),
            ownerHeight) +
        node->getMarginForAxis(YGFlexDirectionColumn, ownerWidth));
    heightMeasureMode = YGMeasureModeExactly;
  } else if (!YGResolveValue(
                  node->getStyle().maxDimensions[YGDimensionHeight],
                  ownerHeight)
                  .isUndefined()) {
    height = YGUnwrapFloatOptional(YGResolveValue(node->getStyle().maxDimensions[YGDimensionHeight], ownerHeight));
    heightMeasureMode = YGMeasureModeAtMost;
  } else {
    height = ownerHeight;
    heightMeasureMode = YGFloatIsUndefined(height) ? YGMeasureModeUndefined
                                                   : YGMeasureModeExactly;
  }
  if (YGLayoutNodeInternal(
          node,
          width,
          height,
          ownerDirection,
          widthMeasureMode,
          heightMeasureMode,
          ownerWidth,
          ownerHeight,
          true,
          "initial",
          node->getConfig())) {
    node->setPosition(
        node->getLayout().direction, ownerWidth, ownerHeight, ownerWidth);
    YGRoundToPixelGrid(node, node->getConfig()->pointScaleFactor, 0.0f, 0.0f);

    if (gPrintTree) {
      YGNodePrint(
          node,
          (YGPrintOptions)(
              YGPrintOptionsLayout | YGPrintOptionsChildren |
              YGPrintOptionsStyle));
    }
  }

  // We want to get rid off `useLegacyStretchBehaviour` from YGConfig. But we
  // aren't sure whether client's of yoga have gotten rid off this flag or not.
  // So logging this in YGLayout would help to find out the call sites depending
  // on this flag. This check would be removed once we are sure no one is
  // dependent on this flag anymore. The flag
  // `shouldDiffLayoutWithoutLegacyStretchBehaviour` in YGConfig will help to
  // run experiments.
  if (node->getConfig()->shouldDiffLayoutWithoutLegacyStretchBehaviour &&
      node->didUseLegacyFlag()) {
    const YGNodeRef originalNode = YGNodeDeepClone(node);
    originalNode->resolveDimension();
    // Recursively mark nodes as dirty
    originalNode->markDirtyAndPropogateDownwards();
    gCurrentGenerationCount++;
    // Rerun the layout, and calculate the diff
    originalNode->setAndPropogateUseLegacyFlag(false);
    if (YGLayoutNodeInternal(
            originalNode,
            width,
            height,
            ownerDirection,
            widthMeasureMode,
            heightMeasureMode,
            ownerWidth,
            ownerHeight,
            true,
            "initial",
            originalNode->getConfig())) {
      originalNode->setPosition(
          originalNode->getLayout().direction,
          ownerWidth,
          ownerHeight,
          ownerWidth);
      YGRoundToPixelGrid(
          originalNode,
          originalNode->getConfig()->pointScaleFactor,
          0.0f,
          0.0f);

      // Set whether the two layouts are different or not.
      node->setLayoutDoesLegacyFlagAffectsLayout(
          !originalNode->isLayoutTreeEqualToNode(*node));

      if (gPrintTree) {
        YGNodePrint(
            originalNode,
            (YGPrintOptions)(
                YGPrintOptionsLayout | YGPrintOptionsChildren |
                YGPrintOptionsStyle));
      }
    }
    YGConfigFreeRecursive(originalNode);
    YGNodeFreeRecursive(originalNode);
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

void YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    const YGConfigRef config,
    const bool shouldDiffLayout) {
  config->shouldDiffLayoutWithoutLegacyStretchBehaviour = shouldDiffLayout;
}

static void YGVLog(const YGConfigRef config,
                   const YGNodeRef node,
                   YGLogLevel level,
                   const char *format,
                   va_list args) {
  const YGConfigRef logConfig = config != nullptr ? config : YGConfigGetDefault();
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
  YGVLog(
      node == nullptr ? nullptr : node->getConfig(), node, level, format, args);
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

void YGConfigSetCloneNodeFunc(const YGConfigRef config, const YGCloneNodeFunc callback) {
  config->cloneNodeCallback = callback;
}

static void YGTraverseChildrenPreOrder(const YGVector& children, const std::function<void(YGNodeRef node)>& f) {
  for (YGNodeRef node : children) {
    f(node);
    YGTraverseChildrenPreOrder(node->getChildren(), f);
  }
}

void YGTraversePreOrder(YGNodeRef const node, std::function<void(YGNodeRef node)>&& f) {
  if (!node) {
    return;
  }
  f(node);
  YGTraverseChildrenPreOrder(node->getChildren(), f);
}
