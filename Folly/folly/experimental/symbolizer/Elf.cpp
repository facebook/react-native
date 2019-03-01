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

#include <sys/mman.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

#include <string>

#include <glog/logging.h>

#include <folly/Conv.h>
#include <folly/Exception.h>
#include <folly/ScopeGuard.h>

namespace folly {
namespace symbolizer {

ElfFile::ElfFile() noexcept
  : fd_(-1),
    file_(static_cast<char*>(MAP_FAILED)),
    length_(0),
    baseAddress_(0) {
}

ElfFile::ElfFile(const char* name, bool readOnly)
  : fd_(-1),
    file_(static_cast<char*>(MAP_FAILED)),
    length_(0),
    baseAddress_(0) {
  open(name, readOnly);
}

void ElfFile::open(const char* name, bool readOnly) {
  const char* msg = "";
  int r = openNoThrow(name, readOnly, &msg);
  if (r == kSystemError) {
    throwSystemError(msg);
  } else {
    CHECK_EQ(r, kSuccess) << msg;
  }
}

int ElfFile::openNoThrow(const char* name,
                         bool readOnly,
                         const char** msg) noexcept {
  FOLLY_SAFE_CHECK(fd_ == -1, "File already open");
  fd_ = ::open(name, readOnly ? O_RDONLY : O_RDWR);
  if (fd_ == -1) {
    if (msg) *msg = "open";
    return kSystemError;
  }
  // Always close fd and unmap in case of failure along the way to avoid
  // check failure above if we leave fd != -1 and the object is recycled
  // like it is inside SignalSafeElfCache
  ScopeGuard guard = makeGuard([&]{ reset(); });
  struct stat st;
  int r = fstat(fd_, &st);
  if (r == -1) {
    if (msg) *msg = "fstat";
    return kSystemError;
  }

  length_ = st.st_size;
  int prot = PROT_READ;
  if (!readOnly) {
    prot |= PROT_WRITE;
  }
  file_ = static_cast<char*>(mmap(nullptr, length_, prot, MAP_SHARED, fd_, 0));
  if (file_ == MAP_FAILED) {
    if (msg) *msg = "mmap";
    return kSystemError;
  }
  if (!init(msg)) {
    errno = EINVAL;
    return kInvalidElfFile;
  }
  guard.dismiss();
  return kSuccess;
}

int ElfFile::openAndFollow(const char* name,
                           bool readOnly,
                           const char** msg) noexcept {
  auto result = openNoThrow(name, readOnly, msg);
  if (!readOnly || result != kSuccess) return result;

  /* NOTE .gnu_debuglink specifies only the name of the debugging info file
   * (with no directory components). GDB checks 3 different directories, but
   * ElfFile only supports the first version:
   *     - dirname(name)
   *     - dirname(name) + /.debug/
   *     - X/dirname(name)/ - where X is set in gdb's `debug-file-directory`.
   */
  auto dirend = strrchr(name, '/');
  // include ending '/' if any.
  auto dirlen = dirend != nullptr ? dirend + 1 - name : 0;

  auto debuginfo = getSectionByName(".gnu_debuglink");
  if (!debuginfo) return result;

  // The section starts with the filename, with any leading directory
  // components removed, followed by a zero byte.
  auto debugFileName = getSectionBody(*debuginfo);
  auto debugFileLen = strlen(debugFileName.begin());
  if (dirlen + debugFileLen >= PATH_MAX) {
    return result;
  }

  char linkname[PATH_MAX];
  memcpy(linkname, name, dirlen);
  memcpy(linkname + dirlen, debugFileName.begin(), debugFileLen + 1);
  reset();
  result = openNoThrow(linkname, readOnly, msg);
  if (result == kSuccess) return result;
  return openNoThrow(name, readOnly, msg);
}

ElfFile::~ElfFile() {
  reset();
}

ElfFile::ElfFile(ElfFile&& other) noexcept
  : fd_(other.fd_),
    file_(other.file_),
    length_(other.length_),
    baseAddress_(other.baseAddress_) {
  other.fd_ = -1;
  other.file_ = static_cast<char*>(MAP_FAILED);
  other.length_ = 0;
  other.baseAddress_ = 0;
}

ElfFile& ElfFile::operator=(ElfFile&& other) {
  assert(this != &other);
  reset();

  fd_ = other.fd_;
  file_ = other.file_;
  length_ = other.length_;
  baseAddress_ = other.baseAddress_;

  other.fd_ = -1;
  other.file_ = static_cast<char*>(MAP_FAILED);
  other.length_ = 0;
  other.baseAddress_ = 0;

  return *this;
}

void ElfFile::reset() {
  if (file_ != MAP_FAILED) {
    munmap(file_, length_);
    file_ = static_cast<char*>(MAP_FAILED);
  }

  if (fd_ != -1) {
    close(fd_);
    fd_ = -1;
  }
}

bool ElfFile::init(const char** msg) {
  auto& elfHeader = this->elfHeader();

  // Validate ELF magic numbers
  if (!(elfHeader.e_ident[EI_MAG0] == ELFMAG0 &&
        elfHeader.e_ident[EI_MAG1] == ELFMAG1 &&
        elfHeader.e_ident[EI_MAG2] == ELFMAG2 &&
        elfHeader.e_ident[EI_MAG3] == ELFMAG3)) {
    if (msg) *msg = "invalid ELF magic";
    return false;
  }

  // Validate ELF class (32/64 bits)
#define EXPECTED_CLASS P1(ELFCLASS, __ELF_NATIVE_CLASS)
#define P1(a, b) P2(a, b)
#define P2(a, b) a ## b
  if (elfHeader.e_ident[EI_CLASS] != EXPECTED_CLASS) {
    if (msg) *msg = "invalid ELF class";
    return false;
  }
#undef P1
#undef P2
#undef EXPECTED_CLASS

  // Validate ELF data encoding (LSB/MSB)
  static constexpr auto kExpectedEncoding =
      kIsLittleEndian ? ELFDATA2LSB : ELFDATA2MSB;
  if (elfHeader.e_ident[EI_DATA] != kExpectedEncoding) {
    if (msg) *msg = "invalid ELF encoding";
    return false;
  }

  // Validate ELF version (1)
  if (elfHeader.e_ident[EI_VERSION] != EV_CURRENT ||
      elfHeader.e_version != EV_CURRENT) {
    if (msg) *msg = "invalid ELF version";
    return false;
  }

  // We only support executable and shared object files
  if (elfHeader.e_type != ET_EXEC && elfHeader.e_type != ET_DYN) {
    if (msg) *msg = "invalid ELF file type";
    return false;
  }

  if (elfHeader.e_phnum == 0) {
    if (msg) *msg = "no program header!";
    return false;
  }

  if (elfHeader.e_phentsize != sizeof(ElfW(Phdr))) {
    if (msg) *msg = "invalid program header entry size";
    return false;
  }

  if (elfHeader.e_shentsize != sizeof(ElfW(Shdr))) {
    if (msg) *msg = "invalid section header entry size";
  }

  const ElfW(Phdr)* programHeader = &at<ElfW(Phdr)>(elfHeader.e_phoff);
  bool foundBase = false;
  for (size_t i = 0; i < elfHeader.e_phnum; programHeader++, i++) {
    // Program headers are sorted by load address, so the first PT_LOAD
    // header gives us the base address.
    if (programHeader->p_type == PT_LOAD) {
      baseAddress_ = programHeader->p_vaddr;
      foundBase = true;
      break;
    }
  }

  if (!foundBase) {
    if (msg) *msg =  "could not find base address";
    return false;
  }

  return true;
}

const ElfW(Shdr)* ElfFile::getSectionByIndex(size_t idx) const {
  FOLLY_SAFE_CHECK(idx < elfHeader().e_shnum, "invalid section index");
  return &at<ElfW(Shdr)>(elfHeader().e_shoff + idx * sizeof(ElfW(Shdr)));
}

folly::StringPiece ElfFile::getSectionBody(const ElfW(Shdr)& section) const {
  return folly::StringPiece(file_ + section.sh_offset, section.sh_size);
}

void ElfFile::validateStringTable(const ElfW(Shdr)& stringTable) const {
  FOLLY_SAFE_CHECK(stringTable.sh_type == SHT_STRTAB,
                   "invalid type for string table");

  const char* start = file_ + stringTable.sh_offset;
  // First and last bytes must be 0
  FOLLY_SAFE_CHECK(stringTable.sh_size == 0 ||
                   (start[0] == '\0' && start[stringTable.sh_size - 1] == '\0'),
                   "invalid string table");
}

const char* ElfFile::getString(const ElfW(Shdr)& stringTable, size_t offset)
  const {
  validateStringTable(stringTable);
  FOLLY_SAFE_CHECK(offset < stringTable.sh_size,
                   "invalid offset in string table");

  return file_ + stringTable.sh_offset + offset;
}

const char* ElfFile::getSectionName(const ElfW(Shdr)& section) const {
  if (elfHeader().e_shstrndx == SHN_UNDEF) {
    return nullptr;  // no section name string table
  }

  const ElfW(Shdr)& sectionNames = *getSectionByIndex(elfHeader().e_shstrndx);
  return getString(sectionNames, section.sh_name);
}

const ElfW(Shdr)* ElfFile::getSectionByName(const char* name) const {
  if (elfHeader().e_shstrndx == SHN_UNDEF) {
    return nullptr;  // no section name string table
  }

  // Find offset in the section name string table of the requested name
  const ElfW(Shdr)& sectionNames = *getSectionByIndex(elfHeader().e_shstrndx);
  const char* foundName = iterateStrings(
      sectionNames,
      [&] (const char* s) { return !strcmp(name, s); });
  if (foundName == nullptr) {
    return nullptr;
  }

  size_t offset = foundName - (file_ + sectionNames.sh_offset);

  // Find section with the appropriate sh_name offset
  const ElfW(Shdr)* foundSection = iterateSections(
    [&](const ElfW(Shdr)& sh) {
      if (sh.sh_name == offset) {
        return true;
      }
      return false;
    });
  return foundSection;
}

ElfFile::Symbol ElfFile::getDefinitionByAddress(uintptr_t address) const {
  Symbol foundSymbol {nullptr, nullptr};

  auto findSection = [&](const ElfW(Shdr)& section) {
    auto findSymbols = [&](const ElfW(Sym)& sym) {
      if (sym.st_shndx == SHN_UNDEF) {
        return false;  // not a definition
      }
      if (address >= sym.st_value && address < sym.st_value + sym.st_size) {
        foundSymbol.first = &section;
        foundSymbol.second = &sym;
        return true;
      }

      return false;
    };

    return iterateSymbolsWithType(section, STT_OBJECT, findSymbols) ||
      iterateSymbolsWithType(section, STT_FUNC, findSymbols);
  };

  // Try the .dynsym section first if it exists, it's smaller.
  (iterateSectionsWithType(SHT_DYNSYM, findSection) ||
   iterateSectionsWithType(SHT_SYMTAB, findSection));

  return foundSymbol;
}

ElfFile::Symbol ElfFile::getSymbolByName(const char* name) const {
  Symbol foundSymbol{nullptr, nullptr};

  auto findSection = [&](const ElfW(Shdr)& section) -> bool {
    // This section has no string table associated w/ its symbols; hence we
    // can't get names for them
    if (section.sh_link == SHN_UNDEF) {
      return false;
    }

    auto findSymbols = [&](const ElfW(Sym)& sym) -> bool {
      if (sym.st_shndx == SHN_UNDEF) {
        return false;  // not a definition
      }
      if (sym.st_name == 0) {
        return false;  // no name for this symbol
      }
      const char* sym_name = getString(
        *getSectionByIndex(section.sh_link), sym.st_name);
      if (strcmp(sym_name, name) == 0) {
        foundSymbol.first = &section;
        foundSymbol.second = &sym;
        return true;
      }

      return false;
    };

    return iterateSymbolsWithType(section, STT_OBJECT, findSymbols) ||
      iterateSymbolsWithType(section, STT_FUNC, findSymbols);
  };

  // Try the .dynsym section first if it exists, it's smaller.
  iterateSectionsWithType(SHT_DYNSYM, findSection) ||
    iterateSectionsWithType(SHT_SYMTAB, findSection);

  return foundSymbol;
}

const ElfW(Shdr)* ElfFile::getSectionContainingAddress(ElfW(Addr) addr) const {
  return iterateSections([&](const ElfW(Shdr)& sh) -> bool {
    return (addr >= sh.sh_addr) && (addr < (sh.sh_addr + sh.sh_size));
  });
}

const char* ElfFile::getSymbolName(Symbol symbol) const {
  if (!symbol.first || !symbol.second) {
    return nullptr;
  }

  if (symbol.second->st_name == 0) {
    return nullptr;  // symbol has no name
  }

  if (symbol.first->sh_link == SHN_UNDEF) {
    return nullptr;  // symbol table has no strings
  }

  return getString(*getSectionByIndex(symbol.first->sh_link),
                   symbol.second->st_name);
}

}  // namespace symbolizer
}  // namespace folly
