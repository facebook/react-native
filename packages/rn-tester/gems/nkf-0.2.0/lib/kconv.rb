# frozen_string_literal: false
#
# kconv.rb - Kanji Converter.
#
# $Id$
#
# ----
#
# kconv.rb implements the Kconv class for Kanji Converter.  Additionally,
# some methods in String classes are added to allow easy conversion.
#

require 'nkf'

#
# Kanji Converter for Ruby.
#
module Kconv
  #
  # Public Constants
  #

  #Constant of Encoding

  # Auto-Detect
  AUTO = NKF::AUTO
  # ISO-2022-JP
  JIS = NKF::JIS
  # EUC-JP
  EUC = NKF::EUC
  # Shift_JIS
  SJIS = NKF::SJIS
  # BINARY
  BINARY = NKF::BINARY
  # NOCONV
  NOCONV = NKF::NOCONV
  # ASCII
  ASCII = NKF::ASCII
  # UTF-8
  UTF8 = NKF::UTF8
  # UTF-16
  UTF16 = NKF::UTF16
  # UTF-32
  UTF32 = NKF::UTF32
  # UNKNOWN
  UNKNOWN = NKF::UNKNOWN

  #
  # Public Methods
  #

  # call-seq:
  #    Kconv.kconv(str, to_enc, from_enc=nil)
  #
  # Convert <code>str</code> to <code>to_enc</code>.
  # <code>to_enc</code> and <code>from_enc</code> are given as constants of Kconv or Encoding objects.
  def kconv(str, to_enc, from_enc=nil)
    opt = ''
    opt += ' --ic=' + from_enc.to_s if from_enc
    opt += ' --oc=' + to_enc.to_s if to_enc

    ::NKF::nkf(opt, str)
  end
  module_function :kconv

  #
  # Encode to
  #

  # call-seq:
  #    Kconv.tojis(str)   => string
  #
  # Convert <code>str</code> to ISO-2022-JP
  def tojis(str)
    kconv(str, JIS)
  end
  module_function :tojis

  # call-seq:
  #    Kconv.toeuc(str)   => string
  #
  # Convert <code>str</code> to EUC-JP
  def toeuc(str)
    kconv(str, EUC)
  end
  module_function :toeuc

  # call-seq:
  #    Kconv.tosjis(str)   => string
  #
  # Convert <code>str</code> to Shift_JIS
  def tosjis(str)
    kconv(str, SJIS)
  end
  module_function :tosjis

  # call-seq:
  #    Kconv.toutf8(str)   => string
  #
  # Convert <code>str</code> to UTF-8
  def toutf8(str)
    kconv(str, UTF8)
  end
  module_function :toutf8

  # call-seq:
  #    Kconv.toutf16(str)   => string
  #
  # Convert <code>str</code> to UTF-16
  def toutf16(str)
    kconv(str, UTF16)
  end
  module_function :toutf16

  # call-seq:
  #    Kconv.toutf32(str)   => string
  #
  # Convert <code>str</code> to UTF-32
  def toutf32(str)
    kconv(str, UTF32)
  end
  module_function :toutf32

  # call-seq:
  #    Kconv.tolocale   => string
  #
  # Convert <code>self</code> to locale encoding
  def tolocale(str)
    kconv(str, Encoding.locale_charmap)
  end
  module_function :tolocale

  #
  # guess
  #

  # call-seq:
  #    Kconv.guess(str)   => encoding
  #
  # Guess input encoding by NKF.guess
  def guess(str)
    ::NKF::guess(str)
  end
  module_function :guess

  #
  # isEncoding
  #

  # call-seq:
  #    Kconv.iseuc(str)   => true or false
  #
  # Returns whether input encoding is EUC-JP or not.
  #
  # *Note* don't expect this return value is MatchData.
  def iseuc(str)
    str.dup.force_encoding(EUC).valid_encoding?
  end
  module_function :iseuc

  # call-seq:
  #    Kconv.issjis(str)   => true or false
  #
  # Returns whether input encoding is Shift_JIS or not.
  def issjis(str)
    str.dup.force_encoding(SJIS).valid_encoding?
  end
  module_function :issjis

  # call-seq:
  #    Kconv.isjis(str)   => true or false
  #
  # Returns whether input encoding is ISO-2022-JP or not.
  def isjis(str)
    /\A [\t\n\r\x20-\x7E]*
      (?:
        (?:\x1b \x28 I      [\x21-\x7E]*
          |\x1b \x28 J      [\x21-\x7E]*
          |\x1b \x24 @      (?:[\x21-\x7E]{2})*
          |\x1b \x24 B      (?:[\x21-\x7E]{2})*
          |\x1b \x24 \x28 D (?:[\x21-\x7E]{2})*
        )*
        \x1b \x28 B [\t\n\r\x20-\x7E]*
      )*
     \z/nox =~ str.dup.force_encoding('BINARY') ? true : false
  end
  module_function :isjis

  # call-seq:
  #    Kconv.isutf8(str)   => true or false
  #
  # Returns whether input encoding is UTF-8 or not.
  def isutf8(str)
    str.dup.force_encoding(UTF8).valid_encoding?
  end
  module_function :isutf8
end

class String
  # call-seq:
  #    String#kconv(to_enc, from_enc)
  #
  # Convert <code>self</code> to <code>to_enc</code>.
  # <code>to_enc</code> and <code>from_enc</code> are given as constants of Kconv or Encoding objects.
  def kconv(to_enc, from_enc=nil)
    from_enc = self.encoding if !from_enc && self.encoding != Encoding.list[0]
    Kconv::kconv(self, to_enc, from_enc)
  end

  #
  # to Encoding
  #

  # call-seq:
  #    String#tojis   => string
  #
  # Convert <code>self</code> to ISO-2022-JP
  def tojis; Kconv.tojis(self) end

  # call-seq:
  #    String#toeuc   => string
  #
  # Convert <code>self</code> to EUC-JP
  def toeuc; Kconv.toeuc(self) end

  # call-seq:
  #    String#tosjis   => string
  #
  # Convert <code>self</code> to Shift_JIS
  def tosjis; Kconv.tosjis(self) end

  # call-seq:
  #    String#toutf8   => string
  #
  # Convert <code>self</code> to UTF-8
  def toutf8; Kconv.toutf8(self) end

  # call-seq:
  #    String#toutf16   => string
  #
  # Convert <code>self</code> to UTF-16
  def toutf16; Kconv.toutf16(self) end

  # call-seq:
  #    String#toutf32   => string
  #
  # Convert <code>self</code> to UTF-32
  def toutf32; Kconv.toutf32(self) end

  # call-seq:
  #    String#tolocale   => string
  #
  # Convert <code>self</code> to locale encoding
  def tolocale; Kconv.tolocale(self) end

  #
  # is Encoding
  #

  # call-seq:
  #    String#iseuc   => true or false
  #
  # Returns whether <code>self</code>'s encoding is EUC-JP or not.
  def iseuc;	Kconv.iseuc(self) end

  # call-seq:
  #    String#issjis   => true or false
  #
  # Returns whether <code>self</code>'s encoding is Shift_JIS or not.
  def issjis;	Kconv.issjis(self) end

  # call-seq:
  #    String#isjis   => true or false
  #
  # Returns whether <code>self</code>'s encoding is ISO-2022-JP or not.
  def isjis;	Kconv.isjis(self) end

  # call-seq:
  #    String#isutf8   => true or false
  #
  # Returns whether <code>self</code>'s encoding is UTF-8 or not.
  def isutf8;	Kconv.isutf8(self) end
end
