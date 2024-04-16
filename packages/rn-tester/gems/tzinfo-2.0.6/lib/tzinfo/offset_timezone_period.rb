# encoding: UTF-8

module TZInfo
  # Represents the infinite period of time in a time zone that constantly
  # observes the same offset from UTC (has an unbounded start and end).
  class OffsetTimezonePeriod < TimezonePeriod
    # Initializes an {OffsetTimezonePeriod}.
    #
    # @param offset [TimezoneOffset] the offset that is constantly observed.
    # @raise [ArgumentError] if `offset` is `nil`.
    def initialize(offset)
      super
    end

    # @return [TimezoneTransition] the transition that defines the start of this
    #   {TimezonePeriod}, always `nil` for {OffsetTimezonePeriod}.
    def start_transition
      nil
    end

    # @return [TimezoneTransition] the transition that defines the end of this
    #   {TimezonePeriod}, always `nil` for {OffsetTimezonePeriod}.
    def end_transition
      nil
    end

    # Determines if this {OffsetTimezonePeriod} is equal to another instance.
    #
    # @param p [Object] the instance to test for equality.
    # @return [Boolean] `true` if `p` is a {OffsetTimezonePeriod} with the same
    #   {offset}, otherwise `false`.
    def ==(p)
      p.kind_of?(OffsetTimezonePeriod) && offset == p.offset
    end
    alias eql? ==

    # @return [Integer] a hash based on {offset}.
    def hash
      offset.hash
    end
  end
end
