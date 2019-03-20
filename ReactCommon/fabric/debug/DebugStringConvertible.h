/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <climits>
#include <memory>
#include <string>
#include <vector>

namespace facebook {
namespace react {

#ifndef NDEBUG
#define RN_DEBUG_STRING_CONVERTIBLE 1
#endif

#if RN_DEBUG_STRING_CONVERTIBLE

class DebugStringConvertible;

using SharedDebugStringConvertible =
    std::shared_ptr<const DebugStringConvertible>;
using SharedDebugStringConvertibleList =
    std::vector<SharedDebugStringConvertible>;

struct DebugStringConvertibleOptions {
  bool format{true};
  int maximumDepth{INT_MAX};
};

// Abstract class describes conformance to DebugStringConvertible concept
// and implements basic recursive debug string assembly algorithm.
// Use this as a base class for providing a debugging textual representation
// of your class.
class DebugStringConvertible {
 public:
  virtual ~DebugStringConvertible() = default;

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
  virtual std::string getDebugDescription(
      DebugStringConvertibleOptions options = {},
      int depth = 0) const;

  // Do same as `getDebugDescription` but return only *children* and
  // *properties* parts (which are used in `getDebugDescription`).
  virtual std::string getDebugPropsDescription(
      DebugStringConvertibleOptions options = {},
      int depth = 0) const;
  virtual std::string getDebugChildrenDescription(
      DebugStringConvertibleOptions options = {},
      int depth = 0) const;
};

#else

class DebugStringConvertible {};

#endif

} // namespace react
} // namespace facebook
