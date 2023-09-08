/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/Yoga.h>
#include <yoga/Yoga-internal.h>

#include <yoga/algorithm/Cache.h>
#include <yoga/algorithm/CalculateLayout.h>
#include <yoga/algorithm/PixelGrid.h>
#include <yoga/debug/AssertFatal.h>
#include <yoga/debug/Log.h>
#include <yoga/debug/NodeToString.h>
#include <yoga/event/event.h>
#include <yoga/node/Node.h>

using namespace facebook;
using namespace facebook::yoga;

#ifdef ANDROID
static int YGAndroidLog(
    const YGConfigRef config,
    const YGNodeRef node,
    YGLogLevel level,
    const char* format,
    va_list args);
#else
static int YGDefaultLog(
    const YGConfigRef config,
    const YGNodeRef node,
    YGLogLevel level,
    const char* format,
    va_list args);
#endif

#ifdef ANDROID
#include <android/log.h>
static int YGAndroidLog(
    const YGConfigRef /*config*/,
    const YGNodeRef /*node*/,
    YGLogLevel level,
    const char* format,
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
#define YG_UNUSED(x) (void) (x);

static int YGDefaultLog(
    const YGConfigRef config,
    const YGNodeRef node,
    YGLogLevel level,
    const char* format,
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

YOGA_EXPORT bool YGFloatIsUndefined(const float value) {
  return yoga::isUndefined(value);
}

YOGA_EXPORT void* YGNodeGetContext(YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->getContext();
}

YOGA_EXPORT void YGNodeSetContext(YGNodeRef node, void* context) {
  return static_cast<yoga::Node*>(node)->setContext(context);
}

YOGA_EXPORT YGConfigRef YGNodeGetConfig(YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->getConfig();
}

YOGA_EXPORT void YGNodeSetConfig(YGNodeRef node, YGConfigRef config) {
  static_cast<yoga::Node*>(node)->setConfig(static_cast<yoga::Config*>(config));
}

YOGA_EXPORT bool YGNodeHasMeasureFunc(YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->hasMeasureFunc();
}

YOGA_EXPORT void YGNodeSetMeasureFunc(
    YGNodeRef node,
    YGMeasureFunc measureFunc) {
  static_cast<yoga::Node*>(node)->setMeasureFunc(measureFunc);
}

YOGA_EXPORT bool YGNodeHasBaselineFunc(YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->hasBaselineFunc();
}

YOGA_EXPORT void YGNodeSetBaselineFunc(
    YGNodeRef node,
    YGBaselineFunc baselineFunc) {
  static_cast<yoga::Node*>(node)->setBaselineFunc(baselineFunc);
}

YOGA_EXPORT YGDirtiedFunc YGNodeGetDirtiedFunc(YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->getDirtied();
}

YOGA_EXPORT void YGNodeSetDirtiedFunc(
    YGNodeRef node,
    YGDirtiedFunc dirtiedFunc) {
  static_cast<yoga::Node*>(node)->setDirtiedFunc(dirtiedFunc);
}

YOGA_EXPORT void YGNodeSetPrintFunc(YGNodeRef node, YGPrintFunc printFunc) {
  static_cast<yoga::Node*>(node)->setPrintFunc(printFunc);
}

YOGA_EXPORT bool YGNodeGetHasNewLayout(YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->getHasNewLayout();
}

YOGA_EXPORT void YGConfigSetPrintTreeFlag(YGConfigRef config, bool enabled) {
  static_cast<yoga::Config*>(config)->setShouldPrintTree(enabled);
}

YOGA_EXPORT void YGNodeSetHasNewLayout(YGNodeRef node, bool hasNewLayout) {
  static_cast<yoga::Node*>(node)->setHasNewLayout(hasNewLayout);
}

YOGA_EXPORT YGNodeType YGNodeGetNodeType(YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->getNodeType();
}

YOGA_EXPORT void YGNodeSetNodeType(YGNodeRef node, YGNodeType nodeType) {
  return static_cast<yoga::Node*>(node)->setNodeType(nodeType);
}

YOGA_EXPORT bool YGNodeIsDirty(YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->isDirty();
}

YOGA_EXPORT void YGNodeMarkDirtyAndPropagateToDescendants(
    const YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->markDirtyAndPropagateDownwards();
}

int32_t gConfigInstanceCount = 0;

YOGA_EXPORT WIN_EXPORT YGNodeRef YGNodeNewWithConfig(const YGConfigRef config) {
  auto* node = new yoga::Node{static_cast<yoga::Config*>(config)};
  yoga::assertFatal(
      config != nullptr, "Tried to construct YGNode with null config");
  yoga::assertFatalWithConfig(
      config, node != nullptr, "Could not allocate memory for node");
  Event::publish<Event::NodeAllocation>(node, {config});

  return node;
}

YOGA_EXPORT YGConfigRef YGConfigGetDefault() {
  static YGConfigRef defaultConfig = YGConfigNew();
  return defaultConfig;
}

YOGA_EXPORT YGNodeRef YGNodeNew(void) {
  return YGNodeNewWithConfig(YGConfigGetDefault());
}

YOGA_EXPORT YGNodeRef YGNodeClone(YGNodeRef oldNodeRef) {
  auto oldNode = static_cast<yoga::Node*>(oldNodeRef);
  auto node = new yoga::Node(*oldNode);
  yoga::assertFatalWithConfig(
      oldNode->getConfig(),
      node != nullptr,
      "Could not allocate memory for node");
  Event::publish<Event::NodeAllocation>(node, {node->getConfig()});
  node->setOwner(nullptr);
  return node;
}

YOGA_EXPORT void YGNodeFree(const YGNodeRef nodeRef) {
  auto node = static_cast<yoga::Node*>(nodeRef);

  if (auto owner = node->getOwner()) {
    owner->removeChild(node);
    node->setOwner(nullptr);
  }

  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    auto child = node->getChild(i);
    child->setOwner(nullptr);
  }

  node->clearChildren();
  YGNodeDeallocate(node);
}

YOGA_EXPORT void YGNodeDeallocate(const YGNodeRef node) {
  Event::publish<Event::NodeDeallocation>(node, {YGNodeGetConfig(node)});
  delete static_cast<yoga::Node*>(node);
}

YOGA_EXPORT void YGNodeFreeRecursiveWithCleanupFunc(
    const YGNodeRef rootRef,
    YGNodeCleanupFunc cleanup) {
  const auto root = static_cast<yoga::Node*>(rootRef);

  uint32_t skipped = 0;
  while (YGNodeGetChildCount(root) > skipped) {
    const auto child = root->getChild(skipped);
    if (child->getOwner() != root) {
      // Don't free shared nodes that we don't own.
      skipped += 1;
    } else {
      YGNodeRemoveChild(root, child);
      YGNodeFreeRecursive(child);
    }
  }
  if (cleanup != nullptr) {
    cleanup(root);
  }
  YGNodeFree(root);
}

YOGA_EXPORT void YGNodeFreeRecursive(const YGNodeRef root) {
  return YGNodeFreeRecursiveWithCleanupFunc(root, nullptr);
}

YOGA_EXPORT void YGNodeReset(YGNodeRef node) {
  static_cast<yoga::Node*>(node)->reset();
}

YOGA_EXPORT int32_t YGConfigGetInstanceCount(void) {
  return gConfigInstanceCount;
}

YOGA_EXPORT YGConfigRef YGConfigNew(void) {
#ifdef ANDROID
  const YGConfigRef config = new yoga::Config(YGAndroidLog);
#else
  const YGConfigRef config = new yoga::Config(YGDefaultLog);
#endif
  gConfigInstanceCount++;
  return config;
}

YOGA_EXPORT void YGConfigFree(const YGConfigRef config) {
  delete static_cast<yoga::Config*>(config);
  gConfigInstanceCount--;
}

YOGA_EXPORT void YGNodeSetIsReferenceBaseline(
    YGNodeRef nodeRef,
    bool isReferenceBaseline) {
  auto node = static_cast<yoga::Node*>(nodeRef);
  if (node->isReferenceBaseline() != isReferenceBaseline) {
    node->setIsReferenceBaseline(isReferenceBaseline);
    node->markDirtyAndPropagate();
  }
}

YOGA_EXPORT bool YGNodeIsReferenceBaseline(YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->isReferenceBaseline();
}

YOGA_EXPORT void YGNodeInsertChild(
    const YGNodeRef ownerRef,
    const YGNodeRef childRef,
    const uint32_t index) {
  auto owner = static_cast<yoga::Node*>(ownerRef);
  auto child = static_cast<yoga::Node*>(childRef);

  yoga::assertFatalWithNode(
      owner,
      child->getOwner() == nullptr,
      "Child already has a owner, it must be removed first.");

  yoga::assertFatalWithNode(
      owner,
      !owner->hasMeasureFunc(),
      "Cannot add child: Nodes with measure functions cannot have children.");

  owner->insertChild(child, index);
  child->setOwner(owner);
  owner->markDirtyAndPropagate();
}

YOGA_EXPORT void YGNodeSwapChild(
    const YGNodeRef ownerRef,
    const YGNodeRef childRef,
    const uint32_t index) {
  auto owner = static_cast<yoga::Node*>(ownerRef);
  auto child = static_cast<yoga::Node*>(childRef);

  owner->replaceChild(child, index);
  child->setOwner(owner);
}

YOGA_EXPORT void YGNodeRemoveChild(
    const YGNodeRef ownerRef,
    const YGNodeRef excludedChildRef) {
  auto owner = static_cast<yoga::Node*>(ownerRef);
  auto excludedChild = static_cast<yoga::Node*>(excludedChildRef);

  if (YGNodeGetChildCount(owner) == 0) {
    // This is an empty set. Nothing to remove.
    return;
  }

  // Children may be shared between parents, which is indicated by not having an
  // owner. We only want to reset the child completely if it is owned
  // exclusively by one node.
  auto childOwner = excludedChild->getOwner();
  if (owner->removeChild(excludedChild)) {
    if (owner == childOwner) {
      excludedChild->setLayout({}); // layout is no longer valid
      excludedChild->setOwner(nullptr);
    }
    owner->markDirtyAndPropagate();
  }
}

YOGA_EXPORT void YGNodeRemoveAllChildren(const YGNodeRef ownerRef) {
  auto owner = static_cast<yoga::Node*>(ownerRef);

  const uint32_t childCount = YGNodeGetChildCount(owner);
  if (childCount == 0) {
    // This is an empty set already. Nothing to do.
    return;
  }
  auto* firstChild = owner->getChild(0);
  if (firstChild->getOwner() == owner) {
    // If the first child has this node as its owner, we assume that this child
    // set is unique.
    for (uint32_t i = 0; i < childCount; i++) {
      yoga::Node* oldChild = owner->getChild(i);
      oldChild->setLayout({}); // layout is no longer valid
      oldChild->setOwner(nullptr);
    }
    owner->clearChildren();
    owner->markDirtyAndPropagate();
    return;
  }
  // Otherwise, we are not the owner of the child set. We don't have to do
  // anything to clear it.
  owner->setChildren({});
  owner->markDirtyAndPropagate();
}

YOGA_EXPORT void YGNodeSetChildren(
    const YGNodeRef ownerRef,
    const YGNodeRef* childrenRefs,
    const uint32_t count) {
  auto owner = static_cast<yoga::Node*>(ownerRef);
  auto children = reinterpret_cast<yoga::Node* const*>(childrenRefs);

  if (!owner) {
    return;
  }

  const std::vector<yoga::Node*> childrenVector = {children, children + count};
  if (childrenVector.size() == 0) {
    if (YGNodeGetChildCount(owner) > 0) {
      for (auto* child : owner->getChildren()) {
        child->setLayout({});
        child->setOwner(nullptr);
      }
      owner->setChildren({});
      owner->markDirtyAndPropagate();
    }
  } else {
    if (YGNodeGetChildCount(owner) > 0) {
      for (auto* oldChild : owner->getChildren()) {
        // Our new children may have nodes in common with the old children. We
        // don't reset these common nodes.
        if (std::find(childrenVector.begin(), childrenVector.end(), oldChild) ==
            childrenVector.end()) {
          oldChild->setLayout({});
          oldChild->setOwner(nullptr);
        }
      }
    }
    owner->setChildren(childrenVector);
    for (yoga::Node* child : childrenVector) {
      child->setOwner(owner);
    }
    owner->markDirtyAndPropagate();
  }
}

YOGA_EXPORT YGNodeRef
YGNodeGetChild(const YGNodeRef nodeRef, const uint32_t index) {
  auto node = static_cast<yoga::Node*>(nodeRef);

  if (index < node->getChildren().size()) {
    return node->getChild(index);
  }
  return nullptr;
}

YOGA_EXPORT uint32_t YGNodeGetChildCount(const YGNodeConstRef node) {
  return static_cast<uint32_t>(
      static_cast<const yoga::Node*>(node)->getChildren().size());
}

YOGA_EXPORT YGNodeRef YGNodeGetOwner(const YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->getOwner();
}

YOGA_EXPORT YGNodeRef YGNodeGetParent(const YGNodeRef node) {
  return static_cast<yoga::Node*>(node)->getOwner();
}

YOGA_EXPORT void YGNodeMarkDirty(const YGNodeRef nodeRef) {
  auto node = static_cast<yoga::Node*>(nodeRef);

  yoga::assertFatalWithNode(
      node,
      node->hasMeasureFunc(),
      "Only leaf nodes with custom measure functions "
      "should manually mark themselves as dirty");

  node->markDirtyAndPropagate();
}

YOGA_EXPORT void YGNodeCopyStyle(
    const YGNodeRef dstNodeRef,
    const YGNodeRef srcNodeRef) {
  auto dstNode = static_cast<yoga::Node*>(dstNodeRef);
  auto srcNode = static_cast<yoga::Node*>(srcNodeRef);

  if (!(dstNode->getStyle() == srcNode->getStyle())) {
    dstNode->setStyle(srcNode->getStyle());
    dstNode->markDirtyAndPropagate();
  }
}

YOGA_EXPORT float YGNodeStyleGetFlexGrow(const YGNodeConstRef nodeRef) {
  auto node = static_cast<const yoga::Node*>(nodeRef);
  return node->getStyle().flexGrow().isUndefined()
      ? Style::DefaultFlexGrow
      : node->getStyle().flexGrow().unwrap();
}

YOGA_EXPORT float YGNodeStyleGetFlexShrink(const YGNodeConstRef nodeRef) {
  auto node = static_cast<const yoga::Node*>(nodeRef);
  return node->getStyle().flexShrink().isUndefined()
      ? (node->getConfig()->useWebDefaults() ? Style::WebDefaultFlexShrink
                                             : Style::DefaultFlexShrink)
      : node->getStyle().flexShrink().unwrap();
}

namespace {

template <typename T, typename NeedsUpdate, typename Update>
void updateStyle(
    yoga::Node* node,
    T value,
    NeedsUpdate&& needsUpdate,
    Update&& update) {
  if (needsUpdate(node->getStyle(), value)) {
    update(node->getStyle(), value);
    node->markDirtyAndPropagate();
  }
}

template <typename Ref, typename T>
void updateStyle(YGNodeRef node, Ref (Style::*prop)(), T value) {
  updateStyle(
      static_cast<yoga::Node*>(node),
      value,
      [prop](Style& s, T x) { return (s.*prop)() != x; },
      [prop](Style& s, T x) { (s.*prop)() = x; });
}

template <typename Ref, typename Idx>
void updateIndexedStyleProp(
    YGNodeRef node,
    Ref (Style::*prop)(),
    Idx idx,
    CompactValue value) {
  updateStyle(
      static_cast<yoga::Node*>(node),
      value,
      [idx, prop](Style& s, CompactValue x) { return (s.*prop)()[idx] != x; },
      [idx, prop](Style& s, CompactValue x) { (s.*prop)()[idx] = x; });
}

} // namespace

// MSVC has trouble inferring the return type of pointer to member functions
// with const and non-const overloads, instead of preferring the non-const
// overload like clang and GCC. For the purposes of updateStyle(), we can help
// MSVC by specifying that return type explicitly. In combination with
// decltype, MSVC will prefer the non-const version.
#define MSVC_HINT(PROP) decltype(Style{}.PROP())

YOGA_EXPORT void YGNodeStyleSetDirection(
    const YGNodeRef node,
    const YGDirection value) {
  updateStyle<MSVC_HINT(direction)>(node, &Style::direction, value);
}
YOGA_EXPORT YGDirection YGNodeStyleGetDirection(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)->getStyle().direction();
}

