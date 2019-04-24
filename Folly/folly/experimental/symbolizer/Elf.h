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

// ELF file parser

#pragma once
#define FOLLY_EXPERIMENTAL_SYMBOLIZER_ELF_H_

#include <elf.h>
#include <link.h> // For ElfW()

#include <cstdio>
#include <initializer_list>
#include <stdexcept>
#include <system_error>

#include <folly/Conv.h>
#include <folly/Likely.h>
#include <folly/Range.h>
#include <folly/lang/SafeAssert.h>

namespace folly {
namespace symbolizer {

using ElfAddr = ElfW(Addr);
using ElfEhdr = ElfW(Ehdr);
using ElfOff = ElfW(Off);
using ElfPhdr = ElfW(Phdr);
using ElfShdr = ElfW(Shdr);
using ElfSym = ElfW(Sym);

/**
 * ELF file parser.
 *
 * We handle native files only (32-bit files on a 32-bit platform, 64-bit files
 * on a 64-bit platform), and only executables (ET_EXEC) and shared objects
 * (ET_DYN).
 */
class ElfFile {
 public:
  ElfFile() noexcept;

  // Note: may throw, call openNoThrow() explicitly if you don't want to throw
  explicit ElfFile(const char* name, bool readOnly = true);

  // Open the ELF file.
  // Returns 0 on success, kSystemError (guaranteed to be -1) (and sets errno)
  // on IO error, kInvalidElfFile (and sets errno to EINVAL) for an invalid
  // Elf file. On error, if msg is not nullptr, sets *msg to a static string
  // indicating what failed.
  enum {
    kSuccess = 0,
    kSystemError = -1,
    kInvalidElfFile = -2,
  };
  // Open the ELF file. Does not throw on error.
  int openNoThrow(
      const char* name,
      bool readOnly = true,
      const char** msg = nullptr) noexcept;

  // Like openNoThrow, but follow .gnu_debuglink if present
  int openAndFollow(
      const char* name,
      bool readOnly = true,
      const char** msg = nullptr) noexcept;

  // Open the ELF file. Throws on error.
  void open(const char* name, bool readOnly = true);

  ~ElfFile();

  ElfFile(ElfFile&& other) noexcept;
  ElfFile& operator=(ElfFile&& other);

  /** Retrieve the ELF header */
  const ElfEhdr& elfHeader() const {
    return at<ElfEhdr>(0);
  }

  /**
   * Get the base address, the address where the file should be loaded if
   * no relocations happened.
   */
  uintptr_t getBaseAddress() const {
    return baseAddress_;
  }

  /** Find a section given its name */
  const ElfShdr* getSectionByName(const char* name) const;

  /** Find a section given its index in the section header table */
  const ElfShdr* getSectionByIndex(size_t idx) const;

  /** Retrieve the name of a section */
  const char* getSectionName(const ElfShdr& section) const;

  /** Get the actual section body */
  folly::StringPiece getSectionBody(const ElfShdr& section) const;

  /** Retrieve a string from a string table section */
  const char* getString(const ElfShdr& stringTable, size_t offset) const;

  /**
   * Iterate over all strings in a string table section for as long as
   * fn(str) returns false.
   * Returns the current ("found") string when fn returned true, or nullptr
   * if fn returned false for all strings in the table.
   */
  template <class Fn>
  const char* iterateStrings(const ElfShdr& stringTable, Fn fn) const;

  /**
   * Iterate over program headers as long as fn(section) returns false.
   * Returns a pointer to the current ("found") section when fn returned
   * true, or nullptr if fn returned false for all sections.
   */
  template <class Fn>
  const ElfPhdr* iterateProgramHeaders(Fn fn) const;

  /**
   * Iterate over all sections for as long as fn(section) returns false.
   * Returns a pointer to the current ("found") section when fn returned
   * true, or nullptr if fn returned false for all sections.
   */
  template <class Fn>
  const ElfShdr* iterateSections(Fn fn) const;

  /**
   * Iterate over all sections with a given type. Similar to
   * iterateSections(), but filtered only for sections with the given type.
   */
  template <class Fn>
  const ElfShdr* iterateSectionsWithType(uint32_t type, Fn fn) const;

  /**
   * Iterate over all sections with a given types. Similar to
   * iterateSectionWithTypes(), but filtered on multiple types.
   */
  template <class Fn>
  const ElfShdr* iterateSectionsWithTypes(
      std::initializer_list<uint32_t> types,
      Fn fn) const;

