/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TreeMutationInstruction.h"

#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

const TreeMutationInstruction TreeMutationInstruction::Insert(
  SharedShadowNode parentNode,
  SharedShadowNode childNode,
  int index
) {
  assert(parentNode);
  assert(childNode);
  assert(index != -1);

  return TreeMutationInstruction(
    Inserting,
    parentNode,
    nullptr,
    childNode,
    index
  );
}

const TreeMutationInstruction TreeMutationInstruction::Delete(
  SharedShadowNode parentNode,
  SharedShadowNode childNode,
  int index
) {
  assert(parentNode);
  assert(childNode);
  assert(index != -1);

  return TreeMutationInstruction(
    Deleting,
    parentNode,
    childNode,
    nullptr,
    index
  );
}

const TreeMutationInstruction TreeMutationInstruction::Update(
  SharedShadowNode parentNode,
  SharedShadowNode oldChildNode,
  SharedShadowNode newChildNode,
  int index
) {
  assert(parentNode);
  assert(oldChildNode);
  assert(newChildNode);
  assert(index != -1);

  return TreeMutationInstruction(
    Updating,
    parentNode,
    oldChildNode,
    newChildNode,
    index
  );
}

TreeMutationInstruction::TreeMutationInstruction(
  Type type,
  SharedShadowNode parentNode,
  SharedShadowNode oldChildNode,
  SharedShadowNode newChildNode,
  int index
):
  type_(type),
  parentNode_(parentNode),
  oldChildNode_(oldChildNode),
  newChildNode_(newChildNode),
  index_(index) {};

#pragma mark - Getters

TreeMutationInstruction::Type TreeMutationInstruction::getType() const {
  return type_;
}

SharedShadowNode TreeMutationInstruction::getParentNode() const {
  assert(parentNode_);
  return parentNode_;
}

SharedShadowNode TreeMutationInstruction::getOldChildNode() const {
  assert(oldChildNode_);
  return oldChildNode_;
}

SharedShadowNode TreeMutationInstruction::getNewChildNode() const {
  assert(newChildNode_);
  return newChildNode_;
}

int TreeMutationInstruction::getIndex() const {
  assert(index_ != -1);
  return index_;
}

#pragma mark - DebugStringConvertible

std::string TreeMutationInstruction::getDebugName() const {
  switch (type_) {
    case Inserting:
      return "Insert";
    case Deleting:
      return "Delete";
    case Updating:
      return "Update";
  }
};

SharedDebugStringConvertibleList TreeMutationInstruction::getDebugProps() const {
  DebugStringConvertibleOptions options = {.maximumDepth = 1, .format = false};

  switch (type_) {
    case Inserting:
      return SharedDebugStringConvertibleList {
        std::make_shared<DebugStringConvertibleItem>("parentNode", parentNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("childNode", newChildNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("index", std::to_string(index_))
      };
    case Deleting:
      return SharedDebugStringConvertibleList {
        std::make_shared<DebugStringConvertibleItem>("parentNode", parentNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("childNode", oldChildNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("index", std::to_string(index_))
      };
    case Updating:
      return SharedDebugStringConvertibleList {
        std::make_shared<DebugStringConvertibleItem>("parentNode", parentNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("oldChildNode", oldChildNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("newChildNode", newChildNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("index", std::to_string(index_))
      };
  }
}

} // namespace react
} // namespace facebook
