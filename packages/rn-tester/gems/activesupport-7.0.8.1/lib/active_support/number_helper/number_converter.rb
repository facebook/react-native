# frozen_string_literal: true

require "active_support/core_ext/big_decimal/conversions"
require "active_support/core_ext/object/blank"
require "active_support/core_ext/hash/keys"
require "active_support/i18n"
require "active_support/core_ext/class/attribute"

module ActiveSupport
  module NumberHelper
    class NumberConverter # :nodoc:
      # Default and i18n option namespace per class
      class_attribute :namespace

      # Does the object need a number that is a valid float?
      class_attribute :validate_float

      attr_reader :number, :opts

      DEFAULTS = {
        # Used in number_to_delimited
        # These are also the defaults for 'currency', 'percentage', 'precision', and 'human'
        format: {
          # Sets the separator between the units, for more precision (e.g. 1.0 / 2.0 == 0.5)
          separator: ".",
          # Delimits thousands (e.g. 1,000,000 is a million) (always in groups of three)
          delimiter: ",",
          # Number of decimals, behind the separator (the number 1 with a precision of 2 gives: 1.00)
          precision: 3,
          # If set to true, precision will mean the number of significant digits instead
          # of the number of decimal digits (1234 with precision 2 becomes 1200, 1.23543 becomes 1.2)
          significant: false,
          # If set, the zeros after the decimal separator will always be stripped (e.g.: 1.200 will be 1.2)
          strip_insignificant_zeros: false
        },

        # Used in number_to_currency
        currency: {
          format: {
            format: "%u%n",
            negative_format: "-%u%n",
            unit: "$",
            # These five are to override number.format and are optional
            separator: ".",
            delimiter: ",",
            precision: 2,
            significant: false,
            strip_insignificant_zeros: false
          }
        },

        # Used in number_to_percentage
        percentage: {
          format: {
            delimiter: "",
            format: "%n%"
          }
        },

        # Used in number_to_rounded
        precision: {
          format: {
            delimiter: ""
          }
        },

        # Used in number_to_human_size and number_to_human
        human: {
          format: {
            # These five are to override number.format and are optional
            delimiter: "",
            precision: 3,
            significant: true,
            strip_insignificant_zeros: true
          },
          # Used in number_to_human_size
          storage_units: {
            # Storage units output formatting.
            # %u is the storage unit, %n is the number (default: 2 MB)
            format: "%n %u",
            units: {
              byte: "Bytes",
              kb: "KB",
              mb: "MB",
              gb: "GB",
              tb: "TB"
            }
          },
          # Used in number_to_human
          decimal_units: {
            format: "%n %u",
            # Decimal units output formatting
            # By default we will only quantify some of the exponents
            # but the commented ones might be defined or overridden
            # by the user.
            units: {
              # femto: Quadrillionth
              # pico: Trillionth
              # nano: Billionth
              # micro: Millionth
              # mili: Thousandth
              # centi: Hundredth
              # deci: Tenth
              unit: "",
              # ten:
              #   one: Ten
              #   other: Tens
              # hundred: Hundred
              thousand: "Thousand",
              million: "Million",
              billion: "Billion",
              trillion: "Trillion",
              quadrillion: "Quadrillion"
            }
          }
        }
      }

      def self.convert(number, options)
        new(number, options).execute
      end

      def initialize(number, options)
        @number = number
        @opts   = options.symbolize_keys
      end

      def execute
        if !number
          nil
        elsif validate_float? && !valid_float?
          number
        else
          convert
        end
      end

      private
        def options
          @options ||= format_options.merge(opts)
        end

        def format_options
          default_format_options.merge!(i18n_format_options)
        end

        def default_format_options
          options = DEFAULTS[:format].dup
          options.merge!(DEFAULTS[namespace][:format]) if namespace
          options
        end

        def i18n_format_options
          locale = opts[:locale]
          options = I18n.translate(:'number.format', locale: locale, default: {}).dup

          if namespace
            options.merge!(I18n.translate(:"number.#{namespace}.format", locale: locale, default: {}))
          end

          options
        end

        def translate_number_value_with_default(key, **i18n_options)
          I18n.translate(key, **{ default: default_value(key), scope: :number }.merge!(i18n_options))
        end

        def translate_in_locale(key, **i18n_options)
          translate_number_value_with_default(key, **{ locale: options[:locale] }.merge(i18n_options))
        end

        def default_value(key)
          key.split(".").reduce(DEFAULTS) { |defaults, k| defaults[k.to_sym] }
        end

        def valid_float?
          Float(number, exception: false)
        end
    end
  end
end
