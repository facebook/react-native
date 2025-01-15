/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <react/renderer/mounting/ShadowView.h>

namespace facebook::react {

/*
 * Describes a single native view tree mutation which may contain
 * pointers to an old shadow view, a new shadow view, a parent shadow view and
 * final index of inserted or updated view.
 * Use static methods to instantiate mutations of different types.
 */
struct ShadowViewMutation final {
  using List = std::vector<ShadowViewMutation>;

  ShadowViewMutation() = delete;

#pragma mark - Designated Initializers

  /*
   * Creates and returns an `Create` mutation.
   */
  static ShadowViewMutation CreateMutation(ShadowView shadowView);

  /*
   * Creates and returns an `Delete` mutation.
   */
  static ShadowViewMutation DeleteMutation(ShadowView shadowView);

  /*
   * Creates and returns an `Insert` mutation.
   */
  static ShadowViewMutation InsertMutation(
      ShadowView parentShadowView,
      ShadowView childShadowView,
      int index);

  /*
   * Creates and returns a `Remove` mutation.
   */
  static ShadowViewMutation RemoveMutation(
      ShadowView parentShadowView,
      ShadowView childShadowView,
      int index);

  /*
   * Creates and returns an `Update` mutation.
   */
  static ShadowViewMutation UpdateMutation(
      ShadowView oldChildShadowView,
      ShadowView newChildShadowView,
      ShadowView parentShadowView);

#pragma mark - Type

  enum Type {
    Create = 1,
    Delete = 2,
    Insert = 4,
    Remove = 8,
    Update = 16,
  };

#pragma mark - Fields

  Type type = {Create};
  ShadowView parentShadowView = {};
  ShadowView oldChildShadowView = {};
  ShadowView newChildShadowView = {};
  int index = -1;

  // Some platforms can have the notion of virtual views - views that are in the
  // ShadowTree hierarchy but never are on the platform. Generally this is used
  // so notify the platform that a view exists so that we can keep EventEmitters
  // around, to notify JS of something. This mechanism is DEPRECATED and it is
  // highly recommended that you NOT make use of this in your platform!
  bool mutatedViewIsVirtual() const;

 private:
  ShadowViewMutation(
      Type type,
      ShadowView parentShadowView,
      ShadowView oldChildShadowView,
      ShadowView newChildShadowView,
      int index);
};

using ShadowViewMutationList = std::vector<ShadowViewMutation>;

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const ShadowViewMutation& mutation);
std::vector<DebugStringConvertibleObject> getDebugProps(
    const ShadowViewMutation& mutation,
    DebugStringConvertibleOptions options);

#endif

} // namespace facebook::react