YOGA_EXPORT void YGNodeStyleSetFlexDirection(
    const YGNodeRef node,
    const YGFlexDirection flexDirection) {
  updateStyle<MSVC_HINT(flexDirection)>(
      node, &Style::flexDirection, flexDirection);
}
YOGA_EXPORT YGFlexDirection
YGNodeStyleGetFlexDirection(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)->getStyle().flexDirection();
}

YOGA_EXPORT void YGNodeStyleSetJustifyContent(
    const YGNodeRef node,
    const YGJustify justifyContent) {
  updateStyle<MSVC_HINT(justifyContent)>(
      node, &Style::justifyContent, justifyContent);
}
YOGA_EXPORT YGJustify YGNodeStyleGetJustifyContent(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)->getStyle().justifyContent();
}

YOGA_EXPORT void YGNodeStyleSetAlignContent(
    const YGNodeRef node,
    const YGAlign alignContent) {
  updateStyle<MSVC_HINT(alignContent)>(
      node, &Style::alignContent, alignContent);
}
YOGA_EXPORT YGAlign YGNodeStyleGetAlignContent(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)->getStyle().alignContent();
}

YOGA_EXPORT void YGNodeStyleSetAlignItems(
    const YGNodeRef node,
    const YGAlign alignItems) {
  updateStyle<MSVC_HINT(alignItems)>(node, &Style::alignItems, alignItems);
}
YOGA_EXPORT YGAlign YGNodeStyleGetAlignItems(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)->getStyle().alignItems();
}

