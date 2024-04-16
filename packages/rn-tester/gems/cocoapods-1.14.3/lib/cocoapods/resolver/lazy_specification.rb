require 'delegate'
module Pod
  class Specification
    class Set
      class SpecWithSource < DelegateClass(Specification)
        attr_reader :spec_source
        def initialize(spec, source)
          super(spec)
          @spec_source = source
        end

        undef is_a?
      end

      class LazySpecification < DelegateClass(Specification)
        attr_reader :name, :version, :spec_source

        def initialize(name, version, spec_source)
          @name = name
          @version = version
          @spec_source = spec_source
        end

        def subspec_by_name(name = nil, raise_if_missing = true, include_non_library_specifications = false)
          subspec =
            if !name || name == self.name
              self
            else
              specification.subspec_by_name(name, raise_if_missing, include_non_library_specifications)
            end
          return unless subspec

          SpecWithSource.new subspec, spec_source
        end

        def specification
          @specification ||= spec_source.specification(name, version.version)
        end
        alias __getobj__ specification

        undef is_a?
      end

      class External
        def all_specifications(_warn_for_multiple_pod_sources, requirement)
          if requirement.satisfied_by? specification.version
            [specification]
          else
            []
          end
        end
      end

      # returns the highest versioned spec last
      def all_specifications(warn_for_multiple_pod_sources, requirement)
        @all_specifications ||= {}
        @all_specifications[requirement] ||= begin
          sources_by_version = {}
          versions_by_source.each do |source, versions|
            versions.each do |v|
              next unless requirement.satisfied_by?(v)

              (sources_by_version[v] ||= []) << source
            end
          end

          if warn_for_multiple_pod_sources
            duplicate_versions = sources_by_version.select { |_version, sources| sources.count > 1 }

            duplicate_versions.each do |version, sources|
              UI.warn "Found multiple specifications for `#{name} (#{version})`:\n" +
                sources.
                  map { |s| s.specification_path(name, version) }.
                  map { |v| "- #{v}" }.join("\n")
            end
          end

          # sort versions from high to low
          sources_by_version.sort_by(&:first).flat_map do |version, sources|
            # within each version, we want the prefered (first-specified) source
            # to be the _last_ one
            sources.reverse_each.map { |source| LazySpecification.new(name, version, source) }
          end
        end
      end
    end
  end
end
