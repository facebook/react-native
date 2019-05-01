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

#include <folly/ScopeGuard.h>

#include <iostream>

/*static*/ void folly::detail::ScopeGuardImplBase::warnAboutToCrash() noexcept {
  // Ensure the availability of std::cerr
  std::ios_base::Init ioInit;
  std::cerr
      << "This program will now terminate because a folly::ScopeGuard callback "
         "threw an \nexception.\n";
}
