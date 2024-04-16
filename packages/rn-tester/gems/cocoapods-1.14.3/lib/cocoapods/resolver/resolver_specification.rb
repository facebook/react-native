module Pod
  class Resolver
    # A small container that wraps a resolved specification for a given target definition. Additional metadata
    # is included here such as if the specification is only used by tests.
    #
    class ResolverSpecification
      # @return [Specification] the specification that was resolved
      #
      attr_reader :spec

      # @return [Source] the spec repo source the specification came from
      #
      attr_reader :source

      # @return [Boolean] whether this resolved specification is used by non-library targets.
      #
      attr_reader :used_by_non_library_targets_only
      alias used_by_non_library_targets_only? used_by_non_library_targets_only

      def initialize(spec, used_by_non_library_targets_only, source)
        @spec = spec
        @used_by_non_library_targets_only = used_by_non_library_targets_only
        @source = source
      end

      def name
        spec.name
      end

      def root
        spec.root
      end

      def ==(other)
        self.class == other.class &&
            spec == other.spec &&
            used_by_non_library_targets_only? == other.used_by_non_library_targets_only?
      end
    end
  end
end
