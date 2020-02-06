/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>
#include <vector>

#include <react/core/ShadowNode.h>

namespace facebook {
namespace react {

/*
 * This is an implementation detail, do not use it directly.
 * A type-erased version of `Element<>`.
 * `ElementFragment` carries all information that is stored inside `Element<>`
 * in some generalized, type-erased manner.
 */
class ElementFragment final {
 public:
  using Shared = std::shared_ptr<ElementFragment>;
  using List = std::vector<ElementFragment>;
  using ListOfShared = std::vector<Shared>;
  using ReferenceCallback =
      std::function<void(ShadowNode::Unshared const &shadowNode)>;
  using FinalizeCallback = std::function<void(ShadowNode &shadowNode)>;

  /*
   * ComponentDescriptor part (describes the type)
   */
  ComponentHandle componentHandle;
  ComponentName componentName;

  /*
   * ShadowNodeFamily part (describes the family)
   */
  Tag tag;
  SurfaceId surfaceId;

  /*
   * ShadowNode part (describes the instance)
   */
  Props::Shared props;
  State::Shared state;
  List children;

  /*
   * Other
   */
  ReferenceCallback referenceCallback;
  FinalizeCallback finalizeCallback;
};

} // namespace react
} // namespace facebook
