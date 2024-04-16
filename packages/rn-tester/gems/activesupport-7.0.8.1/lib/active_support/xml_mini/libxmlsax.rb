# frozen_string_literal: true

require "libxml"
require "active_support/core_ext/object/blank"
require "stringio"

module ActiveSupport
  module XmlMini_LibXMLSAX # :nodoc:
    extend self

    # Class that will build the hash while the XML document
    # is being parsed using SAX events.
    class HashBuilder
      include LibXML::XML::SaxParser::Callbacks

      CONTENT_KEY   = "__content__"
      HASH_SIZE_KEY = "__hash_size__"

      attr_reader :hash

      def current_hash
        @hash_stack.last
      end

      def on_start_document
        @hash = { CONTENT_KEY => +"" }
        @hash_stack = [@hash]
      end

      def on_end_document
        @hash = @hash_stack.pop
        @hash.delete(CONTENT_KEY)
      end

      def on_start_element(name, attrs = {})
        new_hash = { CONTENT_KEY => +"" }.merge!(attrs)
        new_hash[HASH_SIZE_KEY] = new_hash.size + 1

        case current_hash[name]
        when Array then current_hash[name] << new_hash
        when Hash  then current_hash[name] = [current_hash[name], new_hash]
        when nil   then current_hash[name] = new_hash
        end

        @hash_stack.push(new_hash)
      end

      def on_end_element(name)
        if current_hash.length > current_hash.delete(HASH_SIZE_KEY) && current_hash[CONTENT_KEY].blank? || current_hash[CONTENT_KEY] == ""
          current_hash.delete(CONTENT_KEY)
        end
        @hash_stack.pop
      end

      def on_characters(string)
        current_hash[CONTENT_KEY] << string
      end

      alias_method :on_cdata_block, :on_characters
    end

    attr_accessor :document_class
    self.document_class = HashBuilder

    def parse(data)
      if !data.respond_to?(:read)
        data = StringIO.new(data || "")
      end

      if data.eof?
        {}
      else
        LibXML::XML::Error.set_handler(&LibXML::XML::Error::QUIET_HANDLER)
        parser = LibXML::XML::SaxParser.io(data)
        document = document_class.new

        parser.callbacks = document
        parser.parse
        document.hash
      end
    end
  end
end
