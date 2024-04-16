# frozen_string_literal: true

require "forwardable"

module MachO
  # Represents a "Fat" file, which contains a header, a listing of available
  # architectures, and one or more Mach-O binaries.
  # @see https://en.wikipedia.org/wiki/Mach-O#Multi-architecture_binaries
  # @see MachOFile
  class FatFile
    extend Forwardable

    # @return [String] the filename loaded from, or nil if loaded from a binary string
    attr_accessor :filename

    # @return [Hash] any parser options that the instance was created with
    # @note Options specified in a {FatFile} trickle down into the internal {MachOFile}s.
    attr_reader :options

    # @return [Headers::FatHeader] the file's header
    attr_reader :header

    # @return [Array<Headers::FatArch>, Array<Headers::FatArch64] an array of fat architectures
    attr_reader :fat_archs

    # @return [Array<MachOFile>] an array of Mach-O binaries
    attr_reader :machos

    # Creates a new FatFile from the given (single-arch) Mach-Os
    # @param machos [Array<MachOFile>] the machos to combine
    # @param fat64 [Boolean] whether to use {Headers::FatArch64}s to represent each slice
    # @return [FatFile] a new FatFile containing the give machos
    # @raise [ArgumentError] if less than one Mach-O is given
    # @raise [FatArchOffsetOverflowError] if the Mach-Os are too big to be represented
    #  in a 32-bit {Headers::FatArch} and `fat64` is `false`.
    def self.new_from_machos(*machos, fat64: false)
      raise ArgumentError, "expected at least one Mach-O" if machos.empty?

      fa_klass, magic = if fat64
        [Headers::FatArch64, Headers::FAT_MAGIC_64]
      else
        [Headers::FatArch, Headers::FAT_MAGIC]
      end

      # put the smaller alignments further forwards in fat macho, so that we do less padding
      machos = machos.sort_by(&:segment_alignment)

      bin = +""

      bin << Headers::FatHeader.new(magic, machos.size).serialize
      offset = Headers::FatHeader.bytesize + (machos.size * fa_klass.bytesize)

      macho_pads = {}

      machos.each do |macho|
        macho_offset = Utils.round(offset, 2**macho.segment_alignment)

        raise FatArchOffsetOverflowError, macho_offset if !fat64 && macho_offset > (2**32 - 1)

        macho_pads[macho] = Utils.padding_for(offset, 2**macho.segment_alignment)

        bin << fa_klass.new(macho.header.cputype, macho.header.cpusubtype,
                            macho_offset, macho.serialize.bytesize,
                            macho.segment_alignment).serialize

        offset += (macho.serialize.bytesize + macho_pads[macho])
      end

      machos.each do |macho| # rubocop:disable Style/CombinableLoops
        bin << Utils.nullpad(macho_pads[macho])
        bin << macho.serialize
      end

      new_from_bin(bin)
    end

    # Creates a new FatFile instance from a binary string.
    # @param bin [String] a binary string containing raw Mach-O data
    # @param opts [Hash] options to control the parser with
    # @note see {MachOFile#initialize} for currently valid options
    # @return [FatFile] a new FatFile
    def self.new_from_bin(bin, **opts)
      instance = allocate
      instance.initialize_from_bin(bin, opts)

      instance
    end

    # Creates a new FatFile from the given filename.
    # @param filename [String] the fat file to load from
    # @param opts [Hash] options to control the parser with
    # @note see {MachOFile#initialize} for currently valid options
    # @raise [ArgumentError] if the given file does not exist
    def initialize(filename, **opts)
      raise ArgumentError, "#{filename}: no such file" unless File.file?(filename)

      @filename = filename
      @options = opts
      @raw_data = File.open(@filename, "rb", &:read)
      populate_fields
    end

    # Initializes a new FatFile instance from a binary string with the given options.
    # @see new_from_bin
    # @api private
    def initialize_from_bin(bin, opts)
      @filename = nil
      @options = opts
      @raw_data = bin
      populate_fields
    end

    # The file's raw fat data.
    # @return [String] the raw fat data
    def serialize
      @raw_data
    end

    # @!method object?
    #  @return (see MachO::MachOFile#object?)
    # @!method executable?
    #  @return (see MachO::MachOFile#executable?)
    # @!method fvmlib?
    #  @return (see MachO::MachOFile#fvmlib?)
    # @!method core?
    #  @return (see MachO::MachOFile#core?)
    # @!method preload?
    #  @return (see MachO::MachOFile#preload?)
    # @!method dylib?
    #  @return (see MachO::MachOFile#dylib?)
    # @!method dylinker?
    #  @return (see MachO::MachOFile#dylinker?)
    # @!method bundle?
    #  @return (see MachO::MachOFile#bundle?)
    # @!method dsym?
    #  @return (see MachO::MachOFile#dsym?)
    # @!method kext?
    #  @return (see MachO::MachOFile#kext?)
    # @!method filetype
    #  @return (see MachO::MachOFile#filetype)
    # @!method dylib_id
    #  @return (see MachO::MachOFile#dylib_id)
    def_delegators :canonical_macho, :object?, :executable?, :fvmlib?,
                   :core?, :preload?, :dylib?, :dylinker?, :bundle?,
                   :dsym?, :kext?, :filetype, :dylib_id

    # @!method magic
    #  @return (see MachO::Headers::FatHeader#magic)
    def_delegators :header, :magic

    # @return [String] a string representation of the file's magic number
    def magic_string
      Headers::MH_MAGICS[magic]
    end

    # Populate the instance's fields with the raw Fat Mach-O data.
    # @return [void]
    # @note This method is public, but should (almost) never need to be called.
    def populate_fields
      @header = populate_fat_header
      @fat_archs = populate_fat_archs
      @machos = populate_machos
    end

    # All load commands responsible for loading dylibs in the file's Mach-O's.
    # @return [Array<LoadCommands::DylibCommand>] an array of DylibCommands
    def dylib_load_commands
      machos.map(&:dylib_load_commands).flatten
    end

    # Changes the file's dylib ID to `new_id`. If the file is not a dylib,
    #  does nothing.
    # @example
    #  file.change_dylib_id('libFoo.dylib')
    # @param new_id [String] the new dylib ID
    # @param options [Hash]
    # @option options [Boolean] :strict (true) if true, fail if one slice fails.
    #  if false, fail only if all slices fail.
    # @return [void]
    # @raise [ArgumentError] if `new_id` is not a String
    # @see MachOFile#linked_dylibs
    def change_dylib_id(new_id, options = {})
      raise ArgumentError, "argument must be a String" unless new_id.is_a?(String)
      return unless machos.all?(&:dylib?)

      each_macho(options) do |macho|
        macho.change_dylib_id(new_id, options)
      end

      repopulate_raw_machos
    end

    alias dylib_id= change_dylib_id

    # All shared libraries linked to the file's Mach-Os.
    # @return [Array<String>] an array of all shared libraries
    # @see MachOFile#linked_dylibs
    def linked_dylibs
      # Individual architectures in a fat binary can link to different subsets
      # of libraries, but at this point we want to have the full picture, i.e.
      # the union of all libraries used by all architectures.
      machos.map(&:linked_dylibs).flatten.uniq
    end

    # Changes all dependent shared library install names from `old_name` to
    # `new_name`. In a fat file, this changes install names in all internal
    # Mach-Os.
    # @example
    #  file.change_install_name('/usr/lib/libFoo.dylib', '/usr/lib/libBar.dylib')
    # @param old_name [String] the shared library name being changed
    # @param new_name [String] the new name
    # @param options [Hash]
    # @option options [Boolean] :strict (true) if true, fail if one slice fails.
    #  if false, fail only if all slices fail.
    # @return [void]
    # @see MachOFile#change_install_name
    def change_install_name(old_name, new_name, options = {})
      each_macho(options) do |macho|
        macho.change_install_name(old_name, new_name, options)
      end

      repopulate_raw_machos
    end

    alias change_dylib change_install_name

    # All runtime paths associated with the file's Mach-Os.
    # @return [Array<String>] an array of all runtime paths
    # @see MachOFile#rpaths
    def rpaths
      # Can individual architectures have different runtime paths?
      machos.map(&:rpaths).flatten.uniq
    end

    # Change the runtime path `old_path` to `new_path` in the file's Mach-Os.
    # @param old_path [String] the old runtime path
    # @param new_path [String] the new runtime path
    # @param options [Hash]
    # @option options [Boolean] :strict (true) if true, fail if one slice fails.
    #  if false, fail only if all slices fail.
    # @return [void]
    # @see MachOFile#change_rpath
    def change_rpath(old_path, new_path, options = {})
      each_macho(options) do |macho|
        macho.change_rpath(old_path, new_path, options)
      end

      repopulate_raw_machos
    end

    # Add the given runtime path to the file's Mach-Os.
    # @param path [String] the new runtime path
    # @param options [Hash]
    # @option options [Boolean] :strict (true) if true, fail if one slice fails.
    #  if false, fail only if all slices fail.
    # @return [void]
    # @see MachOFile#add_rpath
    def add_rpath(path, options = {})
      each_macho(options) do |macho|
        macho.add_rpath(path, options)
      end

      repopulate_raw_machos
    end

    # Delete the given runtime path from the file's Mach-Os.
    # @param path [String] the runtime path to delete
    # @param options [Hash]
    # @option options [Boolean] :strict (true) if true, fail if one slice fails.
    #  if false, fail only if all slices fail.
    # @return void
    # @see MachOFile#delete_rpath
    def delete_rpath(path, options = {})
      each_macho(options) do |macho|
        macho.delete_rpath(path, options)
      end

      repopulate_raw_machos
    end

    # Extract a Mach-O with the given CPU type from the file.
    # @example
    #  file.extract(:i386) # => MachO::MachOFile
    # @param cputype [Symbol] the CPU type of the Mach-O being extracted
    # @return [MachOFile, nil] the extracted Mach-O or nil if no Mach-O has the given CPU type
    def extract(cputype)
      machos.select { |macho| macho.cputype == cputype }.first
    end

    # Write all (fat) data to the given filename.
    # @param filename [String] the file to write to
    # @return [void]
    def write(filename)
      File.open(filename, "wb") { |f| f.write(@raw_data) }
    end

    # Write all (fat) data to the file used to initialize the instance.
    # @return [void]
    # @raise [MachOError] if the instance was initialized without a file
    # @note Overwrites all data in the file!
    def write!
      raise MachOError, "no initial file to write to" if filename.nil?

      File.open(@filename, "wb") { |f| f.write(@raw_data) }
    end

    # @return [Hash] a hash representation of this {FatFile}
    def to_h
      {
        "header" => header.to_h,
        "fat_archs" => fat_archs.map(&:to_h),
        "machos" => machos.map(&:to_h),
      }
    end

    private

    # Obtain the fat header from raw file data.
    # @return [Headers::FatHeader] the fat header
    # @raise [TruncatedFileError] if the file is too small to have a
    #  valid header
    # @raise [MagicError] if the magic is not valid Mach-O magic
    # @raise [MachOBinaryError] if the magic is for a non-fat Mach-O file
    # @raise [JavaClassFileError] if the file is a Java classfile
    # @api private
    def populate_fat_header
      # the smallest fat Mach-O header is 8 bytes
      raise TruncatedFileError if @raw_data.size < 8

      fh = Headers::FatHeader.new_from_bin(:big, @raw_data[0, Headers::FatHeader.bytesize])

      raise MagicError, fh.magic unless Utils.magic?(fh.magic)
      raise MachOBinaryError unless Utils.fat_magic?(fh.magic)

      # Rationale: Java classfiles have the same magic as big-endian fat
      # Mach-Os. Classfiles encode their version at the same offset as
      # `nfat_arch` and the lowest version number is 43, so we error out
      # if a file claims to have over 30 internal architectures. It's
      # technically possible for a fat Mach-O to have over 30 architectures,
      # but this is extremely unlikely and in practice distinguishes the two
      # formats.
      raise JavaClassFileError if fh.nfat_arch > 30

      fh
    end

    # Obtain an array of fat architectures from raw file data.
    # @return [Array<Headers::FatArch>] an array of fat architectures
    # @api private
    def populate_fat_archs
      archs = []

      fa_klass = Utils.fat_magic32?(header.magic) ? Headers::FatArch : Headers::FatArch64
      fa_off   = Headers::FatHeader.bytesize
      fa_len   = fa_klass.bytesize

      header.nfat_arch.times do |i|
        archs << fa_klass.new_from_bin(:big, @raw_data[fa_off + (fa_len * i), fa_len])
      end

      archs
    end

    # Obtain an array of Mach-O blobs from raw file data.
    # @return [Array<MachOFile>] an array of Mach-Os
    # @api private
    def populate_machos
      machos = []

      fat_archs.each do |arch|
        machos << MachOFile.new_from_bin(@raw_data[arch.offset, arch.size], **options)
      end

      machos
    end

    # Repopulate the raw Mach-O data with each internal Mach-O object.
    # @return [void]
    # @api private
    def repopulate_raw_machos
      machos.each_with_index do |macho, i|
        arch = fat_archs[i]

        @raw_data[arch.offset, arch.size] = macho.serialize
      end
    end

    # Yield each Mach-O object in the file, rescuing and accumulating errors.
    # @param options [Hash]
    # @option options [Boolean] :strict (true) whether or not to fail loudly
    #  with an exception if at least one Mach-O raises an exception. If false,
    #  only raises an exception if *all* Mach-Os raise exceptions.
    # @raise [RecoverableModificationError] under the conditions of
    #  the `:strict` option above.
    # @api private
    def each_macho(options = {})
      strict = options.fetch(:strict, true)
      errors = []

      machos.each_with_index do |macho, index|
        yield macho
      rescue RecoverableModificationError => e
        e.macho_slice = index

        # Strict mode: Immediately re-raise. Otherwise: Retain, check later.
        raise e if strict

        errors << e
      end

      # Non-strict mode: Raise first error if *all* Mach-O slices failed.
      raise errors.first if errors.size == machos.size
    end

    # Return a single-arch Mach-O that represents this fat Mach-O for purposes
    #  of delegation.
    # @return [MachOFile] the Mach-O file
    # @api private
    def canonical_macho
      machos.first
    end
  end
end
