# frozen_string_literal: true

require "active_support/number_helper/number_converter"

module ActiveSupport
  module NumberHelper
    class NumberToPhoneConverter < NumberConverter # :nodoc:
      def convert
        str = country_code(opts[:country_code]).dup
        str << convert_to_phone_number(number.to_s.strip)
        str << phone_ext(opts[:extension])
      end

      private
        def convert_to_phone_number(number)
          if opts[:area_code]
            convert_with_area_code(number)
          else
            convert_without_area_code(number)
          end
        end

        def convert_with_area_code(number)
          default_pattern = /(\d{1,3})(\d{3})(\d{4}$)/
          number.gsub!(regexp_pattern(default_pattern),
                       "(\\1) \\2#{delimiter}\\3")
          number
        end

        def convert_without_area_code(number)
          default_pattern = /(\d{0,3})(\d{3})(\d{4})$/
          number.gsub!(regexp_pattern(default_pattern),
                       "\\1#{delimiter}\\2#{delimiter}\\3")
          number.slice!(0, 1) if start_with_delimiter?(number)
          number
        end

        def start_with_delimiter?(number)
          delimiter.present? && number.start_with?(delimiter)
        end

        def delimiter
          opts[:delimiter] || "-"
        end

        def country_code(code)
          code.blank? ? "" : "+#{code}#{delimiter}"
        end

        def phone_ext(ext)
          ext.blank? ? "" : " x #{ext}"
        end

        def regexp_pattern(default_pattern)
          opts.fetch :pattern, default_pattern
        end
    end
  end
end
