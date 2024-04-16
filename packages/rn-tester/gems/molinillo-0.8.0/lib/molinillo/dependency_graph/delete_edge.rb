# frozen_string_literal: true

require_relative 'action'
module Molinillo
  class DependencyGraph
    # @!visibility private
    # (see DependencyGraph#delete_edge)
    class DeleteEdge < Action
      # @!group Action

      # (see Action.action_name)
      def self.action_name
        :delete_edge
      end

      # (see Action#up)
      def up(graph)
        edge = make_edge(graph)
        edge.origin.outgoing_edges.delete(edge)
        edge.destination.incoming_edges.delete(edge)
      end

      # (see Action#down)
      def down(graph)
        edge = make_edge(graph)
        edge.origin.outgoing_edges << edge
        edge.destination.incoming_edges << edge
        edge
      end

      # @!group DeleteEdge

      # @return [String] the name of the origin of the edge
      attr_reader :origin_name

      # @return [String] the name of the destination of the edge
      attr_reader :destination_name

      # @return [Object] the requirement that the edge represents
      attr_reader :requirement

      # @param  [DependencyGraph] graph the graph to find vertices from
      # @return [Edge] The edge this action adds
      def make_edge(graph)
        Edge.new(
          graph.vertex_named(origin_name),
          graph.vertex_named(destination_name),
          requirement
        )
      end

      # Initialize an action to add an edge to a dependency graph
      # @param [String] origin_name the name of the origin of the edge
      # @param [String] destination_name the name of the destination of the edge
      # @param [Object] requirement the requirement that the edge represents
      def initialize(origin_name, destination_name, requirement)
        @origin_name = origin_name
        @destination_name = destination_name
        @requirement = requirement
      end
    end
  end
end
