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

#include <folly/experimental/symbolizer/Symbolizer.h>

#include <link.h>
#include <ucontext.h>

#include <climits>
#include <cstdio>
#include <cstdlib>
#include <iostream>

#ifdef __GLIBCXX__
#include <ext/stdio_filebuf.h>
#include <ext/stdio_sync_filebuf.h>
#endif

#include <folly/Conv.h>
#include <folly/FileUtil.h>
#include <folly/Memory.h>
#include <folly/ScopeGuard.h>
#include <folly/String.h>

#include <folly/experimental/symbolizer/Dwarf.h>
#include <folly/experimental/symbolizer/Elf.h>
#include <folly/experimental/symbolizer/LineReader.h>
#include <folly/portability/SysMman.h>
#include <folly/portability/Unistd.h>

/*
 * This is declared in `link.h' on Linux platforms, but apparently not on the
 * Mac version of the file.  It's harmless to declare again, in any case.
 *
 * Note that declaring it with `extern "C"` results in linkage conflicts.
 */
extern struct r_debug _r_debug;

namespace folly {
namespace symbolizer {

namespace {

ElfCache* defaultElfCache() {
  static constexpr size_t defaultCapacity = 500;
  static auto cache = new ElfCache(defaultCapacity);
  return cache;
}

} // namespace

void SymbolizedFrame::set(
    const std::shared_ptr<ElfFile>& file,
    uintptr_t address,
    Dwarf::LocationInfoMode mode) {
  clear();
  found = true;

  address += file->getBaseAddress();
  auto sym = file->getDefinitionByAddress(address);
  if (!sym.first) {
    return;
  }

  file_ = file;
  name = file->getSymbolName(sym);

  Dwarf(file.get()).findAddress(address, location, mode);
}

Symbolizer::Symbolizer(
    ElfCacheBase* cache,
    Dwarf::LocationInfoMode mode,
    size_t symbolCacheSize)
    : cache_(cache ? cache : defaultElfCache()), mode_(mode) {
  if (symbolCacheSize > 0) {
    symbolCache_.emplace(folly::in_place, symbolCacheSize);
  }
}

void Symbolizer::symbolize(
    const uintptr_t* addresses,
    SymbolizedFrame* frames,
    size_t addrCount) {
  size_t remaining = 0;
  for (size_t i = 0; i < addrCount; ++i) {
    auto& frame = frames[i];
    if (!frame.found) {
      ++remaining;
      frame.clear();
    }
  }

  if (remaining == 0) { // we're done
    return;
  }

  if (_r_debug.r_version != 1) {
    return;
  }

  char selfPath[PATH_MAX + 8];
  ssize_t selfSize;
  if ((selfSize = readlink("/proc/self/exe", selfPath, PATH_MAX + 1)) == -1) {
    // Something has gone terribly wrong.
    return;
  }
  selfPath[selfSize] = '\0';

  for (auto lmap = _r_debug.r_map; lmap != nullptr && remaining != 0;
       lmap = lmap->l_next) {
    // The empty string is used in place of the filename for the link_map
    // corresponding to the running executable.  Additionally, the `l_addr' is
    // 0 and the link_map appears to be first in the list---but none of this
    // behavior appears to be documented, so checking for the empty string is
    // as good as anything.
    auto const objPath = lmap->l_name[0] != '\0' ? lmap->l_name : selfPath;

    auto const elfFile = cache_->getFile(objPath);
    if (!elfFile) {
      continue;
    }

    // Get the address at which the object is loaded.  We have to use the ELF
    // header for the running executable, since its `l_addr' is zero, but we
    // should use `l_addr' for everything else---in particular, if the object
    // is position-independent, getBaseAddress() (which is p_vaddr) will be 0.
    auto const base =
        lmap->l_addr != 0 ? lmap->l_addr : elfFile->getBaseAddress();

    for (size_t i = 0; i < addrCount && remaining != 0; ++i) {
      auto& frame = frames[i];
      if (frame.found) {
        continue;
      }

      auto const addr = addresses[i];
      if (symbolCache_) {
        // Need a write lock, because EvictingCacheMap brings found item to
        // front of eviction list.
        auto lockedSymbolCache = symbolCache_->wlock();

        auto const iter = lockedSymbolCache->find(addr);
        if (iter != lockedSymbolCache->end()) {
          frame = iter->second;
          continue;
        }
      }

      // Get the unrelocated, ELF-relative address.
      auto const adjusted = addr - base;

      if (elfFile->getSectionContainingAddress(adjusted)) {
        frame.set(elfFile, adjusted, mode_);
        --remaining;
        if (symbolCache_) {
          // frame may already have been set here.  That's ok, we'll just
          // overwrite, which doesn't cause a correctness problem.
          symbolCache_->wlock()->set(addr, frame);
        }
      }
    }
  }
}

namespace {
constexpr char kHexChars[] = "0123456789abcdef";
constexpr auto kAddressColor = SymbolizePrinter::Color::BLUE;
constexpr auto kFunctionColor = SymbolizePrinter::Color::PURPLE;
constexpr auto kFileColor = SymbolizePrinter::Color::DEFAULT;
} // namespace

constexpr char AddressFormatter::bufTemplate[];
constexpr std::array<const char*, SymbolizePrinter::Color::NUM>
    SymbolizePrinter::kColorMap;

AddressFormatter::AddressFormatter() {
  memcpy(buf_, bufTemplate, sizeof(buf_));
}

folly::StringPiece AddressFormatter::format(uintptr_t address) {
  // Can't use sprintf, not async-signal-safe
  static_assert(sizeof(uintptr_t) <= 8, "huge uintptr_t?");
  char* end = buf_ + sizeof(buf_) - 1 - (16 - 2 * sizeof(uintptr_t));
  char* p = end;
  *p-- = '\0';
  while (address != 0) {
    *p-- = kHexChars[address & 0xf];
    address >>= 4;
  }

  return folly::StringPiece(buf_, end);
}

void SymbolizePrinter::print(uintptr_t address, const SymbolizedFrame& frame) {
  if (options_ & TERSE) {
    printTerse(address, frame);
    return;
  }

  SCOPE_EXIT {
    color(Color::DEFAULT);
  };

  if (!(options_ & NO_FRAME_ADDRESS)) {
    color(kAddressColor);

    AddressFormatter formatter;
    doPrint(formatter.format(address));
  }

  const char padBuf[] = "                       ";
  folly::StringPiece pad(
      padBuf, sizeof(padBuf) - 1 - (16 - 2 * sizeof(uintptr_t)));

  color(kFunctionColor);
  if (!frame.found) {
    doPrint(" (not found)");
    return;
  }

  if (!frame.name || frame.name[0] == '\0') {
    doPrint(" (unknown)");
  } else {
    char demangledBuf[2048];
    demangle(frame.name, demangledBuf, sizeof(demangledBuf));
    doPrint(" ");
    doPrint(demangledBuf[0] == '\0' ? frame.name : demangledBuf);
  }

  if (!(options_ & NO_FILE_AND_LINE)) {
    color(kFileColor);
    char fileBuf[PATH_MAX];
    fileBuf[0] = '\0';
    if (frame.location.hasFileAndLine) {
      frame.location.file.toBuffer(fileBuf, sizeof(fileBuf));
      doPrint("\n");
      doPrint(pad);
      doPrint(fileBuf);

      char buf[22];
      uint32_t n = uint64ToBufferUnsafe(frame.location.line, buf);
      doPrint(":");
      doPrint(StringPiece(buf, n));
    }

    if (frame.location.hasMainFile) {
      char mainFileBuf[PATH_MAX];
      mainFileBuf[0] = '\0';
      frame.location.mainFile.toBuffer(mainFileBuf, sizeof(mainFileBuf));
      if (!frame.location.hasFileAndLine || strcmp(fileBuf, mainFileBuf)) {
        doPrint("\n");
        doPrint(pad);
        doPrint("-> ");
        doPrint(mainFileBuf);
      }
    }
  }
}

void SymbolizePrinter::color(SymbolizePrinter::Color color) {
  if ((options_ & COLOR) == 0 && ((options_ & COLOR_IF_TTY) == 0 || !isTty_)) {
    return;
  }
  if (static_cast<size_t>(color) >= kColorMap.size()) { // catches underflow too
    return;
  }
  doPrint(kColorMap[color]);
}

void SymbolizePrinter::println(
    uintptr_t address,
    const SymbolizedFrame& frame) {
  print(address, frame);
  doPrint("\n");
}

void SymbolizePrinter::printTerse(
    uintptr_t address,
    const SymbolizedFrame& frame) {
  if (frame.found && frame.name && frame.name[0] != '\0') {
    char demangledBuf[2048] = {0};
    demangle(frame.name, demangledBuf, sizeof(demangledBuf));
    doPrint(demangledBuf[0] == '\0' ? frame.name : demangledBuf);
  } else {
    // Can't use sprintf, not async-signal-safe
    static_assert(sizeof(uintptr_t) <= 8, "huge uintptr_t?");
    char buf[] = "0x0000000000000000";
    char* end = buf + sizeof(buf) - 1 - (16 - 2 * sizeof(uintptr_t));
    char* p = end;
    *p-- = '\0';
    while (address != 0) {
      *p-- = kHexChars[address & 0xf];
      address >>= 4;
    }
    doPrint(StringPiece(buf, end));
  }
}

void SymbolizePrinter::println(
    const uintptr_t* addresses,
    const SymbolizedFrame* frames,
    size_t frameCount) {
  for (size_t i = 0; i < frameCount; ++i) {
    println(addresses[i], frames[i]);
  }
}

namespace {

int getFD(const std::ios& stream) {
#if defined(__GNUC__) && FOLLY_HAS_RTTI
  std::streambuf* buf = stream.rdbuf();
  using namespace __gnu_cxx;

  {
    auto sbuf = dynamic_cast<stdio_sync_filebuf<char>*>(buf);
    if (sbuf) {
      return fileno(sbuf->file());
    }
  }
  {
    auto sbuf = dynamic_cast<stdio_filebuf<char>*>(buf);
    if (sbuf) {
      return sbuf->fd();
    }
  }
#else
  (void)stream;
#endif // __GNUC__
  return -1;
}

bool isColorfulTty(int options, int fd) {
  if ((options & SymbolizePrinter::TERSE) != 0 ||
      (options & SymbolizePrinter::COLOR_IF_TTY) == 0 || fd < 0 ||
      !::isatty(fd)) {
    return false;
  }
  auto term = ::getenv("TERM");
  return !(term == nullptr || term[0] == '\0' || strcmp(term, "dumb") == 0);
}

} // namespace

OStreamSymbolizePrinter::OStreamSymbolizePrinter(std::ostream& out, int options)
    : SymbolizePrinter(options, isColorfulTty(options, getFD(out))),
      out_(out) {}

void OStreamSymbolizePrinter::doPrint(StringPiece sp) {
  out_ << sp;
}

FDSymbolizePrinter::FDSymbolizePrinter(int fd, int options, size_t bufferSize)
    : SymbolizePrinter(options, isColorfulTty(options, fd)),
      fd_(fd),
      buffer_(bufferSize ? IOBuf::create(bufferSize) : nullptr) {}

FDSymbolizePrinter::~FDSymbolizePrinter() {
  flush();
}

void FDSymbolizePrinter::doPrint(StringPiece sp) {
  if (buffer_) {
    if (sp.size() > buffer_->tailroom()) {
      flush();
      writeFull(fd_, sp.data(), sp.size());
    } else {
      memcpy(buffer_->writableTail(), sp.data(), sp.size());
      buffer_->append(sp.size());
    }
  } else {
    writeFull(fd_, sp.data(), sp.size());
  }
}

void FDSymbolizePrinter::flush() {
  if (buffer_ && !buffer_->empty()) {
    writeFull(fd_, buffer_->data(), buffer_->length());
    buffer_->clear();
  }
}

FILESymbolizePrinter::FILESymbolizePrinter(FILE* file, int options)
    : SymbolizePrinter(options, isColorfulTty(options, fileno(file))),
      file_(file) {}

void FILESymbolizePrinter::doPrint(StringPiece sp) {
  fwrite(sp.data(), 1, sp.size(), file_);
}

void StringSymbolizePrinter::doPrint(StringPiece sp) {
  buf_.append(sp.data(), sp.size());
}

SafeStackTracePrinter::SafeStackTracePrinter(
    size_t minSignalSafeElfCacheSize,
    int fd)
    : fd_(fd),
      elfCache_(std::max(countLoadedElfFiles(), minSignalSafeElfCacheSize)),
      printer_(
          fd,
          SymbolizePrinter::COLOR_IF_TTY,
          size_t(64) << 10), // 64KiB
      addresses_(std::make_unique<FrameArray<kMaxStackTraceDepth>>()) {}

void SafeStackTracePrinter::flush() {
  printer_.flush();
  fsyncNoInt(fd_);
}

void SafeStackTracePrinter::printSymbolizedStackTrace() {
  // This function might run on an alternative stack allocated by
  // UnsafeSelfAllocateStackTracePrinter. Capturing a stack from
  // here is probably wrong.

  // Do our best to populate location info, process is going to terminate,
  // so performance isn't critical.
  Symbolizer symbolizer(&elfCache_, Dwarf::LocationInfoMode::FULL);
  symbolizer.symbolize(*addresses_);

  // Skip the top 2 frames captured by printStackTrace:
  // getStackTraceSafe
  // SafeStackTracePrinter::printStackTrace (captured stack)
  //
  // Leaving signalHandler on the stack for clarity, I think.
  printer_.println(*addresses_, 2);
}

void SafeStackTracePrinter::printStackTrace(bool symbolize) {
  SCOPE_EXIT {
    flush();
  };

  // Skip the getStackTrace frame
  if (!getStackTraceSafe(*addresses_)) {
    print("(error retrieving stack trace)\n");
  } else if (symbolize) {
    printSymbolizedStackTrace();
  } else {
    print("(safe mode, symbolizer not available)\n");
    AddressFormatter formatter;
    for (size_t i = 0; i < addresses_->frameCount; ++i) {
      print(formatter.format(addresses_->addresses[i]));
      print("\n");
    }
  }
}

FastStackTracePrinter::FastStackTracePrinter(
    std::unique_ptr<SymbolizePrinter> printer,
    size_t elfCacheSize,
    size_t symbolCacheSize)
    : elfCache_(
          elfCacheSize == 0
              ? nullptr
              : new ElfCache{std::max(countLoadedElfFiles(), elfCacheSize)}),
      printer_(std::move(printer)),
      symbolizer_(
          elfCache_ ? elfCache_.get() : defaultElfCache(),
          Dwarf::LocationInfoMode::FULL,
          symbolCacheSize) {}

FastStackTracePrinter::~FastStackTracePrinter() {}

void FastStackTracePrinter::printStackTrace(bool symbolize) {
  SCOPE_EXIT {
    printer_->flush();
  };

  FrameArray<kMaxStackTraceDepth> addresses;

  if (!getStackTraceSafe(addresses)) {
    printer_->print("(error retrieving stack trace)\n");
  } else if (symbolize) {
    symbolizer_.symbolize(addresses);

    // Skip the top 2 frames:
    // getStackTraceSafe
    // FastStackTracePrinter::printStackTrace (here)
    printer_->println(addresses, 2);
  } else {
    printer_->print("(safe mode, symbolizer not available)\n");
    AddressFormatter formatter;
    for (size_t i = 0; i < addresses.frameCount; ++i) {
      printer_->print(formatter.format(addresses.addresses[i]));
      printer_->print("\n");
    }
  }
}

void FastStackTracePrinter::flush() {
  printer_->flush();
}

// Stack utilities used by UnsafeSelfAllocateStackTracePrinter
namespace {
// Size of mmap-allocated stack. Not to confuse with sigaltstack.
const size_t kMmapStackSize = 1 * 1024 * 1024;

using MmapPtr = std::unique_ptr<char, void (*)(char*)>;

MmapPtr getNull() {
  return MmapPtr(nullptr, [](char*) {});
}

// Assign a mmap-allocated stack to oucp.
// Return a non-empty smart pointer on success.
MmapPtr allocateStack(ucontext_t* oucp, size_t pageSize) {
  MmapPtr p(
      (char*)mmap(
          nullptr,
          kMmapStackSize,
          PROT_WRITE | PROT_READ,
          MAP_ANONYMOUS | MAP_PRIVATE,
          /* fd */ -1,
          /* offset */ 0),
      [](char* addr) {
        // Usually runs inside a fatal signal handler.
        // Error handling is skipped.
        munmap(addr, kMmapStackSize);
      });

  if (!p) {
    return getNull();
  }

  // Prepare read-only guard pages on both ends
  if (pageSize * 2 >= kMmapStackSize) {
    return getNull();
  }
  size_t upperBound = ((kMmapStackSize - 1) / pageSize) * pageSize;
  if (mprotect(p.get(), pageSize, PROT_NONE) != 0) {
    return getNull();
  }
  if (mprotect(p.get() + upperBound, kMmapStackSize - upperBound, PROT_NONE) !=
      0) {
    return getNull();
  }

  oucp->uc_stack.ss_sp = p.get() + pageSize;
  oucp->uc_stack.ss_size = upperBound - pageSize;
  oucp->uc_stack.ss_flags = 0;

  return p;
}

} // namespace

void UnsafeSelfAllocateStackTracePrinter::printSymbolizedStackTrace() {
  if (pageSizeUnchecked_ <= 0) {
    return;
  }

  ucontext_t cur;
  memset(&cur, 0, sizeof(cur));
  ucontext_t alt;
  memset(&alt, 0, sizeof(alt));

  if (getcontext(&alt) != 0) {
    return;
  }
  alt.uc_link = &cur;

  MmapPtr p = allocateStack(&alt, (size_t)pageSizeUnchecked_);
  if (!p) {
    return;
  }

  auto contextStart = [](UnsafeSelfAllocateStackTracePrinter* that) {
    that->SafeStackTracePrinter::printSymbolizedStackTrace();
  };

  makecontext(
      &alt,
      (void (*)())(void (*)(UnsafeSelfAllocateStackTracePrinter*))(
          contextStart),
      /* argc */ 1,
      /* arg */ this);
  // NOTE: swapcontext is not async-signal-safe
  if (swapcontext(&cur, &alt) != 0) {
    return;
  }
}

} // namespace symbolizer
} // namespace folly
