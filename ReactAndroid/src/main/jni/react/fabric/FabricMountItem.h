/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/renderer/mounting/ShadowView.h>

namespace facebook {
namespace react {

struct JMountItem : public jni::JavaClass<JMountItem> {
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/fabric/mounting/mountitems/MountItem;";
};

struct CppMountItem final {
#pragma mark - Designated Initializers

  static CppMountItem CreateMountItem(ShadowView const &shadowView);

  static CppMountItem DeleteMountItem(ShadowView const &shadowView);

  static CppMountItem InsertMountItem(
      ShadowView const &parentView,
      ShadowView const &shadowView,
      int index);

  static CppMountItem RemoveMountItem(
      ShadowView const &parentView,
      ShadowView const &shadowView,
      int index);

  static CppMountItem RemoveDeleteTreeMountItem(
      ShadowView const &parentView,
      ShadowView const &shadowView,
      int index);

  static CppMountItem UpdatePropsMountItem(
      ShadowView const &oldShadowView,
      ShadowView const &newShadowView);

  static CppMountItem UpdateStateMountItem(ShadowView const &shadowView);

  static CppMountItem UpdateLayoutMountItem(
      ShadowView const &shadowView,
      ShadowView const &parentView);

  static CppMountItem UpdateEventEmitterMountItem(ShadowView const &shadowView);

  static CppMountItem UpdatePaddingMountItem(ShadowView const &shadowView);

  static CppMountItem UpdateOverflowInsetMountItem(
      ShadowView const &shadowView);

#pragma mark - Type

  enum Type {
    Undefined = -1,
    Multiple = 1,
    Create = 2,
    Delete = 4,
    Insert = 8,
    Remove = 16,
    UpdateProps = 32,
    UpdateState = 64,
    UpdateLayout = 128,
    UpdateEventEmitter = 256,
    UpdatePadding = 512,
    UpdateOverflowInset = 1024,
    RemoveDeleteTree = 2048,
    RunCPPMutations = 4096
  };

#pragma mark - Fields

  Type type = {Create};
  ShadowView parentShadowView = {};
  ShadowView oldChildShadowView = {};
  ShadowView newChildShadowView = {};
  int index = {};
};

} // namespace react
} // namespace facebook
