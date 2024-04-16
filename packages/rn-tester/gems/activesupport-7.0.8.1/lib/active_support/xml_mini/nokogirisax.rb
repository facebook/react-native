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
  module XmlMini_NokogiriSAX # :nodoc:
    extend self

    # Class that will build the hash while the XML document
    # is being parsed using SAX events.
    class HashBuilder < Nokogiri::XML::SAX::Document
      CONTENT_KEY   = "__content__"
      HASH_SIZE_KEY = "__hash_size__"

      attr_reader :hash

      def current_hash
        @hash_stack.last
      end

      def start_document
        @hash = {}
        @hash_stack = [@hash]
      end

      def end_document
        raise "Parse stack not empty!" if @hash_stack.size > 1
      end

      def error(error_message)
        raise error_message
      end

      def start_element(name, attrs = [])
        new_hash = { CONTENT_KEY => +"" }.merge!(Hash[attrs])
        new_hash[HASH_SIZE_KEY] = new_hash.size + 1

        case current_hash[name]
        when Array then current_hash[name] << new_hash
        when Hash  then current_hash[name] = [current_hash[name], new_hash]
        when nil   then current_hash[name] = new_hash
        end

        @hash_stack.push(new_hash)
      end

      def end_element(name)
        if current_hash.length > current_hash.delete(HASH_SIZE_KEY) && current_hash[CONTENT_KEY].blank? || current_hash[CONTENT_KEY] == ""
          current_hash.delete(CONTENT_KEY)
        end
        @hash_stack.pop
      end

      def characters(string)
        current_hash[CONTENT_KEY] << string
      end

      alias_method :cdata_block, :characters
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
        document = document_class.new
        parser = Nokogiri::XML::SAX::Parser.new(document)
        parser.parse(data)
        document.hash
      end
    end
  end
end
