# encoding: utf-8

module I18n
  module Locale
    module Tag
      autoload :Parents, 'i18n/locale/tag/parents'
      autoload :Rfc4646, 'i18n/locale/tag/rfc4646'
      autoload :Simple,  'i18n/locale/tag/simple'

      class << self
        # Returns the current locale tag implementation. Defaults to +I18n::Locale::Tag::Simple+.
        def implementation
          @@implementation ||= Simple
        end

        # Sets the current locale tag implementation. Use this to set a different locale tag implementation.
        def implementation=(implementation)
          @@implementation = implementation
        end

        # Factory method for locale tags. Delegates to the current locale tag implementation.
        def tag(tag)
          implementation.tag(tag)
        end
      end
    end
  end
end
