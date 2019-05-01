/*
 * Copyright 2016-present Facebook, Inc.
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

#ifndef _WIN32
#include <syslog.h>
#else

#define LOG_EMERG 1
#define LOG_ALERT 1
#define LOG_CRIT 1
#define LOG_ERR 4
#define LOG_WARNING 5
#define LOG_NOTICE 6
#define LOG_INFO 6
#define LOG_DEBUG 6

extern "C" {
// Do nothing for the system log for now.
inline void openlog(const char*, int, int) {}
inline void closelog() {}
inline void syslog(int, const char*, ...) {}
}

#endif
