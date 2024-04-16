# frozen_string_literal: false

require_relative "child"
require_relative "source"

module REXML
  # Represents an XML Instruction; IE, <? ... ?>
  # TODO: Add parent arg (3rd arg) to constructor
  class Instruction < Child
    START = "<?"
    STOP = "?>"

    # target is the "name" of the Instruction; IE, the "tag" in <?tag ...?>
    # content is everything else.
    attr_accessor :target, :content

    # Constructs a new Instruction
    # @param target can be one of a number of things.  If String, then
    # the target of this instruction is set to this.  If an Instruction,
    # then the Instruction is shallowly cloned (target and content are
    # copied).
    # @param content Must be either a String, or a Parent.  Can only
    # be a Parent if the target argument is a Source.  Otherwise, this
    # String is set as the content of this instruction.
    def initialize(target, content=nil)
      case target
      when String
        super()
        @target = target
        @content = content
      when Instruction
        super(content)
        @target = target.target
        @content = target.content
      else
        message =
          "processing instruction target must be String or REXML::Instruction: "
        message << "<#{target.inspect}>"
        raise ArgumentError, message
      end
      @content.strip! if @content
    end

    def clone
      Instruction.new self
    end

    # == DEPRECATED
    # See the rexml/formatters package
    #
    def write writer, indent=-1, transitive=false, ie_hack=false
      Kernel.warn( "#{self.class.name}.write is deprecated", uplevel: 1)
      indent(writer, indent)
      writer << START
      writer << @target
      if @content
        writer << ' '
        writer << @content
      end
      writer << STOP
    end

    # @return true if other is an Instruction, and the content and target
    # of the other matches the target and content of this object.
    def ==( other )
      other.kind_of? Instruction and
      other.target == @target and
      other.content == @content
    end

    def node_type
      :processing_instruction
    end

    def inspect
      "<?p-i #{target} ...?>"
    end
  end
end
