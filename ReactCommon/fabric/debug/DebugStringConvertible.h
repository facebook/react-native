/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <vector>

namespace facebook {
namespace react {

class DebugStringConvertible;

using SharedDebugStringConvertible = std::shared_ptr<const DebugStringConvertible>;
using SharedDebugStringConvertibleList = std::vector<const SharedDebugStringConvertible>;

// Abstract class describes conformance to DebugStringConvertible concept
// and implements basic recursive debug string assembly algorithm.
// Use this as a base class for providing a debugging textual representation
// of your class.
// TODO (#26770211): Clear up the naming.
class DebugStringConvertible {

public:
  // Returns a name of the object.
  // Default implementation returns "Node".
  virtual std::string getDebugName() const;

  // Returns a value assosiate with the object.
  // Default implementation returns an empty string.
  virtual std::string getDebugValue() const;

  // Returns a list of `DebugStringConvertible` objects which can be considered
  // as *children* of the object.
  // Default implementation returns an empty list.
  virtual SharedDebugStringConvertibleList getDebugChildren() const;

  // Returns a list of `DebugStringConvertible` objects which can be considered
  // as *properties* of the object.
  // Default implementation returns an empty list.
  virtual SharedDebugStringConvertibleList getDebugProps() const;

  // Returns a string which represents the object in a human-readable way.
  // Default implementation returns a description of the subtree
  // rooted at this node, represented in XML-like format.
  virtual std::string getDebugDescription(int level = 0) const;

  // Do same as `getDebugDescription` but return only *children* and
  // *properties* parts (which are used in `getDebugDescription`).
  virtual std::string getDebugPropsDescription(int level = 0) const;
  virtual std::string getDebugChildrenDescription(int level = 0) const;
};

} // namespace react
} // namespace facebook
