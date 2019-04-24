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

#include <atomic>
#include <cstdint>
#include <list>
#include <string>

#include <folly/Range.h>
#include <folly/Synchronized.h>
#include <folly/logging/LogLevel.h>

namespace folly {

class LoggerDB;
class LogHandler;
class LogMessage;

/**
 * LogCategory stores all of the logging configuration for a specific
 * log category.
 *
 * This class is separate from Logger to allow multiple Logger objects to all
 * refer to the same log category.  Logger can be thought of as a small wrapper
 * class that behaves like a pointer to a LogCategory object.
 */
class LogCategory {
 public:
  /**
   * Create the root LogCategory.
   *
   * This should generally only be invoked by LoggerDB.
   */
  explicit LogCategory(LoggerDB* db);

  /**
   * Create a new LogCategory.
   *
   * This should only be invoked by LoggerDB, while holding the main LoggerDB
   * lock.
   *
   * The name argument should already be in canonical form.
   *
   * This constructor automatically adds this new LogCategory to the parent
   * category's firstChild_ linked-list.
   */
  LogCategory(folly::StringPiece name, LogCategory* parent);

  /**
   * Get the name of this log category.
   */
  const std::string& getName() const {
    return name_;
  }

  /**
   * Get the level for this log category.
   */
  LogLevel getLevel() const {
    return static_cast<LogLevel>(
        level_.load(std::memory_order_acquire) & ~FLAG_INHERIT);
  }

  /**
   * Get the log level and inheritance flag.
   */
  std::pair<LogLevel, bool> getLevelInfo() const {
    auto value = level_.load(std::memory_order_acquire);
    return {static_cast<LogLevel>(value & ~FLAG_INHERIT),
            bool(value & FLAG_INHERIT)};
  }

  /**
   * Get the effective level for this log category.
   *
   * This is the minimum log level of this category and all of its parents.
   * Log messages below this level will be ignored, while messages at or
   * above this level need to be processed by this category or one of its
   * parents.
   */
  LogLevel getEffectiveLevel() const {
    return effectiveLevel_.load(std::memory_order_acquire);
  }

  /**
   * Get the effective log level using std::memory_order_relaxed.
   *
   * This is primarily used for log message checks.  Most other callers should
   * use getEffectiveLevel() above to be more conservative with regards to
   * memory ordering.
   */
  LogLevel getEffectiveLevelRelaxed() const {
    return effectiveLevel_.load(std::memory_order_relaxed);
  }

  /**
   * Check whether this Logger or any of its parent Loggers would do anything
   * with a log message at the given level.
   */
  bool logCheck(LogLevel level) const {
    // We load the effective level using std::memory_order_relaxed.
    //
    // We want to make log checks as lightweight as possible.  It's fine if we
    // don't immediately respond to changes made to the log level from other
    // threads.  We can wait until some other operation triggers a memory
    // barrier before we honor the new log level setting.  No other memory
    // accesses depend on the log level value.  Callers should not rely on all
    // other threads to immediately stop logging as soon as they decrease the
    // log level for a given category.
    return effectiveLevel_.load(std::memory_order_relaxed) <= level;
  }

  /**
   * Set the log level for this LogCategory.
   *
   * Messages logged to a specific log category will be ignored unless the
   * message log level is greater than the LogCategory's effective log level.
   *
   * If inherit is true, LogCategory's effective log level is the minimum of
   * its level and its parent category's effective log level.  If inherit is
   * false, the LogCategory's effective log level is simply its log level.
   * (Setting inherit to false is necessary if you want a child LogCategory to
   * use a less verbose level than its parent categories.)
   */
  void setLevel(LogLevel level, bool inherit = true);

  /**
   * Get the LoggerDB that this LogCategory belongs to.
   *
   * This is almost always the main LoggerDB singleton returned by
   * LoggerDB::get().  The logging unit tests are the main location that
   * creates alternative LoggerDB objects.
   */
  LoggerDB* getDB() const {
    return db_;
  }

  /**
   * Attach a LogHandler to this category.
   */
  void addHandler(std::shared_ptr<LogHandler> handler);

  /**
   * Remove all LogHandlers from this category.
   */
  void clearHandlers();

  /**
   * Get the list of LogHandlers attached to this category.
   */
  std::vector<std::shared_ptr<LogHandler>> getHandlers() const;

  /**
   * Replace the list of LogHandlers with a completely new list.
   */
  void replaceHandlers(std::vector<std::shared_ptr<LogHandler>> handlers);

