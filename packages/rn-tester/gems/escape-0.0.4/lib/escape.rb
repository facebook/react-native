# escape.rb - escape/unescape library for several formats
#
# Copyright (C) 2006,2007 Tanaka Akira  <akr@fsij.org>
# 
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
# 
#  1. Redistributions of source code must retain the above copyright notice, this
#     list of conditions and the following disclaimer.
#  2. Redistributions in binary form must reproduce the above copyright notice,
#     this list of conditions and the following disclaimer in the documentation
#     and/or other materials provided with the distribution.
#  3. The name of the author may not be used to endorse or promote products
#     derived from this software without specific prior written permission.
# 
# THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED
# WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
# MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
# EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
# EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
# OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
# IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY
# OF SUCH DAMAGE.

# Escape module provides several escape functions.
# * URI
# * HTML
# * shell command
module Escape
  module_function

  # Escape.shell_command composes
  # a sequence of words to
  # a single shell command line.
  # All shell meta characters are quoted and
  # the words are concatenated with interleaving space.
  #
  #  Escape.shell_command(["ls", "/"]) #=> "ls /"
  #  Escape.shell_command(["echo", "*"]) #=> "echo '*'"
  #
  # Note that system(*command) and
  # system(Escape.shell_command(command)) is roughly same.
  # There are two exception as follows.
  # * The first is that the later may invokes /bin/sh.
  # * The second is an interpretation of an array with only one element: 
  #   the element is parsed by the shell with the former but
  #   it is recognized as single word with the later.
  #   For example, system(*["echo foo"]) invokes echo command with an argument "foo".
  #   But system(Escape.shell_command(["echo foo"])) invokes "echo foo" command without arguments (and it probably fails).
  def shell_command(command)
    command.map {|word| shell_single_word(word) }.join(' ')
  end

  # Escape.shell_single_word quotes shell meta characters.
  #
  # The result string is always single shell word, even if
  # the argument is "".
  # Escape.shell_single_word("") returns "''".
  #
  #  Escape.shell_single_word("") #=> "''"
  #  Escape.shell_single_word("foo") #=> "foo"
  #  Escape.shell_single_word("*") #=> "'*'"
  def shell_single_word(str)
    if str.empty?
      "''"
    elsif %r{\A[0-9A-Za-z+,./:=@_-]+\z} =~ str
      str
    else
      result = ''
      str.scan(/('+)|[^']+/) {
        if $1
          result << %q{\'} * $1.length
        else
          result << "'#{$&}'"
        end
      }
      result
    end
  end

  # Escape.uri_segment escapes URI segment using percent-encoding.
  #
  #  Escape.uri_segment("a/b") #=> "a%2Fb"
  #
  # The segment is "/"-splitted element after authority before query in URI, as follows.
  #
  #   scheme://authority/segment1/segment2/.../segmentN?query#fragment
  #
  # See RFC 3986 for details of URI.
  def uri_segment(str)
    # pchar - pct-encoded = unreserved / sub-delims / ":" / "@"
    # unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
    # sub-delims = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
    str.gsub(%r{[^A-Za-z0-9\-._~!$&'()*+,;=:@]}n) {
      '%' + $&.unpack("H2")[0].upcase
    }
  end

  # Escape.uri_path escapes URI path using percent-encoding.
  # The given path should be a sequence of (non-escaped) segments separated by "/".
  # The segments cannot contains "/".
  #
  #  Escape.uri_path("a/b/c") #=> "a/b/c"
  #  Escape.uri_path("a?b/c?d/e?f") #=> "a%3Fb/c%3Fd/e%3Ff"
  #
  # The path is the part after authority before query in URI, as follows.
  #
  #   scheme://authority/path#fragment
  #
  # See RFC 3986 for details of URI.
  #
  # Note that this function is not appropriate to convert OS path to URI.
  def uri_path(str)
    str.gsub(%r{[^/]+}n) { uri_segment($&) }
  end

  # :stopdoc:
  def html_form_fast(pairs, sep=';')
    pairs.map {|k, v|
      # query-chars - pct-encoded - x-www-form-urlencoded-delimiters =
      #   unreserved / "!" / "$" / "'" / "(" / ")" / "*" / "," / ":" / "@" / "/" / "?"
      # query-char - pct-encoded = unreserved / sub-delims / ":" / "@" / "/" / "?"
      # query-char = pchar / "/" / "?" = unreserved / pct-encoded / sub-delims / ":" / "@" / "/" / "?"
      # unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
      # sub-delims = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
      # x-www-form-urlencoded-delimiters = "&" / "+" / ";" / "="
      k = k.gsub(%r{[^0-9A-Za-z\-\._~:/?@!\$'()*,]}n) {
        '%' + $&.unpack("H2")[0].upcase
      }
      v = v.gsub(%r{[^0-9A-Za-z\-\._~:/?@!\$'()*,]}n) {
        '%' + $&.unpack("H2")[0].upcase
      }
      "#{k}=#{v}"
    }.join(sep)
  end
  # :startdoc:

  # Escape.html_form composes HTML form key-value pairs as a x-www-form-urlencoded encoded string.
  #
  # Escape.html_form takes an array of pair of strings or
  # an hash from string to string.
  #
  #  Escape.html_form([["a","b"], ["c","d"]]) #=> "a=b&c=d"
  #  Escape.html_form({"a"=>"b", "c"=>"d"}) #=> "a=b&c=d"
  #
  # In the array form, it is possible to use same key more than once.
  # (It is required for a HTML form which contains
  # checkboxes and select element with multiple attribute.)
  #
  #  Escape.html_form([["k","1"], ["k","2"]]) #=> "k=1&k=2"
  #
  # If the strings contains characters which must be escaped in x-www-form-urlencoded,
  # they are escaped using %-encoding.
  #
  #  Escape.html_form([["k=","&;="]]) #=> "k%3D=%26%3B%3D"
  #
  # The separator can be specified by the optional second argument.
  #
  #  Escape.html_form([["a","b"], ["c","d"]], ";") #=> "a=b;c=d"
  #
  # See HTML 4.01 for details.
  def html_form(pairs, sep='&')
    r = ''
    first = true
    pairs.each {|k, v|
      # query-chars - pct-encoded - x-www-form-urlencoded-delimiters =
      #   unreserved / "!" / "$" / "'" / "(" / ")" / "*" / "," / ":" / "@" / "/" / "?"
      # query-char - pct-encoded = unreserved / sub-delims / ":" / "@" / "/" / "?"
      # query-char = pchar / "/" / "?" = unreserved / pct-encoded / sub-delims / ":" / "@" / "/" / "?"
      # unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
      # sub-delims = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
      # x-www-form-urlencoded-delimiters = "&" / "+" / ";" / "="
      r << sep if !first
      first = false
      k.each_byte {|byte|
        ch = byte.chr
        if %r{[^0-9A-Za-z\-\._~:/?@!\$'()*,]}n =~ ch
          r << "%" << ch.unpack("H2")[0].upcase
        else
          r << ch
        end
      }
      r << '='
      v.each_byte {|byte|
        ch = byte.chr
        if %r{[^0-9A-Za-z\-\._~:/?@!\$'()*,]}n =~ ch
          r << "%" << ch.unpack("H2")[0].upcase
        else
          r << ch
        end
      }
    }
    r
  end

  # :stopdoc:
  HTML_TEXT_ESCAPE_HASH = {
    '&' => '&amp;',
    '<' => '&lt;',
    '>' => '&gt;',
  }
  # :startdoc:

  # Escape.html_text escapes a string appropriate for HTML text using character references.
  #
  # It escapes 3 characters:
  # * '&' to '&amp;'
  # * '<' to '&lt;'
  # * '>' to '&gt;'
  #
  #  Escape.html_text("abc") #=> "abc"
  #  Escape.html_text("a & b < c > d") #=> "a &amp; b &lt; c &gt; d"
  #
  # This function is not appropriate for escaping HTML element attribute
  # because quotes are not escaped.
  def html_text(str)
    str.gsub(/[&<>]/) {|ch| HTML_TEXT_ESCAPE_HASH[ch] }
  end

  # :stopdoc:
  HTML_ATTR_ESCAPE_HASH = {
    '&' => '&amp;',
    '<' => '&lt;',
    '>' => '&gt;',
    '"' => '&quot;',
  }
  # :startdoc:

  # Escape.html_attr encodes a string as a double-quoted HTML attribute using character references.
  #
  #  Escape.html_attr("abc") #=> "\"abc\""
  #  Escape.html_attr("a&b") #=> "\"a&amp;b\""
  #  Escape.html_attr("ab&<>\"c") #=> "\"ab&amp;&lt;&gt;&quot;c\""
  #  Escape.html_attr("a'c") #=> "\"a'c\""
  #
  # It escapes 4 characters:
  # * '&' to '&amp;'
  # * '<' to '&lt;'
  # * '>' to '&gt;'
  # * '"' to '&quot;'
  #
  def html_attr(str)
    '"' + str.gsub(/[&<>"]/) {|ch| HTML_ATTR_ESCAPE_HASH[ch] } + '"'
  end
end
