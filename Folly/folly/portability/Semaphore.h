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

#ifndef _WIN32
#include <semaphore.h>
#else
#include <limits.h>

#define SEM_VALUE_MAX INT_MAX
namespace folly::portability::semaphore {
using sem_t = struct sem_t_*;
int sem_init(sem_t* s, int shared, unsigned int value);
int sem_destroy(sem_t* s);
int sem_post(sem_t* s);
int sem_trywait(sem_t* s);
int sem_wait(sem_t* s);
} // namespace folly::portability::semaphore

/* using override */ using namespace folly::portability::semaphore;
#endif