  /**
   * Iterate over all symbols witin a given section.
   *
   * Returns a pointer to the current ("found") symbol when fn returned true,
   * or nullptr if fn returned false for all symbols.
   */
  template <class Fn>
  const ElfSym* iterateSymbols(const ElfShdr& section, Fn fn) const;
  template <class Fn>
  const ElfSym*
  iterateSymbolsWithType(const ElfShdr& section, uint32_t type, Fn fn) const;
  template <class Fn>
  const ElfSym* iterateSymbolsWithTypes(
      const ElfShdr& section,
      std::initializer_list<uint32_t> types,
      Fn fn) const;

  /**
   * Find symbol definition by address.
   * Note that this is the file virtual address, so you need to undo
   * any relocation that might have happened.
   *
   * Returns {nullptr, nullptr} if not found.
   */
  typedef std::pair<const ElfShdr*, const ElfSym*> Symbol;
  Symbol getDefinitionByAddress(uintptr_t address) const;

  /**
   * Find symbol definition by name.
   *
   * If a symbol with this name cannot be found, a <nullptr, nullptr> Symbol
   * will be returned. This is O(N) in the number of symbols in the file.
   *
   * Returns {nullptr, nullptr} if not found.
   */
  Symbol getSymbolByName(const char* name) const;

  /**
   * Get the value of a symbol.
   */
  template <class T>
  const T& getSymbolValue(const ElfSym* symbol) const {
    const ElfShdr* section = getSectionByIndex(symbol->st_shndx);
    FOLLY_SAFE_CHECK(section, "Symbol's section index is invalid");

    return valueAt<T>(*section, symbol->st_value);
  }

  /**
   * Get the value of the object stored at the given address.
   *
   * This is the function that you want to use in conjunction with
   * getSymbolValue() to follow pointers. For example, to get the value of
   * a char* symbol, you'd do something like this:
   *
   *  auto sym = getSymbolByName("someGlobalValue");
   *  auto addr = getSymbolValue<ElfAddr>(sym.second);
   *  const char* str = &getSymbolValue<const char>(addr);
   */
  template <class T>
  const T& getAddressValue(const ElfAddr addr) const {
    const ElfShdr* section = getSectionContainingAddress(addr);
    FOLLY_SAFE_CHECK(section, "Address does not refer to existing section");

    return valueAt<T>(*section, addr);
  }

  /**
   * Retrieve symbol name.
   */
  const char* getSymbolName(Symbol symbol) const;

  /** Find the section containing the given address */
  const ElfShdr* getSectionContainingAddress(ElfAddr addr) const;

 private:
  bool init(const char** msg);
  void reset();
  ElfFile(const ElfFile&) = delete;
  ElfFile& operator=(const ElfFile&) = delete;

  void validateStringTable(const ElfShdr& stringTable) const;

  template <class T>
  const typename std::enable_if<std::is_pod<T>::value, T>::type& at(
      ElfOff offset) const {
    if (offset + sizeof(T) > length_) {
      char msg[kFilepathMaxLen + 128];
      snprintf(
          msg,
          sizeof(msg),
          "Offset (%zu + %zu) is not contained within our mmapped"
          " file (%s) of length %zu",
          offset,
          sizeof(T),
          filepath_,
          length_);
      FOLLY_SAFE_CHECK(offset + sizeof(T) <= length_, msg);
    }

    return *reinterpret_cast<T*>(file_ + offset);
  }

  template <class T>
  const T& valueAt(const ElfShdr& section, const ElfAddr addr) const {
    // For exectuables and shared objects, st_value holds a virtual address
    // that refers to the memory owned by sections. Since we didn't map the
    // sections into the addresses that they're expecting (sh_addr), but
    // instead just mmapped the entire file directly, we need to translate
    // between addresses and offsets into the file.
    //
    // TODO: For other file types, st_value holds a file offset directly. Since
    //       I don't have a use-case for that right now, just assert that
    //       nobody wants this. We can always add it later.
    FOLLY_SAFE_CHECK(
        elfHeader().e_type == ET_EXEC || elfHeader().e_type == ET_DYN,
        "Only exectuables and shared objects are supported");
    FOLLY_SAFE_CHECK(
        addr >= section.sh_addr &&
            (addr + sizeof(T)) <= (section.sh_addr + section.sh_size),
        "Address is not contained within the provided segment");

    return at<T>(section.sh_offset + (addr - section.sh_addr));
  }

  static constexpr size_t kFilepathMaxLen = 512;
  char filepath_[kFilepathMaxLen] = {};
  int fd_;
  char* file_; // mmap() location
  size_t length_; // mmap() length

  uintptr_t baseAddress_;
};

} // namespace symbolizer
} // namespace folly

#include <folly/experimental/symbolizer/Elf-inl.h>
