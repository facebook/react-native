# frozen_string_literal: false
require_relative 'parseexception'
module REXML
  class UndefinedNamespaceException < ParseException
    def initialize( prefix, source, parser )
      super( "Undefined prefix #{prefix} found" )
    end
  end
end
