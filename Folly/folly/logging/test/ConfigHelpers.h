/*
 * Copyright 2004-present Facebook, Inc.
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

#include <iosfwd>
#include <memory>

namespace folly {

class LogCategoryConfig;
class LogConfig;
class LogHandler;
class LogHandlerConfig;

/*
 * ostream<< operators so that various objects can be printed nicely in test
 * failure messages and other locations.
 */

std::ostream& operator<<(std::ostream& os, const LogConfig& config);
std::ostream& operator<<(std::ostream& os, const LogCategoryConfig& config);
std::ostream& operator<<(std::ostream& os, const LogHandlerConfig& config);

/*
 * Print std::shared_ptr<LogHandler> nicely so that unit tests matching against
 * LogCategory::getHandlers() can print output nicely.
 */
void PrintTo(const std::shared_ptr<LogHandler>& handler, std::ostream* os);

} // namespace folly
