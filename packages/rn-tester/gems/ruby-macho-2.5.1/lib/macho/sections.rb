# frozen_string_literal: true

module MachO
  # Classes and constants for parsing sections in Mach-O binaries.
  module Sections
    # type mask
    SECTION_TYPE = 0x000000ff

    # attributes mask
    SECTION_ATTRIBUTES = 0xffffff00

    # user settable attributes mask
    SECTION_ATTRIBUTES_USR = 0xff000000

    # system settable attributes mask
    SECTION_ATTRIBUTES_SYS = 0x00ffff00

    # maximum specifiable section alignment, as a power of 2
    # @note see `MAXSECTALIGN` macro in `cctools/misc/lipo.c`
    MAX_SECT_ALIGN = 15

    # association of section flag symbols to values
    # @api private
    SECTION_FLAGS = {
      :S_REGULAR => 0x0,
      :S_ZEROFILL => 0x1,
      :S_CSTRING_LITERALS => 0x2,
      :S_4BYTE_LITERALS => 0x3,
      :S_8BYTE_LITERALS => 0x4,
      :S_LITERAL_POINTERS => 0x5,
      :S_NON_LAZY_SYMBOL_POINTERS => 0x6,
      :S_LAZY_SYMBOL_POINTERS => 0x7,
      :S_SYMBOL_STUBS => 0x8,
      :S_MOD_INIT_FUNC_POINTERS => 0x9,
      :S_MOD_TERM_FUNC_POINTERS => 0xa,
      :S_COALESCED => 0xb,
      :S_GB_ZEROFILE => 0xc,
      :S_INTERPOSING => 0xd,
      :S_16BYTE_LITERALS => 0xe,
      :S_DTRACE_DOF => 0xf,
      :S_LAZY_DYLIB_SYMBOL_POINTERS => 0x10,
      :S_THREAD_LOCAL_REGULAR => 0x11,
      :S_THREAD_LOCAL_ZEROFILL => 0x12,
      :S_THREAD_LOCAL_VARIABLES => 0x13,
      :S_THREAD_LOCAL_VARIABLE_POINTERS => 0x14,
      :S_THREAD_LOCAL_INIT_FUNCTION_POINTERS => 0x15,
      :S_ATTR_PURE_INSTRUCTIONS => 0x80000000,
      :S_ATTR_NO_TOC => 0x40000000,
      :S_ATTR_STRIP_STATIC_SYMS => 0x20000000,
      :S_ATTR_NO_DEAD_STRIP => 0x10000000,
      :S_ATTR_LIVE_SUPPORT => 0x08000000,
      :S_ATTR_SELF_MODIFYING_CODE => 0x04000000,
      :S_ATTR_DEBUG => 0x02000000,
      :S_ATTR_SOME_INSTRUCTIONS => 0x00000400,
      :S_ATTR_EXT_RELOC => 0x00000200,
      :S_ATTR_LOC_RELOC => 0x00000100,
    }.freeze

    # association of section name symbols to names
    # @api private
    SECTION_NAMES = {
      :SECT_TEXT => "__text",
      :SECT_FVMLIB_INIT0 => "__fvmlib_init0",
      :SECT_FVMLIB_INIT1 => "__fvmlib_init1",
      :SECT_DATA => "__data",
      :SECT_BSS => "__bss",
      :SECT_COMMON => "__common",
      :SECT_OBJC_SYMBOLS => "__symbol_table",
      :SECT_OBJC_MODULES => "__module_info",
      :SECT_OBJC_STRINGS => "__selector_strs",
      :SECT_OBJC_REFS => "__selector_refs",
      :SECT_ICON_HEADER => "__header",
      :SECT_ICON_TIFF => "__tiff",
    }.freeze

    # Represents a section of a segment for 32-bit architectures.
    class Section < MachOStructure
      # @return [String] the name of the section, including null pad bytes
      attr_reader :sectname

      # @return [String] the name of the segment's section, including null
      #  pad bytes
      attr_reader :segname

      # @return [Integer] the memory address of the section
      attr_reader :addr

      # @return [Integer] the size, in bytes, of the section
      attr_reader :size

      # @return [Integer] the file offset of the section
      attr_reader :offset

      # @return [Integer] the section alignment (power of 2) of the section
      attr_reader :align

      # @return [Integer] the file offset of the section's relocation entries
      attr_reader :reloff

      # @return [Integer] the number of relocation entries
      attr_reader :nreloc

      # @return [Integer] flags for type and attributes of the section
      attr_reader :flags

      # @return [void] reserved (for offset or index)
      attr_reader :reserved1

      # @return [void] reserved (for count or sizeof)
      attr_reader :reserved2

      # @see MachOStructure::FORMAT
      FORMAT = "Z16Z16L=9"

      # @see MachOStructure::SIZEOF
      SIZEOF = 68

      # @api private
      def initialize(sectname, segname, addr, size, offset, align, reloff,
                     nreloc, flags, reserved1, reserved2)
        super()
        @sectname = sectname
        @segname = segname
        @addr = addr
        @size = size
        @offset = offset
        @align = align
        @reloff = reloff
        @nreloc = nreloc
        @flags = flags
        @reserved1 = reserved1
        @reserved2 = reserved2
      end

      # @return [String] the section's name
      def section_name
        sectname
      end

      # @return [String] the parent segment's name
      def segment_name
        segname
      end

      # @return [Boolean] whether the section is empty (i.e, {size} is 0)
      def empty?
        size.zero?
      end

      # @example
      #  puts "this section is regular" if sect.flag?(:S_REGULAR)
      # @param flag [Symbol] a section flag symbol
      # @return [Boolean] whether the flag is present in the section's {flags}
      def flag?(flag)
        flag = SECTION_FLAGS[flag]

        return false if flag.nil?

        flags & flag == flag
      end

      # @return [Hash] a hash representation of this {Section}
      def to_h
        {
          "sectname" => sectname,
          "segname" => segname,
          "addr" => addr,
          "size" => size,
          "offset" => offset,
          "align" => align,
          "reloff" => reloff,
          "nreloc" => nreloc,
          "flags" => flags,
          "reserved1" => reserved1,
          "reserved2" => reserved2,
        }.merge super
      end
    end

    # Represents a section of a segment for 64-bit architectures.
    class Section64 < Section
      # @return [void] reserved
      attr_reader :reserved3

      # @see MachOStructure::FORMAT
      FORMAT = "Z16Z16Q=2L=8"

      # @see MachOStructure::SIZEOF
      SIZEOF = 80

      # @api private
      def initialize(sectname, segname, addr, size, offset, align, reloff,
                     nreloc, flags, reserved1, reserved2, reserved3)
        super(sectname, segname, addr, size, offset, align, reloff,
          nreloc, flags, reserved1, reserved2)
        @reserved3 = reserved3
      end

      # @return [Hash] a hash representation of this {Section64}
      def to_h
        {
          "reserved3" => reserved3,
        }.merge super
      end
    end
  end
end
