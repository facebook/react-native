# frozen_string_literal: true

module Molinillo
  class DependencyGraph
    # An action that modifies a {DependencyGraph} that is reversible.
    # @abstract
    class Action
      # rubocop:disable Lint/UnusedMethodArgument

      # @return [Symbol] The name of the action.
      def self.action_name
        raise 'Abstract'
      end

      # Performs the action on the given graph.
      # @param  [DependencyGraph] graph the graph to perform the action on.
      # @return [Void]
      def up(graph)
        raise 'Abstract'
      end

      # Reverses the action on the given graph.
      # @param  [DependencyGraph] graph the graph to reverse the action on.
      # @return [Void]
      def down(graph)
        raise 'Abstract'
      end

      # @return [Action,Nil] The previous action
      attr_accessor :previous

      # @return [Action,Nil] The next action
      attr_accessor :next
    end
  end
end
