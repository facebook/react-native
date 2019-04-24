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
#include <folly/logging/LoggerDB.h>

#include <set>

#include <folly/CPortability.h>
#include <folly/Conv.h>
#include <folly/FileUtil.h>
#include <folly/String.h>
#include <folly/logging/LogCategory.h>
#include <folly/logging/LogConfig.h>
#include <folly/logging/LogHandler.h>
#include <folly/logging/LogHandlerFactory.h>
#include <folly/logging/LogLevel.h>
#include <folly/logging/Logger.h>
#include <folly/logging/RateLimiter.h>
#include <folly/logging/StreamHandlerFactory.h>

using std::string;

namespace folly {

/*
 * The default implementation of initializeLoggerDB().
 *
 * This is defined as a weak symbol to allow programs to provide their own
 * alternative definition if desired.
 */
FOLLY_ATTR_WEAK void initializeLoggerDB(LoggerDB& db) {
  // Register the StreamHandlerFactory
  //
  // This is the only LogHandlerFactory that we register by default.  We
  // intentionally do not register FileHandlerFactory, since this allows
  // LoggerDB::updateConfig() to open and write to arbitrary files.  This is
  // potentially a security concern if programs accept user-customizable log
  // configuration settings from untrusted sources.
  //
  // Users can always register additional LogHandlerFactory objects on their
  // own inside their main() function.
  db.registerHandlerFactory(std::make_unique<StreamHandlerFactory>());

  // Build a default LogConfig object.
  // This writes messages to stderr synchronously (immediately, in the thread
  // that generated the message), using the default GLOG-style formatter.
  auto defaultHandlerConfig =
      LogHandlerConfig("stream", {{"stream", "stderr"}, {"async", "false"}});
  auto rootCategoryConfig =
      LogCategoryConfig(kDefaultLogLevel, false, {"default"});
  LogConfig config(
      /* handlerConfigs */ {{"default", defaultHandlerConfig}},
      /* categoryConfig */ {{"", rootCategoryConfig}});

  // Update the configuration
  db.updateConfig(config);
}

namespace {
class LoggerDBSingleton {
 public:
  explicit LoggerDBSingleton(LoggerDB* FOLLY_NONNULL db) : db_{db} {
    // Call initializeLoggerDB() to apply some basic initial configuration.
    initializeLoggerDB(*db_);
  }

  ~LoggerDBSingleton() {
    // We intentionally leak the LoggerDB object on normal destruction.
    // We want Logger objects to remain valid for the entire lifetime of the
    // program, without having to worry about destruction ordering issues, or
    // making the Logger perform reference counting on the LoggerDB.
    //
    // Therefore the main LoggerDB object, and all of the LogCategory objects
    // it contains, are always intentionally leaked.
    //
    // However, we do call db_->cleanupHandlers() to destroy any registered
    // LogHandler objects.  The LogHandlers can be user-defined objects and may
    // hold resources that should be cleaned up.  This also ensures that the
    // LogHandlers flush all outstanding messages before we exit.
    db_->cleanupHandlers();

    // Store the released pointer in a static variable just to prevent ASAN
    // from complaining that we are leaking data.
    static LoggerDB* db = db_.release();
    (void)db;
  }

  LoggerDB& getDB() const {
    return *db_;
  }

