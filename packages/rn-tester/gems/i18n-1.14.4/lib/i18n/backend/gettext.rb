# frozen_string_literal: true

require 'i18n/gettext'
require 'i18n/gettext/po_parser'

module I18n
  module Backend
    # Experimental support for using Gettext po files to store translations.
    #
    # To use this you can simply include the module to the Simple backend - or
    # whatever other backend you are using.
    #
    #  I18n::Backend::Simple.include(I18n::Backend::Gettext)
    #
    # Now you should be able to include your Gettext translation (*.po) files to
    # the +I18n.load_path+ so they're loaded to the backend and you can use them as
    # usual:
    #
    #  I18n.load_path += Dir["path/to/locales/*.po"]
    #
    # Following the Gettext convention this implementation expects that your
    # translation files are named by their locales. E.g. the file en.po would
    # contain the translations for the English locale.
    #
    # To translate text <b>you must use</b> one of the translate methods provided by
    # I18n::Gettext::Helpers.
    #
    #  include I18n::Gettext::Helpers
    #  puts _("some string")
    #
    # Without it strings containing periods (".") will not be translated.

    module Gettext
      class PoData < Hash
        def set_comment(msgid_or_sym, comment)
          # ignore
        end
      end

      protected
        def load_po(filename)
          locale = ::File.basename(filename, '.po').to_sym
          data = normalize(locale, parse(filename))
          [{ locale => data }, false]
        end

        def parse(filename)
          GetText::PoParser.new.parse(::File.read(filename), PoData.new)
        end

        def normalize(locale, data)
          data.inject({}) do |result, (key, value)|
            unless key.nil? || key.empty?
              key = key.gsub(I18n::Gettext::CONTEXT_SEPARATOR, '|')
              key, value = normalize_pluralization(locale, key, value) if key.index("\000")

              parts = key.split('|').reverse
              normalized = parts.inject({}) do |_normalized, part|
                { part => _normalized.empty? ? value : _normalized }
              end

              Utils.deep_merge!(result, normalized)
            end
            result
          end
        end

        def normalize_pluralization(locale, key, value)
          # FIXME po_parser includes \000 chars that can not be turned into Symbols
          key = key.gsub("\000", I18n::Gettext::PLURAL_SEPARATOR).split(I18n::Gettext::PLURAL_SEPARATOR).first

          keys = I18n::Gettext.plural_keys(locale)
          values = value.split("\000")
          raise "invalid number of plurals: #{values.size}, keys: #{keys.inspect} on #{locale} locale for msgid #{key.inspect} with values #{values.inspect}" if values.size != keys.size

          result = {}
          values.each_with_index { |_value, ix| result[keys[ix]] = _value }
          [key, result]
        end

    end
  end
end