YOGA_EXPORT void YGNodeStyleSetAlignSelf(
    const YGNodeRef node,
    const YGAlign alignSelf) {
  updateStyle<MSVC_HINT(alignSelf)>(node, &Style::alignSelf, alignSelf);
}
YOGA_EXPORT YGAlign YGNodeStyleGetAlignSelf(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)->getStyle().alignSelf();
}

YOGA_EXPORT void YGNodeStyleSetPositionType(
    const YGNodeRef node,
    const YGPositionType positionType) {
  updateStyle<MSVC_HINT(positionType)>(
      node, &Style::positionType, positionType);
}
YOGA_EXPORT YGPositionType
YGNodeStyleGetPositionType(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)->getStyle().positionType();
}

YOGA_EXPORT void YGNodeStyleSetFlexWrap(
    const YGNodeRef node,
    const YGWrap flexWrap) {
  updateStyle<MSVC_HINT(flexWrap)>(node, &Style::flexWrap, flexWrap);
}
YOGA_EXPORT YGWrap YGNodeStyleGetFlexWrap(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)->getStyle().flexWrap();
}

YOGA_EXPORT void YGNodeStyleSetOverflow(
    const YGNodeRef node,
    const YGOverflow overflow) {
  updateStyle<MSVC_HINT(overflow)>(node, &Style::overflow, overflow);
}
YOGA_EXPORT YGOverflow YGNodeStyleGetOverflow(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)->getStyle().overflow();
}

