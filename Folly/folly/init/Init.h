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

/*
 * Calls common init functions in the necessary order
 * Among other things, this ensures that folly::Singletons are initialized
 * correctly and installs signal handlers for a superior debugging experience.
 * It also initializes gflags and glog.
 *
 * @param argc, argv   arguments to your main
 * @param removeFlags  if true, will update argc,argv to remove recognized
 *                     gflags passed on the command line
 */
namespace folly {

void init(int* argc, char*** argv, bool removeFlags = true);

} // folly
