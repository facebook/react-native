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

const TreeMutationInstruction TreeMutationInstruction::Create(
  SharedShadowNode node
) {
  assert(node);

  return TreeMutationInstruction(
    Creation,
    nullptr,
    nullptr,
    node,
    -1
  );
}

const TreeMutationInstruction TreeMutationInstruction::Delete(
  SharedShadowNode node
) {
  assert(node);

  return TreeMutationInstruction(
    Deletion,
    nullptr,
    node,
    nullptr,
    -1
  );
}

const TreeMutationInstruction TreeMutationInstruction::Insert(
  SharedShadowNode parentNode,
  SharedShadowNode childNode,
  int index
) {
  assert(parentNode);
  assert(childNode);
  assert(index != -1);

  return TreeMutationInstruction(
    Insertion,
    parentNode,
    nullptr,
    childNode,
    index
  );
}

const TreeMutationInstruction TreeMutationInstruction::Remove(
  SharedShadowNode parentNode,
  SharedShadowNode childNode,
  int index
) {
  assert(parentNode);
  assert(childNode);
  assert(index != -1);

  return TreeMutationInstruction(
    Removal,
    parentNode,
    childNode,
    nullptr,
    index
  );
}

const TreeMutationInstruction TreeMutationInstruction::Replace(
  SharedShadowNode parentNode,
  SharedShadowNode oldChildNode,
  SharedShadowNode newChildNode,
  int index
) {
  assert(oldChildNode);
  assert(newChildNode);

  return TreeMutationInstruction(
    Replacement,
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
    case Creation:
      return "Create";
    case Deletion:
      return "Delete";
    case Insertion:
      return "Insert";
    case Removal:
      return "Remove";
    case Replacement:
      return "Replace";
  }
};

std::string TreeMutationInstruction::getDebugValue() const {
  switch (type_) {
    case Creation:
      return "[*" + folly::to<std::string>(newChildNode_->getTag()) + "]";
    case Deletion:
      return "[~" + folly::to<std::string>(oldChildNode_->getTag()) + "]";
    case Insertion:
      return "[" + folly::to<std::string>(newChildNode_->getTag()) + "->" + folly::to<std::string>(parentNode_->getTag()) + "]";
    case Removal:
      return "[" + folly::to<std::string>(oldChildNode_->getTag()) + "<~" + folly::to<std::string>(parentNode_->getTag()) + "]";
    case Replacement:
      return "[=" + folly::to<std::string>(oldChildNode_->getTag()) + "]";
  }
};

SharedDebugStringConvertibleList TreeMutationInstruction::getDebugProps() const {
  DebugStringConvertibleOptions options = {.maximumDepth = 1, .format = false};

  switch (type_) {
    case Creation:
      return SharedDebugStringConvertibleList {
        std::make_shared<DebugStringConvertibleItem>("node", newChildNode_->getDebugDescription(options)),
      };
    case Deletion:
      return SharedDebugStringConvertibleList {
        std::make_shared<DebugStringConvertibleItem>("node", oldChildNode_->getDebugDescription(options)),
      };
    case Insertion:
      return SharedDebugStringConvertibleList {
        std::make_shared<DebugStringConvertibleItem>("parentNode", parentNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("childNode", newChildNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("index", folly::to<std::string>(index_))
      };
    case Removal:
      return SharedDebugStringConvertibleList {
        std::make_shared<DebugStringConvertibleItem>("parentNode", parentNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("childNode", oldChildNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("index", folly::to<std::string>(index_))
      };
    case Replacement:
      return SharedDebugStringConvertibleList {
        std::make_shared<DebugStringConvertibleItem>("parentNode", parentNode_ ? parentNode_->getDebugDescription(options) : "nullptr"),
        std::make_shared<DebugStringConvertibleItem>("oldChildNode", oldChildNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("newChildNode", newChildNode_->getDebugDescription(options)),
        std::make_shared<DebugStringConvertibleItem>("index", folly::to<std::string>(index_))
      };
  }
}

} // namespace react
} // namespace facebook