 private:
  // Store LoggerDB as a unique_ptr so it will be automatically destroyed if
  // initializeLoggerDB() throws in the constructor.  We will explicitly
  // release this during the normal destructor.
  std::unique_ptr<LoggerDB> db_;
};
} // namespace

LoggerDB& LoggerDB::get() {
  // Intentionally leaky singleton
  static LoggerDBSingleton singleton{new LoggerDB()};
  return singleton.getDB();
}

LoggerDB::LoggerDB() {
  // Create the root log category and set its log level
  auto rootUptr = std::make_unique<LogCategory>(this);
  LogCategory* root = rootUptr.get();
  auto ret =
      loggersByName_.wlock()->emplace(root->getName(), std::move(rootUptr));
  DCHECK(ret.second);

  root->setLevelLocked(kDefaultLogLevel, false);
}

LoggerDB::LoggerDB(TestConstructorArg) : LoggerDB() {}

LoggerDB::~LoggerDB() {}

LogCategory* LoggerDB::getCategory(StringPiece name) {
  return getOrCreateCategoryLocked(*loggersByName_.wlock(), name);
}

LogCategory* FOLLY_NULLABLE LoggerDB::getCategoryOrNull(StringPiece name) {
  auto loggersByName = loggersByName_.rlock();

  auto it = loggersByName->find(name);
  if (it == loggersByName->end()) {
    return nullptr;
  }
  return it->second.get();
}

void LoggerDB::setLevel(folly::StringPiece name, LogLevel level, bool inherit) {
  auto loggersByName = loggersByName_.wlock();
  LogCategory* category = getOrCreateCategoryLocked(*loggersByName, name);
  category->setLevelLocked(level, inherit);
}

void LoggerDB::setLevel(LogCategory* category, LogLevel level, bool inherit) {
  auto loggersByName = loggersByName_.wlock();
  category->setLevelLocked(level, inherit);
}

LogConfig LoggerDB::getConfig() const {
  return getConfigImpl(/* includeAllCategories = */ false);
}

LogConfig LoggerDB::getFullConfig() const {
  return getConfigImpl(/* includeAllCategories = */ true);
}

LogConfig LoggerDB::getConfigImpl(bool includeAllCategories) const {
  auto handlerInfo = handlerInfo_.rlock();

  LogConfig::HandlerConfigMap handlerConfigs;
  std::unordered_map<std::shared_ptr<LogHandler>, string> handlersToName;
  for (const auto& entry : handlerInfo->handlers) {
    auto handler = entry.second.lock();
    if (!handler) {
      continue;
    }
    handlersToName.emplace(handler, entry.first);
    handlerConfigs.emplace(entry.first, handler->getConfig());
  }

  size_t anonymousNameIndex = 1;
  auto generateAnonymousHandlerName = [&]() {
    // Return a unique name of the form "anonymousHandlerN"
    // Keep incrementing N until we find a name that isn't currently taken.
    while (true) {
      auto name = to<string>("anonymousHandler", anonymousNameIndex);
      ++anonymousNameIndex;
      if (handlerInfo->handlers.find(name) == handlerInfo->handlers.end()) {
        return name;
      }
    }
  };

  LogConfig::CategoryConfigMap categoryConfigs;
  {
    auto loggersByName = loggersByName_.rlock();
    for (const auto& entry : *loggersByName) {
      auto* category = entry.second.get();
      auto levelInfo = category->getLevelInfo();
      auto handlers = category->getHandlers();

      // Don't report categories that have default settings
      // if includeAllCategories is false
      if (!includeAllCategories && handlers.empty() &&
          levelInfo.first == LogLevel::MAX_LEVEL && levelInfo.second) {
        continue;
      }

      // Translate the handler pointers to names
      std::vector<string> handlerNames;
      for (const auto& handler : handlers) {
        auto iter = handlersToName.find(handler);
        if (iter == handlersToName.end()) {
          // This LogHandler must have been manually attached to the category,
          // rather than defined with `updateConfig()` or `resetConfig()`.
          // Generate a unique name to use for reporting it in the config.
          auto name = generateAnonymousHandlerName();
          handlersToName.emplace(handler, name);
          handlerConfigs.emplace(name, handler->getConfig());
          handlerNames.emplace_back(name);
        } else {
          handlerNames.emplace_back(iter->second);
        }
      }

      LogCategoryConfig categoryConfig(
          levelInfo.first, levelInfo.second, handlerNames);
      categoryConfigs.emplace(category->getName(), std::move(categoryConfig));
    }
  }

  return LogConfig{std::move(handlerConfigs), std::move(categoryConfigs)};
}

/**
 * Process handler config information when starting a config update operation.
 */
void LoggerDB::startConfigUpdate(
    const Synchronized<HandlerInfo>::LockedPtr& handlerInfo,
    const LogConfig& config,
    NewHandlerMap* handlers,
    OldToNewHandlerMap* oldToNewHandlerMap) {
  // Get a map of all currently existing LogHandlers.
  // This resolves weak_ptrs to shared_ptrs, and ignores expired weak_ptrs.
  // This prevents any of these LogHandler pointers from expiring during the
  // config update.
  for (const auto& entry : handlerInfo->handlers) {
    auto handler = entry.second.lock();
    if (handler) {
      handlers->emplace(entry.first, std::move(handler));
    }
  }

  // Create all of the new LogHandlers needed from this configuration
  for (const auto& entry : config.getHandlerConfigs()) {
    // Check to see if there is an existing LogHandler with this name
    std::shared_ptr<LogHandler> oldHandler;
    auto iter = handlers->find(entry.first);
    if (iter != handlers->end()) {
      oldHandler = iter->second;
    }

    LogHandlerConfig updatedConfig;
    const LogHandlerConfig* handlerConfig;
    if (entry.second.type.hasValue()) {
      handlerConfig = &entry.second;
    } else {
      // This configuration is intended to update an existing LogHandler
      if (!oldHandler) {
        throw std::invalid_argument(to<std::string>(
            "cannot update unknown log handler \"", entry.first, "\""));
      }

      updatedConfig = oldHandler->getConfig();
      if (!updatedConfig.type.hasValue()) {
        // This normally should not happen unless someone improperly manually
        // constructed a LogHandler object.  All existing LogHandler objects
        // should indicate their type.
        throw std::invalid_argument(to<std::string>(
            "existing log handler \"",
            entry.first,
            "\" is missing type information"));
      }
      updatedConfig.update(entry.second);
      handlerConfig = &updatedConfig;
    }

    // Look up the LogHandlerFactory
    auto factoryIter = handlerInfo->factories.find(handlerConfig->type.value());
    if (factoryIter == handlerInfo->factories.end()) {
      throw std::invalid_argument(to<std::string>(
          "unknown log handler type \"", handlerConfig->type.value(), "\""));
    }

    // Create the new log handler
    const auto& factory = factoryIter->second;
    std::shared_ptr<LogHandler> handler;
    try {
      if (oldHandler) {
        handler = factory->updateHandler(oldHandler, handlerConfig->options);
        if (handler != oldHandler) {
          oldToNewHandlerMap->emplace(oldHandler, handler);
        }
      } else {
        handler = factory->createHandler(handlerConfig->options);
      }
    } catch (const std::exception& ex) {
      // Errors creating or updating the the log handler are generally due to
      // bad configuration options.  It is useful to update the exception
      // message to include the name of the log handler we were trying to
      // update or create.
      throw std::invalid_argument(to<string>(
          "error ",
          oldHandler ? "updating" : "creating",
          " log handler \"",
          entry.first,
          "\": ",
          exceptionStr(ex)));
    }
    handlerInfo->handlers[entry.first] = handler;
    (*handlers)[entry.first] = handler;
  }

  // Before we start making any LogCategory changes, confirm that all handlers
  // named in the category configs are known handlers.
  for (const auto& entry : config.getCategoryConfigs()) {
    if (!entry.second.handlers.hasValue()) {
      continue;
    }
    for (const auto& handlerName : entry.second.handlers.value()) {
      auto iter = handlers->find(handlerName);
      if (iter == handlers->end()) {
        throw std::invalid_argument(to<std::string>(
            "unknown log handler \"",
            handlerName,
            "\" configured for log category \"",
            entry.first,
            "\""));
      }
    }
  }
}

/**
 * Update handlerInfo_ at the end of a config update operation.
 */
void LoggerDB::finishConfigUpdate(
    const Synchronized<HandlerInfo>::LockedPtr& handlerInfo,
    NewHandlerMap* handlers,
    OldToNewHandlerMap* oldToNewHandlerMap) {
  // Build a new map to replace handlerInfo->handlers
  // This will contain only the LogHandlers that are still in use by the
  // current LogCategory settings.
  std::unordered_map<std::string, std::weak_ptr<LogHandler>> newHandlerMap;
  for (const auto& entry : *handlers) {
    newHandlerMap.emplace(entry.first, entry.second);
  }
  // Drop all of our shared_ptr references to LogHandler objects,
  // and then remove entries in newHandlerMap that are unreferenced.
  handlers->clear();
  oldToNewHandlerMap->clear();
  handlerInfo->handlers.clear();
  for (auto iter = newHandlerMap.begin(); iter != newHandlerMap.end(); /**/) {
    if (iter->second.expired()) {
      iter = newHandlerMap.erase(iter);
    } else {
      ++iter;
    }
  }
  handlerInfo->handlers.swap(newHandlerMap);
}

std::vector<std::shared_ptr<LogHandler>> LoggerDB::buildCategoryHandlerList(
    const NewHandlerMap& handlerMap,
    StringPiece categoryName,
    const std::vector<std::string>& categoryHandlerNames) {
  std::vector<std::shared_ptr<LogHandler>> catHandlers;
  for (const auto& handlerName : categoryHandlerNames) {
    auto iter = handlerMap.find(handlerName);
    if (iter == handlerMap.end()) {
      // This really shouldn't be possible; the checks in startConfigUpdate()
      // should have already bailed out if there was an unknown handler.
      throw std::invalid_argument(to<std::string>(
          "bug: unknown log handler \"",
          handlerName,
          "\" configured for log category \"",
          categoryName,
          "\""));
    }
    catHandlers.push_back(iter->second);
  }

  return catHandlers;
}

void LoggerDB::updateConfig(const LogConfig& config) {
  // Grab the handlerInfo_ lock.
  // We hold it in write mode for the entire config update operation.  This
  // ensures that only a single config update operation ever runs at once.
  auto handlerInfo = handlerInfo_.wlock();

  NewHandlerMap handlers;
  OldToNewHandlerMap oldToNewHandlerMap;
  startConfigUpdate(handlerInfo, config, &handlers, &oldToNewHandlerMap);

  // If an existing LogHandler was replaced with a new one,
  // walk all current LogCategories and replace this handler.
  if (!oldToNewHandlerMap.empty()) {
    auto loggerMap = loggersByName_.rlock();
    for (const auto& entry : *loggerMap) {
      entry.second->updateHandlers(oldToNewHandlerMap);
    }
  }

  // Update log levels and handlers mentioned in the config update
  auto loggersByName = loggersByName_.wlock();
  for (const auto& entry : config.getCategoryConfigs()) {
    LogCategory* category =
        getOrCreateCategoryLocked(*loggersByName, entry.first);

    // Update the log handlers
    if (entry.second.handlers.hasValue()) {
      auto catHandlers = buildCategoryHandlerList(
          handlers, entry.first, entry.second.handlers.value());
      category->replaceHandlers(std::move(catHandlers));
    }

    // Update the level settings
    category->setLevelLocked(
        entry.second.level, entry.second.inheritParentLevel);
  }

  finishConfigUpdate(handlerInfo, &handlers, &oldToNewHandlerMap);
}

void LoggerDB::resetConfig(const LogConfig& config) {
  // Grab the handlerInfo_ lock.
  // We hold it in write mode for the entire config update operation.  This
  // ensures that only a single config update operation ever runs at once.
  auto handlerInfo = handlerInfo_.wlock();

  NewHandlerMap handlers;
  OldToNewHandlerMap oldToNewHandlerMap;
  startConfigUpdate(handlerInfo, config, &handlers, &oldToNewHandlerMap);

  // Make sure all log categories mentioned in the new config exist.
  // This ensures that we will cover them in our walk below.
  LogCategory* rootCategory;
  {
    auto loggersByName = loggersByName_.wlock();
    rootCategory = getOrCreateCategoryLocked(*loggersByName, "");
    for (const auto& entry : config.getCategoryConfigs()) {
      getOrCreateCategoryLocked(*loggersByName, entry.first);
    }
  }

  {
    // Update all log categories
    auto loggersByName = loggersByName_.rlock();
    for (const auto& entry : *loggersByName) {
      auto* category = entry.second.get();

      auto configIter = config.getCategoryConfigs().find(category->getName());
      if (configIter == config.getCategoryConfigs().end()) {
        // This category is not listed in the config settings.
        // Reset it to the default settings.
        category->clearHandlers();

        if (category == rootCategory) {
          category->setLevelLocked(kDefaultLogLevel, false);
        } else {
          category->setLevelLocked(LogLevel::MAX_LEVEL, true);
        }
        continue;
      }

      const auto& catConfig = configIter->second;

      // Update the category log level
      category->setLevelLocked(catConfig.level, catConfig.inheritParentLevel);

      // Update the category handlers list.
      // If the handler list is not set in the config, clear out any existing
      // handlers rather than leaving it as-is.
      std::vector<std::shared_ptr<LogHandler>> catHandlers;
      if (catConfig.handlers.hasValue()) {
        catHandlers = buildCategoryHandlerList(
            handlers, entry.first, catConfig.handlers.value());
      }
      category->replaceHandlers(std::move(catHandlers));
    }
  }

  finishConfigUpdate(handlerInfo, &handlers, &oldToNewHandlerMap);
}

LogCategory* LoggerDB::getOrCreateCategoryLocked(
    LoggerNameMap& loggersByName,
    StringPiece name) {
  auto it = loggersByName.find(name);
  if (it != loggersByName.end()) {
    return it->second.get();
  }

  StringPiece parentName = LogName::getParent(name);
  LogCategory* parent = getOrCreateCategoryLocked(loggersByName, parentName);
  return createCategoryLocked(loggersByName, name, parent);
}

LogCategory* LoggerDB::createCategoryLocked(
    LoggerNameMap& loggersByName,
    StringPiece name,
    LogCategory* parent) {
  auto uptr = std::make_unique<LogCategory>(name, parent);
  LogCategory* logger = uptr.get();
  auto ret = loggersByName.emplace(logger->getName(), std::move(uptr));
  DCHECK(ret.second);
  return logger;
}

void LoggerDB::cleanupHandlers() {
  // Get a copy of all categories, so we can call clearHandlers() without
  // holding the loggersByName_ lock.  We don't need to worry about LogCategory
  // lifetime, since LogCategory objects always live for the lifetime of the
  // LoggerDB.
  std::vector<LogCategory*> categories;
  {
    auto loggersByName = loggersByName_.wlock();
    categories.reserve(loggersByName->size());
    for (const auto& entry : *loggersByName) {
      categories.push_back(entry.second.get());
    }
  }

  // Also extract our HandlerFactoryMap and HandlerMap, so we can clear them
  // later without holding the handlerInfo_ lock.
  HandlerFactoryMap factories;
  HandlerMap handlers;
  {
    auto handlerInfo = handlerInfo_.wlock();
    factories.swap(handlerInfo->factories);
    handlers.swap(handlerInfo->handlers);
  }

  // Remove all of the LogHandlers from all log categories,
  // to drop any shared_ptr references to the LogHandlers
  for (auto* category : categories) {
    category->clearHandlers();
  }
}

size_t LoggerDB::flushAllHandlers() {
  // Build a set of all LogHandlers.  We use a set to avoid calling flush()
  // more than once on the same handler if it is registered on multiple
  // different categories.
  std::set<std::shared_ptr<LogHandler>> handlers;
  {
    auto loggersByName = loggersByName_.wlock();
    for (const auto& entry : *loggersByName) {
      for (const auto& handler : entry.second->getHandlers()) {
        handlers.emplace(handler);
      }
    }
  }

  // Call flush() on each handler
  for (const auto& handler : handlers) {
    handler->flush();
  }
  return handlers.size();
}

void LoggerDB::registerHandlerFactory(
    std::unique_ptr<LogHandlerFactory> factory,
    bool replaceExisting) {
  auto type = factory->getType();
  auto handlerInfo = handlerInfo_.wlock();
  if (replaceExisting) {
    handlerInfo->factories[type.str()] = std::move(factory);
  } else {
    auto ret = handlerInfo->factories.emplace(type.str(), std::move(factory));
    if (!ret.second) {
      throw std::range_error(to<std::string>(
          "a LogHandlerFactory for the type \"", type, "\" already exists"));
    }
  }
}

void LoggerDB::unregisterHandlerFactory(StringPiece type) {
  auto handlerInfo = handlerInfo_.wlock();
  auto numRemoved = handlerInfo->factories.erase(type.str());
  if (numRemoved != 1) {
    throw std::range_error(
        to<std::string>("no LogHandlerFactory for type \"", type, "\" found"));
  }
}

LogLevel LoggerDB::xlogInit(
    StringPiece categoryName,
    std::atomic<LogLevel>* xlogCategoryLevel,
    LogCategory** xlogCategory) {
  // Hold the lock for the duration of the operation
  // xlogInit() may be called from multiple threads simultaneously.
  // Only one needs to perform the initialization.
  auto loggersByName = loggersByName_.wlock();
  if (xlogCategory != nullptr && *xlogCategory != nullptr) {
    // The xlogCategory was already initialized before we acquired the lock
    return (*xlogCategory)->getEffectiveLevel();
  }

  auto* category = getOrCreateCategoryLocked(*loggersByName, categoryName);
  if (xlogCategory) {
    // Set *xlogCategory before we update xlogCategoryLevel below.
    // This is important, since the XLOG() macros check xlogCategoryLevel to
    // tell if *xlogCategory has been initialized yet.
    *xlogCategory = category;
  }
  auto level = category->getEffectiveLevel();
  xlogCategoryLevel->store(level, std::memory_order_release);
  category->registerXlogLevel(xlogCategoryLevel);
  return level;
}

LogCategory* LoggerDB::xlogInitCategory(
    StringPiece categoryName,
    LogCategory** xlogCategory,
    std::atomic<bool>* isInitialized) {
  // Hold the lock for the duration of the operation
  // xlogInitCategory() may be called from multiple threads simultaneously.
  // Only one needs to perform the initialization.
  auto loggersByName = loggersByName_.wlock();
  if (isInitialized->load(std::memory_order_acquire)) {
    // The xlogCategory was already initialized before we acquired the lock
    return *xlogCategory;
  }

  auto* category = getOrCreateCategoryLocked(*loggersByName, categoryName);
  *xlogCategory = category;
  isInitialized->store(true, std::memory_order_release);
  return category;
}

std::atomic<LoggerDB::InternalWarningHandler> LoggerDB::warningHandler_;

void LoggerDB::internalWarningImpl(
    folly::StringPiece filename,
    int lineNumber,
    std::string&& msg) noexcept {
  auto handler = warningHandler_.load();
  if (handler) {
    handler(filename, lineNumber, std::move(msg));
  } else {
    defaultInternalWarningImpl(filename, lineNumber, std::move(msg));
  }
}

void LoggerDB::setInternalWarningHandler(InternalWarningHandler handler) {
  // This API is intentionally pretty basic.  It has a number of limitations:
  //
  // - We only support plain function pointers, and not full std::function
  //   objects.  This makes it possible to use std::atomic to access the
  //   handler pointer, and also makes it safe to store in a zero-initialized
  //   file-static pointer.
  //
  // - We don't support any void* argument to the handler.  The caller is
  //   responsible for storing any callback state themselves.
  //
  // - When replacing or unsetting a handler we don't make any guarantees about
  //   when the old handler will stop being called.  It may still be called
  //   from other threads briefly even after setInternalWarningHandler()
  //   returns.  This is also a consequence of using std::atomic rather than a
  //   full lock.
  //
  // This provides the minimum capabilities needed to customize the handler,
  // while still keeping the implementation simple and safe to use even before
  // main().
  warningHandler_.store(handler);
}

void LoggerDB::defaultInternalWarningImpl(
    folly::StringPiece filename,
    int lineNumber,
    std::string&& msg) noexcept {
  // Rate limit to 10 messages every 5 seconds.
  //
  // We intentonally use a leaky Meyer's singleton here over folly::Singleton:
  // - We want this code to work even before main()
  // - This singleton does not depend on any other singletons.
  static auto* rateLimiter =
      new logging::IntervalRateLimiter{10, std::chrono::seconds(5)};
  if (!rateLimiter->check()) {
    return;
  }

  if (folly::kIsDebug) {
    // Write directly to file descriptor 2.
    //
    // It's possible the application has closed fd 2 and is using it for
    // something other than stderr.  However we have no good way to detect
    // this, which is the main reason we only write to stderr in debug build
    // modes.  assert() also writes directly to stderr on failure, which seems
    // like a reasonable precedent.
    //
    // Another option would be to use openlog() and syslog().  However
    // calling openlog() may inadvertently affect the behavior of other parts
    // of the program also using syslog().
    //
    // We don't check for write errors here, since there's not much else we can
    // do if it fails.
    auto fullMsg = folly::to<std::string>(
        "logging warning:", filename, ":", lineNumber, ": ", msg, "\n");
    folly::writeFull(STDERR_FILENO, fullMsg.data(), fullMsg.size());
  }
}
} // namespace folly
