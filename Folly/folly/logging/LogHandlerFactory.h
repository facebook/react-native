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

#include <memory>
#include <string>
#include <unordered_map>

#include <folly/CppAttributes.h>
#include <folly/Range.h>

namespace folly {

class LogHandler;

class LogHandlerFactory {
 public:
  using Options = std::unordered_map<std::string, std::string>;

  virtual ~LogHandlerFactory() = default;

  /**
   * Get the type name of this LogHandlerFactory.
   *
   * The type field in the LogHandlerConfig for all LogHandlers created by this
   * factory should match the type of the LogHandlerFactory.
   *
   * The type of a LogHandlerFactory should never change.  The returned
   * StringPiece should be valid for the lifetime of the LogHandlerFactory.
   */
  virtual StringPiece getType() const = 0;

  /**
   * Create a new LogHandler.
   */
  virtual std::shared_ptr<LogHandler> createHandler(const Options& options) = 0;

  /**
   * Update an existing LogHandler with a new configuration.
   *
   * This may create a new LogHandler object, or it may update the existing
   * LogHandler in place.
   *
   * The returned pointer will point to the input handler if it was updated in
   * place, or will point to a new LogHandler if a new one was created.
   */
  virtual std::shared_ptr<LogHandler> updateHandler(
      FOLLY_MAYBE_UNUSED const std::shared_ptr<LogHandler>& existingHandler,
      const Options& options) {
    // Subclasses may override this with functionality to update an existing
    // handler in-place.  However, provide a default implementation that simply
    // calls createHandler() to always create a new handler object.
    return createHandler(options);
  }
};

} // namespace folly
