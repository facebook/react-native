# frozen_string_literal: true
module Ethon
  class Multi

    # This module contains the logic and knowledge about the
    # available options on multi.
    module Options

      # Sets max_total_connections option.
      #
      # @example Set max_total_connections option.
      #   multi.max_total_conections = $value
      #
      # @param [ String ] value The value to set.
      #
      # @return [ void ]
      def max_total_connections=(value)
        Curl.set_option(:max_total_connections, value_for(value, :int), handle, :multi)
      end

      # Sets maxconnects option.
      #
      # @example Set maxconnects option.
      #   multi.maxconnects = $value
      #
      # @param [ String ] value The value to set.
      #
      # @return [ void ]
      def maxconnects=(value)
        Curl.set_option(:maxconnects, value_for(value, :int), handle, :multi)
      end

      # Sets pipelining option.
      #
      # @example Set pipelining option.
      #   multi.pipelining = $value
      #
      # @param [ String ] value The value to set.
      #
      # @return [ void ]
      def pipelining=(value)
        Curl.set_option(:pipelining, value_for(value, :int), handle, :multi)
      end

      # Sets socketdata option.
      #
      # @example Set socketdata option.
      #   multi.socketdata = $value
      #
      # @param [ String ] value The value to set.
      #
      # @return [ void ]
      def socketdata=(value)
        Curl.set_option(:socketdata, value_for(value, :string), handle, :multi)
      end

      # Sets socketfunction option.
      #
      # @example Set socketfunction option.
      #   multi.socketfunction = $value
      #
      # @param [ String ] value The value to set.
      #
      # @return [ void ]
      def socketfunction=(value)
        Curl.set_option(:socketfunction, value_for(value, :string), handle, :multi)
      end

      # Sets timerdata option.
      #
      # @example Set timerdata option.
      #   multi.timerdata = $value
      #
      # @param [ String ] value The value to set.
      #
      # @return [ void ]
      def timerdata=(value)
        Curl.set_option(:timerdata, value_for(value, :string), handle, :multi)
      end

      # Sets timerfunction option.
      #
      # @example Set timerfunction option.
      #   multi.timerfunction = $value
      #
      # @param [ String ] value The value to set.
      #
      # @return [ void ]
      def timerfunction=(value)
        Curl.set_option(:timerfunction, value_for(value, :string), handle, :multi)
      end

      private

      # Return the value to set to multi handle. It is converted with the help
      # of bool_options, enum_options and int_options.
      #
      # @example Return casted the value.
      #   multi.value_for(:verbose)
      #
      # @return [ Object ] The casted value.
      def value_for(value, type, option = nil)
        return nil if value.nil?

        if type == :bool
          value ? 1 : 0
        elsif type == :int
          value.to_i
        elsif value.is_a?(String)
          Ethon::Easy::Util.escape_zero_byte(value)
        else
          value
        end
      end
    end
  end
end
