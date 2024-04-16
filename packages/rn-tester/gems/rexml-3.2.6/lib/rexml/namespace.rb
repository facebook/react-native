# frozen_string_literal: true

require_relative 'xmltokens'

module REXML
  # Adds named attributes to an object.
  module Namespace
    # The name of the object, valid if set
    attr_reader :name, :expanded_name
    # The expanded name of the object, valid if name is set
    attr_accessor :prefix
    include XMLTokens
    NAME_WITHOUT_NAMESPACE = /\A#{NCNAME_STR}\z/
    NAMESPLIT = /^(?:(#{NCNAME_STR}):)?(#{NCNAME_STR})/u

    # Sets the name and the expanded name
    def name=( name )
      @expanded_name = name
      if name.match?(NAME_WITHOUT_NAMESPACE)
        @prefix = ""
        @namespace = ""
        @name = name
      elsif name =~ NAMESPLIT
        if $1
          @prefix = $1
        else
          @prefix = ""
          @namespace = ""
        end
        @name = $2
      elsif name == ""
        @prefix = nil
        @namespace = nil
        @name = nil
      else
        message = "name must be \#{PREFIX}:\#{LOCAL_NAME} or \#{LOCAL_NAME}: "
        message += "<#{name.inspect}>"
        raise ArgumentError, message
      end
    end

    # Compares names optionally WITH namespaces
    def has_name?( other, ns=nil )
      if ns
        return (namespace() == ns and name() == other)
      elsif other.include? ":"
        return fully_expanded_name == other
      else
        return name == other
      end
    end

    alias :local_name :name

    # Fully expand the name, even if the prefix wasn't specified in the
    # source file.
    def fully_expanded_name
      ns = prefix
      return "#{ns}:#@name" if ns.size > 0
      return @name
    end
  end
end