YOGA_EXPORT void YGNodeStyleSetDisplay(
    const YGNodeRef node,
    const YGDisplay display) {
  updateStyle<MSVC_HINT(display)>(node, &Style::display, display);
}
YOGA_EXPORT YGDisplay YGNodeStyleGetDisplay(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)->getStyle().display();
}

// TODO(T26792433): Change the API to accept FloatOptional.
YOGA_EXPORT void YGNodeStyleSetFlex(const YGNodeRef node, const float flex) {
  updateStyle<MSVC_HINT(flex)>(node, &Style::flex, FloatOptional{flex});
}

// TODO(T26792433): Change the API to accept FloatOptional.
YOGA_EXPORT float YGNodeStyleGetFlex(const YGNodeConstRef nodeRef) {
  auto node = static_cast<const yoga::Node*>(nodeRef);
  return node->getStyle().flex().isUndefined()
      ? YGUndefined
      : node->getStyle().flex().unwrap();
}

// TODO(T26792433): Change the API to accept FloatOptional.
YOGA_EXPORT void YGNodeStyleSetFlexGrow(
    const YGNodeRef node,
    const float flexGrow) {
  updateStyle<MSVC_HINT(flexGrow)>(
      node, &Style::flexGrow, FloatOptional{flexGrow});
}

