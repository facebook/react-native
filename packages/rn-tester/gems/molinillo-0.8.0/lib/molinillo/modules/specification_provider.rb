# frozen_string_literal: true

module Molinillo
  # Provides information about specifcations and dependencies to the resolver,
  # allowing the {Resolver} class to remain generic while still providing power
  # and flexibility.
  #
  # This module contains the methods that users of Molinillo must to implement,
  # using knowledge of their own model classes.
  module SpecificationProvider
    # Search for the specifications that match the given dependency.
    # The specifications in the returned array will be considered in reverse
    # order, so the latest version ought to be last.
    # @note This method should be 'pure', i.e. the return value should depend
    #   only on the `dependency` parameter.
    #
    # @param [Object] dependency
    # @return [Array<Object>] the specifications that satisfy the given
    #   `dependency`.
    def search_for(dependency)
      []
    end

    # Returns the dependencies of `specification`.
    # @note This method should be 'pure', i.e. the return value should depend
    #   only on the `specification` parameter.
    #
    # @param [Object] specification
    # @return [Array<Object>] the dependencies that are required by the given
    #   `specification`.
    def dependencies_for(specification)
      []
    end

    # Determines whether the given `requirement` is satisfied by the given
    # `spec`, in the context of the current `activated` dependency graph.
    #
    # @param [Object] requirement
    # @param [DependencyGraph] activated the current dependency graph in the
    #   resolution process.
    # @param [Object] spec
    # @return [Boolean] whether `requirement` is satisfied by `spec` in the
    #   context of the current `activated` dependency graph.
    def requirement_satisfied_by?(requirement, activated, spec)
      true
    end

    # Determines whether two arrays of dependencies are equal, and thus can be
    # grouped.
    #
    # @param [Array<Object>] dependencies
    # @param [Array<Object>] other_dependencies
    # @return [Boolean] whether `dependencies` and `other_dependencies` should
    #   be considered equal.
    def dependencies_equal?(dependencies, other_dependencies)
      dependencies == other_dependencies
    end

    # Returns the name for the given `dependency`.
    # @note This method should be 'pure', i.e. the return value should depend
    #   only on the `dependency` parameter.
    #
    # @param [Object] dependency
    # @return [String] the name for the given `dependency`.
    def name_for(dependency)
      dependency.to_s
    end

    # @return [String] the name of the source of explicit dependencies, i.e.
    #   those passed to {Resolver#resolve} directly.
    def name_for_explicit_dependency_source
      'user-specified dependency'
    end

    # @return [String] the name of the source of 'locked' dependencies, i.e.
    #   those passed to {Resolver#resolve} directly as the `base`
    def name_for_locking_dependency_source
      'Lockfile'
    end

    # Sort dependencies so that the ones that are easiest to resolve are first.
    # Easiest to resolve is (usually) defined by:
    #   1) Is this dependency already activated?
    #   2) How relaxed are the requirements?
    #   3) Are there any conflicts for this dependency?
    #   4) How many possibilities are there to satisfy this dependency?
    #
    # @param [Array<Object>] dependencies
    # @param [DependencyGraph] activated the current dependency graph in the
    #   resolution process.
    # @param [{String => Array<Conflict>}] conflicts
    # @return [Array<Object>] a sorted copy of `dependencies`.
    def sort_dependencies(dependencies, activated, conflicts)
      dependencies.sort_by do |dependency|
        name = name_for(dependency)
        [
          activated.vertex_named(name).payload ? 0 : 1,
          conflicts[name] ? 0 : 1,
        ]
      end
    end

    # Returns whether this dependency, which has no possible matching
    # specifications, can safely be ignored.
    #
    # @param [Object] dependency
    # @return [Boolean] whether this dependency can safely be skipped.
    def allow_missing?(dependency)
      false
    end
  end
end
