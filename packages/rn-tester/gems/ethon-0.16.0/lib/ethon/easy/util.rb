# frozen_string_literal: true
module Ethon
  class Easy # :nodoc:

    # This module contains small helpers.
    #
    # @api private
    module Util

      # Escapes zero bytes in strings.
      #
      # @example Escape zero bytes.
      #   Util.escape_zero_byte("1\0")
      #   #=> "1\\0"
      #
      # @param [ Object ] value The value to escape.
      #
      # @return [ String, Object ] Escaped String if
      #   zero byte found, original object if not.
      def escape_zero_byte(value)
        return value unless value.to_s.include?(0.chr)
        value.to_s.gsub(0.chr, '\\\0')
      end

      extend self
    end
  end
end
