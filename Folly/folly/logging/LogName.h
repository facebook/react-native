/*
 * Copyright 2017-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#pragma once

#include <folly/Range.h>

namespace folly {

/**
 * The LogName class contains utility functions for processing log category
 * names.  It primarily handles canonicalization of names.
 *
 * For instance, "foo.bar", "foo/bar", "foo..bar", and ".foo.bar..." all refer
 * to the same log category.
 */
class LogName {
 public:
  /**
   * Return a canonicalized version of the log name.
   *
   * '/' and '\\' characters are converted to '.', then leading and trailing
   * '.' characters are removed, and all sequences of consecutive '.'
   * characters are replaced with a single '.'
   */
  static std::string canonicalize(folly::StringPiece name);

  /**
   * Hash a log name.
   *
   * The log name does not need to be pre-canonicalized.
   * The hash for equivalent log names will always be equal.
   */
  static size_t hash(folly::StringPiece name);

  /**
   * Compare two log names.
   *
   * The log name does not need to be pre-canonicalized.
   * Returns 0 if and only if the two names refer to the same log category.
   * Otherwise, returns -1 if the canonical version of nameA is less than the
   * canonical version of nameB.
   */
  static int cmp(folly::StringPiece nameA, folly::StringPiece nameB);

  /**
   * Get the name of the parent log category.
   *
   * Returns a StringPiece pointing into the input data.
   * As a result, the parent log name may not be canonical if the input log
   * name is not already canonical.
   *
   * If the input log name refers to the root log category, an empty
   * StringPiece will be returned.
   */
  static folly::StringPiece getParent(folly::StringPiece name);

  /**
   * Hash functor that can be used with standard library containers.
   */
  struct Hash {
    size_t operator()(folly::StringPiece key) const {
      return LogName::hash(key);
    }
  };

  /**
   * Equality functor that can be used with standard library containers.
   */
  struct Equals {
    bool operator()(folly::StringPiece a, folly::StringPiece b) const {
      return LogName::cmp(a, b) == 0;
    }
  };
};
} // namespace folly
