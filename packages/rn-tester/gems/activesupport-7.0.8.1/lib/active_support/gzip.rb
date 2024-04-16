# frozen_string_literal: true

require "zlib"
require "stringio"

module ActiveSupport
  # A convenient wrapper for the zlib standard library that allows
  # compression/decompression of strings with gzip.
  #
  #   gzip = ActiveSupport::Gzip.compress('compress me!')
  #   # => "\x1F\x8B\b\x00o\x8D\xCDO\x00\x03K\xCE\xCF-(J-.V\xC8MU\x04\x00R>n\x83\f\x00\x00\x00"
  #
  #   ActiveSupport::Gzip.decompress(gzip)
  #   # => "compress me!"
  module Gzip
    class Stream < StringIO
      def initialize(*)
        super
        set_encoding "BINARY"
      end
      def close; rewind; end
    end

    # Decompresses a gzipped string.
    def self.decompress(source)
      Zlib::GzipReader.wrap(StringIO.new(source), &:read)
    end

    # Compresses a string using gzip.
    def self.compress(source, level = Zlib::DEFAULT_COMPRESSION, strategy = Zlib::DEFAULT_STRATEGY)
      output = Stream.new
      gz = Zlib::GzipWriter.new(output, level, strategy)
      gz.write(source)
      gz.close
      output.string
    end
  end
end
