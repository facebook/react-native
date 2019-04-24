/*
 * Copyright 2012-present Facebook, Inc.
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

#include <folly/portability/Semaphore.h>

#include <folly/portability/Windows.h>

#include <errno.h>
#include <mutex>

#if _WIN32
namespace folly::portability::semaphore {
struct sem_t_ {
  std::mutex mtx{};
  HANDLE sema{INVALID_HANDLE_VALUE};
  int32_t value{0};
};

int sem_init(sem_t* s, int shared, unsigned int value) {
  // Don't support cross-process shared semaphores.
  if (shared != 0) {
    return -1;
  }
  auto sem = CreateSemaphoreA(nullptr, 0, SEM_VALUE_MAX, nullptr);
  if (sem == 0) {
    return -1;
  }
  auto ret = new sem_t_();
  ret->sema = sem;
  ret->value = value;
  *s = ret;
  return 0;
}

int sem_destroy(sem_t* s) {
  if (!CloseHandle((*s)->sema)) {
    return -1;
  }
  delete *s;
  *s = nullptr;
  return 0;
}

int sem_post(sem_t* s) {
  std::lock_guard<std::mutex> lock{(*s)->mtx};
  if ((*s)->value < SEM_VALUE_MAX) {
    if (++(*s)->value <= 0 && !ReleaseSemaphore((*s)->sema, 1, nullptr)) {
      --(*s)->value;
      errno = EINVAL;
      return -1;
    }
  } else {
    errno = ERANGE;
    return -1;
  }
  return 0;
}

int sem_trywait(sem_t* s) {
  std::lock_guard<std::mutex> lock{(*s)->mtx};
  if ((*s)->value > 0) {
    (*s)->value--;
    return 0;
  } else {
    errno = EAGAIN;
    return -1;
  }
}

int sem_wait(sem_t* s) {
  int32_t value = 0;
  {
    std::lock_guard<std::mutex> lock{(*s)->mtx};
    value = --(*s)->value;
  }

  if (value < 0) {
    if (WaitForSingleObject((*s)->sema, INFINITE) != WAIT_OBJECT_0) {
      errno = EINVAL;
      return -1;
    }
  }
  return 0;
}
} // namespace folly::portability::semaphore
#endif
