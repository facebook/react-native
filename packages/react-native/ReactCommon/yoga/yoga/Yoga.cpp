/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/Yoga-internal.h>
#include <yoga/Yoga.h>

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

bool YGFloatIsUndefined(const float value) {
  return yoga::isUndefined(value);
}

void* YGNodeGetContext(YGNodeConstRef node) {
  return resolveRef(node)->getContext();
}

void YGNodeSetContext(YGNodeRef node, void* context) {
  return resolveRef(node)->setContext(context);
}

YGConfigConstRef YGNodeGetConfig(YGNodeRef node) {
  return resolveRef(node)->getConfig();
}

void YGNodeSetConfig(YGNodeRef node, YGConfigRef config) {
  resolveRef(node)->setConfig(resolveRef(config));
}

bool YGNodeHasMeasureFunc(YGNodeConstRef node) {
  return resolveRef(node)->hasMeasureFunc();
}

void YGNodeSetMeasureFunc(YGNodeRef node, YGMeasureFunc measureFunc) {
  resolveRef(node)->setMeasureFunc(measureFunc);
}

bool YGNodeHasBaselineFunc(YGNodeConstRef node) {
  return resolveRef(node)->hasBaselineFunc();
}

void YGNodeSetBaselineFunc(YGNodeRef node, YGBaselineFunc baselineFunc) {
  resolveRef(node)->setBaselineFunc(baselineFunc);
}

YGDirtiedFunc YGNodeGetDirtiedFunc(YGNodeConstRef node) {
  return resolveRef(node)->getDirtiedFunc();
}

void YGNodeSetDirtiedFunc(YGNodeRef node, YGDirtiedFunc dirtiedFunc) {
  resolveRef(node)->setDirtiedFunc(dirtiedFunc);
}

void YGNodeSetPrintFunc(YGNodeRef node, YGPrintFunc printFunc) {
  resolveRef(node)->setPrintFunc(printFunc);
}

bool YGNodeGetHasNewLayout(YGNodeConstRef node) {
  return resolveRef(node)->getHasNewLayout();
}

void YGConfigSetPrintTreeFlag(YGConfigRef config, bool enabled) {
  resolveRef(config)->setShouldPrintTree(enabled);
}

void YGNodeSetHasNewLayout(YGNodeRef node, bool hasNewLayout) {
  resolveRef(node)->setHasNewLayout(hasNewLayout);
}

YGNodeType YGNodeGetNodeType(YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getNodeType());
}

void YGNodeSetNodeType(YGNodeRef node, YGNodeType nodeType) {
  return resolveRef(node)->setNodeType(scopedEnum(nodeType));
}

bool YGNodeIsDirty(YGNodeConstRef node) {
  return resolveRef(node)->isDirty();
}

void YGNodeMarkDirtyAndPropagateToDescendants(const YGNodeRef node) {
  return resolveRef(node)->markDirtyAndPropagateDownwards();
}

YGNodeRef YGNodeNewWithConfig(const YGConfigConstRef config) {
  auto* node = new yoga::Node{resolveRef(config)};
  yoga::assertFatal(
      config != nullptr, "Tried to construct YGNode with null config");
  Event::publish<Event::NodeAllocation>(node, {config});

  return node;
}

YGConfigConstRef YGConfigGetDefault() {
  return &yoga::Config::getDefault();
}

YGNodeRef YGNodeNew(void) {
  return YGNodeNewWithConfig(YGConfigGetDefault());
}

YGNodeRef YGNodeClone(YGNodeConstRef oldNodeRef) {
  auto oldNode = resolveRef(oldNodeRef);
  const auto node = new yoga::Node(*oldNode);
  yoga::assertFatalWithConfig(
      oldNode->getConfig(),
      node != nullptr,
      "Could not allocate memory for node");
  Event::publish<Event::NodeAllocation>(node, {node->getConfig()});
  node->setOwner(nullptr);
  return node;
}

void YGNodeFree(const YGNodeRef nodeRef) {
  const auto node = resolveRef(nodeRef);

  if (auto owner = node->getOwner()) {
    owner->removeChild(node);
    node->setOwner(nullptr);
  }

  const size_t childCount = node->getChildCount();
  for (size_t i = 0; i < childCount; i++) {
    auto child = node->getChild(i);
    child->setOwner(nullptr);
  }

  node->clearChildren();
  YGNodeDeallocate(node);
}