// TODO(T26792433): Change the API to accept FloatOptional.
YOGA_EXPORT void YGNodeStyleSetFlexShrink(
    const YGNodeRef node,
    const float flexShrink) {
  updateStyle<MSVC_HINT(flexShrink)>(
      node, &Style::flexShrink, FloatOptional{flexShrink});
}

YOGA_EXPORT YGValue YGNodeStyleGetFlexBasis(const YGNodeConstRef node) {
  YGValue flexBasis =
      static_cast<const yoga::Node*>(node)->getStyle().flexBasis();
  if (flexBasis.unit == YGUnitUndefined || flexBasis.unit == YGUnitAuto) {
    // TODO(T26792433): Get rid off the use of YGUndefined at client side
    flexBasis.value = YGUndefined;
  }
  return flexBasis;
}

YOGA_EXPORT void YGNodeStyleSetFlexBasis(
    const YGNodeRef node,
    const float flexBasis) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(flexBasis);
  updateStyle<MSVC_HINT(flexBasis)>(node, &Style::flexBasis, value);
}

YOGA_EXPORT void YGNodeStyleSetFlexBasisPercent(
    const YGNodeRef node,
    const float flexBasisPercent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(flexBasisPercent);
  updateStyle<MSVC_HINT(flexBasis)>(node, &Style::flexBasis, value);
}

YOGA_EXPORT void YGNodeStyleSetFlexBasisAuto(const YGNodeRef node) {
  updateStyle<MSVC_HINT(flexBasis)>(
      node, &Style::flexBasis, CompactValue::ofAuto());
}

YOGA_EXPORT void YGNodeStyleSetPosition(
    YGNodeRef node,
    YGEdge edge,
    float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(position)>(
      node, &Style::position, edge, value);
}
YOGA_EXPORT void YGNodeStyleSetPositionPercent(
    YGNodeRef node,
    YGEdge edge,
    float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(position)>(
      node, &Style::position, edge, value);
}
YOGA_EXPORT YGValue YGNodeStyleGetPosition(YGNodeConstRef node, YGEdge edge) {
  return static_cast<const yoga::Node*>(node)->getStyle().position()[edge];
}

YOGA_EXPORT void YGNodeStyleSetMargin(
    YGNodeRef node,
    YGEdge edge,
    float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(margin)>(node, &Style::margin, edge, value);
}
YOGA_EXPORT void YGNodeStyleSetMarginPercent(
    YGNodeRef node,
    YGEdge edge,
    float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(margin)>(node, &Style::margin, edge, value);
}
YOGA_EXPORT void YGNodeStyleSetMarginAuto(YGNodeRef node, YGEdge edge) {
  updateIndexedStyleProp<MSVC_HINT(margin)>(
      node, &Style::margin, edge, CompactValue::ofAuto());
}
YOGA_EXPORT YGValue YGNodeStyleGetMargin(YGNodeConstRef node, YGEdge edge) {
  return static_cast<const yoga::Node*>(node)->getStyle().margin()[edge];
}

