# frozen_string_literal: false
require_relative "../child"
module REXML
  module DTD
    class EntityDecl < Child
      START = "<!ENTITY"
      START_RE = /^\s*#{START}/um
      PUBLIC = /^\s*#{START}\s+(?:%\s+)?(\w+)\s+PUBLIC\s+((["']).*?\3)\s+((["']).*?\5)\s*>/um
      SYSTEM = /^\s*#{START}\s+(?:%\s+)?(\w+)\s+SYSTEM\s+((["']).*?\3)(?:\s+NDATA\s+\w+)?\s*>/um
      PLAIN = /^\s*#{START}\s+(\w+)\s+((["']).*?\3)\s*>/um
      PERCENT = /^\s*#{START}\s+%\s+(\w+)\s+((["']).*?\3)\s*>/um
      # <!ENTITY name SYSTEM "...">
      # <!ENTITY name "...">
      def initialize src
        super()
        md = nil
        if src.match( PUBLIC )
          md = src.match( PUBLIC, true )
          @middle = "PUBLIC"
          @content = "#{md[2]} #{md[4]}"
        elsif src.match( SYSTEM )
          md = src.match( SYSTEM, true )
          @middle = "SYSTEM"
          @content = md[2]
        elsif src.match( PLAIN )
          md = src.match( PLAIN, true )
          @middle = ""
          @content = md[2]
        elsif src.match( PERCENT )
          md = src.match( PERCENT, true )
          @middle = ""
          @content = md[2]
        end
        raise ParseException.new("failed Entity match", src) if md.nil?
        @name = md[1]
      end

      def to_s
        rv = "<!ENTITY #@name "
        rv << "#@middle " if @middle.size > 0
        rv << @content
        rv
      end

      def write( output, indent )
        indent( output, indent )
        output << to_s
      end

      def EntityDecl.parse_source source, listener
        md = source.match( PATTERN_RE, true )
        thing = md[0].squeeze(" \t\n\r")
        listener.send inspect.downcase, thing
      end
    end
  end
end
