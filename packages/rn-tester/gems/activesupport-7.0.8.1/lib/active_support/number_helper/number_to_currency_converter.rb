# frozen_string_literal: true

require "active_support/number_helper/number_converter"

module ActiveSupport
  module NumberHelper
    class NumberToCurrencyConverter < NumberConverter # :nodoc:
      self.namespace = :currency

      def convert
        format = options[:format]

        number_f = valid_float?
        if number_f
          if number_f.negative?
            number_f = number_f.abs
            format = options[:negative_format] if (number_f * 10**options[:precision]) >= 0.5
          end
          number_s = NumberToRoundedConverter.convert(number_f, options)
        else
          number_s = number.to_s.strip
          format = options[:negative_format] if number_s.sub!(/^-/, "")
        end

        format.gsub("%n", number_s).gsub("%u", options[:unit])
      end

      private
        def options
          @options ||= begin
            defaults = default_format_options.merge(i18n_opts)
            # Override negative format if format options are given
            defaults[:negative_format] = "-#{opts[:format]}" if opts[:format]
            defaults.merge!(opts)
          end
        end

        def i18n_opts
          # Set International negative format if it does not exist
          i18n = i18n_format_options
          i18n[:negative_format] ||= "-#{i18n[:format]}" if i18n[:format]
          i18n
        end
    end
  end
end
