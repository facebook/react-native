# frozen_string_literal: true

module MachO
  # Classes and constants for parsing load commands in Mach-O binaries.
  module LoadCommands
    # load commands added after OS X 10.1 need to be bitwise ORed with
    # LC_REQ_DYLD to be recognized by the dynamic linker (dyld)
    # @api private
    LC_REQ_DYLD = 0x80000000

    # association of load commands to symbol representations
    # @api private
    LOAD_COMMANDS = {
      0x1 => :LC_SEGMENT,
      0x2 => :LC_SYMTAB,
      0x3 => :LC_SYMSEG,
      0x4 => :LC_THREAD,
      0x5 => :LC_UNIXTHREAD,
      0x6 => :LC_LOADFVMLIB,
      0x7 => :LC_IDFVMLIB,
      0x8 => :LC_IDENT,
      0x9 => :LC_FVMFILE,
      0xa => :LC_PREPAGE,
      0xb => :LC_DYSYMTAB,
      0xc => :LC_LOAD_DYLIB,
      0xd => :LC_ID_DYLIB,
      0xe => :LC_LOAD_DYLINKER,
      0xf => :LC_ID_DYLINKER,
      0x10 => :LC_PREBOUND_DYLIB,
      0x11 => :LC_ROUTINES,
      0x12 => :LC_SUB_FRAMEWORK,
      0x13 => :LC_SUB_UMBRELLA,
      0x14 => :LC_SUB_CLIENT,
      0x15 => :LC_SUB_LIBRARY,
      0x16 => :LC_TWOLEVEL_HINTS,
      0x17 => :LC_PREBIND_CKSUM,
      (0x18 | LC_REQ_DYLD) => :LC_LOAD_WEAK_DYLIB,
      0x19 => :LC_SEGMENT_64,
      0x1a => :LC_ROUTINES_64,
      0x1b => :LC_UUID,
      (0x1c | LC_REQ_DYLD) => :LC_RPATH,
      0x1d => :LC_CODE_SIGNATURE,
      0x1e => :LC_SEGMENT_SPLIT_INFO,
      (0x1f | LC_REQ_DYLD) => :LC_REEXPORT_DYLIB,
      0x20 => :LC_LAZY_LOAD_DYLIB,
      0x21 => :LC_ENCRYPTION_INFO,
      0x22 => :LC_DYLD_INFO,
      (0x22 | LC_REQ_DYLD) => :LC_DYLD_INFO_ONLY,
      (0x23 | LC_REQ_DYLD) => :LC_LOAD_UPWARD_DYLIB,
      0x24 => :LC_VERSION_MIN_MACOSX,
      0x25 => :LC_VERSION_MIN_IPHONEOS,
      0x26 => :LC_FUNCTION_STARTS,
      0x27 => :LC_DYLD_ENVIRONMENT,
      (0x28 | LC_REQ_DYLD) => :LC_MAIN,
      0x29 => :LC_DATA_IN_CODE,
      0x2a => :LC_SOURCE_VERSION,
      0x2b => :LC_DYLIB_CODE_SIGN_DRS,
      0x2c => :LC_ENCRYPTION_INFO_64,
      0x2d => :LC_LINKER_OPTION,
      0x2e => :LC_LINKER_OPTIMIZATION_HINT,
      0x2f => :LC_VERSION_MIN_TVOS,
      0x30 => :LC_VERSION_MIN_WATCHOS,
      0x31 => :LC_NOTE,
      0x32 => :LC_BUILD_VERSION,
      (0x33 | LC_REQ_DYLD) => :LC_DYLD_EXPORTS_TRIE,
      (0x34 | LC_REQ_DYLD) => :LD_DYLD_CHAINED_FIXUPS,
    }.freeze

    # association of symbol representations to load command constants
    # @api private
    LOAD_COMMAND_CONSTANTS = LOAD_COMMANDS.invert.freeze

    # load commands responsible for loading dylibs
    # @api private
    DYLIB_LOAD_COMMANDS = %i[
      LC_LOAD_DYLIB
      LC_LOAD_WEAK_DYLIB
      LC_REEXPORT_DYLIB
      LC_LAZY_LOAD_DYLIB
      LC_LOAD_UPWARD_DYLIB
    ].freeze

    # load commands that can be created manually via {LoadCommand.create}
    # @api private
    CREATABLE_LOAD_COMMANDS = DYLIB_LOAD_COMMANDS + %i[
      LC_ID_DYLIB
      LC_RPATH
      LC_LOAD_DYLINKER
    ].freeze

    # association of load command symbols to string representations of classes
    # @api private
    LC_STRUCTURES = {
      :LC_SEGMENT => "SegmentCommand",
      :LC_SYMTAB => "SymtabCommand",
      # "obsolete"
      :LC_SYMSEG => "SymsegCommand",
      # seems obsolete, but not documented as such
      :LC_THREAD => "ThreadCommand",
      :LC_UNIXTHREAD => "ThreadCommand",
      # "obsolete"
      :LC_LOADFVMLIB => "FvmlibCommand",
      # "obsolete"
      :LC_IDFVMLIB => "FvmlibCommand",
      # "obsolete"
      :LC_IDENT => "IdentCommand",
      # "reserved for internal use only"
      :LC_FVMFILE => "FvmfileCommand",
      # "reserved for internal use only", no public struct
      :LC_PREPAGE => "LoadCommand",
      :LC_DYSYMTAB => "DysymtabCommand",
      :LC_LOAD_DYLIB => "DylibCommand",
      :LC_ID_DYLIB => "DylibCommand",
      :LC_LOAD_DYLINKER => "DylinkerCommand",
      :LC_ID_DYLINKER => "DylinkerCommand",
      :LC_PREBOUND_DYLIB => "PreboundDylibCommand",
      :LC_ROUTINES => "RoutinesCommand",
      :LC_SUB_FRAMEWORK => "SubFrameworkCommand",
      :LC_SUB_UMBRELLA => "SubUmbrellaCommand",
      :LC_SUB_CLIENT => "SubClientCommand",
      :LC_SUB_LIBRARY => "SubLibraryCommand",
      :LC_TWOLEVEL_HINTS => "TwolevelHintsCommand",
      :LC_PREBIND_CKSUM => "PrebindCksumCommand",
      :LC_LOAD_WEAK_DYLIB => "DylibCommand",
      :LC_SEGMENT_64 => "SegmentCommand64",
      :LC_ROUTINES_64 => "RoutinesCommand64",
      :LC_UUID => "UUIDCommand",
      :LC_RPATH => "RpathCommand",
      :LC_CODE_SIGNATURE => "LinkeditDataCommand",
      :LC_SEGMENT_SPLIT_INFO => "LinkeditDataCommand",
      :LC_REEXPORT_DYLIB => "DylibCommand",
      :LC_LAZY_LOAD_DYLIB => "DylibCommand",
      :LC_ENCRYPTION_INFO => "EncryptionInfoCommand",
      :LC_DYLD_INFO => "DyldInfoCommand",
      :LC_DYLD_INFO_ONLY => "DyldInfoCommand",
      :LC_LOAD_UPWARD_DYLIB => "DylibCommand",
      :LC_VERSION_MIN_MACOSX => "VersionMinCommand",
      :LC_VERSION_MIN_IPHONEOS => "VersionMinCommand",
      :LC_FUNCTION_STARTS => "LinkeditDataCommand",
      :LC_DYLD_ENVIRONMENT => "DylinkerCommand",
      :LC_MAIN => "EntryPointCommand",
      :LC_DATA_IN_CODE => "LinkeditDataCommand",
      :LC_SOURCE_VERSION => "SourceVersionCommand",
      :LC_DYLIB_CODE_SIGN_DRS => "LinkeditDataCommand",
      :LC_ENCRYPTION_INFO_64 => "EncryptionInfoCommand64",
      :LC_LINKER_OPTION => "LinkerOptionCommand",
      :LC_LINKER_OPTIMIZATION_HINT => "LinkeditDataCommand",
      :LC_VERSION_MIN_TVOS => "VersionMinCommand",
      :LC_VERSION_MIN_WATCHOS => "VersionMinCommand",
      :LC_NOTE => "NoteCommand",
      :LC_BUILD_VERSION => "BuildVersionCommand",
      :LC_DYLD_EXPORTS_TRIE => "LinkeditDataCommand",
      :LD_DYLD_CHAINED_FIXUPS => "LinkeditDataCommand",
    }.freeze

    # association of segment name symbols to names
    # @api private
    SEGMENT_NAMES = {
      :SEG_PAGEZERO => "__PAGEZERO",
      :SEG_TEXT => "__TEXT",
      :SEG_DATA => "__DATA",
      :SEG_OBJC => "__OBJC",
      :SEG_ICON => "__ICON",
      :SEG_LINKEDIT => "__LINKEDIT",
      :SEG_UNIXSTACK => "__UNIXSTACK",
      :SEG_IMPORT => "__IMPORT",
    }.freeze

    # association of segment flag symbols to values
    # @api private
    SEGMENT_FLAGS = {
      :SG_HIGHVM => 0x1,
      :SG_FVMLIB => 0x2,
      :SG_NORELOC => 0x4,
      :SG_PROTECTED_VERSION_1 => 0x8,
    }.freeze

    # The top-level Mach-O load command structure.
    #
    # This is the most generic load command -- only the type ID and size are
    # represented. Used when a more specific class isn't available or isn't implemented.
    class LoadCommand < MachOStructure
      # @return [MachO::MachOView, nil] the raw view associated with the load command,
      #  or nil if the load command was created via {create}.
      attr_reader :view

      # @return [Integer] the load command's type ID
      attr_reader :cmd

      # @return [Integer] the size of the load command, in bytes
      attr_reader :cmdsize

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=2"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 8

      # Instantiates a new LoadCommand given a view into its origin Mach-O
      # @param view [MachO::MachOView] the load command's raw view
      # @return [LoadCommand] the new load command
      # @api private
      def self.new_from_bin(view)
        bin = view.raw_data.slice(view.offset, bytesize)
        format = Utils.specialize_format(self::FORMAT, view.endianness)

        new(view, *bin.unpack(format))
      end

      # Creates a new (viewless) command corresponding to the symbol provided
      # @param cmd_sym [Symbol] the symbol of the load command being created
      # @param args [Array] the arguments for the load command being created
      def self.create(cmd_sym, *args)
        raise LoadCommandNotCreatableError, cmd_sym unless CREATABLE_LOAD_COMMANDS.include?(cmd_sym)

        klass = LoadCommands.const_get LC_STRUCTURES[cmd_sym]
        cmd = LOAD_COMMAND_CONSTANTS[cmd_sym]

        # cmd will be filled in, view and cmdsize will be left unpopulated
        klass_arity = klass.instance_method(:initialize).arity - 3

        raise LoadCommandCreationArityError.new(cmd_sym, klass_arity, args.size) if klass_arity != args.size

        klass.new(nil, cmd, nil, *args)
      end

      # @param view [MachO::MachOView] the load command's raw view
      # @param cmd [Integer] the load command's identifying number
      # @param cmdsize [Integer] the size of the load command in bytes
      # @api private
      def initialize(view, cmd, cmdsize)
        super()
        @view = view
        @cmd = cmd
        @cmdsize = cmdsize
      end

      # @return [Boolean] whether the load command can be serialized
      def serializable?
        CREATABLE_LOAD_COMMANDS.include?(LOAD_COMMANDS[cmd])
      end

      # @param context [SerializationContext] the context
      #  to serialize into
      # @return [String, nil] the serialized fields of the load command, or nil
      #  if the load command can't be serialized
      # @api private
      def serialize(context)
        raise LoadCommandNotSerializableError, LOAD_COMMANDS[cmd] unless serializable?

        format = Utils.specialize_format(FORMAT, context.endianness)
        [cmd, SIZEOF].pack(format)
      end

      # @return [Integer] the load command's offset in the source file
      # @deprecated use {#view} instead
      def offset
        view.offset
      end

      # @return [Symbol, nil] a symbol representation of the load command's
      #  type ID, or nil if the ID doesn't correspond to a known load command class
      def type
        LOAD_COMMANDS[cmd]
      end

      alias to_sym type

      # @return [String] a string representation of the load command's
      #  identifying number
      def to_s
        type.to_s
      end

      # @return [Hash] a hash representation of this load command
      # @note Children should override this to include additional information.
      def to_h
        {
          "view" => view.to_h,
          "cmd" => cmd,
          "cmdsize" => cmdsize,
          "type" => type,
        }.merge super
      end

      # Represents a Load Command string. A rough analogue to the lc_str
      # struct used internally by OS X. This class allows ruby-macho to
      # pretend that strings stored in LCs are immediately available without
      # explicit operations on the raw Mach-O data.
      class LCStr
        # @param lc [LoadCommand] the load command
        # @param lc_str [Integer, String] the offset to the beginning of the
        #  string, or the string itself if not being initialized with a view.
        # @raise [MachO::LCStrMalformedError] if the string is malformed
        # @todo devise a solution such that the `lc_str` parameter is not
        #  interpreted differently depending on `lc.view`. The current behavior
        #  is a hack to allow viewless load command creation.
        # @api private
        def initialize(lc, lc_str)
          view = lc.view

          if view
            lc_str_abs = view.offset + lc_str
            lc_end = view.offset + lc.cmdsize - 1
            raw_string = view.raw_data.slice(lc_str_abs..lc_end)
            @string, null_byte, _padding = raw_string.partition("\x00")

            raise LCStrMalformedError, lc if null_byte.empty?

            @string_offset = lc_str
          else
            @string = lc_str
            @string_offset = 0
          end
        end

        # @return [String] a string representation of the LCStr
        def to_s
          @string
        end

        # @return [Integer] the offset to the beginning of the string in the
        #  load command
        def to_i
          @string_offset
        end

        # @return [Hash] a hash representation of this {LCStr}.
        def to_h
          {
            "string" => to_s,
            "offset" => to_i,
          }
        end
      end

      # Represents the contextual information needed by a load command to
      # serialize itself correctly into a binary string.
      class SerializationContext
        # @return [Symbol] the endianness of the serialized load command
        attr_reader :endianness

        # @return [Integer] the constant alignment value used to pad the
        #  serialized load command
        attr_reader :alignment

        # @param macho [MachO::MachOFile] the file to contextualize
        # @return [SerializationContext] the
        #  resulting context
        def self.context_for(macho)
          new(macho.endianness, macho.alignment)
        end

        # @param endianness [Symbol] the endianness of the context
        # @param alignment [Integer] the alignment of the context
        # @api private
        def initialize(endianness, alignment)
          @endianness = endianness
          @alignment = alignment
        end
      end
    end

    # A load command containing a single 128-bit unique random number
    # identifying an object produced by static link editor. Corresponds to
    # LC_UUID.
    class UUIDCommand < LoadCommand
      # @return [Array<Integer>] the UUID
      attr_reader :uuid

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=2a16"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 24

      # @api private
      def initialize(view, cmd, cmdsize, uuid)
        super(view, cmd, cmdsize)
        @uuid = uuid.unpack("C16") # re-unpack for the actual UUID array
      end

      # @return [String] a string representation of the UUID
      def uuid_string
        hexes = uuid.map { |elem| "%02<elem>x" % { :elem => elem } }
        segs = [
          hexes[0..3].join, hexes[4..5].join, hexes[6..7].join,
          hexes[8..9].join, hexes[10..15].join
        ]

        segs.join("-")
      end

      # @return [Hash] returns a hash representation of this {UUIDCommand}
      def to_h
        {
          "uuid" => uuid,
          "uuid_string" => uuid_string,
        }.merge super
      end
    end

    # A load command indicating that part of this file is to be mapped into
    # the task's address space. Corresponds to LC_SEGMENT.
    class SegmentCommand < LoadCommand
      # @return [String] the name of the segment
      attr_reader :segname

      # @return [Integer] the memory address of the segment
      attr_reader :vmaddr

      # @return [Integer] the memory size of the segment
      attr_reader :vmsize

      # @return [Integer] the file offset of the segment
      attr_reader :fileoff

      # @return [Integer] the amount to map from the file
      attr_reader :filesize

      # @return [Integer] the maximum VM protection
      attr_reader :maxprot

      # @return [Integer] the initial VM protection
      attr_reader :initprot

      # @return [Integer] the number of sections in the segment
      attr_reader :nsects

      # @return [Integer] any flags associated with the segment
      attr_reader :flags

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=2Z16L=4l=2L=2"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 56

      # @api private
      def initialize(view, cmd, cmdsize, segname, vmaddr, vmsize, fileoff,
                     filesize, maxprot, initprot, nsects, flags)
        super(view, cmd, cmdsize)
        @segname = segname
        @vmaddr = vmaddr
        @vmsize = vmsize
        @fileoff = fileoff
        @filesize = filesize
        @maxprot = maxprot
        @initprot = initprot
        @nsects = nsects
        @flags = flags
      end

      # All sections referenced within this segment.
      # @return [Array<MachO::Sections::Section>] if the Mach-O is 32-bit
      # @return [Array<MachO::Sections::Section64>] if the Mach-O is 64-bit
      def sections
        klass = case self
        when SegmentCommand64
          MachO::Sections::Section64
        when SegmentCommand
          MachO::Sections::Section
        end

        offset = view.offset + self.class.bytesize
        length = nsects * klass.bytesize

        bins = view.raw_data[offset, length]
        bins.unpack("a#{klass.bytesize}" * nsects).map do |bin|
          klass.new_from_bin(view.endianness, bin)
        end
      end

      # @example
      #  puts "this segment relocated in/to it" if sect.flag?(:SG_NORELOC)
      # @param flag [Symbol] a segment flag symbol
      # @return [Boolean] true if `flag` is present in the segment's flag field
      def flag?(flag)
        flag = SEGMENT_FLAGS[flag]

        return false if flag.nil?

        flags & flag == flag
      end

      # Guesses the alignment of the segment.
      # @return [Integer] the guessed alignment, as a power of 2
      # @note See `guess_align` in `cctools/misc/lipo.c`
      def guess_align
        return Sections::MAX_SECT_ALIGN if vmaddr.zero?

        align = 0
        segalign = 1

        while (segalign & vmaddr).zero?
          segalign <<= 1
          align += 1
        end

        return 2 if align < 2
        return Sections::MAX_SECT_ALIGN if align > Sections::MAX_SECT_ALIGN

        align
      end

      # @return [Hash] a hash representation of this {SegmentCommand}
      def to_h
        {
          "segname" => segname,
          "vmaddr" => vmaddr,
          "vmsize" => vmsize,
          "fileoff" => fileoff,
          "filesize" => filesize,
          "maxprot" => maxprot,
          "initprot" => initprot,
          "nsects" => nsects,
          "flags" => flags,
          "sections" => sections.map(&:to_h),
        }.merge super
      end
    end

    # A load command indicating that part of this file is to be mapped into
    # the task's address space. Corresponds to LC_SEGMENT_64.
    class SegmentCommand64 < SegmentCommand
      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=2Z16Q=4l=2L=2"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 72
    end

    # A load command representing some aspect of shared libraries, depending
    # on filetype. Corresponds to LC_ID_DYLIB, LC_LOAD_DYLIB,
    # LC_LOAD_WEAK_DYLIB, and LC_REEXPORT_DYLIB.
    class DylibCommand < LoadCommand
      # @return [LCStr] the library's path
      #  name as an LCStr
      attr_reader :name

      # @return [Integer] the library's build time stamp
      attr_reader :timestamp

      # @return [Integer] the library's current version number
      attr_reader :current_version

      # @return [Integer] the library's compatibility version number
      attr_reader :compatibility_version

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=6"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 24

      # @api private
      def initialize(view, cmd, cmdsize, name, timestamp, current_version,
                     compatibility_version)
        super(view, cmd, cmdsize)
        @name = LCStr.new(self, name)
        @timestamp = timestamp
        @current_version = current_version
        @compatibility_version = compatibility_version
      end

      # @param context [SerializationContext]
      #  the context
      # @return [String] the serialized fields of the load command
      # @api private
      def serialize(context)
        format = Utils.specialize_format(FORMAT, context.endianness)
        string_payload, string_offsets = Utils.pack_strings(SIZEOF,
                                                            context.alignment,
                                                            :name => name.to_s)
        cmdsize = SIZEOF + string_payload.bytesize
        [cmd, cmdsize, string_offsets[:name], timestamp, current_version,
         compatibility_version].pack(format) + string_payload
      end

      # @return [Hash] a hash representation of this {DylibCommand}
      def to_h
        {
          "name" => name.to_h,
          "timestamp" => timestamp,
          "current_version" => current_version,
          "compatibility_version" => compatibility_version,
        }.merge super
      end
    end

    # A load command representing some aspect of the dynamic linker, depending
    # on filetype. Corresponds to LC_ID_DYLINKER, LC_LOAD_DYLINKER, and
    # LC_DYLD_ENVIRONMENT.
    class DylinkerCommand < LoadCommand
      # @return [LCStr] the dynamic linker's
      #  path name as an LCStr
      attr_reader :name

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=3"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 12

      # @api private
      def initialize(view, cmd, cmdsize, name)
        super(view, cmd, cmdsize)
        @name = LCStr.new(self, name)
      end

      # @param context [SerializationContext]
      #  the context
      # @return [String] the serialized fields of the load command
      # @api private
      def serialize(context)
        format = Utils.specialize_format(FORMAT, context.endianness)
        string_payload, string_offsets = Utils.pack_strings(SIZEOF,
                                                            context.alignment,
                                                            :name => name.to_s)
        cmdsize = SIZEOF + string_payload.bytesize
        [cmd, cmdsize, string_offsets[:name]].pack(format) + string_payload
      end

      # @return [Hash] a hash representation of this {DylinkerCommand}
      def to_h
        {
          "name" => name.to_h,
        }.merge super
      end
    end

    # A load command used to indicate dynamic libraries used in prebinding.
    # Corresponds to LC_PREBOUND_DYLIB.
    class PreboundDylibCommand < LoadCommand
      # @return [LCStr] the library's path
      #  name as an LCStr
      attr_reader :name

      # @return [Integer] the number of modules in the library
      attr_reader :nmodules

      # @return [Integer] a bit vector of linked modules
      attr_reader :linked_modules

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=5"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 20

      # @api private
      def initialize(view, cmd, cmdsize, name, nmodules, linked_modules)
        super(view, cmd, cmdsize)
        @name = LCStr.new(self, name)
        @nmodules = nmodules
        @linked_modules = linked_modules
      end

      # @return [Hash] a hash representation of this {PreboundDylibCommand}
      def to_h
        {
          "name" => name.to_h,
          "nmodules" => nmodules,
          "linked_modules" => linked_modules,
        }.merge super
      end
    end

    # A load command used to represent threads.
    # @note cctools-870 and onwards have all fields of thread_command commented
    # out except the common ones (cmd, cmdsize)
    class ThreadCommand < LoadCommand
      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=2"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 8
    end

    # A load command containing the address of the dynamic shared library
    # initialization routine and an index into the module table for the module
    # that defines the routine. Corresponds to LC_ROUTINES.
    class RoutinesCommand < LoadCommand
      # @return [Integer] the address of the initialization routine
      attr_reader :init_address

      # @return [Integer] the index into the module table that the init routine
      #  is defined in
      attr_reader :init_module

      # @return [void]
      attr_reader :reserved1

      # @return [void]
      attr_reader :reserved2

      # @return [void]
      attr_reader :reserved3

      # @return [void]
      attr_reader :reserved4

      # @return [void]
      attr_reader :reserved5

      # @return [void]
      attr_reader :reserved6

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=10"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 40

      # @api private
      def initialize(view, cmd, cmdsize, init_address, init_module, reserved1,
                     reserved2, reserved3, reserved4, reserved5, reserved6)
        super(view, cmd, cmdsize)
        @init_address = init_address
        @init_module = init_module
        @reserved1 = reserved1
        @reserved2 = reserved2
        @reserved3 = reserved3
        @reserved4 = reserved4
        @reserved5 = reserved5
        @reserved6 = reserved6
      end

      # @return [Hash] a hash representation of this {RoutinesCommand}
      def to_h
        {
          "init_address" => init_address,
          "init_module" => init_module,
          "reserved1" => reserved1,
          "reserved2" => reserved2,
          "reserved3" => reserved3,
          "reserved4" => reserved4,
          "reserved5" => reserved5,
          "reserved6" => reserved6,
        }.merge super
      end
    end

    # A load command containing the address of the dynamic shared library
    # initialization routine and an index into the module table for the module
    # that defines the routine. Corresponds to LC_ROUTINES_64.
    class RoutinesCommand64 < RoutinesCommand
      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=2Q=8"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 72
    end

    # A load command signifying membership of a subframework containing the name
    # of an umbrella framework. Corresponds to LC_SUB_FRAMEWORK.
    class SubFrameworkCommand < LoadCommand
      # @return [LCStr] the umbrella framework name as an LCStr
      attr_reader :umbrella

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=3"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 12

      # @api private
      def initialize(view, cmd, cmdsize, umbrella)
        super(view, cmd, cmdsize)
        @umbrella = LCStr.new(self, umbrella)
      end

      # @return [Hash] a hash representation of this {SubFrameworkCommand}
      def to_h
        {
          "umbrella" => umbrella.to_h,
        }.merge super
      end
    end

    # A load command signifying membership of a subumbrella containing the name
    # of an umbrella framework. Corresponds to LC_SUB_UMBRELLA.
    class SubUmbrellaCommand < LoadCommand
      # @return [LCStr] the subumbrella framework name as an LCStr
      attr_reader :sub_umbrella

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=3"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 12

      # @api private
      def initialize(view, cmd, cmdsize, sub_umbrella)
        super(view, cmd, cmdsize)
        @sub_umbrella = LCStr.new(self, sub_umbrella)
      end

      # @return [Hash] a hash representation of this {SubUmbrellaCommand}
      def to_h
        {
          "sub_umbrella" => sub_umbrella.to_h,
        }.merge super
      end
    end

    # A load command signifying a sublibrary of a shared library. Corresponds
    # to LC_SUB_LIBRARY.
    class SubLibraryCommand < LoadCommand
      # @return [LCStr] the sublibrary name as an LCStr
      attr_reader :sub_library

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=3"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 12

      # @api private
      def initialize(view, cmd, cmdsize, sub_library)
        super(view, cmd, cmdsize)
        @sub_library = LCStr.new(self, sub_library)
      end

      # @return [Hash] a hash representation of this {SubLibraryCommand}
      def to_h
        {
          "sub_library" => sub_library.to_h,
        }.merge super
      end
    end

    # A load command signifying a shared library that is a subframework of
    # an umbrella framework. Corresponds to LC_SUB_CLIENT.
    class SubClientCommand < LoadCommand
      # @return [LCStr] the subclient name as an LCStr
      attr_reader :sub_client

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=3"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 12

      # @api private
      def initialize(view, cmd, cmdsize, sub_client)
        super(view, cmd, cmdsize)
        @sub_client = LCStr.new(self, sub_client)
      end

      # @return [Hash] a hash representation of this {SubClientCommand}
      def to_h
        {
          "sub_client" => sub_client.to_h,
        }.merge super
      end
    end

    # A load command containing the offsets and sizes of the link-edit 4.3BSD
    # "stab" style symbol table information. Corresponds to LC_SYMTAB.
    class SymtabCommand < LoadCommand
      # @return [Integer] the symbol table's offset
      attr_reader :symoff

      # @return [Integer] the number of symbol table entries
      attr_reader :nsyms

      # @return [Integer] the string table's offset
      attr_reader :stroff

      # @return [Integer] the string table size in bytes
      attr_reader :strsize

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=6"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 24

      # @api private
      def initialize(view, cmd, cmdsize, symoff, nsyms, stroff, strsize)
        super(view, cmd, cmdsize)
        @symoff = symoff
        @nsyms = nsyms
        @stroff = stroff
        @strsize = strsize
      end

      # @return [Hash] a hash representation of this {SymtabCommand}
      def to_h
        {
          "symoff" => symoff,
          "nsyms" => nsyms,
          "stroff" => stroff,
          "strsize" => strsize,
        }.merge super
      end
    end

    # A load command containing symbolic information needed to support data
    # structures used by the dynamic link editor. Corresponds to LC_DYSYMTAB.
    class DysymtabCommand < LoadCommand
      # @return [Integer] the index to local symbols
      attr_reader :ilocalsym

      # @return [Integer] the number of local symbols
      attr_reader :nlocalsym

      # @return [Integer] the index to externally defined symbols
      attr_reader :iextdefsym

      # @return [Integer] the number of externally defined symbols
      attr_reader :nextdefsym

      # @return [Integer] the index to undefined symbols
      attr_reader :iundefsym

      # @return [Integer] the number of undefined symbols
      attr_reader :nundefsym

      # @return [Integer] the file offset to the table of contents
      attr_reader :tocoff

      # @return [Integer] the number of entries in the table of contents
      attr_reader :ntoc

      # @return [Integer] the file offset to the module table
      attr_reader :modtaboff

      # @return [Integer] the number of entries in the module table
      attr_reader :nmodtab

      # @return [Integer] the file offset to the referenced symbol table
      attr_reader :extrefsymoff

      # @return [Integer] the number of entries in the referenced symbol table
      attr_reader :nextrefsyms

      # @return [Integer] the file offset to the indirect symbol table
      attr_reader :indirectsymoff

      # @return [Integer] the number of entries in the indirect symbol table
      attr_reader :nindirectsyms

      # @return [Integer] the file offset to the external relocation entries
      attr_reader :extreloff

      # @return [Integer] the number of external relocation entries
      attr_reader :nextrel

      # @return [Integer] the file offset to the local relocation entries
      attr_reader :locreloff

      # @return [Integer] the number of local relocation entries
      attr_reader :nlocrel

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=20"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 80

      # ugh
      # @api private
      def initialize(view, cmd, cmdsize, ilocalsym, nlocalsym, iextdefsym,
                     nextdefsym, iundefsym, nundefsym, tocoff, ntoc, modtaboff,
                     nmodtab, extrefsymoff, nextrefsyms, indirectsymoff,
                     nindirectsyms, extreloff, nextrel, locreloff, nlocrel)
        super(view, cmd, cmdsize)
        @ilocalsym = ilocalsym
        @nlocalsym = nlocalsym
        @iextdefsym = iextdefsym
        @nextdefsym = nextdefsym
        @iundefsym = iundefsym
        @nundefsym = nundefsym
        @tocoff = tocoff
        @ntoc = ntoc
        @modtaboff = modtaboff
        @nmodtab = nmodtab
        @extrefsymoff = extrefsymoff
        @nextrefsyms = nextrefsyms
        @indirectsymoff = indirectsymoff
        @nindirectsyms = nindirectsyms
        @extreloff = extreloff
        @nextrel = nextrel
        @locreloff = locreloff
        @nlocrel = nlocrel
      end

      # @return [Hash] a hash representation of this {DysymtabCommand}
      def to_h
        {
          "ilocalsym" => ilocalsym,
          "nlocalsym" => nlocalsym,
          "iextdefsym" => iextdefsym,
          "nextdefsym" => nextdefsym,
          "iundefsym" => iundefsym,
          "nundefsym" => nundefsym,
          "tocoff" => tocoff,
          "ntoc" => ntoc,
          "modtaboff" => modtaboff,
          "nmodtab" => nmodtab,
          "extrefsymoff" => extrefsymoff,
          "nextrefsyms" => nextrefsyms,
          "indirectsymoff" => indirectsymoff,
          "nindirectsyms" => nindirectsyms,
          "extreloff" => extreloff,
          "nextrel" => nextrel,
          "locreloff" => locreloff,
          "nlocrel" => nlocrel,
        }.merge super
      end
    end

    # A load command containing the offset and number of hints in the two-level
    # namespace lookup hints table. Corresponds to LC_TWOLEVEL_HINTS.
    class TwolevelHintsCommand < LoadCommand
      # @return [Integer] the offset to the hint table
      attr_reader :htoffset

      # @return [Integer] the number of hints in the hint table
      attr_reader :nhints

      # @return [TwolevelHintsTable]
      #  the hint table
      attr_reader :table

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=4"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 16

      # @api private
      def initialize(view, cmd, cmdsize, htoffset, nhints)
        super(view, cmd, cmdsize)
        @htoffset = htoffset
        @nhints = nhints
        @table = TwolevelHintsTable.new(view, htoffset, nhints)
      end

      # @return [Hash] a hash representation of this {TwolevelHintsCommand}
      def to_h
        {
          "htoffset" => htoffset,
          "nhints" => nhints,
          "table" => table.hints.map(&:to_h),
        }.merge super
      end

      # A representation of the two-level namespace lookup hints table exposed
      # by a {TwolevelHintsCommand} (`LC_TWOLEVEL_HINTS`).
      class TwolevelHintsTable
        # @return [Array<TwolevelHint>] all hints in the table
        attr_reader :hints

        # @param view [MachO::MachOView] the view into the current Mach-O
        # @param htoffset [Integer] the offset of the hints table
        # @param nhints [Integer] the number of two-level hints in the table
        # @api private
        def initialize(view, htoffset, nhints)
          format = Utils.specialize_format("L=#{nhints}", view.endianness)
          raw_table = view.raw_data[htoffset, nhints * 4]
          blobs = raw_table.unpack(format)

          @hints = blobs.map { |b| TwolevelHint.new(b) }
        end

        # An individual two-level namespace lookup hint.
        class TwolevelHint
          # @return [Integer] the index into the sub-images
          attr_reader :isub_image

          # @return [Integer] the index into the table of contents
          attr_reader :itoc

          # @param blob [Integer] the 32-bit number containing the lookup hint
          # @api private
          def initialize(blob)
            @isub_image = blob >> 24
            @itoc = blob & 0x00FFFFFF
          end

          # @return [Hash] a hash representation of this {TwolevelHint}
          def to_h
            {
              "isub_image" => isub_image,
              "itoc" => itoc,
            }
          end
        end
      end
    end

    # A load command containing the value of the original checksum for prebound
    # files, or zero. Corresponds to LC_PREBIND_CKSUM.
    class PrebindCksumCommand < LoadCommand
      # @return [Integer] the checksum or 0
      attr_reader :cksum

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=3"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 12

      # @api private
      def initialize(view, cmd, cmdsize, cksum)
        super(view, cmd, cmdsize)
        @cksum = cksum
      end

      # @return [Hash] a hash representation of this {PrebindCksumCommand}
      def to_h
        {
          "cksum" => cksum,
        }.merge super
      end
    end

    # A load command representing an rpath, which specifies a path that should
    # be added to the current run path used to find @rpath prefixed dylibs.
    # Corresponds to LC_RPATH.
    class RpathCommand < LoadCommand
      # @return [LCStr] the path to add to the run path as an LCStr
      attr_reader :path

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=3"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 12

      # @api private
      def initialize(view, cmd, cmdsize, path)
        super(view, cmd, cmdsize)
        @path = LCStr.new(self, path)
      end

      # @param context [SerializationContext] the context
      # @return [String] the serialized fields of the load command
      # @api private
      def serialize(context)
        format = Utils.specialize_format(FORMAT, context.endianness)
        string_payload, string_offsets = Utils.pack_strings(SIZEOF,
                                                            context.alignment,
                                                            :path => path.to_s)
        cmdsize = SIZEOF + string_payload.bytesize
        [cmd, cmdsize, string_offsets[:path]].pack(format) + string_payload
      end

      # @return [Hash] a hash representation of this {RpathCommand}
      def to_h
        {
          "path" => path.to_h,
        }.merge super
      end
    end

    # A load command representing the offsets and sizes of a blob of data in
    # the __LINKEDIT segment. Corresponds to LC_CODE_SIGNATURE,
    # LC_SEGMENT_SPLIT_INFO, LC_FUNCTION_STARTS, LC_DATA_IN_CODE,
    # LC_DYLIB_CODE_SIGN_DRS, LC_LINKER_OPTIMIZATION_HINT, LC_DYLD_EXPORTS_TRIE,
    # or LC_DYLD_CHAINED_FIXUPS.
    class LinkeditDataCommand < LoadCommand
      # @return [Integer] offset to the data in the __LINKEDIT segment
      attr_reader :dataoff

      # @return [Integer] size of the data in the __LINKEDIT segment
      attr_reader :datasize

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=4"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 16

      # @api private
      def initialize(view, cmd, cmdsize, dataoff, datasize)
        super(view, cmd, cmdsize)
        @dataoff = dataoff
        @datasize = datasize
      end

      # @return [Hash] a hash representation of this {LinkeditDataCommand}
      def to_h
        {
          "dataoff" => dataoff,
          "datasize" => datasize,
        }.merge super
      end
    end

    # A load command representing the offset to and size of an encrypted
    # segment. Corresponds to LC_ENCRYPTION_INFO.
    class EncryptionInfoCommand < LoadCommand
      # @return [Integer] the offset to the encrypted segment
      attr_reader :cryptoff

      # @return [Integer] the size of the encrypted segment
      attr_reader :cryptsize

      # @return [Integer] the encryption system, or 0 if not encrypted yet
      attr_reader :cryptid

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=5"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 20

      # @api private
      def initialize(view, cmd, cmdsize, cryptoff, cryptsize, cryptid)
        super(view, cmd, cmdsize)
        @cryptoff = cryptoff
        @cryptsize = cryptsize
        @cryptid = cryptid
      end

      # @return [Hash] a hash representation of this {EncryptionInfoCommand}
      def to_h
        {
          "cryptoff" => cryptoff,
          "cryptsize" => cryptsize,
          "cryptid" => cryptid,
        }.merge super
      end
    end

    # A load command representing the offset to and size of an encrypted
    # segment. Corresponds to LC_ENCRYPTION_INFO_64.
    class EncryptionInfoCommand64 < EncryptionInfoCommand
      # @return [Integer] 64-bit padding value
      attr_reader :pad

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=6"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 24

      # @api private
      def initialize(view, cmd, cmdsize, cryptoff, cryptsize, cryptid, pad)
        super(view, cmd, cmdsize, cryptoff, cryptsize, cryptid)
        @pad = pad
      end

      # @return [Hash] a hash representation of this {EncryptionInfoCommand64}
      def to_h
        {
          "pad" => pad,
        }.merge super
      end
    end

    # A load command containing the minimum OS version on which the binary
    # was built to run. Corresponds to LC_VERSION_MIN_MACOSX and
    # LC_VERSION_MIN_IPHONEOS.
    class VersionMinCommand < LoadCommand
      # @return [Integer] the version X.Y.Z packed as x16.y8.z8
      attr_reader :version

      # @return [Integer] the SDK version X.Y.Z packed as x16.y8.z8
      attr_reader :sdk

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=4"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 16

      # @api private
      def initialize(view, cmd, cmdsize, version, sdk)
        super(view, cmd, cmdsize)
        @version = version
        @sdk = sdk
      end

      # A string representation of the binary's minimum OS version.
      # @return [String] a string representing the minimum OS version.
      def version_string
        binary = "%032<version>b" % { :version => version }
        segs = [
          binary[0..15], binary[16..23], binary[24..31]
        ].map { |s| s.to_i(2) }

        segs.join(".")
      end

      # A string representation of the binary's SDK version.
      # @return [String] a string representing the SDK version.
      def sdk_string
        binary = "%032<sdk>b" % { :sdk => sdk }
        segs = [
          binary[0..15], binary[16..23], binary[24..31]
        ].map { |s| s.to_i(2) }

        segs.join(".")
      end

      # @return [Hash] a hash representation of this {VersionMinCommand}
      def to_h
        {
          "version" => version,
          "version_string" => version_string,
          "sdk" => sdk,
          "sdk_string" => sdk_string,
        }.merge super
      end
    end

    # A load command containing the minimum OS version on which
    # the binary was built for its platform.
    # Corresponds to LC_BUILD_VERSION.
    class BuildVersionCommand < LoadCommand
      # @return [Integer]
      attr_reader :platform

      # @return [Integer] the minimum OS version X.Y.Z packed as x16.y8.z8
      attr_reader :minos

      # @return [Integer] the SDK version X.Y.Z packed as x16.y8.z8
      attr_reader :sdk

      # @return [ToolEntries] tool entries
      attr_reader :tool_entries

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=6"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 24

      # @api private
      def initialize(view, cmd, cmdsize, platform, minos, sdk, ntools)
        super(view, cmd, cmdsize)
        @platform = platform
        @minos = minos
        @sdk = sdk
        @tool_entries = ToolEntries.new(view, ntools)
      end

      # A string representation of the binary's minimum OS version.
      # @return [String] a string representing the minimum OS version.
      def minos_string
        binary = "%032<minos>b" % { :minos => minos }
        segs = [
          binary[0..15], binary[16..23], binary[24..31]
        ].map { |s| s.to_i(2) }

        segs.join(".")
      end

      # A string representation of the binary's SDK version.
      # @return [String] a string representing the SDK version.
      def sdk_string
        binary = "%032<sdk>b" % { :sdk => sdk }
        segs = [
          binary[0..15], binary[16..23], binary[24..31]
        ].map { |s| s.to_i(2) }

        segs.join(".")
      end

      # @return [Hash] a hash representation of this {BuildVersionCommand}
      def to_h
        {
          "platform" => platform,
          "minos" => minos,
          "minos_string" => minos_string,
          "sdk" => sdk,
          "sdk_string" => sdk_string,
          "tool_entries" => tool_entries.tools.map(&:to_h),
        }.merge super
      end

      # A representation of the tool versions exposed
      # by a {BuildVersionCommand} (`LC_BUILD_VERSION`).
      class ToolEntries
        # @return [Array<Tool>] all tools
        attr_reader :tools

        # @param view [MachO::MachOView] the view into the current Mach-O
        # @param ntools [Integer] the number of tools
        # @api private
        def initialize(view, ntools)
          format = Utils.specialize_format("L=#{ntools * 2}", view.endianness)
          raw_table = view.raw_data[view.offset + 24, ntools * 8]
          blobs = raw_table.unpack(format).each_slice(2).to_a

          @tools = blobs.map { |b| Tool.new(*b) }
        end

        # An individual tool.
        class Tool
          # @return [Integer] the enum for the tool
          attr_reader :tool

          # @return [Integer] the tool's version number
          attr_reader :version

          # @param tool [Integer] 32-bit integer
          # @param version [Integer] 32-bit integer
          # @api private
          def initialize(tool, version)
            @tool = tool
            @version = version
          end

          # @return [Hash] a hash representation of this {Tool}
          def to_h
            {
              "tool" => tool,
              "version" => version,
            }
          end
        end
      end
    end

    # A load command containing the file offsets and sizes of the new
    # compressed form of the information dyld needs to load the image.
    # Corresponds to LC_DYLD_INFO and LC_DYLD_INFO_ONLY.
    class DyldInfoCommand < LoadCommand
      # @return [Integer] the file offset to the rebase information
      attr_reader :rebase_off

      # @return [Integer] the size of the rebase information
      attr_reader :rebase_size

      # @return [Integer] the file offset to the binding information
      attr_reader :bind_off

      # @return [Integer] the size of the binding information
      attr_reader :bind_size

      # @return [Integer] the file offset to the weak binding information
      attr_reader :weak_bind_off

      # @return [Integer] the size of the weak binding information
      attr_reader :weak_bind_size

      # @return [Integer] the file offset to the lazy binding information
      attr_reader :lazy_bind_off

      # @return [Integer] the size of the lazy binding information
      attr_reader :lazy_bind_size

      # @return [Integer] the file offset to the export information
      attr_reader :export_off

      # @return [Integer] the size of the export information
      attr_reader :export_size

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=12"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 48

      # @api private
      def initialize(view, cmd, cmdsize, rebase_off, rebase_size, bind_off,
                     bind_size, weak_bind_off, weak_bind_size, lazy_bind_off,
                     lazy_bind_size, export_off, export_size)
        super(view, cmd, cmdsize)
        @rebase_off = rebase_off
        @rebase_size = rebase_size
        @bind_off = bind_off
        @bind_size = bind_size
        @weak_bind_off = weak_bind_off
        @weak_bind_size = weak_bind_size
        @lazy_bind_off = lazy_bind_off
        @lazy_bind_size = lazy_bind_size
        @export_off = export_off
        @export_size = export_size
      end

      # @return [Hash] a hash representation of this {DyldInfoCommand}
      def to_h
        {
          "rebase_off" => rebase_off,
          "rebase_size" => rebase_size,
          "bind_off" => bind_off,
          "bind_size" => bind_size,
          "weak_bind_off" => weak_bind_off,
          "weak_bind_size" => weak_bind_size,
          "lazy_bind_off" => lazy_bind_off,
          "lazy_bind_size" => lazy_bind_size,
          "export_off" => export_off,
          "export_size" => export_size,
        }.merge super
      end
    end

    # A load command containing linker options embedded in object files.
    # Corresponds to LC_LINKER_OPTION.
    class LinkerOptionCommand < LoadCommand
      # @return [Integer] the number of strings
      attr_reader :count

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=3"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 12

      # @api private
      def initialize(view, cmd, cmdsize, count)
        super(view, cmd, cmdsize)
        @count = count
      end

      # @return [Hash] a hash representation of this {LinkerOptionCommand}
      def to_h
        {
          "count" => count,
        }.merge super
      end
    end

    # A load command specifying the offset of main(). Corresponds to LC_MAIN.
    class EntryPointCommand < LoadCommand
      # @return [Integer] the file (__TEXT) offset of main()
      attr_reader :entryoff

      # @return [Integer] if not 0, the initial stack size.
      attr_reader :stacksize

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=2Q=2"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 24

      # @api private
      def initialize(view, cmd, cmdsize, entryoff, stacksize)
        super(view, cmd, cmdsize)
        @entryoff = entryoff
        @stacksize = stacksize
      end

      # @return [Hash] a hash representation of this {EntryPointCommand}
      def to_h
        {
          "entryoff" => entryoff,
          "stacksize" => stacksize,
        }.merge super
      end
    end

    # A load command specifying the version of the sources used to build the
    # binary. Corresponds to LC_SOURCE_VERSION.
    class SourceVersionCommand < LoadCommand
      # @return [Integer] the version packed as a24.b10.c10.d10.e10
      attr_reader :version

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=2Q=1"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 16

      # @api private
      def initialize(view, cmd, cmdsize, version)
        super(view, cmd, cmdsize)
        @version = version
      end

      # A string representation of the sources used to build the binary.
      # @return [String] a string representation of the version
      def version_string
        binary = "%064<version>b" % { :version => version }
        segs = [
          binary[0..23], binary[24..33], binary[34..43], binary[44..53],
          binary[54..63]
        ].map { |s| s.to_i(2) }

        segs.join(".")
      end

      # @return [Hash] a hash representation of this {SourceVersionCommand}
      def to_h
        {
          "version" => version,
          "version_string" => version_string,
        }.merge super
      end
    end

    # An obsolete load command containing the offset and size of the (GNU style)
    # symbol table information. Corresponds to LC_SYMSEG.
    class SymsegCommand < LoadCommand
      # @return [Integer] the offset to the symbol segment
      attr_reader :offset

      # @return [Integer] the size of the symbol segment in bytes
      attr_reader :size

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=4"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 16

      # @api private
      def initialize(view, cmd, cmdsize, offset, size)
        super(view, cmd, cmdsize)
        @offset = offset
        @size = size
      end

      # @return [Hash] a hash representation of this {SymsegCommand}
      def to_h
        {
          "offset" => offset,
          "size" => size,
        }.merge super
      end
    end

    # An obsolete load command containing a free format string table. Each
    # string is null-terminated and the command is zero-padded to a multiple of
    # 4. Corresponds to LC_IDENT.
    class IdentCommand < LoadCommand
      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=2"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 8
    end

    # An obsolete load command containing the path to a file to be loaded into
    # memory. Corresponds to LC_FVMFILE.
    class FvmfileCommand < LoadCommand
      # @return [LCStr] the pathname of the file being loaded
      attr_reader :name

      # @return [Integer] the virtual address being loaded at
      attr_reader :header_addr

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=4"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 16

      def initialize(view, cmd, cmdsize, name, header_addr)
        super(view, cmd, cmdsize)
        @name = LCStr.new(self, name)
        @header_addr = header_addr
      end

      # @return [Hash] a hash representation of this {FvmfileCommand}
      def to_h
        {
          "name" => name.to_h,
          "header_addr" => header_addr,
        }.merge super
      end
    end

    # An obsolete load command containing the path to a library to be loaded
    # into memory. Corresponds to LC_LOADFVMLIB and LC_IDFVMLIB.
    class FvmlibCommand < LoadCommand
      # @return [LCStr] the library's target pathname
      attr_reader :name

      # @return [Integer] the library's minor version number
      attr_reader :minor_version

      # @return [Integer] the library's header address
      attr_reader :header_addr

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=5"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 20

      def initialize(view, cmd, cmdsize, name, minor_version, header_addr)
        super(view, cmd, cmdsize)
        @name = LCStr.new(self, name)
        @minor_version = minor_version
        @header_addr = header_addr
      end

      # @return [Hash] a hash representation of this {FvmlibCommand}
      def to_h
        {
          "name" => name.to_h,
          "minor_version" => minor_version,
          "header_addr" => header_addr,
        }.merge super
      end
    end

    # A load command containing an owner name and offset/size for an arbitrary data region.
    # Corresponds to LC_NOTE.
    class NoteCommand < LoadCommand
      # @return [String] the name of the owner for this note
      attr_reader :data_owner

      # @return [Integer] the offset, within the file, of the note
      attr_reader :offset

      # @return [Integer] the size, in bytes, of the note
      attr_reader :size

      # @see MachOStructure::FORMAT
      # @api private
      FORMAT = "L=2Z16Q=2"

      # @see MachOStructure::SIZEOF
      # @api private
      SIZEOF = 48

      def initialize(view, cmd, cmdsize, data_owner, offset, size)
        super(view, cmd, cmdsize)
        @data_owner = data_owner
        @offset = offset
        @size = size
      end

      # @return [Hash] a hash representation of this {NoteCommand}
      def to_h
        {
          "data_owner" => data_owner,
          "offset" => offset,
          "size" => size,
        }.merge super
      end
    end
  end
end
