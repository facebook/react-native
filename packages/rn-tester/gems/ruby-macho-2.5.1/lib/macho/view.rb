# frozen_string_literal: true

module MachO
  # A representation of some unspecified Mach-O data.
  class MachOView
    # @return [String] the raw Mach-O data
    attr_reader :raw_data

    # @return [Symbol] the endianness of the data (`:big` or `:little`)
    attr_reader :endianness

    # @return [Integer] the offset of the relevant data (in {#raw_data})
    attr_reader :offset

    # Creates a new MachOView.
    # @param raw_data [String] the raw Mach-O data
    # @param endianness [Symbol] the endianness of the data
    # @param offset [Integer] the offset of the relevant data
    def initialize(raw_data, endianness, offset)
      @raw_data = raw_data
      @endianness = endianness
      @offset = offset
    end

    # @return [Hash] a hash representation of this {MachOView}.
    def to_h
      {
        "endianness" => endianness,
        "offset" => offset,
      }
    end
  end
end
