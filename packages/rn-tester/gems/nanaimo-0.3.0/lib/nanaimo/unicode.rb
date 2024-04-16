# frozen-string-literal: true

require 'nanaimo/unicode/next_step_mapping'
require 'nanaimo/unicode/quote_maps'
module Nanaimo
  # @!visibility private
  #
  module Unicode
    class UnsupportedEscapeSequenceError < Error; end
    class InvalidEscapeSequenceError < Error; end

    module_function

    def quotify_string(string)
      string.gsub(QUOTE_REGEXP, QUOTE_MAP)
    end

    ESCAPE_PREFIXES = %W(
      0 1 2 3 4 5 6 7 a b f n r t v \n U \\
    ).freeze

    OCTAL_DIGITS = (0..7).map(&:to_s).freeze

    # Credit to Samantha Marshall
    # Taken from https://github.com/samdmarshall/pbPlist/blob/346c29f91f913d35d0e24f6722ec19edb24e5707/pbPlist/StrParse.py#L197
    # Licensed under https://raw.githubusercontent.com/samdmarshall/pbPlist/blob/346c29f91f913d35d0e24f6722ec19edb24e5707/LICENSE
    #
    # Originally from: http://www.opensource.apple.com/source/CF/CF-744.19/CFOldStylePList.c See `getSlashedChar()`
    def unquotify_string(string)
      formatted_string = ::String.new
      extracted_string = string
      string_length = string.size
      index = 0
      while index < string_length
        if escape_index = extracted_string.index('\\', index)
          formatted_string << extracted_string[index...escape_index] unless index == escape_index
          index = escape_index + 1
          next_char = extracted_string[index]
          if ESCAPE_PREFIXES.include?(next_char)
            index += 1
            if unquoted = UNQUOTE_MAP[next_char]
              formatted_string << unquoted
            elsif next_char == 'U'
              length = 4
              unicode_numbers = extracted_string[index, length]
              unless unicode_numbers =~ /\A\h{4}\z/
                raise InvalidEscapeSequenceError, "Unicode '\\U' escape sequence terminated without 4 following hex characters"
              end
              index += length
              formatted_string << [unicode_numbers.to_i(16)].pack('U')
            elsif OCTAL_DIGITS.include?(next_char) # https://twitter.com/Catfish_Man/status/658014170055507968
              octal_string = extracted_string[index - 1, 3]
              if octal_string =~ /\A[0-7]{3}\z/
                index += 2
                code_point = octal_string.to_i(8)
                unless code_point <= 0x80 || converted = NEXT_STEP_MAPPING[code_point]
                  raise InvalidEscapeSequenceError, "Invalid octal escape sequence #{octal_string}"
                end
                formatted_string << [converted].pack('U')
              else
                formatted_string << next_char
              end
            else
              raise UnsupportedEscapeSequenceError, "Failed to handle #{next_char} which is in the list of possible escapes"
            end
          else
            index += 1
            formatted_string << next_char
          end
        else
          formatted_string << extracted_string[index..-1]
          index = string_length
        end
      end
      formatted_string
    end

    XML_STRING_ESCAPES = {
      '&' => '&amp;',
      '<' => '&lt;',
      '>' => '&gt;'
    }.freeze
    XML_STRING_ESCAPE_REGEXP = Regexp.union(XML_STRING_ESCAPES.keys)

    def xml_escape_string(string)
      string.to_s.gsub(XML_STRING_ESCAPE_REGEXP, XML_STRING_ESCAPES)
    end
  end
end
