# frozen_string_literal: true

require "active_support/number_helper/number_converter"

module ActiveSupport
  module NumberHelper
    class NumberToHumanConverter < NumberConverter # :nodoc:
      DECIMAL_UNITS = { 0 => :unit, 1 => :ten, 2 => :hundred, 3 => :thousand, 6 => :million, 9 => :billion, 12 => :trillion, 15 => :quadrillion,
        -1 => :deci, -2 => :centi, -3 => :mili, -6 => :micro, -9 => :nano, -12 => :pico, -15 => :femto }
      INVERTED_DECIMAL_UNITS = DECIMAL_UNITS.invert

      self.namespace      = :human
      self.validate_float = true

      def convert # :nodoc:
        @number = RoundingHelper.new(options).round(number)
        @number = Float(number)

        # For backwards compatibility with those that didn't add strip_insignificant_zeros to their locale files.
        unless options.key?(:strip_insignificant_zeros)
          options[:strip_insignificant_zeros] = true
        end

        units = opts[:units]
        exponent = calculate_exponent(units)
        @number = number / (10**exponent)

        rounded_number = NumberToRoundedConverter.convert(number, options)
        unit = determine_unit(units, exponent)
        format.gsub("%n", rounded_number).gsub("%u", unit).strip
      end

      private
        def format
          options[:format] || translate_in_locale("human.decimal_units.format")
        end

        def determine_unit(units, exponent)
          exp = DECIMAL_UNITS[exponent]
          case units
          when Hash
            units[exp] || ""
          when String, Symbol
            I18n.translate("#{units}.#{exp}", locale: options[:locale], count: number.to_i)
          else
            translate_in_locale("human.decimal_units.units.#{exp}", count: number.to_i)
          end
        end

        def calculate_exponent(units)
          exponent = number != 0 ? Math.log10(number.abs).floor : 0
          unit_exponents(units).find { |e| exponent >= e } || 0
        end

        def unit_exponents(units)
          case units
          when Hash
            units
          when String, Symbol
            I18n.translate(units.to_s, locale: options[:locale], raise: true)
          when nil
            translate_in_locale("human.decimal_units.units", raise: true)
          else
            raise ArgumentError, ":units must be a Hash or String translation scope."
          end.keys.map { |e_name| INVERTED_DECIMAL_UNITS[e_name] }.sort_by(&:-@)
        end
    end
  end
end
