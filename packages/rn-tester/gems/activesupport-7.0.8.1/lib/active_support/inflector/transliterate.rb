# frozen_string_literal: true

require "active_support/core_ext/string/multibyte"
require "active_support/i18n"

module ActiveSupport
  module Inflector
    ALLOWED_ENCODINGS_FOR_TRANSLITERATE = [Encoding::UTF_8, Encoding::US_ASCII, Encoding::GB18030].freeze

    # Replaces non-ASCII characters with an ASCII approximation, or if none
    # exists, a replacement character which defaults to "?".
    #
    #    transliterate('Ærøskøbing')
    #    # => "AEroskobing"
    #
    # Default approximations are provided for Western/Latin characters,
    # e.g, "ø", "ñ", "é", "ß", etc.
    #
    # This method is I18n aware, so you can set up custom approximations for a
    # locale. This can be useful, for example, to transliterate German's "ü"
    # and "ö" to "ue" and "oe", or to add support for transliterating Russian
    # to ASCII.
    #
    # In order to make your custom transliterations available, you must set
    # them as the <tt>i18n.transliterate.rule</tt> i18n key:
    #
    #   # Store the transliterations in locales/de.yml
    #   i18n:
    #     transliterate:
    #       rule:
    #         ü: "ue"
    #         ö: "oe"
    #
    #   # Or set them using Ruby
    #   I18n.backend.store_translations(:de, i18n: {
    #     transliterate: {
    #       rule: {
    #         'ü' => 'ue',
    #         'ö' => 'oe'
    #       }
    #     }
    #   })
    #
    # The value for <tt>i18n.transliterate.rule</tt> can be a simple Hash that
    # maps characters to ASCII approximations as shown above, or, for more
    # complex requirements, a Proc:
    #
    #   I18n.backend.store_translations(:de, i18n: {
    #     transliterate: {
    #       rule: ->(string) { MyTransliterator.transliterate(string) }
    #     }
    #   })
    #
    # Now you can have different transliterations for each locale:
    #
    #   transliterate('Jürgen', locale: :en)
    #   # => "Jurgen"
    #
    #   transliterate('Jürgen', locale: :de)
    #   # => "Juergen"
    #
    # Transliteration is restricted to UTF-8, US-ASCII, and GB18030 strings.
    # Other encodings will raise an ArgumentError.
    def transliterate(string, replacement = "?", locale: nil)
      string = string.dup if string.frozen?
      raise ArgumentError, "Can only transliterate strings. Received #{string.class.name}" unless string.is_a?(String)
      raise ArgumentError, "Cannot transliterate strings with #{string.encoding} encoding" unless ALLOWED_ENCODINGS_FOR_TRANSLITERATE.include?(string.encoding)

      input_encoding = string.encoding

      # US-ASCII is a subset of UTF-8 so we'll force encoding as UTF-8 if
      # US-ASCII is given. This way we can let tidy_bytes handle the string
      # in the same way as we do for UTF-8
      string.force_encoding(Encoding::UTF_8) if string.encoding == Encoding::US_ASCII

      # GB18030 is Unicode compatible but is not a direct mapping so needs to be
      # transcoded. Using invalid/undef :replace will result in loss of data in
      # the event of invalid characters, but since tidy_bytes will replace
      # invalid/undef with a "?" we're safe to do the same beforehand
      string.encode!(Encoding::UTF_8, invalid: :replace, undef: :replace) if string.encoding == Encoding::GB18030

      transliterated = I18n.transliterate(
        ActiveSupport::Multibyte::Unicode.tidy_bytes(string).unicode_normalize(:nfc),
        replacement: replacement,
        locale: locale
      )

      # Restore the string encoding of the input if it was not UTF-8.
      # Apply invalid/undef :replace as tidy_bytes does
      transliterated.encode!(input_encoding, invalid: :replace, undef: :replace) if input_encoding != transliterated.encoding

      transliterated
    end

    # Replaces special characters in a string so that it may be used as part of
    # a 'pretty' URL.
    #
    #   parameterize("Donald E. Knuth") # => "donald-e-knuth"
    #   parameterize("^très|Jolie-- ")  # => "tres-jolie"
    #
    # To use a custom separator, override the +separator+ argument.
    #
    #   parameterize("Donald E. Knuth", separator: '_') # => "donald_e_knuth"
    #   parameterize("^très|Jolie__ ", separator: '_')  # => "tres_jolie"
    #
    # To preserve the case of the characters in a string, use the +preserve_case+ argument.
    #
    #   parameterize("Donald E. Knuth", preserve_case: true) # => "Donald-E-Knuth"
    #   parameterize("^très|Jolie-- ", preserve_case: true) # => "tres-Jolie"
    #
    # It preserves dashes and underscores unless they are used as separators:
    #
    #   parameterize("^très|Jolie__ ")                 # => "tres-jolie__"
    #   parameterize("^très|Jolie-- ", separator: "_") # => "tres_jolie--"
    #   parameterize("^très_Jolie-- ", separator: ".") # => "tres_jolie--"
    #
    # If the optional parameter +locale+ is specified,
    # the word will be parameterized as a word of that language.
    # By default, this parameter is set to <tt>nil</tt> and it will use
    # the configured <tt>I18n.locale</tt>.
    def parameterize(string, separator: "-", preserve_case: false, locale: nil)
      # Replace accented chars with their ASCII equivalents.
      parameterized_string = transliterate(string, locale: locale)

      # Turn unwanted chars into the separator.
      parameterized_string.gsub!(/[^a-z0-9\-_]+/i, separator)

      unless separator.nil? || separator.empty?
        if separator == "-"
          re_duplicate_separator        = /-{2,}/
          re_leading_trailing_separator = /^-|-$/i
        else
          re_sep = Regexp.escape(separator)
          re_duplicate_separator        = /#{re_sep}{2,}/
          re_leading_trailing_separator = /^#{re_sep}|#{re_sep}$/i
        end
        # No more than one of the separator in a row.
        parameterized_string.gsub!(re_duplicate_separator, separator)
        # Remove leading/trailing separator.
        parameterized_string.gsub!(re_leading_trailing_separator, "")
      end

      parameterized_string.downcase! unless preserve_case
      parameterized_string
    end
  end
end
