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

// DWARF record parser

#pragma once

#include <boost/variant.hpp>

#include <folly/Range.h>
#include <folly/experimental/symbolizer/Elf.h>

namespace folly {
namespace symbolizer {

/**
 * DWARF record parser.
 *
 * We only implement enough DWARF functionality to convert from PC address
 * to file and line number information.
 *
 * This means (although they're not part of the public API of this class), we
 * can parse Debug Information Entries (DIEs), abbreviations, attributes (of
 * all forms), and we can interpret bytecode for the line number VM.
 *
 * We can interpret DWARF records of version 2, 3, or 4, although we don't
 * actually support many of the version 4 features (such as VLIW, multiple
 * operations per instruction)
 *
 * Note that the DWARF record parser does not allocate heap memory at all.
 * This is on purpose: you can use the parser from
 * memory-constrained situations (such as an exception handler for
 * std::out_of_memory)  If it weren't for this requirement, some things would
 * be much simpler: the Path class would be unnecessary and would be replaced
 * with a std::string; the list of file names in the line number VM would be
 * kept as a vector of strings instead of re-executing the program to look for
 * DW_LNE_define_file instructions, etc.
 */
class Dwarf {
  // Note that Dwarf uses (and returns) StringPiece a lot.
  // The StringPieces point within sections in the ELF file, and so will
  // be live for as long as the passed-in ElfFile is live.
 public:
  /** Create a DWARF parser around an ELF file. */
  explicit Dwarf(const ElfFile* elf);

  /**
   * Represent a file path a s collection of three parts (base directory,
   * subdirectory, and file).
   */
  class Path {
   public:
    Path() {}

    Path(
        folly::StringPiece baseDir,
        folly::StringPiece subDir,
        folly::StringPiece file);

    folly::StringPiece baseDir() const {
      return baseDir_;
    }
    folly::StringPiece subDir() const {
      return subDir_;
    }
    folly::StringPiece file() const {
      return file_;
    }

    size_t size() const;

    /**
     * Copy the Path to a buffer of size bufSize.
     *
     * toBuffer behaves like snprintf: It will always null-terminate the
     * buffer (so it will copy at most bufSize-1 bytes), and it will return
     * the number of bytes that would have been written if there had been
     * enough room, so, if toBuffer returns a value >= bufSize, the output
     * was truncated.
     */
    size_t toBuffer(char* buf, size_t bufSize) const;

    void toString(std::string& dest) const;
    std::string toString() const {
      std::string s;
      toString(s);
      return s;
    }

    // TODO(tudorb): Implement operator==, operator!=; not as easy as it
    // seems as the same path can be represented in multiple ways
   private:
    folly::StringPiece baseDir_;
    folly::StringPiece subDir_;
    folly::StringPiece file_;
  };

  enum class LocationInfoMode {
    // Don't resolve location info.
    DISABLED,
    // Perform CU lookup using .debug_aranges (might be incomplete).
    FAST,
    // Scan all CU in .debug_info (slow!) on .debug_aranges lookup failure.
    FULL,
  };

  struct LocationInfo {
    bool hasMainFile = false;
    Path mainFile;

    bool hasFileAndLine = false;
    Path file;
    uint64_t line = 0;
  };

  /**
   * Find the file and line number information corresponding to address.
   */
  bool findAddress(uintptr_t address, LocationInfo& info, LocationInfoMode mode)
      const;

 private:
  static bool
  findDebugInfoOffset(uintptr_t address, StringPiece aranges, uint64_t& offset);

  void init();
  bool findLocation(
      uintptr_t address,
      StringPiece& infoEntry,
      LocationInfo& info) const;

  const ElfFile* elf_;

  // DWARF section made up of chunks, each prefixed with a length header.
  // The length indicates whether the chunk is DWARF-32 or DWARF-64, which
  // guides interpretation of "section offset" records.
  // (yes, DWARF-32 and DWARF-64 sections may coexist in the same file)
  class Section {
   public:
    Section() : is64Bit_(false) {}

    explicit Section(folly::StringPiece d);

    // Return next chunk, if any; the 4- or 12-byte length was already
    // parsed and isn't part of the chunk.
    bool next(folly::StringPiece& chunk);

