# frozen_string_literal: false
require_relative "text"

module REXML
  class CData < Text
    START = '<![CDATA['
    STOP = ']]>'
    ILLEGAL = /(\]\]>)/

    #   Constructor.  CData is data between <![CDATA[ ... ]]>
    #
    # _Examples_
    #  CData.new( source )
    #  CData.new( "Here is some CDATA" )
    #  CData.new( "Some unprocessed data", respect_whitespace_TF, parent_element )
    def initialize( first, whitespace=true, parent=nil )
      super( first, whitespace, parent, false, true, ILLEGAL )
    end

    # Make a copy of this object
    #
    # _Examples_
    #  c = CData.new( "Some text" )
    #  d = c.clone
    #  d.to_s        # -> "Some text"
    def clone
      CData.new self
    end

    # Returns the content of this CData object
    #
    # _Examples_
    #  c = CData.new( "Some text" )
    #  c.to_s        # -> "Some text"
    def to_s
      @string
    end

    def value
      @string
    end

    # == DEPRECATED
    # See the rexml/formatters package
    #
    # Generates XML output of this object
    #
    # output::
    #   Where to write the string.  Defaults to $stdout
    # indent::
    #   The amount to indent this node by
    # transitive::
    #   Ignored
    # ie_hack::
    #   Ignored
    #
    # _Examples_
    #  c = CData.new( " Some text " )
    #  c.write( $stdout )     #->  <![CDATA[ Some text ]]>
    def write( output=$stdout, indent=-1, transitive=false, ie_hack=false )
      Kernel.warn( "#{self.class.name}.write is deprecated", uplevel: 1)
      indent( output, indent )
      output << START
      output << @string
      output << STOP
    end
  end
end
