# frozen_string_literal: true

module Molinillo
  # A state that a {Resolution} can be in
  # @attr [String] name the name of the current requirement
  # @attr [Array<Object>] requirements currently unsatisfied requirements
  # @attr [DependencyGraph] activated the graph of activated dependencies
  # @attr [Object] requirement the current requirement
  # @attr [Object] possibilities the possibilities to satisfy the current requirement
  # @attr [Integer] depth the depth of the resolution
  # @attr [Hash] conflicts unresolved conflicts, indexed by dependency name
  # @attr [Array<UnwindDetails>] unused_unwind_options unwinds for previous conflicts that weren't explored
  ResolutionState = Struct.new(
    :name,
    :requirements,
    :activated,
    :requirement,
    :possibilities,
    :depth,
    :conflicts,
    :unused_unwind_options
  )

  class ResolutionState
    # Returns an empty resolution state
    # @return [ResolutionState] an empty state
    def self.empty
      new(nil, [], DependencyGraph.new, nil, nil, 0, {}, [])
    end
  end

  # A state that encapsulates a set of {#requirements} with an {Array} of
  # possibilities
  class DependencyState < ResolutionState
    # Removes a possibility from `self`
    # @return [PossibilityState] a state with a single possibility,
    #  the possibility that was removed from `self`
    def pop_possibility_state
      PossibilityState.new(
        name,
        requirements.dup,
        activated,
        requirement,
        [possibilities.pop],
        depth + 1,
        conflicts.dup,
        unused_unwind_options.dup
      ).tap do |state|
        state.activated.tag(state)
      end
    end
  end

  # A state that encapsulates a single possibility to fulfill the given
  # {#requirement}
  class PossibilityState < ResolutionState
  end
end
