/*
 * Copyright 2011-present Facebook, Inc.
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

/*
 * This header defines a few very small mutex types.  These are useful
 * in highly memory-constrained environments where contention is
 * unlikely.
 *
 * Note: these locks are for use when you aren't likely to contend on
 * the critical section, or when the critical section is incredibly
 * small.  Given that, both of the locks defined in this header are
 * inherently unfair: that is, the longer a thread is waiting, the
 * longer it waits between attempts to acquire, so newer waiters are
 * more likely to get the mutex.  For the intended use-case this is
 * fine.
 *
 * @author Keith Adams <kma@fb.com>
 * @author Jordan DeLong <delong.j@fb.com>
 */

#include <folly/MicroLock.h>
#include <folly/synchronization/MicroSpinLock.h>

#include <folly/Portability.h>
#if FOLLY_X64 || FOLLY_AARCH64 || FOLLY_PPC64
#include <folly/synchronization/PicoSpinLock.h>
#endif