  /**
   * Update the LogHandlers attached to this LogCategory by replacing
   * currently attached handlers with new LogHandler objects.
   *
   * The handlerMap argument is a map of (old_handler -> new_handler)
   * If any of the LogHandlers currently attached to this category are found in
   * the handlerMap, replace them with the new handler indicated in the map.
   *
   * This is used when the LogHandler configuration is changed requiring one or
   * more LogHandler objects to be replaced with new ones.
   */
  void updateHandlers(const std::unordered_map<
                      std::shared_ptr<LogHandler>,
                      std::shared_ptr<LogHandler>>& handlerMap);

  /* Internal methods for use by other parts of the logging library code */

  /**
   * Admit a message into the LogCategory hierarchy to be logged.
   *
   * The caller is responsible for having already performed log level
   * admittance checks.
   *
   * This method generally should be invoked only through the logging macros,
   * rather than calling this directly.
   */
  void admitMessage(const LogMessage& message) const;

  /**
   * Note: setLevelLocked() may only be called while holding the
   * LoggerDB loggersByName_ lock.  It is safe to call this while holding the
   * loggersByName_ lock in read-mode; holding it exclusively is not required.
   *
   * This method should only be invoked by LoggerDB.
   */
  void setLevelLocked(LogLevel level, bool inherit);

  /**
   * Register a std::atomic<LogLevel> value used by XLOG*() macros to check the
   * effective level for this category.
   *
   * The LogCategory will keep this value updated whenever its effective log
   * level changes.
   *
   * This function should only be invoked by LoggerDB, and the LoggerDB lock
   * must be held when calling it.
   */
  void registerXlogLevel(std::atomic<LogLevel>* levelPtr);

 private:
  enum : uint32_t { FLAG_INHERIT = 0x80000000 };

  // FLAG_INHERIT is the stored in the uppermost bit of the LogLevel field.
  // assert that it does not conflict with valid LogLevel values.
  static_assert(
      static_cast<uint32_t>(LogLevel::MAX_LEVEL) < FLAG_INHERIT,
      "The FLAG_INHERIT bit must not be set in any valid LogLevel value");

  // Forbidden copy constructor and assignment operator
  LogCategory(LogCategory const&) = delete;
  LogCategory& operator=(LogCategory const&) = delete;
  // Disallow moving LogCategory objects as well.
  // LogCategory objects store pointers to their parent and siblings,
  // so we cannot allow moving categories to other locations.
  LogCategory(LogCategory&&) = delete;
  LogCategory& operator=(LogCategory&&) = delete;

  void processMessage(const LogMessage& message) const;
  void updateEffectiveLevel(LogLevel newEffectiveLevel);
  void parentLevelUpdated(LogLevel parentEffectiveLevel);

  /**
   * The minimum log level of this category and all of its parents.
   */
  std::atomic<LogLevel> effectiveLevel_{LogLevel::MAX_LEVEL};

  /**
   * The current log level for this category.
   *
   * The most significant bit is used to indicate if this logger should
   * inherit its parent's effective log level.
   */
  std::atomic<uint32_t> level_{0};

  /**
   * Our parent LogCategory in the category hierarchy.
   *
   * For instance, if our log name is "foo.bar.abc", our parent category
   * is "foo.bar".
   */
  LogCategory* const parent_{nullptr};

  /**
   * Our log category name.
   */
  const std::string name_;

  /**
   * The list of LogHandlers attached to this category.
   */
  folly::Synchronized<std::vector<std::shared_ptr<LogHandler>>> handlers_;

  /**
   * A pointer to the LoggerDB that we belong to.
   *
   * This is almost always the main LoggerDB singleton.  Unit tests are the
   * main place where we use other LoggerDB objects besides the singleton.
   */
  LoggerDB* const db_{nullptr};

  /**
   * Pointers to children and sibling loggers.
   * These pointers should only ever be accessed while holding the
   * LoggerDB::loggersByName_ lock.  (These are only modified when creating new
   * loggers, which occurs with the main LoggerDB lock held.)
   */
  LogCategory* firstChild_{nullptr};
  LogCategory* nextSibling_{nullptr};

  /**
   * A list of LogLevel values used by XLOG*() statements for this LogCategory.
   * The XLOG*() statements will check these values.  We ensure they are kept
   * up-to-date each time the effective log level changes for this category.
   *
   * This list may only be accessed while holding the main LoggerDB lock.
   */
  std::vector<std::atomic<LogLevel>*> xlogLevels_;
};
} // namespace folly
