# frozen_string_literal: true

require "libxml"
require "active_support/core_ext/object/blank"
require "stringio"

module ActiveSupport
  module XmlMini_LibXML # :nodoc:
    extend self

    # Parse an XML Document string or IO into a simple hash using libxml.
    # data::
    #   XML Document string or IO to parse
    def parse(data)
      if !data.respond_to?(:read)
        data = StringIO.new(data || "")
      end

      if data.eof?
        {}
      else
        LibXML::XML::Parser.io(data).parse.to_hash
      end
    end
  end
end

module LibXML # :nodoc:
  module Conversions # :nodoc:
    module Document # :nodoc:
      def to_hash
        root.to_hash
      end
    end

    module Node # :nodoc:
      CONTENT_ROOT = "__content__"

      # Convert XML document to hash.
      #
      # hash::
      #   Hash to merge the converted element into.
      def to_hash(hash = {})
        node_hash = {}

        # Insert node hash into parent hash correctly.
        case hash[name]
        when Array then hash[name] << node_hash
        when Hash  then hash[name] = [hash[name], node_hash]
        when nil   then hash[name] = node_hash
        end

        # Handle child elements
        each_child do |c|
          if c.element?
            c.to_hash(node_hash)
          elsif c.text? || c.cdata?
            node_hash[CONTENT_ROOT] ||= +""
            node_hash[CONTENT_ROOT] << c.content
          end
        end

        # Remove content node if it is blank
        if node_hash.length > 1 && node_hash[CONTENT_ROOT].blank?
          node_hash.delete(CONTENT_ROOT)
        end

        # Handle attributes
        each_attr { |a| node_hash[a.name] = a.value }

        hash
      end
    end
  end
end

# :enddoc:

LibXML::XML::Document.include(LibXML::Conversions::Document)
LibXML::XML::Node.include(LibXML::Conversions::Node)
