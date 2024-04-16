# frozen_string_literal: false
require_relative "child"

module REXML
  ##
  # Represents an XML comment; that is, text between \<!-- ... -->
  class Comment < Child
    include Comparable
    START = "<!--"
    STOP = "-->"

    # The content text

    attr_accessor :string

    ##
    # Constructor.  The first argument can be one of three types:
    # @param first If String, the contents of this comment are set to the
    # argument.  If Comment, the argument is duplicated.  If
    # Source, the argument is scanned for a comment.
    # @param second If the first argument is a Source, this argument
    # should be nil, not supplied, or a Parent to be set as the parent
    # of this object
    def initialize( first, second = nil )
      super(second)
      if first.kind_of? String
        @string = first
      elsif first.kind_of? Comment
        @string = first.string
      end
    end

    def clone
      Comment.new self
    end

    # == DEPRECATED
    # See REXML::Formatters
    #
    # output::
    #    Where to write the string
    # indent::
    #    An integer.    If -1, no indenting will be used; otherwise, the
    #    indentation will be this number of spaces, and children will be
    #    indented an additional amount.
    # transitive::
    #    Ignored by this class. The contents of comments are never modified.
    # ie_hack::
    #    Needed for conformity to the child API, but not used by this class.
    def write( output, indent=-1, transitive=false, ie_hack=false )
      Kernel.warn("Comment.write is deprecated.  See REXML::Formatters", uplevel: 1)
      indent( output, indent )
      output << START
      output << @string
      output << STOP
    end

    alias :to_s :string

    ##
    # Compares this Comment to another; the contents of the comment are used
    # in the comparison.
    def <=>(other)
      other.to_s <=> @string
    end

    ##
    # Compares this Comment to another; the contents of the comment are used
    # in the comparison.
    def ==( other )
      other.kind_of? Comment and
      (other <=> self) == 0
    end

    def node_type
      :comment
    end
  end
end
#vim:ts=2 sw=2 noexpandtab:
