# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  module DataSources
    # Represents a data time zone defined by a list of transitions that change
    # the locally observed time.
    class TransitionsDataTimezoneInfo < DataTimezoneInfo
      # @return [Array<TimezoneTransition>] the transitions that define this
      #   time zone in order of ascending timestamp.
      attr_reader :transitions

      # Initializes a new {TransitionsDataTimezoneInfo}.
      #
      # The passed in `identifier` instance will be frozen. A reference to the
      # passed in `Array` will be retained.
      #
      # The `transitions` `Array` must be sorted in order of ascending
      # timestamp. Each transition must have a
      # {TimezoneTransition#timestamp_value timestamp_value} that is greater
      # than the {TimezoneTransition#timestamp_value timestamp_value} of the
      # prior transition.
      #
      # @param identifier [String] the identifier of the time zone.
      # @param transitions [Array<TimezoneTransitions>] an `Array` of
      #   transitions that each indicate when a change occurs in the locally
      #   observed time.
      # @raise [ArgumentError] if `identifier` is `nil`.
      # @raise [ArgumentError] if `transitions` is `nil`.
      # @raise [ArgumentError] if `transitions` is an empty `Array`.
      def initialize(identifier, transitions)
        super(identifier)
        raise ArgumentError, 'transitions must be specified' unless transitions
        raise ArgumentError, 'transitions must not be an empty Array' if transitions.empty?
        @transitions = transitions.freeze
      end

      # (see DataTimezoneInfo#period_for)
      def period_for(timestamp)
        raise ArgumentError, 'timestamp must be specified' unless timestamp
        raise ArgumentError, 'timestamp must have a specified utc_offset' unless timestamp.utc_offset

        timestamp_value = timestamp.value

        index = find_minimum_transition {|t| t.timestamp_value >= timestamp_value }

        if index
          transition = @transitions[index]

          if transition.timestamp_value == timestamp_value
            # timestamp occurs within the second of the found transition, so is
            # the transition that starts the period.
            start_transition = transition
            end_transition = @transitions[index + 1]
          else
            # timestamp occurs before the second of the found transition, so is
            # the transition that ends the period.
            start_transition = index == 0 ? nil : @transitions[index - 1]
            end_transition = transition
          end
        else
          start_transition = @transitions.last
          end_transition = nil
        end

        TransitionsTimezonePeriod.new(start_transition, end_transition)
      end

      # (see DataTimezoneInfo#periods_for_local)
      def periods_for_local(local_timestamp)
        raise ArgumentError, 'local_timestamp must be specified' unless local_timestamp
        raise ArgumentError, 'local_timestamp must have an unspecified utc_offset' if local_timestamp.utc_offset

        local_timestamp_value = local_timestamp.value
        latest_possible_utc_value = local_timestamp_value + 86400
        earliest_possible_utc_value = local_timestamp_value - 86400

        # Find the index of the first transition that occurs after a latest
        # possible UTC representation of the local timestamp and then search
        # backwards until an earliest possible UTC representation.

        index = find_minimum_transition {|t| t.timestamp_value >= latest_possible_utc_value }

        # No transitions after latest_possible_utc_value, set to max index + 1
        # to search backwards including the period after the last transition
        index = @transitions.length unless index

        result = []

        index.downto(0) do |i|
          start_transition = i > 0 ? @transitions[i - 1] : nil
          end_transition = @transitions[i]
          offset = start_transition ? start_transition.offset : end_transition.previous_offset
          utc_timestamp_value = local_timestamp_value - offset.observed_utc_offset

          # It is not necessary to compare the sub-seconds because a timestamp
          # is in the period if is >= the start transition (sub-seconds would
          # make == become >) and if it is < the end transition (which
          # sub-seconds cannot affect).
          if (!start_transition || utc_timestamp_value >= start_transition.timestamp_value) && (!end_transition || utc_timestamp_value < end_transition.timestamp_value)
            result << TransitionsTimezonePeriod.new(start_transition, end_transition)
          elsif end_transition && end_transition.timestamp_value < earliest_possible_utc_value
            break
          end
        end

        result.reverse!
      end

      # (see DataTimezoneInfo#transitions_up_to)
      def transitions_up_to(to_timestamp, from_timestamp = nil)
        raise ArgumentError, 'to_timestamp must be specified' unless to_timestamp
        raise ArgumentError, 'to_timestamp must have a specified utc_offset' unless to_timestamp.utc_offset

        if from_timestamp
          raise ArgumentError, 'from_timestamp must have a specified utc_offset' unless from_timestamp.utc_offset
          raise ArgumentError, 'to_timestamp must be greater than from_timestamp' if to_timestamp <= from_timestamp
        end

        if from_timestamp
          from_index = find_minimum_transition {|t| transition_on_or_after_timestamp?(t, from_timestamp) }
          return [] unless from_index
        else
          from_index = 0
        end

        to_index = find_minimum_transition {|t| transition_on_or_after_timestamp?(t, to_timestamp) }

        if to_index
          return [] if to_index < 1
          to_index -= 1
        else
          to_index = -1
        end

        @transitions[from_index..to_index]
      end

      private

      # Array#bsearch_index was added in Ruby 2.3.0. Use bsearch_index to find
      # transitions if it is available, otherwise use a Ruby implementation.
      if [].respond_to?(:bsearch_index)
        # Performs a binary search on {transitions} to find the index of the
        # earliest transition satisfying a condition.
        #
        # @yield [transition] the caller will be yielded to to test the search
        #   condition.
        # @yieldparam transition [TimezoneTransition] a {TimezoneTransition}
        #   instance from {transitions}.
        # @yieldreturn [Boolean] `true` for the earliest transition that
        #   satisfies the condition and return `true` for all subsequent
        #   transitions. In all other cases, the result of the block must be
        #   `false`.
        # @return [Integer] the index of the earliest transition safisfying
        #   the condition or `nil` if there are no such transitions.
        #
        # :nocov_no_array_bsearch_index:
        def find_minimum_transition(&block)
          @transitions.bsearch_index(&block)
        end
        # :nocov_no_array_bsearch_index:
      else
        # Performs a binary search on {transitions} to find the index of the
        # earliest transition satisfying a condition.
        #
        # @yield [transition] the caller will be yielded to to test the search
        #   condition.
        # @yieldparam transition [TimezoneTransition] a {TimezoneTransition}
        #   instance from {transitions}.
        # @yieldreturn [Boolean] `true` for the earliest transition that
        #   satisfies the condition and return `true` for all subsequent
        #   transitions. In all other cases, the result of the block must be
        #   `false`.
        # @return [Integer] the index of the earliest transition safisfying
        #   the condition or `nil` if there are no such transitions.
        #
        # :nocov_array_bsearch_index:
        def find_minimum_transition
          # A Ruby implementation of the find-minimum mode of Array#bsearch_index.
          low = 0
          high = @transitions.length
          satisfied = false

          while low < high do
            mid = (low + high).div(2)
            if yield @transitions[mid]
              satisfied = true
              high = mid
            else
              low = mid + 1
            end
          end

          satisfied ? low : nil
        end
        # :nocov_array_bsearch_index:
      end

      # Determines if a transition occurs at or after a given {Timestamp},
      # taking the {Timestamp#sub_second sub_second} into consideration.
      #
      # @param transition [TimezoneTransition] the transition to compare.
      # @param timestamp [Timestamp] the timestamp to compare.
      # @return [Boolean] `true` if `transition` occurs at or after `timestamp`,
      #   otherwise `false`.
      def transition_on_or_after_timestamp?(transition, timestamp)
        transition_timestamp_value = transition.timestamp_value
        timestamp_value = timestamp.value
        transition_timestamp_value > timestamp_value || transition_timestamp_value == timestamp_value && timestamp.sub_second == 0
      end
    end
  end
end
