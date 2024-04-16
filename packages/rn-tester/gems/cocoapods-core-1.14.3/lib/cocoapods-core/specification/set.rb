require 'active_support/core_ext/array/conversions'
require 'cocoapods-core/specification/set/presenter'

module Pod
  class Specification
    # A Specification::Set is responsible of handling all the specifications of
    # a Pod. This class stores the information of the dependencies that required
    # a Pod in the resolution process.
    #
    # @note   The order in which the sets are provided is used to select a
    #         specification if multiple are available for a given version.
    #
    # @note   The set class is not and should be not aware of the backing store
    #         of a Source.
    #
    class Set
      # @return [String] the name of the Pod.
      #
      attr_reader :name

      # @return [Array<Source>] the sources that contain the specifications for
      #         the available versions of a Pod.
      #
      attr_reader :sources

      # @param  [String] name
      #         the name of the Pod.
      #
      # @param  [Array<Source>,Source] sources
      #         the sources that contain a Pod.
      #
      def initialize(name, sources = [])
        @name = name
        @sources = Array(sources)
      end

      # @return [Specification] the top level specification of the Pod for the
      #         {#required_version}.
      #
      # @note   If multiple sources have a specification for the
      #         {#required_version}, the order in which they are provided
      #         is used to disambiguate.
      #
      def specification
        unless highest_version_spec_path
          raise Informative, "Could not find the highest version for `#{name}`. "\
                             "This could be due to an empty #{name} directory in a local repository."
        end

        Specification.from_file(highest_version_spec_path)
      end

      # @return [Specification] the top level specification for this set for any version.
      #
      def specification_name
        versions_by_source.each do |source, versions|
          next unless version = versions.first
          return source.specification(name, version).name
        end
        nil
      end

      # @return [Array<String>] the paths to specifications for the given
      #         version
      #
      def specification_paths_for_version(version)
        sources = @sources.select { |source| versions_by_source[source].include?(version) }
        sources.map { |source| source.specification_path(name, version) }
      end

      # @return [Array<Version>] all the available versions for the Pod, sorted
      #         from highest to lowest.
      #
      def versions
        @versions ||= versions_by_source.values.flatten.uniq.sort.reverse
      end

      # @return [Version] The highest version known of the specification.
      #
      def highest_version
        versions.first
      end

      # @return [Pathname] The path of the highest version.
      #
      # @note   If multiple sources have a specification for the
      #         {#required_version}, the order in which they are provided
      #         is used to disambiguate.
      #
      def highest_version_spec_path
        @highest_version_spec_path ||= specification_paths_for_version(highest_version).first
      end

      # @return [Hash{Source => Version}] all the available versions for the
      #         Pod grouped by source.
      #
      def versions_by_source
        @versions_by_source ||= sources.each_with_object({}) do |source, result|
          result[source] = source.versions(name)
        end
      end

      def ==(other)
        self.class == other.class &&
          @name == other.name &&
          @sources.map(&:name) == other.sources.map(&:name)
      end

      def to_s
        "#<#{self.class.name} for `#{name}' available at `#{sources.map(&:name).join(', ')}'>"
      end
      alias_method :inspect, :to_s

      # Returns a hash representation of the set composed by dumb data types.
      #
      # @example
      #
      #   "name" => "CocoaLumberjack",
      #   "versions" => { "master" => [ "1.6", "1.3.3"] },
      #   "highest_version" => "1.6",
      #   "highest_version_spec" => 'REPO/CocoaLumberjack/1.6/CocoaLumberjack.podspec'
      #
      # @return [Hash] The hash representation.
      #
      def to_hash
        versions = versions_by_source.reduce({}) do |memo, (source, version)|
          memo[source.name] = version.map(&:to_s)
          memo
        end
        {
          'name' => name,
          'versions' => versions,
          'highest_version' => highest_version.to_s,
          'highest_version_spec' => highest_version_spec_path.to_s,
        }
      end

      #-----------------------------------------------------------------------#

      # The Set::External class handles Pods from external sources. Pods from
      # external sources don't use the {Source} and are initialized by a given
      # specification.
      #
      # @note External sources *don't* support subspecs.
      #
      class External < Set
        attr_reader :specification

        def initialize(spec)
          @specification = spec.root
          super(@specification.name)
        end

        def ==(other)
          self.class == other.class && specification == other.specification
        end

        def versions
          [specification.version]
        end
      end

      #-----------------------------------------------------------------------#

      # The Set::Head class handles Pods in head mode. Pods in head
      # mode don't use the {Source} and are initialized by a given
      # specification.
      #
      class Head < External
        def initialize(spec)
          super
          specification.version.head = true
        end
      end
    end
  end
end
