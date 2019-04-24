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
/*
 * This macro enables FbSystrace usage in production for fb4a. When
 * FOLLY_SCOPED_TRACE_SECTION_HEADER is defined then a trace section is started
 * and later automatically terminated at the close of the scope it is called in.
 * In all other cases no action is taken.
 */

#pragma once

#if defined(FOLLY_SCOPED_TRACE_SECTION_HEADER)
#include FOLLY_SCOPED_TRACE_SECTION_HEADER
#else
#define FOLLY_SCOPED_TRACE_SECTION(arg, ...) \
  do {                                       \
  } while (0)
#endif
