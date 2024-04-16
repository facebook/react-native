# frozen_string_literal: true

require_relative 'dependency_graph'

module Molinillo
  # This class encapsulates a dependency resolver.
  # The resolver is responsible for determining which set of dependencies to
  # activate, with feedback from the {#specification_provider}
  #
  #
  class Resolver
    require_relative 'resolution'

    # @return [SpecificationProvider] the specification provider used
    #   in the resolution process
    attr_reader :specification_provider

    # @return [UI] the UI module used to communicate back to the user
    #   during the resolution process
    attr_reader :resolver_ui

    # Initializes a new resolver.
    # @param  [SpecificationProvider] specification_provider
    #   see {#specification_provider}
    # @param  [UI] resolver_ui
    #   see {#resolver_ui}
    def initialize(specification_provider, resolver_ui)
      @specification_provider = specification_provider
      @resolver_ui = resolver_ui
    end

    # Resolves the requested dependencies into a {DependencyGraph},
    # locking to the base dependency graph (if specified)
    # @param [Array] requested an array of 'requested' dependencies that the
    #   {#specification_provider} can understand
    # @param [DependencyGraph,nil] base the base dependency graph to which
    #   dependencies should be 'locked'
    def resolve(requested, base = DependencyGraph.new)
      Resolution.new(specification_provider,
                     resolver_ui,
                     requested,
                     base).
        resolve
    end
  end
end