void YGNodeDeallocate(const YGNodeRef node) {
  Event::publish<Event::NodeDeallocation>(node, {YGNodeGetConfig(node)});
  delete resolveRef(node);
}

void YGNodeFreeRecursiveWithCleanupFunc(
    const YGNodeRef rootRef,
    YGNodeCleanupFunc cleanup) {
  const auto root = resolveRef(rootRef);

  size_t skipped = 0;
  while (root->getChildCount() > skipped) {
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

void YGNodeFreeRecursive(const YGNodeRef root) {
  return YGNodeFreeRecursiveWithCleanupFunc(root, nullptr);
}

void YGNodeReset(YGNodeRef node) {
  resolveRef(node)->reset();
}

YGConfigRef YGConfigNew(void) {
  return new yoga::Config(getDefaultLogger());
}

void YGConfigFree(const YGConfigRef config) {
  delete resolveRef(config);
}

void YGNodeSetIsReferenceBaseline(YGNodeRef nodeRef, bool isReferenceBaseline) {
  const auto node = resolveRef(nodeRef);
  if (node->isReferenceBaseline() != isReferenceBaseline) {
    node->setIsReferenceBaseline(isReferenceBaseline);
    node->markDirtyAndPropagate();
  }
}

bool YGNodeIsReferenceBaseline(YGNodeConstRef node) {
  return resolveRef(node)->isReferenceBaseline();
}

void YGNodeInsertChild(
    const YGNodeRef ownerRef,
    const YGNodeRef childRef,
    const size_t index) {
  auto owner = resolveRef(ownerRef);
  auto child = resolveRef(childRef);

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

void YGNodeSwapChild(
    const YGNodeRef ownerRef,
    const YGNodeRef childRef,
    const size_t index) {
  auto owner = resolveRef(ownerRef);
  auto child = resolveRef(childRef);

  owner->replaceChild(child, index);
  child->setOwner(owner);
}

void YGNodeRemoveChild(
    const YGNodeRef ownerRef,
    const YGNodeRef excludedChildRef) {
  auto owner = resolveRef(ownerRef);
  auto excludedChild = resolveRef(excludedChildRef);

  if (owner->getChildCount() == 0) {
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

void YGNodeRemoveAllChildren(const YGNodeRef ownerRef) {
  auto owner = resolveRef(ownerRef);

  const size_t childCount = owner->getChildCount();
  if (childCount == 0) {
    // This is an empty set already. Nothing to do.
    return;
  }
  auto* firstChild = owner->getChild(0);
  if (firstChild->getOwner() == owner) {
    // If the first child has this node as its owner, we assume that this child
    // set is unique.
    for (size_t i = 0; i < childCount; i++) {
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

void YGNodeSetChildren(
    const YGNodeRef ownerRef,
    const YGNodeRef* childrenRefs,
    const size_t count) {
  auto owner = resolveRef(ownerRef);
  auto children = reinterpret_cast<yoga::Node* const*>(childrenRefs);

  if (!owner) {
    return;
  }

  const std::vector<yoga::Node*> childrenVector = {children, children + count};
  if (childrenVector.size() == 0) {
    if (owner->getChildCount() > 0) {
      for (auto* child : owner->getChildren()) {
        child->setLayout({});
        child->setOwner(nullptr);
      }
      owner->setChildren({});
      owner->markDirtyAndPropagate();
    }
  } else {
    if (owner->getChildCount() > 0) {
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

YGNodeRef YGNodeGetChild(const YGNodeRef nodeRef, const size_t index) {
  const auto node = resolveRef(nodeRef);

  if (index < node->getChildren().size()) {
    return node->getChild(index);
  }
  return nullptr;
}

size_t YGNodeGetChildCount(const YGNodeConstRef node) {
  return resolveRef(node)->getChildren().size();
}

YGNodeRef YGNodeGetOwner(const YGNodeRef node) {
  return resolveRef(node)->getOwner();
}

YGNodeRef YGNodeGetParent(const YGNodeRef node) {
  return resolveRef(node)->getOwner();
}

void YGNodeMarkDirty(const YGNodeRef nodeRef) {
  const auto node = resolveRef(nodeRef);

  yoga::assertFatalWithNode(
      node,
      node->hasMeasureFunc(),
      "Only leaf nodes with custom measure functions "
      "should manually mark themselves as dirty");

  node->markDirtyAndPropagate();
}

void YGNodeCopyStyle(
    const YGNodeRef dstNodeRef,
    const YGNodeConstRef srcNodeRef) {
  auto dstNode = resolveRef(dstNodeRef);
  auto srcNode = resolveRef(srcNodeRef);

  if (!(dstNode->getStyle() == srcNode->getStyle())) {
    dstNode->setStyle(srcNode->getStyle());
    dstNode->markDirtyAndPropagate();
  }
}

float YGNodeStyleGetFlexGrow(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->getStyle().flexGrow().isUndefined()
      ? Style::DefaultFlexGrow
      : node->getStyle().flexGrow().unwrap();
}

float YGNodeStyleGetFlexShrink(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
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
      resolveRef(node),
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
      resolveRef(node),
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

void YGNodeStyleSetDirection(const YGNodeRef node, const YGDirection value) {
  updateStyle<MSVC_HINT(direction)>(node, &Style::direction, value);
}
YGDirection YGNodeStyleGetDirection(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().direction();
}

void YGNodeStyleSetFlexDirection(
    const YGNodeRef node,
    const YGFlexDirection flexDirection) {
  updateStyle<MSVC_HINT(flexDirection)>(
      node, &Style::flexDirection, flexDirection);
}
YGFlexDirection YGNodeStyleGetFlexDirection(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().flexDirection();
}

void YGNodeStyleSetJustifyContent(
    const YGNodeRef node,
    const YGJustify justifyContent) {
  updateStyle<MSVC_HINT(justifyContent)>(
      node, &Style::justifyContent, justifyContent);
}
YGJustify YGNodeStyleGetJustifyContent(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().justifyContent();
}

void YGNodeStyleSetAlignContent(
    const YGNodeRef node,
    const YGAlign alignContent) {
  updateStyle<MSVC_HINT(alignContent)>(
      node, &Style::alignContent, alignContent);
}
YGAlign YGNodeStyleGetAlignContent(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().alignContent();
}

void YGNodeStyleSetAlignItems(const YGNodeRef node, const YGAlign alignItems) {
  updateStyle<MSVC_HINT(alignItems)>(node, &Style::alignItems, alignItems);
}
YGAlign YGNodeStyleGetAlignItems(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().alignItems();
}

void YGNodeStyleSetAlignSelf(const YGNodeRef node, const YGAlign alignSelf) {
  updateStyle<MSVC_HINT(alignSelf)>(node, &Style::alignSelf, alignSelf);
}
YGAlign YGNodeStyleGetAlignSelf(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().alignSelf();
}

void YGNodeStyleSetPositionType(
    const YGNodeRef node,
    const YGPositionType positionType) {
  updateStyle<MSVC_HINT(positionType)>(
      node, &Style::positionType, positionType);
}
YGPositionType YGNodeStyleGetPositionType(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().positionType();
}

void YGNodeStyleSetFlexWrap(const YGNodeRef node, const YGWrap flexWrap) {
  updateStyle<MSVC_HINT(flexWrap)>(node, &Style::flexWrap, flexWrap);
}
YGWrap YGNodeStyleGetFlexWrap(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().flexWrap();
}

void YGNodeStyleSetOverflow(const YGNodeRef node, const YGOverflow overflow) {
  updateStyle<MSVC_HINT(overflow)>(node, &Style::overflow, overflow);
}
YGOverflow YGNodeStyleGetOverflow(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().overflow();
}

void YGNodeStyleSetDisplay(const YGNodeRef node, const YGDisplay display) {
  updateStyle<MSVC_HINT(display)>(node, &Style::display, display);
}
YGDisplay YGNodeStyleGetDisplay(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().display();
}

// TODO(T26792433): Change the API to accept FloatOptional.
void YGNodeStyleSetFlex(const YGNodeRef node, const float flex) {
  updateStyle<MSVC_HINT(flex)>(node, &Style::flex, FloatOptional{flex});
}

// TODO(T26792433): Change the API to accept FloatOptional.
float YGNodeStyleGetFlex(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->getStyle().flex().isUndefined()
      ? YGUndefined
      : node->getStyle().flex().unwrap();
}

// TODO(T26792433): Change the API to accept FloatOptional.
void YGNodeStyleSetFlexGrow(const YGNodeRef node, const float flexGrow) {
  updateStyle<MSVC_HINT(flexGrow)>(
      node, &Style::flexGrow, FloatOptional{flexGrow});
}

// TODO(T26792433): Change the API to accept FloatOptional.
void YGNodeStyleSetFlexShrink(const YGNodeRef node, const float flexShrink) {
  updateStyle<MSVC_HINT(flexShrink)>(
      node, &Style::flexShrink, FloatOptional{flexShrink});
}

YGValue YGNodeStyleGetFlexBasis(const YGNodeConstRef node) {
  YGValue flexBasis = resolveRef(node)->getStyle().flexBasis();
  if (flexBasis.unit == YGUnitUndefined || flexBasis.unit == YGUnitAuto) {
    // TODO(T26792433): Get rid off the use of YGUndefined at client side
    flexBasis.value = YGUndefined;
  }
  return flexBasis;
}

void YGNodeStyleSetFlexBasis(const YGNodeRef node, const float flexBasis) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(flexBasis);
  updateStyle<MSVC_HINT(flexBasis)>(node, &Style::flexBasis, value);
}

void YGNodeStyleSetFlexBasisPercent(
    const YGNodeRef node,
    const float flexBasisPercent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(flexBasisPercent);
  updateStyle<MSVC_HINT(flexBasis)>(node, &Style::flexBasis, value);
}

void YGNodeStyleSetFlexBasisAuto(const YGNodeRef node) {
  updateStyle<MSVC_HINT(flexBasis)>(
      node, &Style::flexBasis, CompactValue::ofAuto());
}

void YGNodeStyleSetPosition(YGNodeRef node, YGEdge edge, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(position)>(
      node, &Style::position, edge, value);
}
void YGNodeStyleSetPositionPercent(YGNodeRef node, YGEdge edge, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(position)>(
      node, &Style::position, edge, value);
}
YGValue YGNodeStyleGetPosition(YGNodeConstRef node, YGEdge edge) {
  return resolveRef(node)->getStyle().position()[edge];
}

void YGNodeStyleSetMargin(YGNodeRef node, YGEdge edge, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(margin)>(node, &Style::margin, edge, value);
}
void YGNodeStyleSetMarginPercent(YGNodeRef node, YGEdge edge, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(margin)>(node, &Style::margin, edge, value);
}
void YGNodeStyleSetMarginAuto(YGNodeRef node, YGEdge edge) {
  updateIndexedStyleProp<MSVC_HINT(margin)>(
      node, &Style::margin, edge, CompactValue::ofAuto());
}
YGValue YGNodeStyleGetMargin(YGNodeConstRef node, YGEdge edge) {
  return resolveRef(node)->getStyle().margin()[edge];
}

void YGNodeStyleSetPadding(YGNodeRef node, YGEdge edge, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(padding)>(
      node, &Style::padding, edge, value);
}
void YGNodeStyleSetPaddingPercent(YGNodeRef node, YGEdge edge, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(padding)>(
      node, &Style::padding, edge, value);
}
YGValue YGNodeStyleGetPadding(YGNodeConstRef node, YGEdge edge) {
  return resolveRef(node)->getStyle().padding()[edge];
}

// TODO(T26792433): Change the API to accept FloatOptional.
void YGNodeStyleSetBorder(
    const YGNodeRef node,
    const YGEdge edge,
    const float border) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(border);
  updateIndexedStyleProp<MSVC_HINT(border)>(node, &Style::border, edge, value);
}

float YGNodeStyleGetBorder(const YGNodeConstRef node, const YGEdge edge) {
  auto border = resolveRef(node)->getStyle().border()[edge];
  if (border.isUndefined() || border.isAuto()) {
    // TODO(T26792433): Rather than returning YGUndefined, change the api to
    // return FloatOptional.
    return YGUndefined;
  }

  return static_cast<YGValue>(border).value;
}

void YGNodeStyleSetGap(
    const YGNodeRef node,
    const YGGutter gutter,
    const float gapLength) {
  auto length = CompactValue::ofMaybe<YGUnitPoint>(gapLength);
  updateIndexedStyleProp<MSVC_HINT(gap)>(node, &Style::gap, gutter, length);
}

float YGNodeStyleGetGap(const YGNodeConstRef node, const YGGutter gutter) {
  auto gapLength = resolveRef(node)->getStyle().gap()[gutter];
  if (gapLength.isUndefined() || gapLength.isAuto()) {
    // TODO(T26792433): Rather than returning YGUndefined, change the api to
    // return FloatOptional.
    return YGUndefined;
  }

  return static_cast<YGValue>(gapLength).value;
}

// Yoga specific properties, not compatible with flexbox specification

// TODO(T26792433): Change the API to accept FloatOptional.
float YGNodeStyleGetAspectRatio(const YGNodeConstRef node) {
  const FloatOptional op = resolveRef(node)->getStyle().aspectRatio();
  return op.isUndefined() ? YGUndefined : op.unwrap();
}

// TODO(T26792433): Change the API to accept FloatOptional.
void YGNodeStyleSetAspectRatio(const YGNodeRef node, const float aspectRatio) {
  updateStyle<MSVC_HINT(aspectRatio)>(
      node, &Style::aspectRatio, FloatOptional{aspectRatio});
}

void YGNodeStyleSetWidth(YGNodeRef node, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionWidth, value);
}
void YGNodeStyleSetWidthPercent(YGNodeRef node, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionWidth, value);
}
void YGNodeStyleSetWidthAuto(YGNodeRef node) {
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionWidth, CompactValue::ofAuto());
}
YGValue YGNodeStyleGetWidth(YGNodeConstRef node) {
  return resolveRef(node)->getStyle().dimensions()[YGDimensionWidth];
}

void YGNodeStyleSetHeight(YGNodeRef node, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionHeight, value);
}
void YGNodeStyleSetHeightPercent(YGNodeRef node, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionHeight, value);
}
void YGNodeStyleSetHeightAuto(YGNodeRef node) {
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &Style::dimensions, YGDimensionHeight, CompactValue::ofAuto());
}
YGValue YGNodeStyleGetHeight(YGNodeConstRef node) {
  return resolveRef(node)->getStyle().dimensions()[YGDimensionHeight];
}

void YGNodeStyleSetMinWidth(const YGNodeRef node, const float minWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(minWidth);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &Style::minDimensions, YGDimensionWidth, value);
}
void YGNodeStyleSetMinWidthPercent(const YGNodeRef node, const float minWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(minWidth);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &Style::minDimensions, YGDimensionWidth, value);
}
YGValue YGNodeStyleGetMinWidth(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().minDimensions()[YGDimensionWidth];
}

void YGNodeStyleSetMinHeight(const YGNodeRef node, const float minHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(minHeight);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &Style::minDimensions, YGDimensionHeight, value);
}
void YGNodeStyleSetMinHeightPercent(
    const YGNodeRef node,
    const float minHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(minHeight);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &Style::minDimensions, YGDimensionHeight, value);
}
YGValue YGNodeStyleGetMinHeight(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().minDimensions()[YGDimensionHeight];
}

