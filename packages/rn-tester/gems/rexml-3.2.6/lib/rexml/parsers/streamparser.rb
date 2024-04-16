# frozen_string_literal: false
require_relative "baseparser"

module REXML
  module Parsers
    class StreamParser
      def initialize source, listener
        @listener = listener
        @parser = BaseParser.new( source )
        @tag_stack = []
      end

      def add_listener( listener )
        @parser.add_listener( listener )
      end

      def parse
        # entity string
        while true
          event = @parser.pull
          case event[0]
          when :end_document
            unless @tag_stack.empty?
              tag_path = "/" + @tag_stack.join("/")
              raise ParseException.new("Missing end tag for '#{tag_path}'",
                                       @parser.source)
            end
            return
          when :start_element
            @tag_stack << event[1]
            attrs = event[2].each do |n, v|
              event[2][n] = @parser.unnormalize( v )
            end
            @listener.tag_start( event[1], attrs )
          when :end_element
            @listener.tag_end( event[1] )
            @tag_stack.pop
          when :text
            normalized = @parser.unnormalize( event[1] )
            @listener.text( normalized )
          when :processing_instruction
            @listener.instruction( *event[1,2] )
          when :start_doctype
            @listener.doctype( *event[1..-1] )
          when :end_doctype
            # FIXME: remove this condition for milestone:3.2
            @listener.doctype_end if @listener.respond_to? :doctype_end
          when :comment, :attlistdecl, :cdata, :xmldecl, :elementdecl
            @listener.send( event[0].to_s, *event[1..-1] )
          when :entitydecl, :notationdecl
            @listener.send( event[0].to_s, event[1..-1] )
          when :externalentity
            entity_reference = event[1]
            content = entity_reference.gsub(/\A%|;\z/, "")
            @listener.entity(content)
          end
        end
      end
    end
  end
end
