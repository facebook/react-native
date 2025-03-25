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
    const ShadowView& parentView,
    const ShadowView& shadowView,
    int index) {
  return {CppMountItem::Type::Insert, parentView, {}, shadowView, index};
}
CppMountItem CppMountItem::RemoveMountItem(
    const ShadowView& parentView,
    const ShadowView& shadowView,
    int index) {
  return {CppMountItem::Type::Remove, parentView, shadowView, {}, index};
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
    const ShadowView& parentView) {
  return {CppMountItem::Type::UpdateLayout, parentView, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateEventEmitterMountItem(
    const ShadowView& shadowView) {
  return {CppMountItem::Type::UpdateEventEmitter, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdatePaddingMountItem(
    const ShadowView& shadowView) {
  return {CppMountItem::Type::UpdatePadding, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateOverflowInsetMountItem(
    const ShadowView& shadowView) {
  return {CppMountItem::Type::UpdateOverflowInset, {}, {}, shadowView, -1};
}

} // namespace facebook::react
