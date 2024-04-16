# frozen_string_literal: true

require "active_support/multibyte"

class String
  # == Multibyte proxy
  #
  # +mb_chars+ is a multibyte safe proxy for string methods.
  #
  # It creates and returns an instance of the ActiveSupport::Multibyte::Chars class which
  # encapsulates the original string. A Unicode safe version of all the String methods are defined on this proxy
  # class. If the proxy class doesn't respond to a certain method, it's forwarded to the encapsulated string.
  #
  #   >> "ǉ".mb_chars.upcase.to_s
  #   => "Ǉ"
  #
  # NOTE: Ruby 2.4 and later support native Unicode case mappings:
  #
  #   >> "ǉ".upcase
  #   => "Ǉ"
  #
  # == Method chaining
  #
  # All the methods on the Chars proxy which normally return a string will return a Chars object. This allows
  # method chaining on the result of any of these methods.
  #
  #   name.mb_chars.reverse.length # => 12
  #
  # == Interoperability and configuration
  #
  # The Chars object tries to be as interchangeable with String objects as possible: sorting and comparing between
  # String and Char work like expected. The bang! methods change the internal string representation in the Chars
  # object. Interoperability problems can be resolved easily with a +to_s+ call.
  #
  # For more information about the methods defined on the Chars proxy see ActiveSupport::Multibyte::Chars. For
  # information about how to change the default Multibyte behavior see ActiveSupport::Multibyte.
  def mb_chars
    ActiveSupport::Multibyte.proxy_class.new(self)
  end

  # Returns +true+ if string has utf_8 encoding.
  #
  #   utf_8_str = "some string".encode "UTF-8"
  #   iso_str = "some string".encode "ISO-8859-1"
  #
  #   utf_8_str.is_utf8? # => true
  #   iso_str.is_utf8?   # => false
  def is_utf8?
    case encoding
    when Encoding::UTF_8, Encoding::US_ASCII
      valid_encoding?
    when Encoding::ASCII_8BIT
      dup.force_encoding(Encoding::UTF_8).valid_encoding?
    else
      false
    end
  end
end
