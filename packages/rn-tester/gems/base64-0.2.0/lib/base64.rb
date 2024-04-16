# frozen_string_literal: true
#
# \Module \Base64 provides methods for:
#
# - Encoding a binary string (containing non-ASCII characters)
#   as a string of printable ASCII characters.
# - Decoding such an encoded string.
#
# \Base64 is commonly used in contexts where binary data
# is not allowed or supported:
#
# - Images in HTML or CSS files, or in URLs.
# - Email attachments.
#
# A \Base64-encoded string is about one-third larger that its source.
# See the {Wikipedia article}[https://en.wikipedia.org/wiki/Base64]
# for more information.
#
# This module provides three pairs of encode/decode methods.
# Your choices among these methods should depend on:
#
# - Which character set is to be used for encoding and decoding.
# - Whether "padding" is to be used.
# - Whether encoded strings are to contain newlines.
#
# Note: Examples on this page assume that the including program has executed:
#
#   require 'base64'
#
# == Encoding Character Sets
#
# A \Base64-encoded string consists only of characters from a 64-character set:
#
# - <tt>('A'..'Z')</tt>.
# - <tt>('a'..'z')</tt>.
# - <tt>('0'..'9')</tt>.
# - <tt>=</tt>, the 'padding' character.
# - Either:
#   - <tt>%w[+ /]</tt>:
#     {RFC-2045-compliant}[https://datatracker.ietf.org/doc/html/rfc2045];
#     _not_ safe for URLs.
#   - <tt>%w[- _]</tt>:
#     {RFC-4648-compliant}[https://datatracker.ietf.org/doc/html/rfc4648];
#     safe for URLs.
#
# If you are working with \Base64-encoded strings that will come from
# or be put into URLs, you should choose this encoder-decoder pair
# of RFC-4648-compliant methods:
#
# - Base64.urlsafe_encode64 and Base64.urlsafe_decode64.
#
# Otherwise, you may choose any of the pairs in this module,
# including the pair above, or the RFC-2045-compliant pairs:
#
# - Base64.encode64 and Base64.decode64.
# - Base64.strict_encode64 and Base64.strict_decode64.
#
# == Padding
#
# \Base64-encoding changes a triplet of input bytes
# into a quartet of output characters.
#
# <b>Padding in Encode Methods</b>
#
# Padding -- extending an encoded string with zero, one, or two trailing
# <tt>=</tt> characters -- is performed by methods Base64.encode64,
# Base64.strict_encode64, and, by default, Base64.urlsafe_encode64:
#
#   Base64.encode64('s')                         # => "cw==\n"
#   Base64.strict_encode64('s')                  # => "cw=="
#   Base64.urlsafe_encode64('s')                 # => "cw=="
#   Base64.urlsafe_encode64('s', padding: false) # => "cw"
#
# When padding is performed, the encoded string is always of length <em>4n</em>,
# where +n+ is a non-negative integer:
#
# - Input bytes of length <em>3n</em> generate unpadded output characters
#   of length <em>4n</em>:
#
#     # n = 1:  3 bytes => 4 characters.
#     Base64.strict_encode64('123')      # => "MDEy"
#     # n = 2:  6 bytes => 8 characters.
#     Base64.strict_encode64('123456')   # => "MDEyMzQ1"
#
# - Input bytes of length <em>3n+1</em> generate padded output characters
#   of length <em>4(n+1)</em>, with two padding characters at the end:
#
#     # n = 1:  4 bytes => 8 characters.
#     Base64.strict_encode64('1234')     # => "MDEyMw=="
#     # n = 2:  7 bytes => 12 characters.
#     Base64.strict_encode64('1234567')  # => "MDEyMzQ1Ng=="
#
# - Input bytes of length <em>3n+2</em> generate padded output characters
#   of length <em>4(n+1)</em>, with one padding character at the end:
#
#     # n = 1:  5 bytes => 8 characters.
#     Base64.strict_encode64('12345')    # => "MDEyMzQ="
#     # n = 2:  8 bytes => 12 characters.
#     Base64.strict_encode64('12345678') # => "MDEyMzQ1Njc="
#
# When padding is suppressed, for a positive integer <em>n</em>:
#
# - Input bytes of length <em>3n</em> generate unpadded output characters
#   of length <em>4n</em>:
#
#     # n = 1:  3 bytes => 4 characters.
#     Base64.urlsafe_encode64('123', padding: false)      # => "MDEy"
#     # n = 2:  6 bytes => 8 characters.
#     Base64.urlsafe_encode64('123456', padding: false)   # => "MDEyMzQ1"
#
# - Input bytes of length <em>3n+1</em> generate unpadded output characters
#   of length <em>4n+2</em>, with two padding characters at the end:
#
#     # n = 1:  4 bytes => 6 characters.
#     Base64.urlsafe_encode64('1234', padding: false)     # => "MDEyMw"
#     # n = 2:  7 bytes => 10 characters.
#     Base64.urlsafe_encode64('1234567', padding: false)  # => "MDEyMzQ1Ng"
#
# - Input bytes of length <em>3n+2</em> generate unpadded output characters
#   of length <em>4n+3</em>, with one padding character at the end:
#
#     # n = 1:  5 bytes => 7 characters.
#     Base64.urlsafe_encode64('12345', padding: false)    # => "MDEyMzQ"
#     # m = 2:  8 bytes => 11 characters.
#     Base64.urlsafe_encode64('12345678', padding: false) # => "MDEyMzQ1Njc"
#
# <b>Padding in Decode Methods</b>
#
# All of the \Base64 decode methods support (but do not require) padding.
#
# \Method Base64.decode64 does not check the size of the padding:
#
#   Base64.decode64("MDEyMzQ1Njc") # => "01234567"
#   Base64.decode64("MDEyMzQ1Njc=") # => "01234567"
#   Base64.decode64("MDEyMzQ1Njc==") # => "01234567"
#
# \Method Base64.strict_decode64 strictly enforces padding size:
#
#   Base64.strict_decode64("MDEyMzQ1Njc")   # Raises ArgumentError
#   Base64.strict_decode64("MDEyMzQ1Njc=")  # => "01234567"
#   Base64.strict_decode64("MDEyMzQ1Njc==") # Raises ArgumentError
#
# \Method Base64.urlsafe_decode64 allows padding in +str+,
# which if present, must be correct:
# see {Padding}[Base64.html#module-Base64-label-Padding], above:
#
#   Base64.urlsafe_decode64("MDEyMzQ1Njc") # => "01234567"
#   Base64.urlsafe_decode64("MDEyMzQ1Njc=") # => "01234567"
#   Base64.urlsafe_decode64("MDEyMzQ1Njc==") # Raises ArgumentError.
#
# == Newlines
#
# An encoded string returned by Base64.encode64 or Base64.urlsafe_encode64
# has an embedded newline character
# after each 60-character sequence, and, if non-empty, at the end:
#
#   # No newline if empty.
#   encoded = Base64.encode64("\x00" *  0)
#   encoded.index("\n") # => nil
#
#   # Newline at end of short output.
#   encoded = Base64.encode64("\x00" *  1)
#   encoded.size        # => 4
#   encoded.index("\n") # => 4
#
#   # Newline at end of longer output.
#   encoded = Base64.encode64("\x00" * 45)
#   encoded.size        # => 60
#   encoded.index("\n") # => 60
#
#   # Newlines embedded and at end of still longer output.
#   encoded = Base64.encode64("\x00" * 46)
#   encoded.size                          # => 65
#   encoded.rindex("\n")                  # => 65
#   encoded.split("\n").map {|s| s.size } # => [60, 4]
#
# The string to be encoded may itself contain newlines,
# which are encoded as \Base64:
#
#      #   Base64.encode64("\n\n\n") # => "CgoK\n"
#    s = "This is line 1\nThis is line 2\n"
#    Base64.encode64(s) # => "VGhpcyBpcyBsaW5lIDEKVGhpcyBpcyBsaW5lIDIK\n"
#
module Base64

  VERSION = "0.2.0"

  module_function

  # Returns a string containing the RFC-2045-compliant \Base64-encoding of +bin+.
  #
  # Per RFC 2045, the returned string may contain the URL-unsafe characters
  # <tt>+</tt> or <tt>/</tt>;
  # see {Encoding Character Set}[Base64.html#module-Base64-label-Encoding+Character+Sets] above:
  #
  #   Base64.encode64("\xFB\xEF\xBE") # => "++++\n"
  #   Base64.encode64("\xFF\xFF\xFF") # => "////\n"
  #
  # The returned string may include padding;
  # see {Padding}[Base64.html#module-Base64-label-Padding] above.
  #
  #   Base64.encode64('*') # => "Kg==\n"
  #
  # The returned string ends with a newline character, and if sufficiently long
  # will have one or more embedded newline characters;
  # see {Newlines}[Base64.html#module-Base64-label-Newlines] above:
  #
  #   Base64.encode64('*') # => "Kg==\n"
  #   Base64.encode64('*' * 46)
  #   # => "KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioq\nKg==\n"
  #
  # The string to be encoded may itself contain newlines,
  # which will be encoded as ordinary \Base64:
  #
  #   Base64.encode64("\n\n\n") # => "CgoK\n"
  #   s = "This is line 1\nThis is line 2\n"
  #   Base64.encode64(s) # => "VGhpcyBpcyBsaW5lIDEKVGhpcyBpcyBsaW5lIDIK\n"
  #
  def encode64(bin)
    [bin].pack("m")
  end

  # Returns a string containing the decoding of an RFC-2045-compliant
  # \Base64-encoded string +str+:
  #
  #   s = "VGhpcyBpcyBsaW5lIDEKVGhpcyBpcyBsaW5lIDIK\n"
  #   Base64.decode64(s) # => "This is line 1\nThis is line 2\n"
  #
  # Non-\Base64 characters in +str+ are ignored;
  # see {Encoding Character Set}[Base64.html#module-Base64-label-Encoding+Character+Sets] above:
  # these include newline characters and characters <tt>-</tt> and <tt>/</tt>:
  #
  #   Base64.decode64("\x00\n-_") # => ""
  #
  # Padding in +str+ (even if incorrect) is ignored:
  #
  #   Base64.decode64("MDEyMzQ1Njc")   # => "01234567"
  #   Base64.decode64("MDEyMzQ1Njc=")  # => "01234567"
  #   Base64.decode64("MDEyMzQ1Njc==") # => "01234567"
  #
  def decode64(str)
    str.unpack1("m")
  end

  # Returns a string containing the RFC-2045-compliant \Base64-encoding of +bin+.
  #
  # Per RFC 2045, the returned string may contain the URL-unsafe characters
  # <tt>+</tt> or <tt>/</tt>;
  # see {Encoding Character Set}[Base64.html#module-Base64-label-Encoding+Character+Sets] above:
  #
  #   Base64.strict_encode64("\xFB\xEF\xBE") # => "++++\n"
  #   Base64.strict_encode64("\xFF\xFF\xFF") # => "////\n"
  #
  # The returned string may include padding;
  # see {Padding}[Base64.html#module-Base64-label-Padding] above.
  #
  #   Base64.strict_encode64('*') # => "Kg==\n"
  #
  # The returned string will have no newline characters, regardless of its length;
  # see {Newlines}[Base64.html#module-Base64-label-Newlines] above:
  #
  #   Base64.strict_encode64('*') # => "Kg=="
  #   Base64.strict_encode64('*' * 46)
  #   # => "KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg=="
  #
  # The string to be encoded may itself contain newlines,
  # which will be encoded as ordinary \Base64:
  #
  #   Base64.strict_encode64("\n\n\n") # => "CgoK"
  #   s = "This is line 1\nThis is line 2\n"
  #   Base64.strict_encode64(s) # => "VGhpcyBpcyBsaW5lIDEKVGhpcyBpcyBsaW5lIDIK"
  #
  def strict_encode64(bin)
    [bin].pack("m0")
  end

  # Returns a string containing the decoding of an RFC-2045-compliant
  # \Base64-encoded string +str+:
  #
  #   s = "VGhpcyBpcyBsaW5lIDEKVGhpcyBpcyBsaW5lIDIK"
  #   Base64.strict_decode64(s) # => "This is line 1\nThis is line 2\n"
  #
  # Non-\Base64 characters in +str+ not allowed;
  # see {Encoding Character Set}[Base64.html#module-Base64-label-Encoding+Character+Sets] above:
  # these include newline characters and characters <tt>-</tt> and <tt>/</tt>:
  #
  #   Base64.strict_decode64("\n") # Raises ArgumentError
  #   Base64.strict_decode64('-')  # Raises ArgumentError
  #   Base64.strict_decode64('_')  # Raises ArgumentError
  #
  # Padding in +str+, if present, must be correct:
  #
  #   Base64.strict_decode64("MDEyMzQ1Njc")   # Raises ArgumentError
  #   Base64.strict_decode64("MDEyMzQ1Njc=")  # => "01234567"
  #   Base64.strict_decode64("MDEyMzQ1Njc==") # Raises ArgumentError
  #
  def strict_decode64(str)
    str.unpack1("m0")
  end

  # Returns the RFC-4648-compliant \Base64-encoding of +bin+.
  #
  # Per RFC 4648, the returned string will not contain the URL-unsafe characters
  # <tt>+</tt> or <tt>/</tt>,
  # but instead may contain the URL-safe characters
  # <tt>-</tt> and <tt>_</tt>;
  # see {Encoding Character Set}[Base64.html#module-Base64-label-Encoding+Character+Sets] above:
  #
  #   Base64.urlsafe_encode64("\xFB\xEF\xBE") # => "----"
  #   Base64.urlsafe_encode64("\xFF\xFF\xFF") # => "____"
  #
  # By default, the returned string may have padding;
  # see {Padding}[Base64.html#module-Base64-label-Padding], above:
  #
  #   Base64.urlsafe_encode64('*') # => "Kg=="
  #
  # Optionally, you can suppress padding:
  #
  #   Base64.urlsafe_encode64('*', padding: false) # => "Kg"
  #
  # The returned string will have no newline characters, regardless of its length;
  # see {Newlines}[Base64.html#module-Base64-label-Newlines] above:
  #
  #   Base64.urlsafe_encode64('*') # => "Kg=="
  #   Base64.urlsafe_encode64('*' * 46)
  #   # => "KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg=="
  #
  def urlsafe_encode64(bin, padding: true)
    str = strict_encode64(bin)
    str.chomp!("==") or str.chomp!("=") unless padding
    str.tr!("+/", "-_")
    str
  end

  # Returns the decoding of an RFC-4648-compliant \Base64-encoded string +str+:
  #
  # +str+ may not contain non-Base64 characters;
  # see {Encoding Character Set}[Base64.html#module-Base64-label-Encoding+Character+Sets] above:
  #
  #   Base64.urlsafe_decode64('+')  # Raises ArgumentError.
  #   Base64.urlsafe_decode64('/')  # Raises ArgumentError.
  #   Base64.urlsafe_decode64("\n") # Raises ArgumentError.
  #
  # Padding in +str+, if present, must be correct:
  # see {Padding}[Base64.html#module-Base64-label-Padding], above:
  #
  #   Base64.urlsafe_decode64("MDEyMzQ1Njc") # => "01234567"
  #   Base64.urlsafe_decode64("MDEyMzQ1Njc=") # => "01234567"
  #   Base64.urlsafe_decode64("MDEyMzQ1Njc==") # Raises ArgumentError.
  #
  def urlsafe_decode64(str)
    # NOTE: RFC 4648 does say nothing about unpadded input, but says that
    # "the excess pad characters MAY also be ignored", so it is inferred that
    # unpadded input is also acceptable.
    if !str.end_with?("=") && str.length % 4 != 0
      str = str.ljust((str.length + 3) & ~3, "=")
      str.tr!("-_", "+/")
    else
      str = str.tr("-_", "+/")
    end
    strict_decode64(str)
  end
end
