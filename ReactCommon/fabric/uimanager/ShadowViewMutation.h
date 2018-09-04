/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <fabric/uimanager/ShadowView.h>

namespace facebook {
namespace react {

/*
 * Describes a single native view tree mutation instruction which may contain
 * pointers to an old shadow view, a new shadow view, a parent shadow view and
 * final index of inserted or updated view.
 * Use static methods to instantiate mutations of different types.
 */
struct ShadowViewMutation final {

#pragma mark - Designated Initializers

  /*
   * Creates and returns an `Create` mutation instruction.
   */
  static ShadowViewMutation CreateMutation(
    ShadowView shadowView
  );

  /*
   * Creates and returns an `Delete` mutation instruction.
   */
  static ShadowViewMutation DeleteMutation(
    ShadowView shadowView
  );

  /*
   * Creates and returns an `Insert` mutation instruction.
   */
  static ShadowViewMutation InsertMutation(
    ShadowView parentShadowView,
    ShadowView childShadowView,
    int index
  );

  /*
   * Creates and returns a `Remove` mutation instruction.
   */
  static ShadowViewMutation RemoveMutation(
    ShadowView parentShadowView,
    ShadowView childShadowView,
    int index
  );
  
  /*
   * Creates and returns an `Update` mutation instruction.
   */
  static ShadowViewMutation UpdateMutation(
    ShadowView parentShadowView,
    ShadowView oldChildShadowView,
    ShadowView newChildShadowView,
    int index
  );

#pragma mark - Type

  enum Type {
    Create,
    Delete,
    Insert,
    Remove,
    Update
  };

#pragma mark - Fields

  Type type = {Create};
  ShadowView parentShadowView = {};
  ShadowView oldChildShadowView = {};
  ShadowView newChildShadowView = {};
  int index = {};
};

using ShadowViewMutationList = std::vector<ShadowViewMutation>;

} // namespace react
} // namespace facebook
