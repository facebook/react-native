# frozen_string_literal: false
require_relative "validation"
require_relative "../parsers/baseparser"

module REXML
  module Validation
    # Implemented:
    # * empty
    # * element
    # * attribute
    # * text
    # * optional
    # * choice
    # * oneOrMore
    # * zeroOrMore
    # * group
    # * value
    # * interleave
    # * mixed
    # * ref
    # * grammar
    # * start
    # * define
    #
    # Not implemented:
    # * data
    # * param
    # * include
    # * externalRef
    # * notAllowed
    # * anyName
    # * nsName
    # * except
    # * name
    class RelaxNG
      include Validator

      INFINITY = 1.0 / 0.0
      EMPTY = Event.new( nil )
      TEXT = [:start_element, "text"]
      attr_accessor :current
      attr_accessor :count
      attr_reader :references

      # FIXME: Namespaces
      def initialize source
        parser = REXML::Parsers::BaseParser.new( source )

        @count = 0
        @references = {}
        @root = @current = Sequence.new(self)
        @root.previous = true
        states = [ @current ]
        begin
          event = parser.pull
          case event[0]
          when :start_element
            case event[1]
            when "empty"
            when "element", "attribute", "text", "value"
              states[-1] << event
            when "optional"
              states << Optional.new( self )
              states[-2] << states[-1]
            when "choice"
              states << Choice.new( self )
              states[-2] << states[-1]
            when "oneOrMore"
              states << OneOrMore.new( self )
              states[-2] << states[-1]
            when "zeroOrMore"
              states << ZeroOrMore.new( self )
              states[-2] << states[-1]
            when "group"
              states << Sequence.new( self )
              states[-2] << states[-1]
            when "interleave"
              states << Interleave.new( self )
              states[-2] << states[-1]
            when "mixed"
              states << Interleave.new( self )
              states[-2] << states[-1]
              states[-1] << TEXT
            when "define"
              states << [ event[2]["name"] ]
            when "ref"
              states[-1] << Ref.new( event[2]["name"] )
            when "anyName"
              states << AnyName.new( self )
              states[-2] << states[-1]
            when "nsName"
            when "except"
            when "name"
            when "data"
            when "param"
            when "include"
            when "grammar"
            when "start"
            when "externalRef"
            when "notAllowed"
            end
          when :end_element
            case event[1]
            when "element", "attribute"
              states[-1] << event
            when "zeroOrMore", "oneOrMore", "choice", "optional",
              "interleave", "group", "mixed"
              states.pop
            when "define"
              ref = states.pop
              @references[ ref.shift ] = ref
            #when "empty"
            end
          when :end_document
            states[-1] << event
          when :text
            states[-1] << event
          end
        end while event[0] != :end_document
      end

      def receive event
        validate( event )
      end
    end

    class State
      def initialize( context )
        @previous = []
        @events = []
        @current = 0
        @count = context.count += 1
        @references = context.references
        @value = false
      end

      def reset
        return if @current == 0
        @current = 0
        @events.each {|s| s.reset if s.kind_of? State }
      end

      def previous=( previous )
        @previous << previous
      end

      def next( event )
        #print "In next with #{event.inspect}.  "
        #p @previous
        return @previous.pop.next( event ) if @events[@current].nil?
        expand_ref_in( @events, @current ) if @events[@current].class == Ref
        if ( @events[@current].kind_of? State )
          @current += 1
          @events[@current-1].previous = self
          return @events[@current-1].next( event )
        end
        if ( @events[@current].matches?(event) )
          @current += 1
          if @events[@current].nil?
            return @previous.pop
          elsif @events[@current].kind_of? State
            @current += 1
            @events[@current-1].previous = self
            return @events[@current-1]
          else
            return self
          end
        else
          return nil
        end
      end

      def to_s
        # Abbreviated:
        self.class.name =~ /(?:::)(\w)\w+$/
        # Full:
        #self.class.name =~ /(?:::)(\w+)$/
        "#$1.#@count"
      end

      def inspect
        "< #{to_s} #{@events.collect{|e|
          pre = e == @events[@current] ? '#' : ''
          pre + e.inspect unless self == e
        }.join(', ')} >"
      end

      def expected
        return [@events[@current]]
      end

      def <<( event )
        add_event_to_arry( @events, event )
      end


      protected
      def expand_ref_in( arry, ind )
        new_events = []
        @references[ arry[ind].to_s ].each{ |evt|
          add_event_to_arry(new_events,evt)
        }
        arry[ind,1] = new_events
      end

      def add_event_to_arry( arry, evt )
        evt = generate_event( evt )
        if evt.kind_of? String
          arry[-1].event_arg = evt if arry[-1].kind_of? Event and @value
          @value = false
        else
          arry << evt
        end
      end

      def generate_event( event )
        return event if event.kind_of? State or event.class == Ref
        evt = nil
        arg = nil
        case event[0]
        when :start_element
          case event[1]
          when "element"
            evt = :start_element
            arg = event[2]["name"]
          when "attribute"
            evt = :start_attribute
            arg = event[2]["name"]
          when "text"
            evt = :text
          when "value"
            evt = :text
            @value = true
          end
        when :text
          return event[1]
        when :end_document
          return Event.new( event[0] )
        else # then :end_element
          case event[1]
          when "element"
            evt = :end_element
          when "attribute"
            evt = :end_attribute
          end
        end
        return Event.new( evt, arg )
      end
    end


    class Sequence < State
      def matches?(event)
        @events[@current].matches?( event )
      end
    end


    class Optional < State
      def next( event )
        if @current == 0
          rv = super
          return rv if rv
          @prior = @previous.pop
          return @prior.next( event )
        end
        super
      end

      def matches?(event)
        @events[@current].matches?(event) ||
        (@current == 0 and @previous[-1].matches?(event))
      end

      def expected
        return [ @prior.expected, @events[0] ].flatten if @current == 0
        return [@events[@current]]
      end
    end


    class ZeroOrMore < Optional
      def next( event )
        expand_ref_in( @events, @current ) if @events[@current].class == Ref
        if ( @events[@current].matches?(event) )
          @current += 1
          if @events[@current].nil?
            @current = 0
            return self
          elsif @events[@current].kind_of? State
            @current += 1
            @events[@current-1].previous = self
            return @events[@current-1]
          else
            return self
          end
        else
          @prior = @previous.pop
          return @prior.next( event ) if @current == 0
          return nil
        end
      end

      def expected
        return [ @prior.expected, @events[0] ].flatten if @current == 0
        return [@events[@current]]
      end
    end


    class OneOrMore < State
      def initialize context
        super
        @ord = 0
      end

      def reset
        super
        @ord = 0
      end

      def next( event )
        expand_ref_in( @events, @current ) if @events[@current].class == Ref
        if ( @events[@current].matches?(event) )
          @current += 1
          @ord += 1
          if @events[@current].nil?
            @current = 0
            return self
          elsif @events[@current].kind_of? State
            @current += 1
            @events[@current-1].previous = self
            return @events[@current-1]
          else
            return self
          end
        else
          return @previous.pop.next( event ) if @current == 0 and @ord > 0
          return nil
        end
      end

      def matches?( event )
        @events[@current].matches?(event) ||
        (@current == 0 and @ord > 0 and @previous[-1].matches?(event))
      end

      def expected
        if @current == 0 and @ord > 0
          return [@previous[-1].expected, @events[0]].flatten
        else
          return [@events[@current]]
        end
      end
    end


    class Choice < State
      def initialize context
        super
        @choices = []
      end

      def reset
        super
        @events = []
        @choices.each { |c| c.each { |s| s.reset if s.kind_of? State } }
      end

      def <<( event )
        add_event_to_arry( @choices, event )
      end

      def next( event )
        # Make the choice if we haven't
        if @events.size == 0
          c = 0 ; max = @choices.size
          while c < max
            if @choices[c][0].class == Ref
              expand_ref_in( @choices[c], 0 )
              @choices += @choices[c]
              @choices.delete( @choices[c] )
              max -= 1
            else
              c += 1
            end
          end
          @events = @choices.find { |evt| evt[0].matches? event }
          # Remove the references
          # Find the events
        end
        unless @events
          @events = []
          return nil
        end
        super
      end

      def matches?( event )
        return @events[@current].matches?( event ) if @events.size > 0
        !@choices.find{|evt| evt[0].matches?(event)}.nil?
      end

      def expected
        return [@events[@current]] if @events.size > 0
        return @choices.collect do |x|
          if x[0].kind_of? State
            x[0].expected
          else
            x[0]
          end
        end.flatten
      end

      def inspect
        "< #{to_s} #{@choices.collect{|e| e.collect{|f|f.to_s}.join(', ')}.join(' or ')} >"
      end

      protected
      def add_event_to_arry( arry, evt )
        if evt.kind_of? State or evt.class == Ref
          arry << [evt]
        elsif evt[0] == :text
         if arry[-1] and
            arry[-1][-1].kind_of?( Event ) and
            arry[-1][-1].event_type == :text and @value

            arry[-1][-1].event_arg = evt[1]
            @value = false
         end
        else
          arry << [] if evt[0] == :start_element
          arry[-1] << generate_event( evt )
        end
      end
    end


    class Interleave < Choice
      def initialize context
        super
        @choice = 0
      end

      def reset
        @choice = 0
      end

      def next_current( event )
        # Expand references
        c = 0 ; max = @choices.size
        while c < max
          if @choices[c][0].class == Ref
            expand_ref_in( @choices[c], 0 )
            @choices += @choices[c]
            @choices.delete( @choices[c] )
            max -= 1
          else
            c += 1
          end
        end
        @events = @choices[@choice..-1].find { |evt| evt[0].matches? event }
        @current = 0
        if @events
          # reorder the choices
          old = @choices[@choice]
          idx = @choices.index( @events )
          @choices[@choice] = @events
          @choices[idx] = old
          @choice += 1
        end

        @events = [] unless @events
      end


      def next( event )
        # Find the next series
        next_current(event) unless @events[@current]
        return nil unless @events[@current]

        expand_ref_in( @events, @current ) if @events[@current].class == Ref
        if ( @events[@current].kind_of? State )
          @current += 1
          @events[@current-1].previous = self
          return @events[@current-1].next( event )
        end
        return @previous.pop.next( event ) if @events[@current].nil?
        if ( @events[@current].matches?(event) )
          @current += 1
          if @events[@current].nil?
            return self unless @choices[@choice].nil?
            return @previous.pop
          elsif @events[@current].kind_of? State
            @current += 1
            @events[@current-1].previous = self
            return @events[@current-1]
          else
            return self
          end
        else
          return nil
        end
      end

      def matches?( event )
        return @events[@current].matches?( event ) if @events[@current]
        !@choices[@choice..-1].find{|evt| evt[0].matches?(event)}.nil?
      end

      def expected
        return [@events[@current]] if @events[@current]
        return @choices[@choice..-1].collect do |x|
          if x[0].kind_of? State
            x[0].expected
          else
            x[0]
          end
        end.flatten
      end

      def inspect
        "< #{to_s} #{@choices.collect{|e| e.collect{|f|f.to_s}.join(', ')}.join(' and ')} >"
      end
    end

    class Ref
      def initialize value
        @value = value
      end
      def to_s
        @value
      end
      def inspect
        "{#{to_s}}"
      end
    end
  end
end
