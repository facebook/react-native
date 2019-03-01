/*
 * Copyright 2017 Facebook, Inc.
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

#ifndef FOLLY_URI_H_
#error This file may only be included from folly/Uri.h
#endif

#include <folly/Conv.h>

namespace folly {

template <class String>
String Uri::toString() const {
  String str;
  if (hasAuthority_) {
    toAppend(scheme_, "://", &str);
    if (!password_.empty()) {
      toAppend(username_, ":", password_, "@", &str);
    } else if (!username_.empty()) {
      toAppend(username_, "@", &str);
    }
    toAppend(host_, &str);
    if (port_ != 0) {
      toAppend(":", port_, &str);
    }
  } else {
    toAppend(scheme_, ":", &str);
  }
  toAppend(path_, &str);
  if (!query_.empty()) {
    toAppend("?", query_, &str);
  }
  if (!fragment_.empty()) {
    toAppend("#", fragment_, &str);
  }
  return str;
}

}  // namespace folly
