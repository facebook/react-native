require 'delegate'

module Typhoeus
  class Response

    # This class represents the response header.
    # It can be accessed like a hash.
    # Values can be strings (normal case) or arrays of strings (for duplicates headers)
    #
    # @api private
    class Header < DelegateClass(Hash)

      # Create a new header.
      #
      # @example Create new header.
      #   Header.new(raw)
      #
      # @param [ String ] raw The raw header.
      def initialize(raw)
        super({})
        @raw = raw
        @sanitized = {}
        parse
      end

      def [](key)
        fetch(key) { @sanitized[key.to_s.downcase] }
      end

      # Parses the raw header.
      #
      # @example Parse header.
      #   header.parse
      def parse
        case @raw
        when Hash
          raw.each do |k, v|
            process_pair(k, v)
          end
        when String
          raw.split(/\r?\n(?!\s)/).each do |header|
            header.strip!
            next if header.empty? || header.start_with?( 'HTTP/' )
            process_line(header)
          end
        end
      end

      private

      # Processes line and saves the result.
      #
      # @return [ void ]
      def process_line(header)
        key, value = header.split(':', 2)
        process_pair(key.strip, (value ? value.strip.gsub(/\r?\n\s*/, ' ') : ''))
      end

      # Sets key value pair for self and @sanitized.
      #
      # @return [ void ]
      def process_pair(key, value)
        set_value(key, value, self)
        @sanitized[key.downcase] = self[key]
      end

      # Sets value for key in specified hash
      #
      # @return [ void ]
      def set_value(key, value, hash)
        current_value = hash[key]
        if current_value
          if current_value.is_a? Array
            current_value << value
          else
            hash[key] = [current_value, value]
          end
        else
          hash[key] = value
        end
      end

      # Returns the raw header or empty string.
      #
      # @example Return raw header.
      #   header.raw
      #
      # @return [ String ] The raw header.
      def raw
        @raw || ''
      end

      # Sets the default proc for the specified hash independent of the Ruby version.
      #
      # @return [ void ]
      def set_default_proc_on(hash, default_proc)
        if hash.respond_to?(:default_proc=)
          hash.default_proc = default_proc
        else
          hash.replace(Hash.new(&default_proc).merge(hash))
        end
      end
    end
  end
end
