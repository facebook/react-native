# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  # A set of rules that define when transitions occur in time zones with
  # annually occurring daylight savings time.
  #
  # @private
  class AnnualRules #:nodoc:
    # @return [TimezoneOffset] the standard offset that applies when daylight
    #   savings time is not in force.
    attr_reader :std_offset

    # @return [TimezoneOffset] the offset that applies when daylight savings
    #   time is in force.
    attr_reader :dst_offset

    # @return [TransitionRule] the rule that determines when daylight savings
    #   time starts.
    attr_reader :dst_start_rule

    # @return [TransitionRule] the rule that determines when daylight savings
    #   time ends.
    attr_reader :dst_end_rule

    # Initializes a new {AnnualRules} instance.
    #
    # @param std_offset [TimezoneOffset] the standard offset that applies when
    #   daylight savings time is not in force.
    # @param dst_offset [TimezoneOffset] the offset that applies when daylight
    #   savings time is in force.
    # @param dst_start_rule [TransitionRule] the rule that determines when
    #   daylight savings time starts.
    # @param dst_end_rule [TransitionRule] the rule that determines when daylight
    #   savings time ends.
    def initialize(std_offset, dst_offset, dst_start_rule, dst_end_rule)
      @std_offset = std_offset
      @dst_offset = dst_offset
      @dst_start_rule = dst_start_rule
      @dst_end_rule = dst_end_rule
    end

    # Returns the transitions between standard and daylight savings time for a
    # given year. The results are ordered by time of occurrence (earliest to
    # latest).
    #
    # @param year [Integer] the year to calculate transitions for.
    # @return [Array<TimezoneTransition>] the transitions for the year.
    def transitions(year)
      start_dst = apply_rule(@dst_start_rule, @std_offset, @dst_offset, year)
      end_dst = apply_rule(@dst_end_rule, @dst_offset, @std_offset, year)

      end_dst.timestamp_value < start_dst.timestamp_value ? [end_dst, start_dst] : [start_dst, end_dst]
    end

    private

    # Applies a given rule between offsets on a year.
    #
    # @param rule [TransitionRule] the rule to apply.
    # @param from_offset [TimezoneOffset] the offset the rule transitions from.
    # @param to_offset [TimezoneOffset] the offset the rule transitions to.
    # @param year [Integer] the year when the transition occurs.
    # @return [TimezoneTransition] the transition determined by the rule.
    def apply_rule(rule, from_offset, to_offset, year)
      at = rule.at(from_offset, year)
      TimezoneTransition.new(to_offset, from_offset, at.value)
    end
  end
  private_constant :AnnualRules
end
