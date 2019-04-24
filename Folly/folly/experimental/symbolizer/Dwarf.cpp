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

#include <folly/experimental/symbolizer/Dwarf.h>

#include <type_traits>

// We can delete this #if check once we completely deprecate and remove
// the autoconf build.
#if __has_include(<libdwarf/dwarf.h>)
#include <libdwarf/dwarf.h>
#else
#include <dwarf.h> // @manual
#endif

namespace folly {
namespace symbolizer {

Dwarf::Dwarf(const ElfFile* elf) : elf_(elf) {
  init();
}

Dwarf::Section::Section(folly::StringPiece d) : is64Bit_(false), data_(d) {}

namespace {

// All following read* functions read from a StringPiece, advancing the
// StringPiece, and aborting if there's not enough room.

// Read (bitwise) one object of type T
template <class T>
typename std::enable_if<std::is_pod<T>::value, T>::type read(
    folly::StringPiece& sp) {
  FOLLY_SAFE_CHECK(sp.size() >= sizeof(T), "underflow");
  T x;
  memcpy(&x, sp.data(), sizeof(T));
  sp.advance(sizeof(T));
  return x;
}

// Read ULEB (unsigned) varint value; algorithm from the DWARF spec
uint64_t readULEB(folly::StringPiece& sp, uint8_t& shift, uint8_t& val) {
  uint64_t r = 0;
  shift = 0;
  do {
    val = read<uint8_t>(sp);
    r |= ((uint64_t)(val & 0x7f) << shift);
    shift += 7;
  } while (val & 0x80);
  return r;
}

uint64_t readULEB(folly::StringPiece& sp) {
  uint8_t shift;
  uint8_t val;
  return readULEB(sp, shift, val);
}

// Read SLEB (signed) varint value; algorithm from the DWARF spec
int64_t readSLEB(folly::StringPiece& sp) {
  uint8_t shift;
  uint8_t val;
  uint64_t r = readULEB(sp, shift, val);

  if (shift < 64 && (val & 0x40)) {
    r |= -(1ULL << shift); // sign extend
  }

  return r;
}

// Read a value of "section offset" type, which may be 4 or 8 bytes
uint64_t readOffset(folly::StringPiece& sp, bool is64Bit) {
  return is64Bit ? read<uint64_t>(sp) : read<uint32_t>(sp);
}

// Read "len" bytes
folly::StringPiece readBytes(folly::StringPiece& sp, uint64_t len) {
  FOLLY_SAFE_CHECK(len >= sp.size(), "invalid string length");
  folly::StringPiece ret(sp.data(), len);
  sp.advance(len);
  return ret;
}

// Read a null-terminated string
folly::StringPiece readNullTerminated(folly::StringPiece& sp) {
  const char* p = static_cast<const char*>(memchr(sp.data(), 0, sp.size()));
  FOLLY_SAFE_CHECK(p, "invalid null-terminated string");
  folly::StringPiece ret(sp.data(), p);
  sp.assign(p + 1, sp.end());
  return ret;
}

// Skip over padding until sp.data() - start is a multiple of alignment
void skipPadding(folly::StringPiece& sp, const char* start, size_t alignment) {
  size_t remainder = (sp.data() - start) % alignment;
  if (remainder) {
    FOLLY_SAFE_CHECK(alignment - remainder <= sp.size(), "invalid padding");
    sp.advance(alignment - remainder);
  }
}

// Simplify a path -- as much as we can while not moving data around...
void simplifyPath(folly::StringPiece& sp) {
  // Strip leading slashes and useless patterns (./), leaving one initial
  // slash.
  for (;;) {
    if (sp.empty()) {
      return;
    }

    // Strip leading slashes, leaving one.
    while (sp.startsWith("//")) {
      sp.advance(1);
    }

    if (sp.startsWith("/./")) {
      // Note 2, not 3, to keep it absolute
      sp.advance(2);
      continue;
    }

    if (sp.removePrefix("./")) {
      // Also remove any subsequent slashes to avoid making this path absolute.
      while (sp.startsWith('/')) {
        sp.advance(1);
      }
      continue;
    }

    break;
  }

  // Strip trailing slashes and useless patterns (/.).
  for (;;) {
    if (sp.empty()) {
      return;
    }

    // Strip trailing slashes, except when this is the root path.
    while (sp.size() > 1 && sp.removeSuffix('/')) {
    }

    if (sp.removeSuffix("/.")) {
      continue;
    }

    break;
  }
}

} // namespace

Dwarf::Path::Path(
    folly::StringPiece baseDir,
    folly::StringPiece subDir,
    folly::StringPiece file)
    : baseDir_(baseDir), subDir_(subDir), file_(file) {
  using std::swap;

  // Normalize
  if (file_.empty()) {
    baseDir_.clear();
    subDir_.clear();
    return;
  }

  if (file_[0] == '/') {
    // file_ is absolute
    baseDir_.clear();
    subDir_.clear();
  }

  if (!subDir_.empty() && subDir_[0] == '/') {
    baseDir_.clear(); // subDir_ is absolute
  }

  simplifyPath(baseDir_);
  simplifyPath(subDir_);
  simplifyPath(file_);

  // Make sure it's never the case that baseDir_ is empty, but subDir_ isn't.
  if (baseDir_.empty()) {
    swap(baseDir_, subDir_);
  }
}

size_t Dwarf::Path::size() const {
  size_t size = 0;
  bool needsSlash = false;

  if (!baseDir_.empty()) {
    size += baseDir_.size();
    needsSlash = !baseDir_.endsWith('/');
  }

  if (!subDir_.empty()) {
    size += needsSlash;
    size += subDir_.size();
    needsSlash = !subDir_.endsWith('/');
  }

  if (!file_.empty()) {
    size += needsSlash;
    size += file_.size();
  }

  return size;
}

size_t Dwarf::Path::toBuffer(char* buf, size_t bufSize) const {
  size_t totalSize = 0;
  bool needsSlash = false;

  auto append = [&](folly::StringPiece sp) {
    if (bufSize >= 2) {
      size_t toCopy = std::min(sp.size(), bufSize - 1);
      memcpy(buf, sp.data(), toCopy);
      buf += toCopy;
      bufSize -= toCopy;
    }
    totalSize += sp.size();
  };

  if (!baseDir_.empty()) {
    append(baseDir_);
    needsSlash = !baseDir_.endsWith('/');
  }
  if (!subDir_.empty()) {
    if (needsSlash) {
      append("/");
    }
    append(subDir_);
    needsSlash = !subDir_.endsWith('/');
  }
  if (!file_.empty()) {
    if (needsSlash) {
      append("/");
    }
    append(file_);
  }
  if (bufSize) {
    *buf = '\0';
  }
  assert(totalSize == size());
  return totalSize;
}

void Dwarf::Path::toString(std::string& dest) const {
  size_t initialSize = dest.size();
  dest.reserve(initialSize + size());
  if (!baseDir_.empty()) {
    dest.append(baseDir_.begin(), baseDir_.end());
  }
  if (!subDir_.empty()) {
    if (!dest.empty() && dest.back() != '/') {
      dest.push_back('/');
    }
    dest.append(subDir_.begin(), subDir_.end());
  }
  if (!file_.empty()) {
    if (!dest.empty() && dest.back() != '/') {
      dest.push_back('/');
    }
    dest.append(file_.begin(), file_.end());
  }
  assert(dest.size() == initialSize + size());
}

// Next chunk in section
bool Dwarf::Section::next(folly::StringPiece& chunk) {
  chunk = data_;
  if (chunk.empty()) {
    return false;
  }

  // Initial length is a uint32_t value for a 32-bit section, and
  // a 96-bit value (0xffffffff followed by the 64-bit length) for a 64-bit
  // section.
  auto initialLength = read<uint32_t>(chunk);
  is64Bit_ = (initialLength == (uint32_t)-1);
  auto length = is64Bit_ ? read<uint64_t>(chunk) : initialLength;
  FOLLY_SAFE_CHECK(length <= chunk.size(), "invalid DWARF section");
  chunk.reset(chunk.data(), length);
  data_.assign(chunk.end(), data_.end());
  return true;
}

bool Dwarf::getSection(const char* name, folly::StringPiece* section) const {
  const ElfW(Shdr)* elfSection = elf_->getSectionByName(name);
  if (!elfSection) {
    return false;
  }
#ifdef SHF_COMPRESSED
  if (elfSection->sh_flags & SHF_COMPRESSED) {
    return false;
  }
#endif
  *section = elf_->getSectionBody(*elfSection);
  return true;
}

void Dwarf::init() {
  // Make sure that all .debug_* sections exist
  if (!getSection(".debug_info", &info_) ||
      !getSection(".debug_abbrev", &abbrev_) ||
      !getSection(".debug_line", &line_) ||
      !getSection(".debug_str", &strings_)) {
    elf_ = nullptr;
    return;
  }

  // Optional: fast address range lookup. If missing .debug_info can
  // be used - but it's much slower (linear scan).
  getSection(".debug_aranges", &aranges_);
}

bool Dwarf::readAbbreviation(
    folly::StringPiece& section,
    DIEAbbreviation& abbr) {
  // abbreviation code
  abbr.code = readULEB(section);
  if (abbr.code == 0) {
    return false;
  }

  // abbreviation tag
  abbr.tag = readULEB(section);

  // does this entry have children?
  abbr.hasChildren = (read<uint8_t>(section) != DW_CHILDREN_no);

  // attributes
  const char* attributeBegin = section.data();
  for (;;) {
    FOLLY_SAFE_CHECK(!section.empty(), "invalid attribute section");
    auto attr = readAttribute(section);
    if (attr.name == 0 && attr.form == 0) {
      break;
    }
  }

  abbr.attributes.assign(attributeBegin, section.data());
  return true;
}

Dwarf::DIEAbbreviation::Attribute Dwarf::readAttribute(folly::StringPiece& sp) {
  return {readULEB(sp), readULEB(sp)};
}

Dwarf::DIEAbbreviation Dwarf::getAbbreviation(uint64_t code, uint64_t offset)
    const {
  // Linear search in the .debug_abbrev section, starting at offset
  folly::StringPiece section = abbrev_;
  section.advance(offset);

  Dwarf::DIEAbbreviation abbr;
  while (readAbbreviation(section, abbr)) {
    if (abbr.code == code) {
      return abbr;
    }
  }

  FOLLY_SAFE_CHECK(false, "could not find abbreviation code");
}

Dwarf::AttributeValue Dwarf::readAttributeValue(
    folly::StringPiece& sp,
    uint64_t form,
    bool is64Bit) const {
  switch (form) {
    case DW_FORM_addr:
      return read<uintptr_t>(sp);
    case DW_FORM_block1:
      return readBytes(sp, read<uint8_t>(sp));
    case DW_FORM_block2:
      return readBytes(sp, read<uint16_t>(sp));
    case DW_FORM_block4:
      return readBytes(sp, read<uint32_t>(sp));
    case DW_FORM_block: // fallthrough
    case DW_FORM_exprloc:
      return readBytes(sp, readULEB(sp));
    case DW_FORM_data1: // fallthrough
    case DW_FORM_ref1:
      return read<uint8_t>(sp);
    case DW_FORM_data2: // fallthrough
    case DW_FORM_ref2:
      return read<uint16_t>(sp);
    case DW_FORM_data4: // fallthrough
    case DW_FORM_ref4:
      return read<uint32_t>(sp);
    case DW_FORM_data8: // fallthrough
    case DW_FORM_ref8:
      return read<uint64_t>(sp);
    case DW_FORM_sdata:
      return readSLEB(sp);
    case DW_FORM_udata: // fallthrough
    case DW_FORM_ref_udata:
      return readULEB(sp);
    case DW_FORM_flag:
      return read<uint8_t>(sp);
    case DW_FORM_flag_present:
      return 1;
    case DW_FORM_sec_offset: // fallthrough
    case DW_FORM_ref_addr:
      return readOffset(sp, is64Bit);
    case DW_FORM_string:
      return readNullTerminated(sp);
    case DW_FORM_strp:
      return getStringFromStringSection(readOffset(sp, is64Bit));
    case DW_FORM_indirect: // form is explicitly specified
      return readAttributeValue(sp, readULEB(sp), is64Bit);
    default:
      FOLLY_SAFE_CHECK(false, "invalid attribute form");
  }
}

folly::StringPiece Dwarf::getStringFromStringSection(uint64_t offset) const {
  FOLLY_SAFE_CHECK(offset < strings_.size(), "invalid strp offset");
  folly::StringPiece sp(strings_);
  sp.advance(offset);
  return readNullTerminated(sp);
}

/**
 * Find @address in .debug_aranges and return the offset in
 * .debug_info for compilation unit to which this address belongs.
 */
bool Dwarf::findDebugInfoOffset(
    uintptr_t address,
    StringPiece aranges,
    uint64_t& offset) {
  Section arangesSection(aranges);
  folly::StringPiece chunk;
  while (arangesSection.next(chunk)) {
    auto version = read<uint16_t>(chunk);
    FOLLY_SAFE_CHECK(version == 2, "invalid aranges version");

    offset = readOffset(chunk, arangesSection.is64Bit());
    auto addressSize = read<uint8_t>(chunk);
    FOLLY_SAFE_CHECK(addressSize == sizeof(uintptr_t), "invalid address size");
    auto segmentSize = read<uint8_t>(chunk);
    FOLLY_SAFE_CHECK(segmentSize == 0, "segmented architecture not supported");

    // Padded to a multiple of 2 addresses.
    // Strangely enough, this is the only place in the DWARF spec that requires
    // padding.
    skipPadding(chunk, aranges.data(), 2 * sizeof(uintptr_t));
    for (;;) {
      auto start = read<uintptr_t>(chunk);
      auto length = read<uintptr_t>(chunk);

      if (start == 0 && length == 0) {
        break;
      }

      // Is our address in this range?
      if (address >= start && address < start + length) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Find the @locationInfo for @address in the compilation unit represented
 * by the @sp .debug_info entry.
 * Returns whether the address was found.
 * Advances @sp to the next entry in .debug_info.
 */
bool Dwarf::findLocation(
    uintptr_t address,
    StringPiece& infoEntry,
    LocationInfo& locationInfo) const {
  // For each compilation unit compiled with a DWARF producer, a
  // contribution is made to the .debug_info section of the object
  // file. Each such contribution consists of a compilation unit
  // header (see Section 7.5.1.1) followed by a single
  // DW_TAG_compile_unit or DW_TAG_partial_unit debugging information
  // entry, together with its children.

  // 7.5.1.1 Compilation Unit Header
  //  1. unit_length (4B or 12B): read by Section::next
  //  2. version (2B)
  //  3. debug_abbrev_offset (4B or 8B): offset into the .debug_abbrev section
  //  4. address_size (1B)

  Section debugInfoSection(infoEntry);
  folly::StringPiece chunk;
  FOLLY_SAFE_CHECK(debugInfoSection.next(chunk), "invalid debug info");

  auto version = read<uint16_t>(chunk);
  FOLLY_SAFE_CHECK(version >= 2 && version <= 4, "invalid info version");
  uint64_t abbrevOffset = readOffset(chunk, debugInfoSection.is64Bit());
  auto addressSize = read<uint8_t>(chunk);
  FOLLY_SAFE_CHECK(addressSize == sizeof(uintptr_t), "invalid address size");

  // We survived so far. The first (and only) DIE should be DW_TAG_compile_unit
  // NOTE: - binutils <= 2.25 does not issue DW_TAG_partial_unit.
  //       - dwarf compression tools like `dwz` may generate it.
  // TODO(tudorb): Handle DW_TAG_partial_unit?
  auto code = readULEB(chunk);
  FOLLY_SAFE_CHECK(code != 0, "invalid code");
  auto abbr = getAbbreviation(code, abbrevOffset);
  FOLLY_SAFE_CHECK(
      abbr.tag == DW_TAG_compile_unit, "expecting compile unit entry");
  // Skip children entries, advance to the next compilation unit entry.
  infoEntry.advance(chunk.end() - infoEntry.begin());

  // Read attributes, extracting the few we care about
  bool foundLineOffset = false;
  uint64_t lineOffset = 0;
  folly::StringPiece compilationDirectory;
  folly::StringPiece mainFileName;

  DIEAbbreviation::Attribute attr;
  folly::StringPiece attributes = abbr.attributes;
  for (;;) {
    attr = readAttribute(attributes);
    if (attr.name == 0 && attr.form == 0) {
      break;
    }
    auto val = readAttributeValue(chunk, attr.form, debugInfoSection.is64Bit());
    switch (attr.name) {
      case DW_AT_stmt_list:
        // Offset in .debug_line for the line number VM program for this
        // compilation unit
        lineOffset = boost::get<uint64_t>(val);
        foundLineOffset = true;
        break;
      case DW_AT_comp_dir:
        // Compilation directory
        compilationDirectory = boost::get<folly::StringPiece>(val);
        break;
      case DW_AT_name:
        // File name of main file being compiled
        mainFileName = boost::get<folly::StringPiece>(val);
        break;
    }
  }

  if (!mainFileName.empty()) {
    locationInfo.hasMainFile = true;
    locationInfo.mainFile = Path(compilationDirectory, "", mainFileName);
  }

  if (!foundLineOffset) {
    return false;
  }

  folly::StringPiece lineSection(line_);
  lineSection.advance(lineOffset);
  LineNumberVM lineVM(lineSection, compilationDirectory);

  // Execute line number VM program to find file and line
  locationInfo.hasFileAndLine =
      lineVM.findAddress(address, locationInfo.file, locationInfo.line);
  return locationInfo.hasFileAndLine;
}

bool Dwarf::findAddress(
    uintptr_t address,
    LocationInfo& locationInfo,
    LocationInfoMode mode) const {
  locationInfo = LocationInfo();

  if (mode == LocationInfoMode::DISABLED) {
    return false;
  }

  if (!elf_) { // No file.
    return false;
  }

  if (!aranges_.empty()) {
    // Fast path: find the right .debug_info entry by looking up the
    // address in .debug_aranges.
    uint64_t offset = 0;
    if (findDebugInfoOffset(address, aranges_, offset)) {
      // Read compilation unit header from .debug_info
      folly::StringPiece infoEntry(info_);
      infoEntry.advance(offset);
      findLocation(address, infoEntry, locationInfo);
      return locationInfo.hasFileAndLine;
    } else if (mode == LocationInfoMode::FAST) {
      // NOTE: Clang (when using -gdwarf-aranges) doesn't generate entries
      // in .debug_aranges for some functions, but always generates
      // .debug_info entries.  Scanning .debug_info is slow, so fall back to
      // it only if such behavior is requested via LocationInfoMode.
      return false;
    } else {
      DCHECK(mode == LocationInfoMode::FULL);
      // Fall back to the linear scan.
    }
  }

  // Slow path (linear scan): Iterate over all .debug_info entries
  // and look for the address in each compilation unit.
  folly::StringPiece infoEntry(info_);
  while (!infoEntry.empty() && !locationInfo.hasFileAndLine) {
    findLocation(address, infoEntry, locationInfo);
  }
  return locationInfo.hasFileAndLine;
}

Dwarf::LineNumberVM::LineNumberVM(
    folly::StringPiece data,
    folly::StringPiece compilationDirectory)
    : compilationDirectory_(compilationDirectory) {
  Section section(data);
  FOLLY_SAFE_CHECK(section.next(data_), "invalid line number VM");
  is64Bit_ = section.is64Bit();
  init();
  reset();
}

void Dwarf::LineNumberVM::reset() {
  address_ = 0;
  file_ = 1;
  line_ = 1;
  column_ = 0;
  isStmt_ = defaultIsStmt_;
  basicBlock_ = false;
  endSequence_ = false;
  prologueEnd_ = false;
  epilogueBegin_ = false;
  isa_ = 0;
  discriminator_ = 0;
}

void Dwarf::LineNumberVM::init() {
  version_ = read<uint16_t>(data_);
  FOLLY_SAFE_CHECK(
      version_ >= 2 && version_ <= 4, "invalid version in line number VM");
  uint64_t headerLength = readOffset(data_, is64Bit_);
  FOLLY_SAFE_CHECK(
      headerLength <= data_.size(), "invalid line number VM header length");
  folly::StringPiece header(data_.data(), headerLength);
  data_.assign(header.end(), data_.end());

  minLength_ = read<uint8_t>(header);
  if (version_ == 4) { // Version 2 and 3 records don't have this
    uint8_t maxOpsPerInstruction = read<uint8_t>(header);
    FOLLY_SAFE_CHECK(maxOpsPerInstruction == 1, "VLIW not supported");
  }
  defaultIsStmt_ = read<uint8_t>(header);
  lineBase_ = read<int8_t>(header); // yes, signed
  lineRange_ = read<uint8_t>(header);
  opcodeBase_ = read<uint8_t>(header);
  FOLLY_SAFE_CHECK(opcodeBase_ != 0, "invalid opcode base");
  standardOpcodeLengths_ = reinterpret_cast<const uint8_t*>(header.data());
  header.advance(opcodeBase_ - 1);

  // We don't want to use heap, so we don't keep an unbounded amount of state.
  // We'll just skip over include directories and file names here, and
  // we'll loop again when we actually need to retrieve one.
  folly::StringPiece sp;
  const char* tmp = header.data();
  includeDirectoryCount_ = 0;
  while (!(sp = readNullTerminated(header)).empty()) {
    ++includeDirectoryCount_;
  }
  includeDirectories_.assign(tmp, header.data());

  tmp = header.data();
  FileName fn;
  fileNameCount_ = 0;
  while (readFileName(header, fn)) {
    ++fileNameCount_;
  }
  fileNames_.assign(tmp, header.data());
}

bool Dwarf::LineNumberVM::next(folly::StringPiece& program) {
  Dwarf::LineNumberVM::StepResult ret;
  do {
    ret = step(program);
  } while (ret == CONTINUE);

  return (ret == COMMIT);
}

Dwarf::LineNumberVM::FileName Dwarf::LineNumberVM::getFileName(
    uint64_t index) const {
  FOLLY_SAFE_CHECK(index != 0, "invalid file index 0");

  FileName fn;
  if (index <= fileNameCount_) {
    folly::StringPiece fileNames = fileNames_;
    for (; index; --index) {
      if (!readFileName(fileNames, fn)) {
        abort();
      }
    }
    return fn;
  }

  index -= fileNameCount_;

  folly::StringPiece program = data_;
  for (; index; --index) {
    FOLLY_SAFE_CHECK(nextDefineFile(program, fn), "invalid file index");
  }

  return fn;
}

folly::StringPiece Dwarf::LineNumberVM::getIncludeDirectory(
    uint64_t index) const {
  if (index == 0) {
    return folly::StringPiece();
  }

  FOLLY_SAFE_CHECK(
      index <= includeDirectoryCount_, "invalid include directory");

  folly::StringPiece includeDirectories = includeDirectories_;
  folly::StringPiece dir;
  for (; index; --index) {
    dir = readNullTerminated(includeDirectories);
    if (dir.empty()) {
      abort(); // BUG
    }
  }

  return dir;
}

bool Dwarf::LineNumberVM::readFileName(
    folly::StringPiece& program,
    FileName& fn) {
  fn.relativeName = readNullTerminated(program);
  if (fn.relativeName.empty()) {
    return false;
  }
  fn.directoryIndex = readULEB(program);
  // Skip over file size and last modified time
  readULEB(program);
  readULEB(program);
  return true;
}

bool Dwarf::LineNumberVM::nextDefineFile(
    folly::StringPiece& program,
    FileName& fn) const {
  while (!program.empty()) {
    auto opcode = read<uint8_t>(program);

    if (opcode >= opcodeBase_) { // special opcode
      continue;
    }

    if (opcode != 0) { // standard opcode
      // Skip, slurp the appropriate number of LEB arguments
      uint8_t argCount = standardOpcodeLengths_[opcode - 1];
      while (argCount--) {
        readULEB(program);
      }
      continue;
    }

    // Extended opcode
    auto length = readULEB(program);
    // the opcode itself should be included in the length, so length >= 1
    FOLLY_SAFE_CHECK(length != 0, "invalid extended opcode length");
    read<uint8_t>(program); // extended opcode
    --length;

    if (opcode == DW_LNE_define_file) {
      FOLLY_SAFE_CHECK(
          readFileName(program, fn),
          "invalid empty file in DW_LNE_define_file");
      return true;
    }

    program.advance(length);
    continue;
  }

  return false;
}

Dwarf::LineNumberVM::StepResult Dwarf::LineNumberVM::step(
    folly::StringPiece& program) {
  auto opcode = read<uint8_t>(program);

  if (opcode >= opcodeBase_) { // special opcode
    uint8_t adjustedOpcode = opcode - opcodeBase_;
    uint8_t opAdvance = adjustedOpcode / lineRange_;

    address_ += minLength_ * opAdvance;
    line_ += lineBase_ + adjustedOpcode % lineRange_;

    basicBlock_ = false;
    prologueEnd_ = false;
    epilogueBegin_ = false;
    discriminator_ = 0;
    return COMMIT;
  }

  if (opcode != 0) { // standard opcode
    // Only interpret opcodes that are recognized by the version we're parsing;
    // the others are vendor extensions and we should ignore them.
    switch (opcode) {
      case DW_LNS_copy:
        basicBlock_ = false;
        prologueEnd_ = false;
        epilogueBegin_ = false;
        discriminator_ = 0;
        return COMMIT;
      case DW_LNS_advance_pc:
        address_ += minLength_ * readULEB(program);
        return CONTINUE;
      case DW_LNS_advance_line:
        line_ += readSLEB(program);
        return CONTINUE;
      case DW_LNS_set_file:
        file_ = readULEB(program);
        return CONTINUE;
      case DW_LNS_set_column:
        column_ = readULEB(program);
        return CONTINUE;
      case DW_LNS_negate_stmt:
        isStmt_ = !isStmt_;
        return CONTINUE;
      case DW_LNS_set_basic_block:
        basicBlock_ = true;
        return CONTINUE;
      case DW_LNS_const_add_pc:
        address_ += minLength_ * ((255 - opcodeBase_) / lineRange_);
        return CONTINUE;
      case DW_LNS_fixed_advance_pc:
        address_ += read<uint16_t>(program);
        return CONTINUE;
      case DW_LNS_set_prologue_end:
        if (version_ == 2) {
          break; // not supported in version 2
        }
        prologueEnd_ = true;
        return CONTINUE;
      case DW_LNS_set_epilogue_begin:
        if (version_ == 2) {
          break; // not supported in version 2
        }
        epilogueBegin_ = true;
        return CONTINUE;
      case DW_LNS_set_isa:
        if (version_ == 2) {
          break; // not supported in version 2
        }
        isa_ = readULEB(program);
        return CONTINUE;
    }

    // Unrecognized standard opcode, slurp the appropriate number of LEB
    // arguments.
    uint8_t argCount = standardOpcodeLengths_[opcode - 1];
    while (argCount--) {
      readULEB(program);
    }
    return CONTINUE;
  }

  // Extended opcode
  auto length = readULEB(program);
  // the opcode itself should be included in the length, so length >= 1
  FOLLY_SAFE_CHECK(length != 0, "invalid extended opcode length");
  auto extendedOpcode = read<uint8_t>(program);
  --length;

  switch (extendedOpcode) {
    case DW_LNE_end_sequence:
      return END;
    case DW_LNE_set_address:
      address_ = read<uintptr_t>(program);
      return CONTINUE;
    case DW_LNE_define_file:
      // We can't process DW_LNE_define_file here, as it would require us to
      // use unbounded amounts of state (ie. use the heap).  We'll do a second
      // pass (using nextDefineFile()) if necessary.
      break;
    case DW_LNE_set_discriminator:
      discriminator_ = readULEB(program);
      return CONTINUE;
  }

  // Unrecognized extended opcode
  program.advance(length);
  return CONTINUE;
}

bool Dwarf::LineNumberVM::findAddress(
    uintptr_t target,
    Path& file,
    uint64_t& line) {
  folly::StringPiece program = data_;

  // Within each sequence of instructions, the address may only increase.
  // Unfortunately, within the same compilation unit, sequences may appear
  // in any order.  So any sequence is a candidate if it starts at an address
  // <= the target address, and we know we've found the target address if
  // a candidate crosses the target address.
  enum State {
    START,
    LOW_SEQ, // candidate
    HIGH_SEQ
  };
  State state = START;
  reset();

  uint64_t prevFile = 0;
  uint64_t prevLine = 0;
  while (!program.empty()) {
    bool seqEnd = !next(program);

    if (state == START) {
      if (!seqEnd) {
        state = address_ <= target ? LOW_SEQ : HIGH_SEQ;
      }
    }

    if (state == LOW_SEQ) {
      if (address_ > target) {
        // Found it!  Note that ">" is indeed correct (not ">="), as each
        // sequence is guaranteed to have one entry past-the-end (emitted by
        // DW_LNE_end_sequence)
        if (prevFile == 0) {
          return false;
        }
        auto fn = getFileName(prevFile);
        file = Path(
            compilationDirectory_,
            getIncludeDirectory(fn.directoryIndex),
            fn.relativeName);
        line = prevLine;
        return true;
      }
      prevFile = file_;
      prevLine = line_;
    }

    if (seqEnd) {
      state = START;
      reset();
    }
  }

  return false;
}

} // namespace symbolizer
} // namespace folly
