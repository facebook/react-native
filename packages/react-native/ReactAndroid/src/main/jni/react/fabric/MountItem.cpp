/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MountItem.h"

namespace facebook::react {

CppMountItem CppMountItem::CreateMountItem(const ShadowView& shadowView) {
  return {CppMountItem::Type::Create, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::DeleteMountItem(const ShadowView& shadowView) {
  return {CppMountItem::Type::Delete, {}, shadowView, {}, -1};
}
CppMountItem CppMountItem::InsertMountItem(
    Tag parentTag,
    const ShadowView& shadowView,
    int index) {
  return {CppMountItem::Type::Insert, parentTag, {}, shadowView, index};
}
CppMountItem CppMountItem::RemoveMountItem(
    Tag parentTag,
    const ShadowView& shadowView,
    int index) {
  return {CppMountItem::Type::Remove, parentTag, shadowView, {}, index};
}
CppMountItem CppMountItem::UpdatePropsMountItem(
    const ShadowView& oldShadowView,
    const ShadowView& newShadowView) {
  return {
      CppMountItem::Type::UpdateProps, {}, oldShadowView, newShadowView, -1};
}
CppMountItem CppMountItem::UpdateStateMountItem(const ShadowView& shadowView) {
  return {CppMountItem::Type::UpdateState, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateLayoutMountItem(
    const ShadowView& shadowView,
    Tag parentTag) {
  return {CppMountItem::Type::UpdateLayout, parentTag, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateEventEmitterMountItem(
    const ShadowView& shadowView) {
  return {CppMountItem::Type::UpdateEventEmitter, -1, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdatePaddingMountItem(
    const ShadowView& shadowView) {
  return {CppMountItem::Type::UpdatePadding, -1, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateOverflowInsetMountItem(
    const ShadowView& shadowView) {
  return {CppMountItem::Type::UpdateOverflowInset, -1, {}, shadowView, -1};
}

} // namespace facebook::react
