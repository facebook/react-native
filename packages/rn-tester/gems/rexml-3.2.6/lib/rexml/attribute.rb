# frozen_string_literal: true
require_relative "namespace"
require_relative 'text'

module REXML
  # Defines an Element Attribute; IE, a attribute=value pair, as in:
  # <element attribute="value"/>.  Attributes can be in their own
  # namespaces.  General users of REXML will not interact with the
  # Attribute class much.
  class Attribute
    include Node
    include Namespace

    # The element to which this attribute belongs
    attr_reader :element
    PATTERN = /\s*(#{NAME_STR})\s*=\s*(["'])(.*?)\2/um

    NEEDS_A_SECOND_CHECK = /(<|&((#{Entity::NAME});|(#0*((?:\d+)|(?:x[a-fA-F0-9]+)));)?)/um

    # Constructor.
    # FIXME: The parser doesn't catch illegal characters in attributes
    #
    # first::
    #   Either: an Attribute, which this new attribute will become a
    #   clone of; or a String, which is the name of this attribute
    # second::
    #   If +first+ is an Attribute, then this may be an Element, or nil.
    #   If nil, then the Element parent of this attribute is the parent
    #   of the +first+ Attribute.  If the first argument is a String,
    #   then this must also be a String, and is the content of the attribute.
    #   If this is the content, it must be fully normalized (contain no
    #   illegal characters).
    # parent::
    #   Ignored unless +first+ is a String; otherwise, may be the Element
    #   parent of this attribute, or nil.
    #
    #
    #  Attribute.new( attribute_to_clone )
    #  Attribute.new( attribute_to_clone, parent_element )
    #  Attribute.new( "attr", "attr_value" )
    #  Attribute.new( "attr", "attr_value", parent_element )
    def initialize( first, second=nil, parent=nil )
      @normalized = @unnormalized = @element = nil
      if first.kind_of? Attribute
        self.name = first.expanded_name
        @unnormalized = first.value
        if second.kind_of? Element
          @element = second
        else
          @element = first.element
        end
      elsif first.kind_of? String
        @element = parent
        self.name = first
        @normalized = second.to_s
      else
        raise "illegal argument #{first.class.name} to Attribute constructor"
      end
    end

    # Returns the namespace of the attribute.
    #
    #  e = Element.new( "elns:myelement" )
    #  e.add_attribute( "nsa:a", "aval" )
    #  e.add_attribute( "b", "bval" )
    #  e.attributes.get_attribute( "a" ).prefix   # -> "nsa"
    #  e.attributes.get_attribute( "b" ).prefix   # -> ""
    #  a = Attribute.new( "x", "y" )
    #  a.prefix                                   # -> ""
    def prefix
      super
    end

    # Returns the namespace URL, if defined, or nil otherwise
    #
    #  e = Element.new("el")
    #  e.add_namespace("ns", "http://url")
    #  e.add_attribute("ns:a", "b")
    #  e.add_attribute("nsx:a", "c")
    #  e.attribute("ns:a").namespace # => "http://url"
    #  e.attribute("nsx:a").namespace # => nil
    #
    # This method always returns "" for no namespace attribute. Because
    # the default namespace doesn't apply to attribute names.
    #
    # From https://www.w3.org/TR/xml-names/#uniqAttrs
    #
    # > the default namespace does not apply to attribute names
    #
    #  e = REXML::Element.new("el")
    #  e.add_namespace("", "http://example.com/")
    #  e.namespace # => "http://example.com/"
    #  e.add_attribute("a", "b")
    #  e.attribute("a").namespace # => ""
    def namespace arg=nil
      arg = prefix if arg.nil?
      if arg == ""
        ""
      else
        @element.namespace(arg)
      end
    end

    # Returns true if other is an Attribute and has the same name and value,
    # false otherwise.
    def ==( other )
      other.kind_of?(Attribute) and other.name==name and other.value==value
    end

    # Creates (and returns) a hash from both the name and value
    def hash
      name.hash + value.hash
    end

    # Returns this attribute out as XML source, expanding the name
    #
    #  a = Attribute.new( "x", "y" )
    #  a.to_string     # -> "x='y'"
    #  b = Attribute.new( "ns:x", "y" )
    #  b.to_string     # -> "ns:x='y'"
    def to_string
      value = to_s
      if @element and @element.context and @element.context[:attribute_quote] == :quote
        value = value.gsub('"', '&quot;') if value.include?('"')
        %Q^#@expanded_name="#{value}"^
      else
        value = value.gsub("'", '&apos;') if value.include?("'")
        "#@expanded_name='#{value}'"
      end
    end

    def doctype
      if @element
        doc = @element.document
        doc.doctype if doc
      end
    end

    # Returns the attribute value, with entities replaced
    def to_s
      return @normalized if @normalized

      @normalized = Text::normalize( @unnormalized, doctype )
      @normalized
    end

    # Returns the UNNORMALIZED value of this attribute.  That is, entities
    # have been expanded to their values
    def value
      return @unnormalized if @unnormalized
      @unnormalized = Text::unnormalize( @normalized, doctype )
      @unnormalized
    end

    # The normalized value of this attribute.  That is, the attribute with
    # entities intact.
    def normalized=(new_normalized)
      @normalized = new_normalized
      @unnormalized = nil
    end

    # Returns a copy of this attribute
    def clone
      Attribute.new self
    end

    # Sets the element of which this object is an attribute.  Normally, this
    # is not directly called.
    #
    # Returns this attribute
    def element=( element )
      @element = element

      if @normalized
        Text.check( @normalized, NEEDS_A_SECOND_CHECK, doctype )
      end

      self
    end

    # Removes this Attribute from the tree, and returns true if successful
    #
    # This method is usually not called directly.
    def remove
      @element.attributes.delete self.name unless @element.nil?
    end

    # Writes this attribute (EG, puts 'key="value"' to the output)
    def write( output, indent=-1 )
      output << to_string
    end

    def node_type
      :attribute
    end

    def inspect
      rv = +""
      write( rv )
      rv
    end

    def xpath
      path = @element.xpath
      path += "/@#{self.expanded_name}"
      return path
    end
  end
end
#vim:ts=2 sw=2 noexpandtab:
