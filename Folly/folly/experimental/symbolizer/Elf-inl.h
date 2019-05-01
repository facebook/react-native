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

#ifndef FOLLY_EXPERIMENTAL_SYMBOLIZER_ELF_H_
#error This file must be included from Elf.h
#endif

namespace folly {
namespace symbolizer {

template <class Fn>
const ElfPhdr* ElfFile::iterateProgramHeaders(Fn fn) const {
  // there exist ELF binaries which execute correctly, but have invalid internal
  // offset(s) to program/section headers; most probably due to invalid
  // stripping of symbols
  if (elfHeader().e_phoff + sizeof(ElfPhdr) >= length_) {
    return nullptr;
  }

  const ElfPhdr* ptr = &at<ElfPhdr>(elfHeader().e_phoff);
  for (size_t i = 0; i < elfHeader().e_phnum; i++, ptr++) {
    if (fn(*ptr)) {
      return ptr;
    }
  }
  return nullptr;
}

template <class Fn>
const ElfShdr* ElfFile::iterateSections(Fn fn) const {
  // there exist ELF binaries which execute correctly, but have invalid internal
  // offset(s) to program/section headers; most probably due to invalid
  // stripping of symbols
  if (elfHeader().e_shoff + sizeof(ElfShdr) >= length_) {
    return nullptr;
  }

  const ElfShdr* ptr = &at<ElfShdr>(elfHeader().e_shoff);
  for (size_t i = 0; i < elfHeader().e_shnum; i++, ptr++) {
    if (fn(*ptr)) {
      return ptr;
    }
  }
  return nullptr;
}

template <class Fn>
const ElfShdr* ElfFile::iterateSectionsWithType(uint32_t type, Fn fn) const {
  return iterateSections(
      [&](const ElfShdr& sh) { return sh.sh_type == type && fn(sh); });
}

template <class Fn>
const ElfShdr* ElfFile::iterateSectionsWithTypes(
    std::initializer_list<uint32_t> types,
    Fn fn) const {
  return iterateSections([&](const ElfShdr& sh) {
    auto const it = std::find(types.begin(), types.end(), sh.sh_type);
    return it != types.end() && fn(sh);
  });
}

template <class Fn>
const char* ElfFile::iterateStrings(const ElfShdr& stringTable, Fn fn) const {
  validateStringTable(stringTable);

  const char* start = file_ + stringTable.sh_offset;
  const char* end = start + stringTable.sh_size;

  const char* ptr = start;
  while (ptr != end && !fn(ptr)) {
    ptr += strlen(ptr) + 1;
  }

  return ptr != end ? ptr : nullptr;
}

template <class Fn>
const ElfSym* ElfFile::iterateSymbols(const ElfShdr& section, Fn fn) const {
  FOLLY_SAFE_CHECK(
      section.sh_entsize == sizeof(ElfSym),
      "invalid entry size in symbol table");

  const ElfSym* sym = &at<ElfSym>(section.sh_offset);
  const ElfSym* end = sym + (section.sh_size / section.sh_entsize);

  while (sym < end) {
    if (fn(*sym)) {
      return sym;
    }

    ++sym;
  }

  return nullptr;
}

template <class Fn>
const ElfSym* ElfFile::iterateSymbolsWithType(
    const ElfShdr& section,
    uint32_t type,
    Fn fn) const {
  // N.B. st_info has the same representation on 32- and 64-bit platforms
  return iterateSymbols(section, [&](const ElfSym& sym) -> bool {
    return ELF32_ST_TYPE(sym.st_info) == type && fn(sym);
  });
}

template <class Fn>
const ElfSym* ElfFile::iterateSymbolsWithTypes(
    const ElfShdr& section,
    std::initializer_list<uint32_t> types,
    Fn fn) const {
  // N.B. st_info has the same representation on 32- and 64-bit platforms
  return iterateSymbols(section, [&](const ElfSym& sym) -> bool {
    auto const elfType = ELF32_ST_TYPE(sym.st_info);
    auto const it = std::find(types.begin(), types.end(), elfType);
    return it != types.end() && fn(sym);
  });
}

} // namespace symbolizer
} // namespace folly
