# encoding: utf-8

module CLAide
  # This class is used to represent individual arguments to present to
  # the command help banner
  #
  class Argument
    # The string used for ellipsis / repeatable arguments in the banner
    #
    ELLIPSIS = '...'

    # @return [Array<String>]
    #         List of alternate names for the parameters
    attr_reader :names

    # @return [Boolean]
    #         Indicates if the argument is required (not optional)
    #
    attr_accessor :required
    alias_method :required?, :required

    # @return [Boolean]
    #         Indicates if the argument is repeatable (= can appear multiple
    #         times in the command, which is indicated by '...' in the banner)
    #
    attr_accessor :repeatable
    alias_method :repeatable?, :repeatable

    # @param [String,Array<String>] names
    #        List of the names of each parameter alternatives.
    #        For convenience, if there is only one alternative for that
    #        parameter, we can use a String instead of a 1-item Array
    #
    # @param [Boolean] required
    #        true if the parameter is required, false if it is optional
    #
    # @param [Boolean] repeatable
    #        If true, the argument can appear multiple times in the command.
    #        In that case, an ellipsis will be appended after the argument
    #        in the help banner.
    #
    # @example
    #
    #   # A required parameter that can be either a NAME or URL
    #   Argument.new(%(NAME URL), true)
    #
    def initialize(names, required, repeatable = false)
      @names = Array(names)
      @required = required
      @repeatable = repeatable
    end

    # @return [Boolean] true on equality
    #
    # @param [Argument] other the Argument compared against
    #
    def ==(other)
      other.is_a?(Argument) &&
        names == other.names && required == other.required
    end
  end
end
