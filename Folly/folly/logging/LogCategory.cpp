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
#include <folly/logging/LogCategory.h>

#include <cstdio>
#include <cstdlib>

#include <folly/ConstexprMath.h>
#include <folly/ExceptionString.h>
#include <folly/FileUtil.h>
#include <folly/MapUtil.h>
#include <folly/logging/LogHandler.h>
#include <folly/logging/LogMessage.h>
#include <folly/logging/LogName.h>
#include <folly/logging/LoggerDB.h>

namespace folly {

LogCategory::LogCategory(LoggerDB* db)
    : effectiveLevel_{LogLevel::ERR},
      level_{static_cast<uint32_t>(LogLevel::ERR)},
      parent_{nullptr},
      name_{},
      db_{db} {}

LogCategory::LogCategory(StringPiece name, LogCategory* parent)
    : effectiveLevel_{parent->getEffectiveLevel()},
      level_{static_cast<uint32_t>(LogLevel::MAX_LEVEL) | FLAG_INHERIT},
      parent_{parent},
      name_{LogName::canonicalize(name)},
      db_{parent->getDB()},
      nextSibling_{parent_->firstChild_} {
  parent_->firstChild_ = this;
}

void LogCategory::admitMessage(const LogMessage& message) const {
  processMessage(message);

  // If this is a fatal message, flush the handlers to make sure the log
  // message was written out, then crash.
  if (isLogLevelFatal(message.getLevel())) {
    auto numHandlers = db_->flushAllHandlers();
    if (numHandlers == 0) {
      // No log handlers were configured.
      // Print the message to stderr, to make sure we always print the reason
      // we are crashing somewhere.
      auto msg = folly::to<std::string>(
          "FATAL:",
          message.getFileName(),
          ":",
          message.getLineNumber(),
          ": ",
          message.getMessage(),
          "\n");
      folly::writeFull(STDERR_FILENO, msg.data(), msg.size());
    }
    std::abort();
  }
}

void LogCategory::processMessage(const LogMessage& message) const {
  // Make a copy of any attached LogHandlers, so we can release the handlers_
  // lock before holding them.
  //
  // In the common case there will only be a small number of handlers.  Use a
  // std::array in this case to avoid a heap allocation for the vector.
  const std::shared_ptr<LogHandler>* handlers = nullptr;
  size_t numHandlers = 0;
  constexpr uint32_t kSmallOptimizationSize = 5;
  std::array<std::shared_ptr<LogHandler>, kSmallOptimizationSize> handlersArray;
  std::vector<std::shared_ptr<LogHandler>> handlersVector;
  {
    auto lockedHandlers = handlers_.rlock();
    numHandlers = lockedHandlers->size();
    if (numHandlers <= kSmallOptimizationSize) {
      for (size_t n = 0; n < numHandlers; ++n) {
        handlersArray[n] = (*lockedHandlers)[n];
      }
      handlers = handlersArray.data();
    } else {
      handlersVector = *lockedHandlers;
      handlers = handlersVector.data();
    }
  }

  for (size_t n = 0; n < numHandlers; ++n) {
    try {
      handlers[n]->handleMessage(message, this);
    } catch (const std::exception& ex) {
      // Use LoggerDB::internalWarning() to report the error, but continue
      // trying to log the message to any other handlers attached to ourself or
      // one of our parent categories.
      LoggerDB::internalWarning(
          __FILE__,
          __LINE__,
          "log handler for category \"",
          name_,
          "\" threw an error: ",
          folly::exceptionStr(ex));
    }
  }

  // Propagate the message up to our parent LogCategory.
  //
  // Maybe in the future it might be worth adding a flag to control if a
  // LogCategory should propagate messages to its parent or not.  (This would
  // be similar to log4j's "additivity" flag.)
  // For now I don't have a strong use case for this.
  if (parent_) {
    parent_->processMessage(message);
  }
}

void LogCategory::addHandler(std::shared_ptr<LogHandler> handler) {
  auto handlers = handlers_.wlock();
  handlers->emplace_back(std::move(handler));
}

void LogCategory::clearHandlers() {
  std::vector<std::shared_ptr<LogHandler>> emptyHandlersList;
  // Swap out the handlers list with the handlers_ lock held.
  {
    auto handlers = handlers_.wlock();
    handlers->swap(emptyHandlersList);
  }
  // Destroy emptyHandlersList now that the handlers_ lock is released.
  // This way we don't hold the handlers_ lock while invoking any of the
  // LogHandler destructors.
}

std::vector<std::shared_ptr<LogHandler>> LogCategory::getHandlers() const {
  return *(handlers_.rlock());
}

void LogCategory::replaceHandlers(
    std::vector<std::shared_ptr<LogHandler>> handlers) {
  return handlers_.wlock()->swap(handlers);
}

void LogCategory::updateHandlers(const std::unordered_map<
                                 std::shared_ptr<LogHandler>,
                                 std::shared_ptr<LogHandler>>& handlerMap) {
  auto handlers = handlers_.wlock();
  for (auto& entry : *handlers) {
    auto* ptr = get_ptr(handlerMap, entry);
    if (ptr) {
      entry = *ptr;
    }
  }
}

void LogCategory::setLevel(LogLevel level, bool inherit) {
  // We have to set the level through LoggerDB, since we require holding
  // the LoggerDB lock to iterate through our children in case our effective
  // level changes.
  db_->setLevel(this, level, inherit);
}

void LogCategory::setLevelLocked(LogLevel level, bool inherit) {
  // Clamp the value to MIN_LEVEL and MAX_LEVEL.
  //
  // This makes sure that UNINITIALIZED is always less than any valid level
  // value, and that level values cannot conflict with our flag bits.
  level = constexpr_clamp(level, LogLevel::MIN_LEVEL, LogLevel::MAX_LEVEL);

  // Make sure the inherit flag is always off for the root logger.
  if (!parent_) {
    inherit = false;
  }
  auto newValue = static_cast<uint32_t>(level);
  if (inherit) {
    newValue |= FLAG_INHERIT;
  }

  // Update the stored value
  uint32_t oldValue = level_.exchange(newValue, std::memory_order_acq_rel);

  // Break out early if the value has not changed.
  if (oldValue == newValue) {
    return;
  }

  // Update the effective log level
  LogLevel newEffectiveLevel;
  if (inherit) {
    newEffectiveLevel = std::min(level, parent_->getEffectiveLevel());
  } else {
    newEffectiveLevel = level;
  }
  updateEffectiveLevel(newEffectiveLevel);
}

void LogCategory::updateEffectiveLevel(LogLevel newEffectiveLevel) {
  auto oldEffectiveLevel =
      effectiveLevel_.exchange(newEffectiveLevel, std::memory_order_acq_rel);
  // Break out early if the value did not change.
  if (newEffectiveLevel == oldEffectiveLevel) {
    return;
  }

  // Update all of the values in xlogLevels_
  for (auto* levelPtr : xlogLevels_) {
    levelPtr->store(newEffectiveLevel, std::memory_order_release);
  }

  // Update all children loggers
  LogCategory* child = firstChild_;
  while (child != nullptr) {
    child->parentLevelUpdated(newEffectiveLevel);
    child = child->nextSibling_;
  }
}

void LogCategory::parentLevelUpdated(LogLevel parentEffectiveLevel) {
  uint32_t levelValue = level_.load(std::memory_order_acquire);
  auto inherit = (levelValue & FLAG_INHERIT);
  if (!inherit) {
    return;
  }

  auto myLevel = static_cast<LogLevel>(levelValue & ~FLAG_INHERIT);
  auto newEffectiveLevel = std::min(myLevel, parentEffectiveLevel);
  updateEffectiveLevel(newEffectiveLevel);
}

void LogCategory::registerXlogLevel(std::atomic<LogLevel>* levelPtr) {
  xlogLevels_.push_back(levelPtr);
}
} // namespace folly