YOGA_EXPORT void YGNodeStyleSetPadding(
    YGNodeRef node,
    YGEdge edge,
    float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(padding)>(
      node, &Style::padding, edge, value);
}
YOGA_EXPORT void YGNodeStyleSetPaddingPercent(
    YGNodeRef node,
    YGEdge edge,
    float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(padding)>(
      node, &Style::padding, edge, value);
}
YOGA_EXPORT YGValue YGNodeStyleGetPadding(YGNodeConstRef node, YGEdge edge) {
  return static_cast<const yoga::Node*>(node)->getStyle().padding()[edge];
}

// TODO(T26792433): Change the API to accept FloatOptional.
YOGA_EXPORT void YGNodeStyleSetBorder(
    const YGNodeRef node,
    const YGEdge edge,
    const float border) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(border);
  updateIndexedStyleProp<MSVC_HINT(border)>(node, &Style::border, edge, value);
}

YOGA_EXPORT float YGNodeStyleGetBorder(
    const YGNodeConstRef node,
    const YGEdge edge) {
  auto border = static_cast<const yoga::Node*>(node)->getStyle().border()[edge];
  if (border.isUndefined() || border.isAuto()) {
    // TODO(T26792433): Rather than returning YGUndefined, change the api to
    // return FloatOptional.
    return YGUndefined;
  }

  return static_cast<YGValue>(border).value;
}

YOGA_EXPORT void YGNodeStyleSetGap(
    const YGNodeRef node,
    const YGGutter gutter,
    const float gapLength) {
  auto length = CompactValue::ofMaybe<YGUnitPoint>(gapLength);
  updateIndexedStyleProp<MSVC_HINT(gap)>(node, &Style::gap, gutter, length);
}

YOGA_EXPORT float YGNodeStyleGetGap(
    const YGNodeConstRef node,
    const YGGutter gutter) {
  auto gapLength =
      static_cast<const yoga::Node*>(node)->getStyle().gap()[gutter];
  if (gapLength.isUndefined() || gapLength.isAuto()) {
    // TODO(T26792433): Rather than returning YGUndefined, change the api to
    // return FloatOptional.
    return YGUndefined;
  }

  return static_cast<YGValue>(gapLength).value;
}

// Yoga specific properties, not compatible with flexbox specification

// TODO(T26792433): Change the API to accept FloatOptional.
YOGA_EXPORT float YGNodeStyleGetAspectRatio(const YGNodeConstRef node) {
  const FloatOptional op =
      static_cast<const yoga::Node*>(node)->getStyle().aspectRatio();
  return op.isUndefined() ? YGUndefined : op.unwrap();
}

// TODO(T26792433): Change the API to accept FloatOptional.
YOGA_EXPORT void YGNodeStyleSetAspectRatio(
    const YGNodeRef node,
    const float aspectRatio) {
  updateStyle<MSVC_HINT(aspectRatio)>(
      node, &Style::aspectRatio, FloatOptional{aspectRatio});
}

YOGA_EXPORT void YGNodeStyleSetWidth(YGNodeRef node, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionWidth, value);
}
YOGA_EXPORT void YGNodeStyleSetWidthPercent(YGNodeRef node, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionWidth, value);
}
YOGA_EXPORT void YGNodeStyleSetWidthAuto(YGNodeRef node) {
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionWidth, CompactValue::ofAuto());
}
YOGA_EXPORT YGValue YGNodeStyleGetWidth(YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)
      ->getStyle()
      .dimensions()[YGDimensionWidth];
}

YOGA_EXPORT void YGNodeStyleSetHeight(YGNodeRef node, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionHeight, value);
}
YOGA_EXPORT void YGNodeStyleSetHeightPercent(YGNodeRef node, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionHeight, value);
}
YOGA_EXPORT void YGNodeStyleSetHeightAuto(YGNodeRef node) {
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionHeight, CompactValue::ofAuto());
}
YOGA_EXPORT YGValue YGNodeStyleGetHeight(YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)
      ->getStyle()
      .dimensions()[YGDimensionHeight];
}

YOGA_EXPORT void YGNodeStyleSetMinWidth(
    const YGNodeRef node,
    const float minWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(minWidth);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &Style::minDimensions, YGDimensionWidth, value);
}
YOGA_EXPORT void YGNodeStyleSetMinWidthPercent(
    const YGNodeRef node,
    const float minWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(minWidth);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &Style::minDimensions, YGDimensionWidth, value);
}
YOGA_EXPORT YGValue YGNodeStyleGetMinWidth(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)
      ->getStyle()
      .minDimensions()[YGDimensionWidth];
}

