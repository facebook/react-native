# frozen_string_literal: true

require_relative 'action'
module Molinillo
  class DependencyGraph
    # @!visibility private
    # (see DependencyGraph#add_vertex)
    class AddVertex < Action # :nodoc:
      # @!group Action

      # (see Action.action_name)
      def self.action_name
        :add_vertex
      end

      # (see Action#up)
      def up(graph)
        if existing = graph.vertices[name]
          @existing_payload = existing.payload
          @existing_root = existing.root
        end
        vertex = existing || Vertex.new(name, payload)
        graph.vertices[vertex.name] = vertex
        vertex.payload ||= payload
        vertex.root ||= root
        vertex
      end

      # (see Action#down)
      def down(graph)
        if defined?(@existing_payload)
          vertex = graph.vertices[name]
          vertex.payload = @existing_payload
          vertex.root = @existing_root
        else
          graph.vertices.delete(name)
        end
      end

      # @!group AddVertex

      # @return [String] the name of the vertex
      attr_reader :name

      # @return [Object] the payload for the vertex
      attr_reader :payload

      # @return [Boolean] whether the vertex is root or not
      attr_reader :root

      # Initialize an action to add a vertex to a dependency graph
      # @param [String] name the name of the vertex
      # @param [Object] payload the payload for the vertex
      # @param [Boolean] root whether the vertex is root or not
      def initialize(name, payload, root)
        @name = name
        @payload = payload
        @root = root
      end
    end
  end
end
