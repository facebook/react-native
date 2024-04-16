# frozen_string_literal: false
require_relative "../child"
module REXML
  module DTD
    class NotationDecl < Child
      START = "<!NOTATION"
      START_RE = /^\s*#{START}/um
      PUBLIC = /^\s*#{START}\s+(\w[\w-]*)\s+(PUBLIC)\s+((["']).*?\4)\s*>/um
      SYSTEM = /^\s*#{START}\s+(\w[\w-]*)\s+(SYSTEM)\s+((["']).*?\4)\s*>/um
      def initialize src
        super()
        if src.match( PUBLIC )
          md = src.match( PUBLIC, true )
        elsif src.match( SYSTEM )
          md = src.match( SYSTEM, true )
        else
          raise ParseException.new( "error parsing notation: no matching pattern", src )
        end
        @name = md[1]
        @middle = md[2]
        @rest = md[3]
      end

      def to_s
        "<!NOTATION #@name #@middle #@rest>"
      end

      def write( output, indent )
        indent( output, indent )
        output << to_s
      end

      def NotationDecl.parse_source source, listener
        md = source.match( PATTERN_RE, true )
        thing = md[0].squeeze(" \t\n\r")
        listener.send inspect.downcase, thing
      end
    end
  end
end
