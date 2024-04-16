require 'shellwords'

module Xcodeproj
  class Config
    # Parses other linker flags values.
    #
    module OtherLinkerFlagsParser
      # @return [Hash{Symbol, Array[String]}] Splits the given
      #         other linker flags value by type.
      #
      # @param  [String, Array] flags
      #         The other linker flags value.
      #
      def self.parse(flags)
        result = {
          :frameworks => [],
          :weak_frameworks => [],
          :libraries => [],
          :arg_files => [],
          :simple => [],
          :force_load => [],
        }

        key = nil
        if flags.is_a? String
          flags = split(flags)
        end
        flags.each do |token|
          case token
          when '-framework'
            key = :frameworks
          when '-weak_framework'
            key = :weak_frameworks
          when '-l'
            key = :libraries
          when '@'
            key = :arg_files
          when '-force_load'
            key = :force_load
          else
            if key
              result[key] << token
              key = nil
            else
              result[:simple] << token
            end
          end
        end
        result
      end

      # @return [Array<String>] Split the given other linker
      #         flags value, taking into account quoting and
      #         the fact that the `-l` flag might omit the
      #         space.
      #
      # @param  [String] flags
      #         The other linker flags value.
      #
      def self.split(flags)
        flags.strip.shellsplit.flat_map do |string|
          if string =~ /\A-l.+/
            ['-l', string[2..-1]]
          elsif string =~ /\A@.+/
            ['@', string[1..-1]]
          else
            string
          end
        end
      end
    end
  end
end
