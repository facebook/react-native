# frozen_string_literal: false

require_relative 'encoding'
require_relative 'source'

module REXML
  # NEEDS DOCUMENTATION
  class XMLDecl < Child
    include Encoding

    DEFAULT_VERSION = "1.0"
    DEFAULT_ENCODING = "UTF-8"
    DEFAULT_STANDALONE = "no"
    START = "<?xml"
    STOP = "?>"

    attr_accessor :version, :standalone
    attr_reader :writeencoding, :writethis

    def initialize(version=DEFAULT_VERSION, encoding=nil, standalone=nil)
      @writethis = true
      @writeencoding = !encoding.nil?
      if version.kind_of? XMLDecl
        super()
        @version = version.version
        self.encoding = version.encoding
        @writeencoding = version.writeencoding
        @standalone = version.standalone
        @writethis = version.writethis
      else
        super()
        @version = version
        self.encoding = encoding
        @standalone = standalone
      end
      @version = DEFAULT_VERSION if @version.nil?
    end

    def clone
      XMLDecl.new(self)
    end

    # indent::
    #   Ignored.  There must be no whitespace before an XML declaration
    # transitive::
    #   Ignored
    # ie_hack::
    #   Ignored
    def write(writer, indent=-1, transitive=false, ie_hack=false)
      return nil unless @writethis or writer.kind_of? Output
      writer << START
      writer << " #{content encoding}"
      writer << STOP
    end

    def ==( other )
      other.kind_of?(XMLDecl) and
      other.version == @version and
      other.encoding == self.encoding and
      other.standalone == @standalone
    end

    def xmldecl version, encoding, standalone
      @version = version
      self.encoding = encoding
      @standalone = standalone
    end

    def node_type
      :xmldecl
    end

    alias :stand_alone? :standalone
    alias :old_enc= :encoding=

    def encoding=( enc )
      if enc.nil?
        self.old_enc = "UTF-8"
        @writeencoding = false
      else
        self.old_enc = enc
        @writeencoding = true
      end
      self.dowrite
    end

    # Only use this if you do not want the XML declaration to be written;
    # this object is ignored by the XML writer.  Otherwise, instantiate your
    # own XMLDecl and add it to the document.
    #
    # Note that XML 1.1 documents *must* include an XML declaration
    def XMLDecl.default
      rv = XMLDecl.new( "1.0" )
      rv.nowrite
      rv
    end

    def nowrite
      @writethis = false
    end

    def dowrite
      @writethis = true
    end

    def inspect
      "#{START} ... #{STOP}"
    end

    private
    def content(enc)
      context = nil
      context = parent.context if parent
      if context and context[:prologue_quote] == :quote
        quote = "\""
      else
        quote = "'"
      end

      rv = "version=#{quote}#{@version}#{quote}"
      if @writeencoding or enc !~ /\Autf-8\z/i
        rv << " encoding=#{quote}#{enc}#{quote}"
      end
      if @standalone
        rv << " standalone=#{quote}#{@standalone}#{quote}"
      end
      rv
    end
  end
end
