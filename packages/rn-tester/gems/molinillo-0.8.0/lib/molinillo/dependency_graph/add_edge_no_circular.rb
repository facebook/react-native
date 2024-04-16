# frozen_string_literal: true

require_relative 'action'
module Molinillo
  class DependencyGraph
    # @!visibility private
    # (see DependencyGraph#add_edge_no_circular)
    class AddEdgeNoCircular < Action
      # @!group Action

      # (see Action.action_name)
      def self.action_name
        :add_vertex
      end

      # (see Action#up)
      def up(graph)
        edge = make_edge(graph)
        edge.origin.outgoing_edges << edge
        edge.destination.incoming_edges << edge
        edge
      end

      # (see Action#down)
      def down(graph)
        edge = make_edge(graph)
        delete_first(edge.origin.outgoing_edges, edge)
        delete_first(edge.destination.incoming_edges, edge)
      end

      # @!group AddEdgeNoCircular

      # @return [String] the name of the origin of the edge
      attr_reader :origin

      # @return [String] the name of the destination of the edge
      attr_reader :destination

      # @return [Object] the requirement that the edge represents
      attr_reader :requirement

      # @param  [DependencyGraph] graph the graph to find vertices from
      # @return [Edge] The edge this action adds
      def make_edge(graph)
        Edge.new(graph.vertex_named(origin), graph.vertex_named(destination), requirement)
      end

      # Initialize an action to add an edge to a dependency graph
      # @param [String] origin the name of the origin of the edge
      # @param [String] destination the name of the destination of the edge
      # @param [Object] requirement the requirement that the edge represents
      def initialize(origin, destination, requirement)
        @origin = origin
        @destination = destination
        @requirement = requirement
      end

      private

      def delete_first(array, item)
        return unless index = array.index(item)
        array.delete_at(index)
      end
    end
  end
end
