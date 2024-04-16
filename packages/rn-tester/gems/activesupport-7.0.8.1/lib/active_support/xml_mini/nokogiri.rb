# frozen_string_literal: true

begin
  require "nokogiri"
rescue LoadError => e
  $stderr.puts "You don't have nokogiri installed in your application. Please add it to your Gemfile and run bundle install"
  raise e
end
require "active_support/core_ext/object/blank"
require "stringio"

module ActiveSupport
  module XmlMini_Nokogiri # :nodoc:
    extend self

    # Parse an XML Document string or IO into a simple hash using libxml / nokogiri.
    # data::
    #   XML Document string or IO to parse
    def parse(data)
      if !data.respond_to?(:read)
        data = StringIO.new(data || "")
      end

      if data.eof?
        {}
      else
        doc = Nokogiri::XML(data)
        raise doc.errors.first if doc.errors.length > 0
        doc.to_hash
      end
    end

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
          children.each do |c|
            if c.element?
              c.to_hash(node_hash)
            elsif c.text? || c.cdata?
              node_hash[CONTENT_ROOT] ||= +""
              node_hash[CONTENT_ROOT] << c.content
            end
          end

          # Remove content node if it is blank and there are child tags
          if node_hash.length > 1 && node_hash[CONTENT_ROOT].blank?
            node_hash.delete(CONTENT_ROOT)
          end

          # Handle attributes
          attribute_nodes.each { |a| node_hash[a.node_name] = a.value }

          hash
        end
      end
    end

    Nokogiri::XML::Document.include(Conversions::Document)
    Nokogiri::XML::Node.include(Conversions::Node)
  end
end
