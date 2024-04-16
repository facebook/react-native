# frozen_string_literal: false
require_relative 'streamparser'
require_relative 'baseparser'
require_relative '../light/node'

module REXML
  module Parsers
    class LightParser
      def initialize stream
        @stream = stream
        @parser = REXML::Parsers::BaseParser.new( stream )
      end

      def add_listener( listener )
        @parser.add_listener( listener )
      end

      def rewind
        @stream.rewind
        @parser.stream = @stream
      end

      def parse
        root = context = [ :document ]
        while true
          event = @parser.pull
          case event[0]
          when :end_document
            break
          when :start_element, :start_doctype
            new_node = event
            context << new_node
            new_node[1,0] = [context]
            context = new_node
          when :end_element, :end_doctype
            context = context[1]
          else
            new_node = event
            context << new_node
            new_node[1,0] = [context]
          end
        end
        root
      end
    end

    # An element is an array.  The array contains:
    #  0                        The parent element
    #  1                        The tag name
    #  2                        A hash of attributes
    #  3..-1    The child elements
    # An element is an array of size > 3
    # Text is a String
    # PIs are [ :processing_instruction, target, data ]
    # Comments are [ :comment, data ]
    # DocTypes are DocType structs
    # The root is an array with XMLDecls, Text, DocType, Array, Text
  end
end
