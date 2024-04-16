# frozen_string_literal: true

module MachO
  # A collection of utility functions used throughout ruby-macho.
  module Utils
    # Rounds a value to the next multiple of the given round.
    # @param value [Integer] the number being rounded
    # @param round [Integer] the number being rounded with
    # @return [Integer] the rounded value
    # @see http://www.opensource.apple.com/source/cctools/cctools-870/libstuff/rnd.c
    def self.round(value, round)
      round -= 1
      value += round
      value &= ~round
      value
    end

    # Returns the number of bytes needed to pad the given size to the given
    #  alignment.
    # @param size [Integer] the unpadded size
    # @param alignment [Integer] the number to alignment the size with
    # @return [Integer] the number of pad bytes required
    def self.padding_for(size, alignment)
      round(size, alignment) - size
    end

    # Returns a string of null bytes of the requested (non-negative) size
    # @param size [Integer] the size of the nullpad
    # @return [String] the null string (or empty string, for `size = 0`)
    # @raise [ArgumentError] if a non-positive nullpad is requested
    def self.nullpad(size)
      raise ArgumentError, "size < 0: #{size}" if size.negative?

      "\x00" * size
    end

    # Converts an abstract (native-endian) String#unpack format to big or
    #  little.
    # @param format [String] the format string being converted
    # @param endianness [Symbol] either `:big` or `:little`
    # @return [String] the converted string
    def self.specialize_format(format, endianness)
      modifier = endianness == :big ? ">" : "<"
      format.tr("=", modifier)
    end

    # Packs tagged strings into an aligned payload.
    # @param fixed_offset [Integer] the baseline offset for the first packed
    #  string
    # @param alignment [Integer] the alignment value to use for packing
    # @param strings [Hash] the labeled strings to pack
    # @return [Array<String, Hash>] the packed string and labeled offsets
    def self.pack_strings(fixed_offset, alignment, strings = {})
      offsets = {}
      next_offset = fixed_offset
      payload = +""

      strings.each do |key, string|
        offsets[key] = next_offset
        payload << string
        payload << Utils.nullpad(1)
        next_offset += string.bytesize + 1
      end

      payload << Utils.nullpad(padding_for(fixed_offset + payload.bytesize, alignment))
      [payload.freeze, offsets]
    end

    # Compares the given number to valid Mach-O magic numbers.
    # @param num [Integer] the number being checked
    # @return [Boolean] whether `num` is a valid Mach-O magic number
    def self.magic?(num)
      Headers::MH_MAGICS.key?(num)
    end

    # Compares the given number to valid Fat magic numbers.
    # @param num [Integer] the number being checked
    # @return [Boolean] whether `num` is a valid Fat magic number
    def self.fat_magic?(num)
      [Headers::FAT_MAGIC, Headers::FAT_MAGIC_64].include? num
    end

    # Compares the given number to valid 32-bit Fat magic numbers.
    # @param num [Integer] the number being checked
    # @return [Boolean] whether `num` is a valid 32-bit fat magic number
    def self.fat_magic32?(num)
      num == Headers::FAT_MAGIC
    end

    # Compares the given number to valid 64-bit Fat magic numbers.
    # @param num [Integer] the number being checked
    # @return [Boolean] whether `num` is a valid 64-bit fat magic number
    def self.fat_magic64?(num)
      num == Headers::FAT_MAGIC_64
    end

    # Compares the given number to valid 32-bit Mach-O magic numbers.
    # @param num [Integer] the number being checked
    # @return [Boolean] whether `num` is a valid 32-bit magic number
    def self.magic32?(num)
      [Headers::MH_MAGIC, Headers::MH_CIGAM].include? num
    end

    # Compares the given number to valid 64-bit Mach-O magic numbers.
    # @param num [Integer] the number being checked
    # @return [Boolean] whether `num` is a valid 64-bit magic number
    def self.magic64?(num)
      [Headers::MH_MAGIC_64, Headers::MH_CIGAM_64].include? num
    end

    # Compares the given number to valid little-endian magic numbers.
    # @param num [Integer] the number being checked
    # @return [Boolean] whether `num` is a valid little-endian magic number
    def self.little_magic?(num)
      [Headers::MH_CIGAM, Headers::MH_CIGAM_64].include? num
    end

    # Compares the given number to valid big-endian magic numbers.
    # @param num [Integer] the number being checked
    # @return [Boolean] whether `num` is a valid big-endian magic number
    def self.big_magic?(num)
      [Headers::MH_MAGIC, Headers::MH_MAGIC_64].include? num
    end
  end
end
