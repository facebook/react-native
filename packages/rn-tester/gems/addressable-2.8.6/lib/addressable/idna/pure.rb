# frozen_string_literal: true

#--
# Copyright (C) Bob Aman
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
#++


module Addressable
  module IDNA
    # This module is loosely based on idn_actionmailer by Mick Staugaard,
    # the unicode library by Yoshida Masato, and the punycode implementation
    # by Kazuhiro Nishiyama.  Most of the code was copied verbatim, but
    # some reformatting was done, and some translation from C was done.
    #
    # Without their code to work from as a base, we'd all still be relying
    # on the presence of libidn.  Which nobody ever seems to have installed.
    #
    # Original sources:
    # http://github.com/staugaard/idn_actionmailer
    # http://www.yoshidam.net/Ruby.html#unicode
    # http://rubyforge.org/frs/?group_id=2550


    UNICODE_TABLE = File.expand_path(
      File.join(File.dirname(__FILE__), '../../..', 'data/unicode.data')
    )

    ACE_PREFIX = "xn--"

    UTF8_REGEX = /\A(?:
      [\x09\x0A\x0D\x20-\x7E]               # ASCII
      | [\xC2-\xDF][\x80-\xBF]              # non-overlong 2-byte
      | \xE0[\xA0-\xBF][\x80-\xBF]          # excluding overlongs
      | [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}   # straight 3-byte
      | \xED[\x80-\x9F][\x80-\xBF]          # excluding surrogates
      | \xF0[\x90-\xBF][\x80-\xBF]{2}       # planes 1-3
      | [\xF1-\xF3][\x80-\xBF]{3}           # planes 4nil5
      | \xF4[\x80-\x8F][\x80-\xBF]{2}       # plane 16
      )*\z/mnx

    UTF8_REGEX_MULTIBYTE = /(?:
      [\xC2-\xDF][\x80-\xBF]                # non-overlong 2-byte
      | \xE0[\xA0-\xBF][\x80-\xBF]          # excluding overlongs
      | [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}   # straight 3-byte
      | \xED[\x80-\x9F][\x80-\xBF]          # excluding surrogates
      | \xF0[\x90-\xBF][\x80-\xBF]{2}       # planes 1-3
      | [\xF1-\xF3][\x80-\xBF]{3}           # planes 4nil5
      | \xF4[\x80-\x8F][\x80-\xBF]{2}       # plane 16
      )/mnx

    # :startdoc:

    # Converts from a Unicode internationalized domain name to an ASCII
    # domain name as described in RFC 3490.
    def self.to_ascii(input)
      input = input.to_s unless input.is_a?(String)
      input = input.dup.force_encoding(Encoding::UTF_8).unicode_normalize(:nfkc)
      if input.respond_to?(:force_encoding)
        input.force_encoding(Encoding::ASCII_8BIT)
      end
      if input =~ UTF8_REGEX && input =~ UTF8_REGEX_MULTIBYTE
        parts = unicode_downcase(input).split('.')
        parts.map! do |part|
          if part.respond_to?(:force_encoding)
            part.force_encoding(Encoding::ASCII_8BIT)
          end
          if part =~ UTF8_REGEX && part =~ UTF8_REGEX_MULTIBYTE
            ACE_PREFIX + punycode_encode(part)
          else
            part
          end
        end
        parts.join('.')
      else
        input
      end
    end

    # Converts from an ASCII domain name to a Unicode internationalized
    # domain name as described in RFC 3490.
    def self.to_unicode(input)
      input = input.to_s unless input.is_a?(String)
      parts = input.split('.')
      parts.map! do |part|
        if part =~ /^#{ACE_PREFIX}(.+)/
          begin
            punycode_decode(part[/^#{ACE_PREFIX}(.+)/, 1])
          rescue Addressable::IDNA::PunycodeBadInput
            # toUnicode is explicitly defined as never-fails by the spec
            part
          end
        else
          part
        end
      end
      output = parts.join('.')
      if output.respond_to?(:force_encoding)
        output.force_encoding(Encoding::UTF_8)
      end
      output
    end

    class << self
      # @deprecated Use {String#unicode_normalize(:nfkc)} instead
      def unicode_normalize_kc(value)
        value.to_s.unicode_normalize(:nfkc)
      end

      extend Gem::Deprecate
      deprecate :unicode_normalize_kc, "String#unicode_normalize(:nfkc)", 2023, 4
    end

    ##
    # Unicode aware downcase method.
    #
    # @api private
    # @param [String] input
    #   The input string.
    # @return [String] The downcased result.
    def self.unicode_downcase(input)
      input = input.to_s unless input.is_a?(String)
      unpacked = input.unpack("U*")
      unpacked.map! { |codepoint| lookup_unicode_lowercase(codepoint) }
      return unpacked.pack("U*")
    end
    private_class_method :unicode_downcase

    def self.lookup_unicode_lowercase(codepoint)
      codepoint_data = UNICODE_DATA[codepoint]
      (codepoint_data ?
        (codepoint_data[UNICODE_DATA_LOWERCASE] || codepoint) :
        codepoint)
    end
    private_class_method :lookup_unicode_lowercase

    UNICODE_DATA_COMBINING_CLASS = 0
    UNICODE_DATA_EXCLUSION = 1
    UNICODE_DATA_CANONICAL = 2
    UNICODE_DATA_COMPATIBILITY = 3
    UNICODE_DATA_UPPERCASE = 4
    UNICODE_DATA_LOWERCASE = 5
    UNICODE_DATA_TITLECASE = 6

    begin
      if defined?(FakeFS)
        fakefs_state = FakeFS.activated?
        FakeFS.deactivate!
      end
      # This is a sparse Unicode table.  Codepoints without entries are
      # assumed to have the value: [0, 0, nil, nil, nil, nil, nil]
      UNICODE_DATA = File.open(UNICODE_TABLE, "rb") do |file|
        Marshal.load(file.read)
      end
    ensure
      if defined?(FakeFS)
        FakeFS.activate! if fakefs_state
      end
    end

    COMPOSITION_TABLE = {}
    UNICODE_DATA.each do |codepoint, data|
      canonical = data[UNICODE_DATA_CANONICAL]
      exclusion = data[UNICODE_DATA_EXCLUSION]

      if canonical && exclusion == 0
        COMPOSITION_TABLE[canonical.unpack("C*")] = codepoint
      end
    end

    UNICODE_MAX_LENGTH = 256
    ACE_MAX_LENGTH = 256

    PUNYCODE_BASE = 36
    PUNYCODE_TMIN = 1
    PUNYCODE_TMAX = 26
    PUNYCODE_SKEW = 38
    PUNYCODE_DAMP = 700
    PUNYCODE_INITIAL_BIAS = 72
    PUNYCODE_INITIAL_N = 0x80
    PUNYCODE_DELIMITER = 0x2D

    PUNYCODE_MAXINT = 1 << 64

    PUNYCODE_PRINT_ASCII =
      "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n" +
      "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n" +
      " !\"\#$%&'()*+,-./" +
      "0123456789:;<=>?" +
      "@ABCDEFGHIJKLMNO" +
      "PQRSTUVWXYZ[\\]^_" +
      "`abcdefghijklmno" +
      "pqrstuvwxyz{|}~\n"

    # Input is invalid.
    class PunycodeBadInput < StandardError; end
    # Output would exceed the space provided.
    class PunycodeBigOutput < StandardError; end
    # Input needs wider integers to process.
    class PunycodeOverflow < StandardError; end

    def self.punycode_encode(unicode)
      unicode = unicode.to_s unless unicode.is_a?(String)
      input = unicode.unpack("U*")
      output = [0] * (ACE_MAX_LENGTH + 1)
      input_length = input.size
      output_length = [ACE_MAX_LENGTH]

      # Initialize the state
      n = PUNYCODE_INITIAL_N
      delta = out = 0
      max_out = output_length[0]
      bias = PUNYCODE_INITIAL_BIAS

      # Handle the basic code points:
      input_length.times do |j|
        if punycode_basic?(input[j])
          if max_out - out < 2
            raise PunycodeBigOutput,
              "Output would exceed the space provided."
          end
          output[out] = input[j]
          out += 1
        end
      end

      h = b = out

      # h is the number of code points that have been handled, b is the
      # number of basic code points, and out is the number of characters
      # that have been output.

      if b > 0
        output[out] = PUNYCODE_DELIMITER
        out += 1
      end

      # Main encoding loop:

      while h < input_length
        # All non-basic code points < n have been
        # handled already.  Find the next larger one:

        m = PUNYCODE_MAXINT
        input_length.times do |j|
          m = input[j] if (n...m) === input[j]
        end

        # Increase delta enough to advance the decoder's
        # <n,i> state to <m,0>, but guard against overflow:

        if m - n > (PUNYCODE_MAXINT - delta) / (h + 1)
          raise PunycodeOverflow, "Input needs wider integers to process."
        end
        delta += (m - n) * (h + 1)
        n = m

        input_length.times do |j|
          # Punycode does not need to check whether input[j] is basic:
          if input[j] < n
            delta += 1
            if delta == 0
              raise PunycodeOverflow,
                "Input needs wider integers to process."
            end
          end

          if input[j] == n
            # Represent delta as a generalized variable-length integer:

            q = delta; k = PUNYCODE_BASE
            while true
              if out >= max_out
                raise PunycodeBigOutput,
                  "Output would exceed the space provided."
              end
              t = (
                if k <= bias
                  PUNYCODE_TMIN
                elsif k >= bias + PUNYCODE_TMAX
                  PUNYCODE_TMAX
                else
                  k - bias
                end
              )
              break if q < t
              output[out] =
                punycode_encode_digit(t + (q - t) % (PUNYCODE_BASE - t))
              out += 1
              q = (q - t) / (PUNYCODE_BASE - t)
              k += PUNYCODE_BASE
            end

            output[out] = punycode_encode_digit(q)
            out += 1
            bias = punycode_adapt(delta, h + 1, h == b)
            delta = 0
            h += 1
          end
        end

        delta += 1
        n += 1
      end

      output_length[0] = out

      outlen = out
      outlen.times do |j|
        c = output[j]
        unless c >= 0 && c <= 127
          raise StandardError, "Invalid output char."
        end
        unless PUNYCODE_PRINT_ASCII[c]
          raise PunycodeBadInput, "Input is invalid."
        end
      end

      output[0..outlen].map { |x| x.chr }.join("").sub(/\0+\z/, "")
    end
    private_class_method :punycode_encode

    def self.punycode_decode(punycode)
      input = []
      output = []

      if ACE_MAX_LENGTH * 2 < punycode.size
        raise PunycodeBigOutput, "Output would exceed the space provided."
      end
      punycode.each_byte do |c|
        unless c >= 0 && c <= 127
          raise PunycodeBadInput, "Input is invalid."
        end
        input.push(c)
      end

      input_length = input.length
      output_length = [UNICODE_MAX_LENGTH]

      # Initialize the state
      n = PUNYCODE_INITIAL_N

      out = i = 0
      max_out = output_length[0]
      bias = PUNYCODE_INITIAL_BIAS

      # Handle the basic code points:  Let b be the number of input code
      # points before the last delimiter, or 0 if there is none, then
      # copy the first b code points to the output.

      b = 0
      input_length.times do |j|
        b = j if punycode_delimiter?(input[j])
      end
      if b > max_out
        raise PunycodeBigOutput, "Output would exceed the space provided."
      end

      b.times do |j|
        unless punycode_basic?(input[j])
          raise PunycodeBadInput, "Input is invalid."
        end
        output[out] = input[j]
        out+=1
      end

      # Main decoding loop:  Start just after the last delimiter if any
      # basic code points were copied; start at the beginning otherwise.

      in_ = b > 0 ? b + 1 : 0
      while in_ < input_length

        # in_ is the index of the next character to be consumed, and
        # out is the number of code points in the output array.

        # Decode a generalized variable-length integer into delta,
        # which gets added to i.  The overflow checking is easier
        # if we increase i as we go, then subtract off its starting
        # value at the end to obtain delta.

        oldi = i; w = 1; k = PUNYCODE_BASE
        while true
          if in_ >= input_length
            raise PunycodeBadInput, "Input is invalid."
          end
          digit = punycode_decode_digit(input[in_])
          in_+=1
          if digit >= PUNYCODE_BASE
            raise PunycodeBadInput, "Input is invalid."
          end
          if digit > (PUNYCODE_MAXINT - i) / w
            raise PunycodeOverflow, "Input needs wider integers to process."
          end
          i += digit * w
          t = (
            if k <= bias
              PUNYCODE_TMIN
            elsif k >= bias + PUNYCODE_TMAX
              PUNYCODE_TMAX
            else
              k - bias
            end
          )
          break if digit < t
          if w > PUNYCODE_MAXINT / (PUNYCODE_BASE - t)
            raise PunycodeOverflow, "Input needs wider integers to process."
          end
          w *= PUNYCODE_BASE - t
          k += PUNYCODE_BASE
        end

        bias = punycode_adapt(i - oldi, out + 1, oldi == 0)

        # I was supposed to wrap around from out + 1 to 0,
        # incrementing n each time, so we'll fix that now:

        if i / (out + 1) > PUNYCODE_MAXINT - n
          raise PunycodeOverflow, "Input needs wider integers to process."
        end
        n += i / (out + 1)
        i %= out + 1

        # Insert n at position i of the output:

        # not needed for Punycode:
        # raise PUNYCODE_INVALID_INPUT if decode_digit(n) <= base
        if out >= max_out
          raise PunycodeBigOutput, "Output would exceed the space provided."
        end

        #memmove(output + i + 1, output + i, (out - i) * sizeof *output)
        output[i + 1, out - i] = output[i, out - i]
        output[i] = n
        i += 1

        out += 1
      end

      output_length[0] = out

      output.pack("U*")
    end
    private_class_method :punycode_decode

    def self.punycode_basic?(codepoint)
      codepoint < 0x80
    end
    private_class_method :punycode_basic?

    def self.punycode_delimiter?(codepoint)
      codepoint == PUNYCODE_DELIMITER
    end
    private_class_method :punycode_delimiter?

    def self.punycode_encode_digit(d)
      d + 22 + 75 * ((d < 26) ? 1 : 0)
    end
    private_class_method :punycode_encode_digit

    # Returns the numeric value of a basic codepoint
    # (for use in representing integers) in the range 0 to
    # base - 1, or PUNYCODE_BASE if codepoint does not represent a value.
    def self.punycode_decode_digit(codepoint)
      if codepoint - 48 < 10
        codepoint - 22
      elsif codepoint - 65 < 26
        codepoint - 65
      elsif codepoint - 97 < 26
        codepoint - 97
      else
        PUNYCODE_BASE
      end
    end
    private_class_method :punycode_decode_digit

    # Bias adaptation method
    def self.punycode_adapt(delta, numpoints, firsttime)
      delta = firsttime ? delta / PUNYCODE_DAMP : delta >> 1
      # delta >> 1 is a faster way of doing delta / 2
      delta += delta / numpoints
      difference = PUNYCODE_BASE - PUNYCODE_TMIN

      k = 0
      while delta > (difference * PUNYCODE_TMAX) / 2
        delta /= difference
        k += PUNYCODE_BASE
      end

      k + (difference + 1) * delta / (delta + PUNYCODE_SKEW)
    end
    private_class_method :punycode_adapt
  end
  # :startdoc:
end
