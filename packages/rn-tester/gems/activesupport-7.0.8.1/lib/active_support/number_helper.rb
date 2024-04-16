# frozen_string_literal: true

module ActiveSupport
  module NumberHelper
    extend ActiveSupport::Autoload

    eager_autoload do
      autoload :NumberConverter
      autoload :RoundingHelper
      autoload :NumberToRoundedConverter
      autoload :NumberToDelimitedConverter
      autoload :NumberToHumanConverter
      autoload :NumberToHumanSizeConverter
      autoload :NumberToPhoneConverter
      autoload :NumberToCurrencyConverter
      autoload :NumberToPercentageConverter
    end

    extend self

    # Formats a +number+ into a phone number (US by default e.g., (555)
    # 123-9876). You can customize the format in the +options+ hash.
    #
    # ==== Options
    #
    # * <tt>:area_code</tt> - Adds parentheses around the area code.
    # * <tt>:delimiter</tt> - Specifies the delimiter to use
    #   (defaults to "-").
    # * <tt>:extension</tt> - Specifies an extension to add to the
    #   end of the generated number.
    # * <tt>:country_code</tt> - Sets the country code for the phone
    #   number.
    # * <tt>:pattern</tt> - Specifies how the number is divided into three
    #   groups with the custom regexp to override the default format.
    # ==== Examples
    #
    #   number_to_phone(5551234)                                     # => "555-1234"
    #   number_to_phone('5551234')                                   # => "555-1234"
    #   number_to_phone(1235551234)                                  # => "123-555-1234"
    #   number_to_phone(1235551234, area_code: true)                 # => "(123) 555-1234"
    #   number_to_phone(1235551234, delimiter: ' ')                  # => "123 555 1234"
    #   number_to_phone(1235551234, area_code: true, extension: 555) # => "(123) 555-1234 x 555"
    #   number_to_phone(1235551234, country_code: 1)                 # => "+1-123-555-1234"
    #   number_to_phone('123a456')                                   # => "123a456"
    #
    #   number_to_phone(1235551234, country_code: 1, extension: 1343, delimiter: '.')
    #   # => "+1.123.555.1234 x 1343"
    #
    #   number_to_phone(75561234567, pattern: /(\d{1,4})(\d{4})(\d{4})$/, area_code: true)
    #   # => "(755) 6123-4567"
    #   number_to_phone(13312345678, pattern: /(\d{3})(\d{4})(\d{4})$/)
    #   # => "133-1234-5678"
    def number_to_phone(number, options = {})
      NumberToPhoneConverter.convert(number, options)
    end

    # Formats a +number+ into a currency string (e.g., $13.65). You
    # can customize the format in the +options+ hash.
    #
    # The currency unit and number formatting of the current locale will be used
    # unless otherwise specified in the provided options. No currency conversion
    # is performed. If the user is given a way to change their locale, they will
    # also be able to change the relative value of the currency displayed with
    # this helper. If your application will ever support multiple locales, you
    # may want to specify a constant <tt>:locale</tt> option or consider
    # using a library capable of currency conversion.
    #
    # ==== Options
    #
    # * <tt>:locale</tt> - Sets the locale to be used for formatting
    #   (defaults to current locale).
    # * <tt>:precision</tt> - Sets the level of precision (defaults
    #   to 2).
    # * <tt>:round_mode</tt> - Determine how rounding is performed
    #   (defaults to :default. See BigDecimal::mode)
    # * <tt>:unit</tt> - Sets the denomination of the currency
    #   (defaults to "$").
    # * <tt>:separator</tt> - Sets the separator between the units
    #   (defaults to ".").
    # * <tt>:delimiter</tt> - Sets the thousands delimiter (defaults
    #   to ",").
    # * <tt>:format</tt> - Sets the format for non-negative numbers
    #   (defaults to "%u%n").  Fields are <tt>%u</tt> for the
    #   currency, and <tt>%n</tt> for the number.
    # * <tt>:negative_format</tt> - Sets the format for negative
    #   numbers (defaults to prepending a hyphen to the formatted
    #   number given by <tt>:format</tt>).  Accepts the same fields
    #   than <tt>:format</tt>, except <tt>%n</tt> is here the
    #   absolute value of the number.
    # * <tt>:strip_insignificant_zeros</tt> - If +true+ removes
    #   insignificant zeros after the decimal separator (defaults to
    #   +false+).
    #
    # ==== Examples
    #
    #   number_to_currency(1234567890.50)                # => "$1,234,567,890.50"
    #   number_to_currency(1234567890.506)               # => "$1,234,567,890.51"
    #   number_to_currency(1234567890.506, precision: 3) # => "$1,234,567,890.506"
    #   number_to_currency(1234567890.506, locale: :fr)  # => "1 234 567 890,51 €"
    #   number_to_currency('123a456')                    # => "$123a456"
    #
    #   number_to_currency(-0.456789, precision: 0)
    #   # => "$0"
    #   number_to_currency(-1234567890.50, negative_format: '(%u%n)')
    #   # => "($1,234,567,890.50)"
    #   number_to_currency(1234567890.50, unit: '&pound;', separator: ',', delimiter: '')
    #   # => "&pound;1234567890,50"
    #   number_to_currency(1234567890.50, unit: '&pound;', separator: ',', delimiter: '', format: '%n %u')
    #   # => "1234567890,50 &pound;"
    #   number_to_currency(1234567890.50, strip_insignificant_zeros: true)
    #   # => "$1,234,567,890.5"
    #   number_to_currency(1234567890.50, precision: 0, round_mode: :up)
    #   # => "$1,234,567,891"
    def number_to_currency(number, options = {})
      NumberToCurrencyConverter.convert(number, options)
    end

    # Formats a +number+ as a percentage string (e.g., 65%). You can
    # customize the format in the +options+ hash.
    #
    # ==== Options
    #
    # * <tt>:locale</tt> - Sets the locale to be used for formatting
    #   (defaults to current locale).
    # * <tt>:precision</tt> - Sets the precision of the number
    #   (defaults to 3). Keeps the number's precision if +nil+.
    # * <tt>:round_mode</tt> - Determine how rounding is performed
    #   (defaults to :default. See BigDecimal::mode)
    # * <tt>:significant</tt> - If +true+, precision will be the number
    #   of significant_digits. If +false+, the number of fractional
    #   digits (defaults to +false+).
    # * <tt>:separator</tt> - Sets the separator between the
    #   fractional and integer digits (defaults to ".").
    # * <tt>:delimiter</tt> - Sets the thousands delimiter (defaults
    #   to "").
    # * <tt>:strip_insignificant_zeros</tt> - If +true+ removes
    #   insignificant zeros after the decimal separator (defaults to
    #   +false+).
    # * <tt>:format</tt> - Specifies the format of the percentage
    #   string The number field is <tt>%n</tt> (defaults to "%n%").
    #
    # ==== Examples
    #
    #   number_to_percentage(100)                                              # => "100.000%"
    #   number_to_percentage('98')                                             # => "98.000%"
    #   number_to_percentage(100, precision: 0)                                # => "100%"
    #   number_to_percentage(1000, delimiter: '.', separator: ',')             # => "1.000,000%"
    #   number_to_percentage(302.24398923423, precision: 5)                    # => "302.24399%"
    #   number_to_percentage(1000, locale: :fr)                                # => "1000,000%"
    #   number_to_percentage(1000, precision: nil)                             # => "1000%"
    #   number_to_percentage('98a')                                            # => "98a%"
    #   number_to_percentage(100, format: '%n  %')                             # => "100.000  %"
    #   number_to_percentage(302.24398923423, precision: 5, round_mode: :down) # => "302.24398%"
    def number_to_percentage(number, options = {})
      NumberToPercentageConverter.convert(number, options)
    end

    # Formats a +number+ with grouped thousands using +delimiter+
    # (e.g., 12,324). You can customize the format in the +options+
    # hash.
    #
    # ==== Options
    #
    # * <tt>:locale</tt> - Sets the locale to be used for formatting
    #   (defaults to current locale).
    # * <tt>:delimiter</tt> - Sets the thousands delimiter (defaults
    #   to ",").
    # * <tt>:separator</tt> - Sets the separator between the
    #   fractional and integer digits (defaults to ".").
    # * <tt>:delimiter_pattern</tt> - Sets a custom regular expression used for
    #   deriving the placement of delimiter. Helpful when using currency formats
    #   like INR.
    #
    # ==== Examples
    #
    #   number_to_delimited(12345678)                    # => "12,345,678"
    #   number_to_delimited('123456')                    # => "123,456"
    #   number_to_delimited(12345678.05)                 # => "12,345,678.05"
    #   number_to_delimited(12345678, delimiter: '.')    # => "12.345.678"
    #   number_to_delimited(12345678, delimiter: ',')    # => "12,345,678"
    #   number_to_delimited(12345678.05, separator: ' ') # => "12,345,678 05"
    #   number_to_delimited(12345678.05, locale: :fr)    # => "12 345 678,05"
    #   number_to_delimited('112a')                      # => "112a"
    #   number_to_delimited(98765432.98, delimiter: ' ', separator: ',')
    #                                                    # => "98 765 432,98"
    #   number_to_delimited("123456.78",
    #     delimiter_pattern: /(\d+?)(?=(\d\d)+(\d)(?!\d))/)
    #                                                    # => "1,23,456.78"
    def number_to_delimited(number, options = {})
      NumberToDelimitedConverter.convert(number, options)
    end

    # Formats a +number+ with the specified level of
    # <tt>:precision</tt> (e.g., 112.32 has a precision of 2 if
    # +:significant+ is +false+, and 5 if +:significant+ is +true+).
    # You can customize the format in the +options+ hash.
    #
    # ==== Options
    #
    # * <tt>:locale</tt> - Sets the locale to be used for formatting
    #   (defaults to current locale).
    # * <tt>:precision</tt> - Sets the precision of the number
    #   (defaults to 3). Keeps the number's precision if +nil+.
    # * <tt>:round_mode</tt> - Determine how rounding is performed
    #   (defaults to :default. See BigDecimal::mode)
    # * <tt>:significant</tt> - If +true+, precision will be the number
    #   of significant_digits. If +false+, the number of fractional
    #   digits (defaults to +false+).
    # * <tt>:separator</tt> - Sets the separator between the
    #   fractional and integer digits (defaults to ".").
    # * <tt>:delimiter</tt> - Sets the thousands delimiter (defaults
    #   to "").
    # * <tt>:strip_insignificant_zeros</tt> - If +true+ removes
    #   insignificant zeros after the decimal separator (defaults to
    #   +false+).
    #
    # ==== Examples
    #
    #   number_to_rounded(111.2345)                                  # => "111.235"
    #   number_to_rounded(111.2345, precision: 2)                    # => "111.23"
    #   number_to_rounded(13, precision: 5)                          # => "13.00000"
    #   number_to_rounded(389.32314, precision: 0)                   # => "389"
    #   number_to_rounded(111.2345, significant: true)               # => "111"
    #   number_to_rounded(111.2345, precision: 1, significant: true) # => "100"
    #   number_to_rounded(13, precision: 5, significant: true)       # => "13.000"
    #   number_to_rounded(13, precision: nil)                        # => "13"
    #   number_to_rounded(389.32314, precision: 0, round_mode: :up)  # => "390"
    #   number_to_rounded(111.234, locale: :fr)                      # => "111,234"
    #
    #   number_to_rounded(13, precision: 5, significant: true, strip_insignificant_zeros: true)
    #   # => "13"
    #
    #   number_to_rounded(389.32314, precision: 4, significant: true) # => "389.3"
    #   number_to_rounded(1111.2345, precision: 2, separator: ',', delimiter: '.')
    #   # => "1.111,23"
    def number_to_rounded(number, options = {})
      NumberToRoundedConverter.convert(number, options)
    end

    # Formats the bytes in +number+ into a more understandable
    # representation (e.g., giving it 1500 yields 1.46 KB). This
    # method is useful for reporting file sizes to users. You can
    # customize the format in the +options+ hash.
    #
    # See <tt>number_to_human</tt> if you want to pretty-print a
    # generic number.
    #
    # ==== Options
    #
    # * <tt>:locale</tt> - Sets the locale to be used for formatting
    #   (defaults to current locale).
    # * <tt>:precision</tt> - Sets the precision of the number
    #   (defaults to 3).
    # * <tt>:round_mode</tt> - Determine how rounding is performed
    #   (defaults to :default. See BigDecimal::mode)
    # * <tt>:significant</tt> - If +true+, precision will be the number
    #   of significant_digits. If +false+, the number of fractional
    #   digits (defaults to +true+)
    # * <tt>:separator</tt> - Sets the separator between the
    #   fractional and integer digits (defaults to ".").
    # * <tt>:delimiter</tt> - Sets the thousands delimiter (defaults
    #   to "").
    # * <tt>:strip_insignificant_zeros</tt> - If +true+ removes
    #   insignificant zeros after the decimal separator (defaults to
    #   +true+)
    #
    # ==== Examples
    #
    #   number_to_human_size(123)                                    # => "123 Bytes"
    #   number_to_human_size(1234)                                   # => "1.21 KB"
    #   number_to_human_size(12345)                                  # => "12.1 KB"
    #   number_to_human_size(1234567)                                # => "1.18 MB"
    #   number_to_human_size(1234567890)                             # => "1.15 GB"
    #   number_to_human_size(1234567890123)                          # => "1.12 TB"
    #   number_to_human_size(1234567890123456)                       # => "1.1 PB"
    #   number_to_human_size(1234567890123456789)                    # => "1.07 EB"
    #   number_to_human_size(1234567, precision: 2)                  # => "1.2 MB"
    #   number_to_human_size(483989, precision: 2)                   # => "470 KB"
    #   number_to_human_size(483989, precision: 2, round_mode: :up)  # => "480 KB"
    #   number_to_human_size(1234567, precision: 2, separator: ',')  # => "1,2 MB"
    #   number_to_human_size(1234567890123, precision: 5)            # => "1.1228 TB"
    #   number_to_human_size(524288000, precision: 5)                # => "500 MB"
    def number_to_human_size(number, options = {})
      NumberToHumanSizeConverter.convert(number, options)
    end

    # Pretty prints (formats and approximates) a number in a way it
    # is more readable by humans (e.g.: 1200000000 becomes "1.2
    # Billion"). This is useful for numbers that can get very large
    # (and too hard to read).
    #
    # See <tt>number_to_human_size</tt> if you want to print a file
    # size.
    #
    # You can also define your own unit-quantifier names if you want
    # to use other decimal units (e.g.: 1500 becomes "1.5
    # kilometers", 0.150 becomes "150 milliliters", etc). You may
    # define a wide range of unit quantifiers, even fractional ones
    # (centi, deci, mili, etc).
    #
    # ==== Options
    #
    # * <tt>:locale</tt> - Sets the locale to be used for formatting
    #   (defaults to current locale).
    # * <tt>:precision</tt> - Sets the precision of the number
    #   (defaults to 3).
    # * <tt>:round_mode</tt> - Determine how rounding is performed
    #   (defaults to :default. See BigDecimal::mode)
    # * <tt>:significant</tt> - If +true+, precision will be the number
    #   of significant_digits. If +false+, the number of fractional
    #   digits (defaults to +true+)
    # * <tt>:separator</tt> - Sets the separator between the
    #   fractional and integer digits (defaults to ".").
    # * <tt>:delimiter</tt> - Sets the thousands delimiter (defaults
    #   to "").
    # * <tt>:strip_insignificant_zeros</tt> - If +true+ removes
    #   insignificant zeros after the decimal separator (defaults to
    #   +true+)
    # * <tt>:units</tt> - A Hash of unit quantifier names. Or a
    #   string containing an i18n scope where to find this hash. It
    #   might have the following keys:
    #   * *integers*: <tt>:unit</tt>, <tt>:ten</tt>,
    #     <tt>:hundred</tt>, <tt>:thousand</tt>, <tt>:million</tt>,
    #     <tt>:billion</tt>, <tt>:trillion</tt>,
    #     <tt>:quadrillion</tt>
    #   * *fractionals*: <tt>:deci</tt>, <tt>:centi</tt>,
    #     <tt>:mili</tt>, <tt>:micro</tt>, <tt>:nano</tt>,
    #     <tt>:pico</tt>, <tt>:femto</tt>
    # * <tt>:format</tt> - Sets the format of the output string
    #   (defaults to "%n %u"). The field types are:
    #   * %u - The quantifier (ex.: 'thousand')
    #   * %n - The number
    #
    # ==== Examples
    #
    #   number_to_human(123)                         # => "123"
    #   number_to_human(1234)                        # => "1.23 Thousand"
    #   number_to_human(12345)                       # => "12.3 Thousand"
    #   number_to_human(1234567)                     # => "1.23 Million"
    #   number_to_human(1234567890)                  # => "1.23 Billion"
    #   number_to_human(1234567890123)               # => "1.23 Trillion"
    #   number_to_human(1234567890123456)            # => "1.23 Quadrillion"
    #   number_to_human(1234567890123456789)         # => "1230 Quadrillion"
    #   number_to_human(489939, precision: 2)        # => "490 Thousand"
    #   number_to_human(489939, precision: 4)        # => "489.9 Thousand"
    #   number_to_human(489939, precision: 2
    #                         , round_mode: :down)   # => "480 Thousand"
    #   number_to_human(1234567, precision: 4,
    #                            significant: false) # => "1.2346 Million"
    #   number_to_human(1234567, precision: 1,
    #                            separator: ',',
    #                            significant: false) # => "1,2 Million"
    #
    #   number_to_human(500000000, precision: 5)           # => "500 Million"
    #   number_to_human(12345012345, significant: false)   # => "12.345 Billion"
    #
    # Non-significant zeros after the decimal separator are stripped
    # out by default (set <tt>:strip_insignificant_zeros</tt> to
    # +false+ to change that):
    #
    #   number_to_human(12.00001)                                       # => "12"
    #   number_to_human(12.00001, strip_insignificant_zeros: false)     # => "12.0"
    #
    # ==== Custom Unit Quantifiers
    #
    # You can also use your own custom unit quantifiers:
    #
    #   number_to_human(500000, units: { unit: 'ml', thousand: 'lt' })  # => "500 lt"
    #
    # If in your I18n locale you have:
    #
    #   distance:
    #     centi:
    #       one: "centimeter"
    #       other: "centimeters"
    #     unit:
    #       one: "meter"
    #       other: "meters"
    #     thousand:
    #       one: "kilometer"
    #       other: "kilometers"
    #     billion: "gazillion-distance"
    #
    # Then you could do:
    #
    #   number_to_human(543934, units: :distance)            # => "544 kilometers"
    #   number_to_human(54393498, units: :distance)          # => "54400 kilometers"
    #   number_to_human(54393498000, units: :distance)       # => "54.4 gazillion-distance"
    #   number_to_human(343, units: :distance, precision: 1) # => "300 meters"
    #   number_to_human(1, units: :distance)                 # => "1 meter"
    #   number_to_human(0.34, units: :distance)              # => "34 centimeters"
    def number_to_human(number, options = {})
      NumberToHumanConverter.convert(number, options)
    end
  end
end
