# frozen_string_literal: true

module ActiveSupport
  module Multibyte
    module Unicode
      extend self

      # The Unicode version that is supported by the implementation
      UNICODE_VERSION = RbConfig::CONFIG["UNICODE_VERSION"]

      # Decompose composed characters to the decomposed form.
      def decompose(type, codepoints)
        if type == :compatibility
          codepoints.pack("U*").unicode_normalize(:nfkd).codepoints
        else
          codepoints.pack("U*").unicode_normalize(:nfd).codepoints
        end
      end

      # Compose decomposed characters to the composed form.
      def compose(codepoints)
        codepoints.pack("U*").unicode_normalize(:nfc).codepoints
      end

      # Rubinius' String#scrub, however, doesn't support ASCII-incompatible chars.
      if !defined?(Rubinius)
        # Replaces all ISO-8859-1 or CP1252 characters by their UTF-8 equivalent
        # resulting in a valid UTF-8 string.
        #
        # Passing +true+ will forcibly tidy all bytes, assuming that the string's
        # encoding is entirely CP1252 or ISO-8859-1.
        def tidy_bytes(string, force = false)
          return string if string.empty? || string.ascii_only?
          return recode_windows1252_chars(string) if force
          string.scrub { |bad| recode_windows1252_chars(bad) }
        end
      else
        def tidy_bytes(string, force = false)
          return string if string.empty?
          return recode_windows1252_chars(string) if force

          # We can't transcode to the same format, so we choose a nearly-identical encoding.
          # We're going to 'transcode' bytes from UTF-8 when possible, then fall back to
          # CP1252 when we get errors. The final string will be 'converted' back to UTF-8
          # before returning.
          reader = Encoding::Converter.new(Encoding::UTF_8, Encoding::UTF_16LE)

          source = string.dup
          out = "".force_encoding(Encoding::UTF_16LE)

          loop do
            reader.primitive_convert(source, out)
            _, _, _, error_bytes, _ = reader.primitive_errinfo
            break if error_bytes.nil?
            out << error_bytes.encode(Encoding::UTF_16LE, Encoding::Windows_1252, invalid: :replace, undef: :replace)
          end

          reader.finish

          out.encode!(Encoding::UTF_8)
        end
      end

      private
        def recode_windows1252_chars(string)
          string.encode(Encoding::UTF_8, Encoding::Windows_1252, invalid: :replace, undef: :replace)
        end
    end
  end
end