YOGA_EXPORT void YGNodeStyleSetMinHeight(
    const YGNodeRef node,
    const float minHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(minHeight);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &Style::minDimensions, YGDimensionHeight, value);
}
YOGA_EXPORT void YGNodeStyleSetMinHeightPercent(
    const YGNodeRef node,
    const float minHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(minHeight);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &Style::minDimensions, YGDimensionHeight, value);
}
YOGA_EXPORT YGValue YGNodeStyleGetMinHeight(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)
      ->getStyle()
      .minDimensions()[YGDimensionHeight];
}

YOGA_EXPORT void YGNodeStyleSetMaxWidth(
    const YGNodeRef node,
    const float maxWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(maxWidth);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &Style::maxDimensions, YGDimensionWidth, value);
}
YOGA_EXPORT void YGNodeStyleSetMaxWidthPercent(
    const YGNodeRef node,
    const float maxWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(maxWidth);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &Style::maxDimensions, YGDimensionWidth, value);
}
YOGA_EXPORT YGValue YGNodeStyleGetMaxWidth(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)
      ->getStyle()
      .maxDimensions()[YGDimensionWidth];
}

YOGA_EXPORT void YGNodeStyleSetMaxHeight(
    const YGNodeRef node,
    const float maxHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(maxHeight);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &Style::maxDimensions, YGDimensionHeight, value);
}
YOGA_EXPORT void YGNodeStyleSetMaxHeightPercent(
    const YGNodeRef node,
    const float maxHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(maxHeight);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &Style::maxDimensions, YGDimensionHeight, value);
}
YOGA_EXPORT YGValue YGNodeStyleGetMaxHeight(const YGNodeConstRef node) {
  return static_cast<const yoga::Node*>(node)
      ->getStyle()
      .maxDimensions()[YGDimensionHeight];
}

#define YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName)       \
  YOGA_EXPORT type YGNodeLayoutGet##name(const YGNodeRef node) {     \
    return static_cast<yoga::Node*>(node)->getLayout().instanceName; \
  }

#define YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName) \
  YOGA_EXPORT type YGNodeLayoutGet##name(                               \
      const YGNodeRef nodeRef, const YGEdge edge) {                     \
    auto node = static_cast<yoga::Node*>(nodeRef);                      \
    yoga::assertFatalWithNode(                                          \
        node,                                                           \
        edge <= YGEdgeEnd,                                              \
        "Cannot get layout properties of multi-edge shorthands");       \
                                                                        \
    if (edge == YGEdgeStart) {                                          \
      if (node->getLayout().direction() == YGDirectionRTL) {            \
        return node->getLayout().instanceName[YGEdgeRight];             \
      } else {                                                          \
        return node->getLayout().instanceName[YGEdgeLeft];              \
      }                                                                 \
    }                                                                   \
                                                                        \
    if (edge == YGEdgeEnd) {                                            \
      if (node->getLayout().direction() == YGDirectionRTL) {            \
        return node->getLayout().instanceName[YGEdgeLeft];              \
      } else {                                                          \
        return node->getLayout().instanceName[YGEdgeRight];             \
      }                                                                 \
    }                                                                   \
                                                                        \
    return node->getLayout().instanceName[edge];                        \
  }

YG_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[YGEdgeLeft])
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[YGEdgeTop])
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[YGEdgeRight])
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[YGEdgeBottom])
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[YGDimensionWidth])
YG_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[YGDimensionHeight])
YG_NODE_LAYOUT_PROPERTY_IMPL(YGDirection, Direction, direction())
YG_NODE_LAYOUT_PROPERTY_IMPL(bool, HadOverflow, hadOverflow())

YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Margin, margin)
YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Border, border)
YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Padding, padding)

#ifdef DEBUG
YOGA_EXPORT void YGNodePrint(
    const YGNodeRef nodeRef,
    const YGPrintOptions options) {
  const auto node = static_cast<yoga::Node*>(nodeRef);
  std::string str;
  yoga::nodeToString(str, node, options, 0);
  yoga::log(node, YGLogLevelDebug, nullptr, str.c_str());
}
#endif

YOGA_EXPORT void YGConfigSetLogger(const YGConfigRef config, YGLogger logger) {
  if (logger != nullptr) {
    static_cast<yoga::Config*>(config)->setLogger(logger);
  } else {
#ifdef ANDROID
    static_cast<yoga::Config*>(config)->setLogger(&YGAndroidLog);
#else
    static_cast<yoga::Config*>(config)->setLogger(&YGDefaultLog);
#endif
  }
}

