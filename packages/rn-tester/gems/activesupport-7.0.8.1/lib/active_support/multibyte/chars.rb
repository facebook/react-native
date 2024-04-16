# frozen_string_literal: true

require "active_support/json"
require "active_support/core_ext/string/access"
require "active_support/core_ext/string/behavior"
require "active_support/core_ext/module/delegation"

module ActiveSupport # :nodoc:
  module Multibyte # :nodoc:
    # Chars enables you to work transparently with UTF-8 encoding in the Ruby
    # String class without having extensive knowledge about the encoding. A
    # Chars object accepts a string upon initialization and proxies String
    # methods in an encoding safe manner. All the normal String methods are also
    # implemented on the proxy.
    #
    # String methods are proxied through the Chars object, and can be accessed
    # through the +mb_chars+ method. Methods which would normally return a
    # String object now return a Chars object so methods can be chained.
    #
    #   'The Perfect String  '.mb_chars.downcase.strip
    #   # => #<ActiveSupport::Multibyte::Chars:0x007fdc434ccc10 @wrapped_string="the perfect string">
    #
    # Chars objects are perfectly interchangeable with String objects as long as
    # no explicit class checks are made. If certain methods do explicitly check
    # the class, call +to_s+ before you pass chars objects to them.
    #
    #   bad.explicit_checking_method 'T'.mb_chars.downcase.to_s
    #
    # The default Chars implementation assumes that the encoding of the string
    # is UTF-8, if you want to handle different encodings you can write your own
    # multibyte string handler and configure it through
    # ActiveSupport::Multibyte.proxy_class.
    #
    #   class CharsForUTF32
    #     def size
    #       @wrapped_string.size / 4
    #     end
    #
    #     def self.accepts?(string)
    #       string.length % 4 == 0
    #     end
    #   end
    #
    #   ActiveSupport::Multibyte.proxy_class = CharsForUTF32
    class Chars
      include Comparable
      attr_reader :wrapped_string
      alias to_s wrapped_string
      alias to_str wrapped_string

      delegate :<=>, :=~, :match?, :acts_like_string?, to: :wrapped_string

      # Creates a new Chars instance by wrapping _string_.
      def initialize(string)
        @wrapped_string = string
        @wrapped_string.force_encoding(Encoding::UTF_8) unless @wrapped_string.frozen?
      end

      # Forward all undefined methods to the wrapped string.
      def method_missing(method, *args, &block)
        result = @wrapped_string.__send__(method, *args, &block)
        if method.end_with?("!")
          self if result
        else
          result.kind_of?(String) ? chars(result) : result
        end
      end

      # Returns +true+ if _obj_ responds to the given method. Private methods
      # are included in the search only if the optional second parameter
      # evaluates to +true+.
      def respond_to_missing?(method, include_private)
        @wrapped_string.respond_to?(method, include_private)
      end

      # Works just like <tt>String#split</tt>, with the exception that the items
      # in the resulting list are Chars instances instead of String. This makes
      # chaining methods easier.
      #
      #   'Café périferôl'.mb_chars.split(/é/).map { |part| part.upcase.to_s } # => ["CAF", " P", "RIFERÔL"]
      def split(*args)
        @wrapped_string.split(*args).map { |i| self.class.new(i) }
      end

      # Works like <tt>String#slice!</tt>, but returns an instance of
      # Chars, or +nil+ if the string was not modified. The string will not be
      # modified if the range given is out of bounds
      #
      #   string = 'Welcome'
      #   string.mb_chars.slice!(3)    # => #<ActiveSupport::Multibyte::Chars:0x000000038109b8 @wrapped_string="c">
      #   string # => 'Welome'
      #   string.mb_chars.slice!(0..3) # => #<ActiveSupport::Multibyte::Chars:0x00000002eb80a0 @wrapped_string="Welo">
      #   string # => 'me'
      def slice!(*args)
        string_sliced = @wrapped_string.slice!(*args)
        if string_sliced
          chars(string_sliced)
        end
      end

      # Reverses all characters in the string.
      #
      #   'Café'.mb_chars.reverse.to_s # => 'éfaC'
      def reverse
        chars(@wrapped_string.grapheme_clusters.reverse.join)
      end

      # Limits the byte size of the string to a number of bytes without breaking
      # characters. Usable when the storage for a string is limited for some
      # reason.
      #
      #   'こんにちは'.mb_chars.limit(7).to_s # => "こん"
      def limit(limit)
        chars(@wrapped_string.truncate_bytes(limit, omission: nil))
      end

      # Capitalizes the first letter of every word, when possible.
      #
      #   "ÉL QUE SE ENTERÓ".mb_chars.titleize.to_s    # => "Él Que Se Enteró"
      #   "日本語".mb_chars.titleize.to_s               # => "日本語"
      def titleize
        chars(downcase.to_s.gsub(/\b('?\S)/u) { $1.upcase })
      end
      alias_method :titlecase, :titleize

      # Performs canonical decomposition on all the characters.
      #
      #   'é'.length                         # => 1
      #   'é'.mb_chars.decompose.to_s.length # => 2
      def decompose
        chars(Unicode.decompose(:canonical, @wrapped_string.codepoints.to_a).pack("U*"))
      end

      # Performs composition on all the characters.
      #
      #   'é'.length                       # => 1
      #   'é'.mb_chars.compose.to_s.length # => 1
      def compose
        chars(Unicode.compose(@wrapped_string.codepoints.to_a).pack("U*"))
      end

      # Returns the number of grapheme clusters in the string.
      #
      #   'क्षि'.mb_chars.length   # => 4
      #   'क्षि'.mb_chars.grapheme_length # => 2
      def grapheme_length
        @wrapped_string.grapheme_clusters.length
      end

      # Replaces all ISO-8859-1 or CP1252 characters by their UTF-8 equivalent
      # resulting in a valid UTF-8 string.
      #
      # Passing +true+ will forcibly tidy all bytes, assuming that the string's
      # encoding is entirely CP1252 or ISO-8859-1.
      def tidy_bytes(force = false)
        chars(Unicode.tidy_bytes(@wrapped_string, force))
      end

      def as_json(options = nil) # :nodoc:
        to_s.as_json(options)
      end

      %w(reverse tidy_bytes).each do |method|
        define_method("#{method}!") do |*args|
          @wrapped_string = public_send(method, *args).to_s
          self
        end
      end

      private
        def chars(string)
          self.class.new(string)
        end
    end
  end
end