void YGNodeStyleSetMaxWidth(const YGNodeRef node, const float maxWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(maxWidth);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &Style::maxDimensions, YGDimensionWidth, value);
}
void YGNodeStyleSetMaxWidthPercent(const YGNodeRef node, const float maxWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(maxWidth);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &Style::maxDimensions, YGDimensionWidth, value);
}
YGValue YGNodeStyleGetMaxWidth(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().maxDimensions()[YGDimensionWidth];
}

void YGNodeStyleSetMaxHeight(const YGNodeRef node, const float maxHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(maxHeight);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &Style::maxDimensions, YGDimensionHeight, value);
}
void YGNodeStyleSetMaxHeightPercent(
    const YGNodeRef node,
    const float maxHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(maxHeight);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &Style::maxDimensions, YGDimensionHeight, value);
}
YGValue YGNodeStyleGetMaxHeight(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().maxDimensions()[YGDimensionHeight];
}

#define YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type YGNodeLayoutGet##name(const YGNodeConstRef node) {      \
    return resolveRef(node)->getLayout().instanceName;         \
  }

#define YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName) \
  type YGNodeLayoutGet##name(                                           \
      const YGNodeConstRef nodeRef, const YGEdge edge) {                \
    const auto node = resolveRef(nodeRef);                              \
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
void YGNodePrint(const YGNodeConstRef node, const YGPrintOptions options) {
  yoga::print(resolveRef(node), scopedEnum(options));
}
#endif

void YGConfigSetLogger(const YGConfigRef config, YGLogger logger) {
  if (logger != nullptr) {
    resolveRef(config)->setLogger(logger);
  } else {
    resolveRef(config)->setLogger(getDefaultLogger());
  }
}

void YGConfigSetPointScaleFactor(
    const YGConfigRef config,
    const float pixelsInPoint) {
  yoga::assertFatalWithConfig(
      resolveRef(config),
      pixelsInPoint >= 0.0f,
      "Scale factor should not be less than zero");

  // We store points for Pixel as we will use it for rounding
  if (pixelsInPoint == 0.0f) {
    // Zero is used to skip rounding
    resolveRef(config)->setPointScaleFactor(0.0f);
  } else {
    resolveRef(config)->setPointScaleFactor(pixelsInPoint);
  }
}

float YGConfigGetPointScaleFactor(const YGConfigConstRef config) {
  return resolveRef(config)->getPointScaleFactor();
}

float YGRoundValueToPixelGrid(
    const double value,
    const double pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor) {
  return yoga::roundValueToPixelGrid(
      value, pointScaleFactor, forceCeil, forceFloor);
}

void YGConfigSetExperimentalFeatureEnabled(
    const YGConfigRef config,
    const YGExperimentalFeature feature,
    const bool enabled) {
  resolveRef(config)->setExperimentalFeatureEnabled(
      scopedEnum(feature), enabled);
}

bool YGConfigIsExperimentalFeatureEnabled(
    const YGConfigConstRef config,
    const YGExperimentalFeature feature) {
  return resolveRef(config)->isExperimentalFeatureEnabled(scopedEnum(feature));
}

void YGConfigSetUseWebDefaults(const YGConfigRef config, const bool enabled) {
  resolveRef(config)->setUseWebDefaults(enabled);
}

bool YGConfigGetUseWebDefaults(const YGConfigConstRef config) {
  return resolveRef(config)->useWebDefaults();
}

void YGConfigSetContext(const YGConfigRef config, void* context) {
  resolveRef(config)->setContext(context);
}

void* YGConfigGetContext(const YGConfigConstRef config) {
  return resolveRef(config)->getContext();
}

void YGConfigSetErrata(YGConfigRef config, YGErrata errata) {
  resolveRef(config)->setErrata(scopedEnum(errata));
}

YGErrata YGConfigGetErrata(YGConfigConstRef config) {
  return unscopedEnum(resolveRef(config)->getErrata());
}

void YGConfigSetCloneNodeFunc(
    const YGConfigRef config,
    const YGCloneNodeFunc callback) {
  resolveRef(config)->setCloneNodeCallback(callback);
}

// TODO: This should not be part of the public API. Remove after removing
// ComponentKit usage of it.
bool YGNodeCanUseCachedMeasurement(
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
      scopedEnum(widthMode),
      availableWidth,
      scopedEnum(heightMode),
      availableHeight,
      scopedEnum(lastWidthMode),
      lastAvailableWidth,
      scopedEnum(lastHeightMode),
      lastAvailableHeight,
      lastComputedWidth,
      lastComputedHeight,
      marginRow,
      marginColumn,
      resolveRef(config));
}

void YGNodeCalculateLayout(
    const YGNodeRef node,
    const float ownerWidth,
    const float ownerHeight,
    const YGDirection ownerDirection) {
  yoga::calculateLayout(
      resolveRef(node), ownerWidth, ownerHeight, ownerDirection);
}
