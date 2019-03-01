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


#include <folly/experimental/symbolizer/Elf.h>

#include <stdio.h>

#include <glog/logging.h>

#include <folly/portability/GFlags.h>

using namespace folly;
using namespace folly::symbolizer;

int main(int argc, char *argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  CHECK_GE(argc, 2);

  ElfFile elf(argv[1]);

  if (argc > 2) {
    auto section = elf.getSectionByName(argv[2]);
    printf("Section %s: %s\n",
           argv[2],
           (section ? "found" : "not found"));
  }

  auto sym = elf.getDefinitionByAddress(reinterpret_cast<uintptr_t>(main));
  if (sym.first) {
    printf("found %s\n", elf.getSymbolName(sym));
  } else {
    printf("main not found\n");
  }

  return 0;
}
