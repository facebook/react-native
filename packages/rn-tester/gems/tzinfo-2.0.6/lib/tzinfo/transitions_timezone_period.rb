# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  # Represents a period of time in a time zone where the same offset from UTC
  # applies. The period of time is bounded at at least one end, either having a
  # start transition, end transition or both start and end transitions.
  class TransitionsTimezonePeriod < TimezonePeriod
    # @return [TimezoneTransition] the transition that defines the start of this
    #   {TimezonePeriod} (`nil` if the start is unbounded).
    attr_reader :start_transition

    # @return [TimezoneTransition] the transition that defines the end of this
    #   {TimezonePeriod} (`nil` if the end is unbounded).
    attr_reader :end_transition

    # Initializes a {TransitionsTimezonePeriod}.
    #
    # At least one of `start_transition` and `end_transition` must be specified.
    #
    # @param start_transition [TimezoneTransition] the transition that defines
    #   the start of the period, or `nil` if the start is unbounded.
    # @param end_transition [TimezoneTransition] the transition that defines the
    #   end of the period, or `nil` if the end is unbounded.
    # @raise [ArgumentError] if both `start_transition` and `end_transition` are
    #   `nil`.
    def initialize(start_transition, end_transition)
      if start_transition
        super(start_transition.offset)
      elsif end_transition
        super(end_transition.previous_offset)
      else
        raise ArgumentError, 'At least one of start_transition and end_transition must be specified'
      end

      @start_transition = start_transition
      @end_transition = end_transition
    end

    # Determines if this {TransitionsTimezonePeriod} is equal to another
    # instance.
    #
    # @param p [Object] the instance to test for equality.
    # @return [Boolean] `true` if `p` is a {TransitionsTimezonePeriod} with the
    #   same {offset}, {start_transition} and {end_transition}, otherwise
    #   `false`.
    def ==(p)
      p.kind_of?(TransitionsTimezonePeriod) && start_transition == p.start_transition && end_transition == p.end_transition
    end
    alias eql? ==

    # @return [Integer] a hash based on {start_transition} and {end_transition}.
    def hash
      [@start_transition, @end_transition].hash
    end

    # @return [String] the internal object state as a programmer-readable
    #   `String`.
    def inspect
      "#<#{self.class}: @start_transition=#{@start_transition.inspect}, @end_transition=#{@end_transition.inspect}>"
    end
  end
end
