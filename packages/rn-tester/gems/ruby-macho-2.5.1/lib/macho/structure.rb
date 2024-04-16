# frozen_string_literal: true

module MachO
  # A general purpose pseudo-structure.
  # @abstract
  class MachOStructure
    # The String#unpack format of the data structure.
    # @return [String] the unpacking format
    # @api private
    FORMAT = ""

    # The size of the data structure, in bytes.
    # @return [Integer] the size, in bytes
    # @api private
    SIZEOF = 0

    # @return [Integer] the size, in bytes, of the represented structure.
    def self.bytesize
      self::SIZEOF
    end

    # @param endianness [Symbol] either `:big` or `:little`
    # @param bin [String] the string to be unpacked into the new structure
    # @return [MachO::MachOStructure] the resulting structure
    # @api private
    def self.new_from_bin(endianness, bin)
      format = Utils.specialize_format(self::FORMAT, endianness)

      new(*bin.unpack(format))
    end

    # @return [Hash] a hash representation of this {MachOStructure}.
    def to_h
      {
        "structure" => {
          "format" => self.class::FORMAT,
          "bytesize" => self.class.bytesize,
        },
      }
    end
  end
end
