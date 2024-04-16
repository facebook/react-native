require 'set'

module Pod
  class Installer
    class Analyzer
      # This class represents the state of a collection of Pods.
      #
      # @note The names of the pods stored by this class are always the **root**
      #       name of the specification.
      #
      # @note The motivation for this class is to ensure that the names of the
      #       subspecs are added instead of the name of the Pods.
      #
      class SpecsState
        # @return [Set<String>] the names of the pods that were added.
        #
        attr_reader :added

        # @return [Set<String>] the names of the pods that were changed.
        #
        attr_reader :changed

        # @return [Set<String>] the names of the pods that were deleted.
        #
        attr_reader :deleted

        # @return [Set<String>] the names of the pods that were unchanged.
        #
        attr_reader :unchanged

        # Initialize a new instance
        #
        # @param  [Hash{Symbol=>String}] pods_by_state
        #         The name of the pods grouped by their state
        #         (`:added`, `:removed`, `:changed` or `:unchanged`).
        #
        def initialize(pods_by_state = nil)
          @added     = Set.new
          @deleted   = Set.new
          @changed   = Set.new
          @unchanged = Set.new

          if pods_by_state
            {
              :added => :added,
              :changed => :changed,
              :removed => :deleted,
              :unchanged => :unchanged,
            }.each do |state, spec_state|
              Array(pods_by_state[state]).each do |name|
                add_name(name, spec_state)
              end
            end
          end
        end

        # Displays the state of each pod.
        #
        # @return [void]
        #
        def print
          states = %i(added deleted changed unchanged)
          lines(states).each do |line|
            UI.message(line, '', 2)
          end
        end

        def to_s(states: %i(added deleted changed unchanged))
          lines(states).join("\n")
        end

        # Adds the name of a Pod to the give state.
        #
        # @param  [String] name
        #         the name of the Pod.
        #
        # @param  [Symbol] state
        #         the state of the Pod.
        #
        # @return [void]
        #
        def add_name(name, state)
          send(state) << Specification.root_name(name)
        end

        private

        # @return [Array<String>] A description of changes for the given states,
        #                         one per line
        #
        def lines(states)
          prefixes = {
            :added     => 'A'.green,
            :deleted   => 'R'.red,
            :changed   => 'M'.yellow,
            :unchanged => '-',
          }

          states.flat_map do |state|
            send(state).sort.map do |pod|
              prefixes[state.to_sym] + " #{pod}"
            end
          end
        end
      end
    end
  end
end
