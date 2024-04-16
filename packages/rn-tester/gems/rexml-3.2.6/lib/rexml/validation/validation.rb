# frozen_string_literal: false
require_relative 'validationexception'

module REXML
  module Validation
    module Validator
      NILEVENT = [ nil ]
      def reset
        @current = @root
        @root.reset
        @root.previous = true
        @attr_stack = []
        self
      end
      def dump
        puts @root.inspect
      end
      def validate( event )
        @attr_stack = [] unless defined? @attr_stack
        match = @current.next(event)
        raise ValidationException.new( "Validation error.  Expected: "+
          @current.expected.join( " or " )+" from #{@current.inspect} "+
          " but got #{Event.new( event[0], event[1] ).inspect}" ) unless match
        @current = match

        # Check for attributes
        case event[0]
        when :start_element
          @attr_stack << event[2]
          begin
            sattr = [:start_attribute, nil]
            eattr = [:end_attribute]
            text = [:text, nil]
            k, = event[2].find { |key,value|
              sattr[1] = key
              m = @current.next( sattr )
              if m
                # If the state has text children...
                if m.matches?( eattr )
                  @current = m
                else
                  text[1] = value
                  m = m.next( text )
                  text[1] = nil
                  return false unless m
                  @current = m if m
                end
                m = @current.next( eattr )
                if m
                  @current = m
                  true
                else
                  false
                end
              else
                false
              end
            }
            event[2].delete(k) if k
          end while k
        when :end_element
          attrs = @attr_stack.pop
          raise ValidationException.new( "Validation error.  Illegal "+
            " attributes: #{attrs.inspect}") if attrs.length > 0
        end
      end
    end

    class Event
      def initialize(event_type, event_arg=nil )
        @event_type = event_type
        @event_arg = event_arg
      end

      attr_reader :event_type
      attr_accessor :event_arg

      def done?
        @done
      end

      def single?
        return (@event_type != :start_element and @event_type != :start_attribute)
      end

      def matches?( event )
        return false unless event[0] == @event_type
        case event[0]
        when nil
          return true
        when :start_element
          return true if event[1] == @event_arg
        when :end_element
          return true
        when :start_attribute
          return true if event[1] == @event_arg
        when :end_attribute
          return true
        when :end_document
          return true
        when :text
          return (@event_arg.nil? or @event_arg == event[1])
=begin
        when :processing_instruction
          false
        when :xmldecl
          false
        when :start_doctype
          false
        when :end_doctype
          false
        when :externalentity
          false
        when :elementdecl
          false
        when :entity
          false
        when :attlistdecl
          false
        when :notationdecl
          false
        when :end_doctype
          false
=end
        else
          false
        end
      end

      def ==( other )
        return false unless other.kind_of? Event
        @event_type == other.event_type and @event_arg == other.event_arg
      end

      def to_s
        inspect
      end

      def inspect
        "#{@event_type.inspect}( #@event_arg )"
      end
    end
  end
end