    // Is the current chunk 64 bit?
    bool is64Bit() const {
      return is64Bit_;
    }

   private:
    // Yes, 32- and 64- bit sections may coexist.  Yikes!
    bool is64Bit_;
    folly::StringPiece data_;
  };

  // Abbreviation for a Debugging Information Entry.
  struct DIEAbbreviation {
    uint64_t code;
    uint64_t tag;
    bool hasChildren;

    struct Attribute {
      uint64_t name;
      uint64_t form;
    };

    folly::StringPiece attributes;
  };

  // Interpreter for the line number bytecode VM
  class LineNumberVM {
   public:
    LineNumberVM(
        folly::StringPiece data,
        folly::StringPiece compilationDirectory);

    bool findAddress(uintptr_t address, Path& file, uint64_t& line);

   private:
    void init();
    void reset();

    // Execute until we commit one new row to the line number matrix
    bool next(folly::StringPiece& program);
    enum StepResult {
      CONTINUE, // Continue feeding opcodes
      COMMIT, // Commit new <address, file, line> tuple
      END, // End of sequence
    };
    // Execute one opcode
    StepResult step(folly::StringPiece& program);

    struct FileName {
      folly::StringPiece relativeName;
      // 0 = current compilation directory
      // otherwise, 1-based index in the list of include directories
      uint64_t directoryIndex;
    };
    // Read one FileName object, advance sp
    static bool readFileName(folly::StringPiece& sp, FileName& fn);

    // Get file name at given index; may be in the initial table
    // (fileNames_) or defined using DW_LNE_define_file (and we reexecute
    // enough of the program to find it, if so)
    FileName getFileName(uint64_t index) const;

    // Get include directory at given index
    folly::StringPiece getIncludeDirectory(uint64_t index) const;

    // Execute opcodes until finding a DW_LNE_define_file and return true;
    // return file at the end.
    bool nextDefineFile(folly::StringPiece& program, FileName& fn) const;

    // Initialization
    bool is64Bit_;
    folly::StringPiece data_;
    folly::StringPiece compilationDirectory_;

    // Header
    uint16_t version_;
    uint8_t minLength_;
    bool defaultIsStmt_;
    int8_t lineBase_;
    uint8_t lineRange_;
    uint8_t opcodeBase_;
    const uint8_t* standardOpcodeLengths_;

    folly::StringPiece includeDirectories_;
    size_t includeDirectoryCount_;

    folly::StringPiece fileNames_;
    size_t fileNameCount_;

    // State machine registers
    uint64_t address_;
    uint64_t file_;
    uint64_t line_;
    uint64_t column_;
    bool isStmt_;
    bool basicBlock_;
    bool endSequence_;
    bool prologueEnd_;
    bool epilogueBegin_;
    uint64_t isa_;
    uint64_t discriminator_;
  };

  // Read an abbreviation from a StringPiece, return true if at end; advance sp
  static bool readAbbreviation(folly::StringPiece& sp, DIEAbbreviation& abbr);

  // Get abbreviation corresponding to a code, in the chunk starting at
  // offset in the .debug_abbrev section
  DIEAbbreviation getAbbreviation(uint64_t code, uint64_t offset) const;

  // Read one attribute <name, form> pair, advance sp; returns <0, 0> at end.
  static DIEAbbreviation::Attribute readAttribute(folly::StringPiece& sp);

  // Read one attribute value, advance sp
  typedef boost::variant<uint64_t, folly::StringPiece> AttributeValue;
  AttributeValue
  readAttributeValue(folly::StringPiece& sp, uint64_t form, bool is64Bit) const;

  // Get an ELF section by name, return true if found
  bool getSection(const char* name, folly::StringPiece* section) const;

  // Get a string from the .debug_str section
  folly::StringPiece getStringFromStringSection(uint64_t offset) const;

  folly::StringPiece info_; // .debug_info
  folly::StringPiece abbrev_; // .debug_abbrev
  folly::StringPiece aranges_; // .debug_aranges
  folly::StringPiece line_; // .debug_line
  folly::StringPiece strings_; // .debug_str
};

inline std::ostream& operator<<(std::ostream& out, const Dwarf::Path& path) {
  return out << path.toString();
}

} // namespace symbolizer
} // namespace folly
