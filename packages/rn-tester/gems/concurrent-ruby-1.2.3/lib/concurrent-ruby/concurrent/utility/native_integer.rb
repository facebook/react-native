module Concurrent
  # @!visibility private
  module Utility
    # @private
    module NativeInteger
      # http://stackoverflow.com/questions/535721/ruby-max-integer
      MIN_VALUE = -(2**(0.size * 8 - 2))
      MAX_VALUE = (2**(0.size * 8 - 2) - 1)

      def ensure_upper_bound(value)
        if value > MAX_VALUE
          raise RangeError.new("#{value} is greater than the maximum value of #{MAX_VALUE}")
        end
        value
      end

      def ensure_lower_bound(value)
        if value < MIN_VALUE
          raise RangeError.new("#{value} is less than the maximum value of #{MIN_VALUE}")
        end
        value
      end

      def ensure_integer(value)
        unless value.is_a?(Integer)
          raise ArgumentError.new("#{value} is not an Integer")
        end
        value
      end

      def ensure_integer_and_bounds(value)
        ensure_integer value
        ensure_upper_bound value
        ensure_lower_bound value
      end

      def ensure_positive(value)
        if value < 0
          raise ArgumentError.new("#{value} cannot be negative")
        end
        value
      end

      def ensure_positive_and_no_zero(value)
        if value < 1
          raise ArgumentError.new("#{value} cannot be negative or zero")
        end
        value
      end

      extend self
    end
  end
end
