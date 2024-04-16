# coding: US-ASCII
# frozen_string_literal: false
module REXML
  module Encoding
    # ID ---> Encoding name
    attr_reader :encoding
    def encoding=(encoding)
      encoding = encoding.name if encoding.is_a?(Encoding)
      if encoding.is_a?(String)
        original_encoding = encoding
        encoding = find_encoding(encoding)
        unless encoding
          raise ArgumentError, "Bad encoding name #{original_encoding}"
        end
      end
      return false if defined?(@encoding) and encoding == @encoding
      if encoding
        @encoding = encoding.upcase
      else
        @encoding = 'UTF-8'
      end
      true
    end

    def encode(string)
      string.encode(@encoding)
    end

    def decode(string)
      string.encode(::Encoding::UTF_8, @encoding)
    end

    private
    def find_encoding(name)
      case name
      when /\Ashift-jis\z/i
        return "SHIFT_JIS"
      when /\ACP-(\d+)\z/
        name = "CP#{$1}"
      when /\AUTF-8\z/i
        return name
      end
      begin
        ::Encoding::Converter.search_convpath(name, 'UTF-8')
      rescue ::Encoding::ConverterNotFoundError
        return nil
      end
      name
    end
  end
end