YOGA_EXPORT void YGConfigSetPointScaleFactor(
    const YGConfigRef config,
    const float pixelsInPoint) {
  yoga::assertFatalWithConfig(
      config,
      pixelsInPoint >= 0.0f,
      "Scale factor should not be less than zero");

  // We store points for Pixel as we will use it for rounding
  if (pixelsInPoint == 0.0f) {
    // Zero is used to skip rounding
    static_cast<yoga::Config*>(config)->setPointScaleFactor(0.0f);
  } else {
    static_cast<yoga::Config*>(config)->setPointScaleFactor(pixelsInPoint);
  }
}

YOGA_EXPORT float YGConfigGetPointScaleFactor(const YGConfigRef config) {
  return static_cast<yoga::Config*>(config)->getPointScaleFactor();
}

YOGA_EXPORT float YGRoundValueToPixelGrid(
    const double value,
    const double pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor) {
  return yoga::roundValueToPixelGrid(
      value, pointScaleFactor, forceCeil, forceFloor);
}

YOGA_EXPORT void YGConfigSetExperimentalFeatureEnabled(
    const YGConfigRef config,
    const YGExperimentalFeature feature,
    const bool enabled) {
  static_cast<yoga::Config*>(config)->setExperimentalFeatureEnabled(
      feature, enabled);
}

YOGA_EXPORT bool YGConfigIsExperimentalFeatureEnabled(
    const YGConfigRef config,
    const YGExperimentalFeature feature) {
  return static_cast<yoga::Config*>(config)->isExperimentalFeatureEnabled(
      feature);
}

YOGA_EXPORT void YGConfigSetUseWebDefaults(
    const YGConfigRef config,
    const bool enabled) {
  static_cast<yoga::Config*>(config)->setUseWebDefaults(enabled);
}

YOGA_EXPORT bool YGConfigGetUseLegacyStretchBehaviour(
    const YGConfigRef config) {
  return static_cast<yoga::Config*>(config)->hasErrata(
      YGErrataStretchFlexBasis);
}

YOGA_EXPORT void YGConfigSetUseLegacyStretchBehaviour(
    const YGConfigRef config,
    const bool useLegacyStretchBehaviour) {
  if (useLegacyStretchBehaviour) {
    static_cast<yoga::Config*>(config)->addErrata(YGErrataStretchFlexBasis);
  } else {
    static_cast<yoga::Config*>(config)->removeErrata(YGErrataStretchFlexBasis);
  }
}

bool YGConfigGetUseWebDefaults(const YGConfigRef config) {
  return static_cast<yoga::Config*>(config)->useWebDefaults();
}

YOGA_EXPORT void YGConfigSetContext(const YGConfigRef config, void* context) {
  static_cast<yoga::Config*>(config)->setContext(context);
}

YOGA_EXPORT void* YGConfigGetContext(const YGConfigRef config) {
  return static_cast<yoga::Config*>(config)->getContext();
}

YOGA_EXPORT void YGConfigSetErrata(YGConfigRef config, YGErrata errata) {
  static_cast<yoga::Config*>(config)->setErrata(errata);
}

YOGA_EXPORT YGErrata YGConfigGetErrata(YGConfigRef config) {
  return static_cast<yoga::Config*>(config)->getErrata();
}

YOGA_EXPORT void YGConfigSetCloneNodeFunc(
    const YGConfigRef config,
    const YGCloneNodeFunc callback) {
  static_cast<yoga::Config*>(config)->setCloneNodeCallback(callback);
}

// TODO: This should not be part of the public API. Remove after removing
// ComponentKit usage of it.
YOGA_EXPORT bool YGNodeCanUseCachedMeasurement(
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
    YGConfigRef config) {
  return yoga::canUseCachedMeasurement(
      widthMode,
      availableWidth,
      heightMode,
      availableHeight,
      lastWidthMode,
      lastAvailableWidth,
      lastHeightMode,
      lastAvailableHeight,
      lastComputedWidth,
      lastComputedHeight,
      marginRow,
      marginColumn,
      static_cast<yoga::Config*>(config));
}

YOGA_EXPORT void YGNodeCalculateLayout(
    const YGNodeRef node,
    const float ownerWidth,
    const float ownerHeight,
    const YGDirection ownerDirection) {
  YGNodeCalculateLayoutWithContext(
      node, ownerWidth, ownerHeight, ownerDirection, nullptr);
}

YOGA_EXPORT void YGNodeCalculateLayoutWithContext(
    const YGNodeRef nodeRef,
    const float ownerWidth,
    const float ownerHeight,
    const YGDirection ownerDirection,
    void* layoutContext) {
  yoga::calculateLayout(
      static_cast<Node*>(nodeRef),
      ownerWidth,
      ownerHeight,
      ownerDirection,
      layoutContext);
}
