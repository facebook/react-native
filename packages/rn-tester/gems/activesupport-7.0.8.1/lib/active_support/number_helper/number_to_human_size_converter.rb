# frozen_string_literal: true

require "active_support/number_helper/number_converter"

module ActiveSupport
  module NumberHelper
    class NumberToHumanSizeConverter < NumberConverter # :nodoc:
      STORAGE_UNITS = [:byte, :kb, :mb, :gb, :tb, :pb, :eb]

      self.namespace      = :human
      self.validate_float = true

      def convert
        @number = Float(number)

        # For backwards compatibility with those that didn't add strip_insignificant_zeros to their locale files.
        unless options.key?(:strip_insignificant_zeros)
          options[:strip_insignificant_zeros] = true
        end

        if smaller_than_base?
          number_to_format = number.to_i.to_s
        else
          human_size = number / (base**exponent)
          number_to_format = NumberToRoundedConverter.convert(human_size, options)
        end
        conversion_format.gsub("%n", number_to_format).gsub("%u", unit)
      end

      private
        def conversion_format
          translate_number_value_with_default("human.storage_units.format", locale: options[:locale], raise: true)
        end

        def unit
          translate_number_value_with_default(storage_unit_key, locale: options[:locale], count: number.to_i, raise: true)
        end

        def storage_unit_key
          key_end = smaller_than_base? ? "byte" : STORAGE_UNITS[exponent]
          "human.storage_units.units.#{key_end}"
        end

        def exponent
          max = STORAGE_UNITS.size - 1
          exp = (Math.log(number) / Math.log(base)).to_i
          exp = max if exp > max # avoid overflow for the highest unit
          exp
        end

        def smaller_than_base?
          number.to_i < base
        end

        def base
          1024
        end
    end
  end
end
