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

#pragma once

#include <pthread.h>

#ifdef _WIN32
// We implement a sane comparison operand for
// pthread_t and an integer so that it may be
// compared against 0.

inline bool operator==(pthread_t ptA, unsigned int b) {
  if (ptA.p == nullptr) {
    return b == 0;
  }
  return pthread_getw32threadid_np(ptA) == b;
}

inline bool operator!=(pthread_t ptA, unsigned int b) {
  if (ptA.p == nullptr) {
    return b != 0;
  }
  return pthread_getw32threadid_np(ptA) != b;
}

inline bool operator==(pthread_t ptA, pthread_t ptB) {
  return pthread_equal(ptA, ptB) != 0;
}

inline bool operator!=(pthread_t ptA, pthread_t ptB) {
  return pthread_equal(ptA, ptB) == 0;
}

inline bool operator<(pthread_t ptA, pthread_t ptB) {
  return ptA.p < ptB.p;
}

inline bool operator!(pthread_t ptA) {
  return ptA == 0;
}

inline int pthread_attr_getstack(
    pthread_attr_t* attr,
    void** stackaddr,
    size_t* stacksize) {
  if (pthread_attr_getstackaddr(attr, stackaddr) != 0) {
    return -1;
  }
  if (pthread_attr_getstacksize(attr, stacksize) != 0) {
    return -1;
  }
  return 0;
}

inline int
pthread_attr_setstack(pthread_attr_t* attr, void* stackaddr, size_t stacksize) {
  if (pthread_attr_setstackaddr(attr, stackaddr) != 0) {
    return -1;
  }
  if (pthread_attr_setstacksize(attr, stacksize) != 0) {
    return -1;
  }
  return 0;
}

inline int pthread_attr_getguardsize(
    pthread_attr_t* /* attr */,
    size_t* guardsize) {
  *guardsize = 0;
  return 0;
}

#include <xstddef>
namespace std {
template <>
struct hash<pthread_t> {
  std::size_t operator()(const pthread_t& k) const {
    return 0 ^ std::hash<decltype(k.p)>()(k.p) ^
        std::hash<decltype(k.x)>()(k.x);
  }
};
}
#endif
