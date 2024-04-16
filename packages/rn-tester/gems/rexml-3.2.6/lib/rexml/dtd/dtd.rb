# frozen_string_literal: false
require_relative "elementdecl"
require_relative "entitydecl"
require_relative "../comment"
require_relative "notationdecl"
require_relative "attlistdecl"
require_relative "../parent"

module REXML
  module DTD
    class Parser
      def Parser.parse( input )
        case input
        when String
          parse_helper input
        when File
          parse_helper input.read
        end
      end

      # Takes a String and parses it out
      def Parser.parse_helper( input )
        contents = Parent.new
        while input.size > 0
          case input
          when ElementDecl.PATTERN_RE
            match = $&
            contents << ElementDecl.new( match )
          when AttlistDecl.PATTERN_RE
            matchdata = $~
            contents << AttlistDecl.new( matchdata )
          when EntityDecl.PATTERN_RE
            matchdata = $~
            contents << EntityDecl.new( matchdata )
          when Comment.PATTERN_RE
            matchdata = $~
            contents << Comment.new( matchdata )
          when NotationDecl.PATTERN_RE
            matchdata = $~
            contents << NotationDecl.new( matchdata )
          end
        end
        contents
      end
    end
  end
end
