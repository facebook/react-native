# frozen_string_literal: true

module Molinillo
  # @!visibility private
  module Delegates
    # Delegates all {Molinillo::ResolutionState} methods to a `#state` property.
    module ResolutionState
      # (see Molinillo::ResolutionState#name)
      def name
        current_state = state || Molinillo::ResolutionState.empty
        current_state.name
      end

      # (see Molinillo::ResolutionState#requirements)
      def requirements
        current_state = state || Molinillo::ResolutionState.empty
        current_state.requirements
      end

      # (see Molinillo::ResolutionState#activated)
      def activated
        current_state = state || Molinillo::ResolutionState.empty
        current_state.activated
      end

      # (see Molinillo::ResolutionState#requirement)
      def requirement
        current_state = state || Molinillo::ResolutionState.empty
        current_state.requirement
      end

      # (see Molinillo::ResolutionState#possibilities)
      def possibilities
        current_state = state || Molinillo::ResolutionState.empty
        current_state.possibilities
      end

      # (see Molinillo::ResolutionState#depth)
      def depth
        current_state = state || Molinillo::ResolutionState.empty
        current_state.depth
      end

      # (see Molinillo::ResolutionState#conflicts)
      def conflicts
        current_state = state || Molinillo::ResolutionState.empty
        current_state.conflicts
      end

      # (see Molinillo::ResolutionState#unused_unwind_options)
      def unused_unwind_options
        current_state = state || Molinillo::ResolutionState.empty
        current_state.unused_unwind_options
      end
    end
  end
end
