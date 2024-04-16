# frozen_string_literal: false
module REXML
  # Defines a number of tokens used for parsing XML.  Not for general
  # consumption.
  module XMLTokens
    # From http://www.w3.org/TR/REC-xml/#sec-common-syn
    #
    #   [4] NameStartChar ::=
    #         ":" |
    #         [A-Z] |
    #         "_" |
    #         [a-z] |
    #         [#xC0-#xD6] |
    #         [#xD8-#xF6] |
    #         [#xF8-#x2FF] |
    #         [#x370-#x37D] |
    #         [#x37F-#x1FFF] |
    #         [#x200C-#x200D] |
    #         [#x2070-#x218F] |
    #         [#x2C00-#x2FEF] |
    #         [#x3001-#xD7FF] |
    #         [#xF900-#xFDCF] |
    #         [#xFDF0-#xFFFD] |
    #         [#x10000-#xEFFFF]
    name_start_chars = [
      ":",
      "A-Z",
      "_",
      "a-z",
      "\\u00C0-\\u00D6",
      "\\u00D8-\\u00F6",
      "\\u00F8-\\u02FF",
      "\\u0370-\\u037D",
      "\\u037F-\\u1FFF",
      "\\u200C-\\u200D",
      "\\u2070-\\u218F",
      "\\u2C00-\\u2FEF",
      "\\u3001-\\uD7FF",
      "\\uF900-\\uFDCF",
      "\\uFDF0-\\uFFFD",
      "\\u{10000}-\\u{EFFFF}",
    ]
    # From http://www.w3.org/TR/REC-xml/#sec-common-syn
    #
    #   [4a] NameChar ::=
    #      NameStartChar |
    #      "-" |
    #      "." |
    #      [0-9] |
    #      #xB7 |
    #      [#x0300-#x036F] |
    #      [#x203F-#x2040]
    name_chars = name_start_chars + [
      "\\-",
      "\\.",
      "0-9",
      "\\u00B7",
      "\\u0300-\\u036F",
      "\\u203F-\\u2040",
    ]
    NAME_START_CHAR = "[#{name_start_chars.join('')}]"
    NAME_CHAR = "[#{name_chars.join('')}]"
    NAMECHAR = NAME_CHAR # deprecated. Use NAME_CHAR instead.

    # From http://www.w3.org/TR/xml-names11/#NT-NCName
    #
    #   [6] NCNameStartChar ::= NameStartChar - ':'
    ncname_start_chars = name_start_chars - [":"]
    # From http://www.w3.org/TR/xml-names11/#NT-NCName
    #
    #   [5] NCNameChar ::= NameChar - ':'
    ncname_chars = name_chars - [":"]
    NCNAME_STR = "[#{ncname_start_chars.join('')}][#{ncname_chars.join('')}]*"
    NAME_STR = "(?:#{NCNAME_STR}:)?#{NCNAME_STR}"

    NAME = "(#{NAME_START_CHAR}#{NAME_CHAR}*)"
    NMTOKEN = "(?:#{NAME_CHAR})+"
    NMTOKENS = "#{NMTOKEN}(\\s+#{NMTOKEN})*"
    REFERENCE = "(?:&#{NAME};|&#\\d+;|&#x[0-9a-fA-F]+;)"

    #REFERENCE = "(?:#{ENTITYREF}|#{CHARREF})"
    #ENTITYREF = "&#{NAME};"
    #CHARREF = "&#\\d+;|&#x[0-9a-fA-F]+;"
  end
end
