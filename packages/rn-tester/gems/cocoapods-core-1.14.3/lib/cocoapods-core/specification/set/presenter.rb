require 'active_support/core_ext/array/conversions'

module Pod
  class Specification
    class Set
      # Provides support for presenting a Pod described by a {Set} in a
      # consistent way across clients of CocoaPods-Core.
      #
      class Presenter
        # @return [Set] the set that should be presented.
        #
        attr_reader :set

        # @param  [Set] set @see #set.
        #
        def initialize(set)
          @set = set
        end

        #---------------------------------------------------------------------#

        # @!group Set Information

        # @return   [String] the name of the Pod.
        #
        def name
          @set.name
        end

        # @return   [Version] the highest version of available for the Pod.
        #
        def version
          @set.versions.first
        end

        # @return   [Array<Version>] all the versions available ascending
        #           order.
        #
        def versions
          @set.versions
        end

        # @return   [String] all the versions available sorted from the highest
        #           to the lowest.
        #
        # @example  Return example
        #
        #           "1.5pre, 1.4 [master repo] - 1.4 [test_repo repo]"
        #
        # @note     This method orders the sources by name.
        #
        def versions_by_source
          result = []
          versions_by_source = @set.versions_by_source
          @set.sources.sort.each do |source|
            versions = versions_by_source[source]
            result << "#{versions.map(&:to_s) * ', '} [#{source.name} repo]"
          end
          result * ' - '
        end

        # @return [Array<String>] The name of the sources that contain the Pod
        #         sorted alphabetically.
        #
        def sources
          @set.sources.map(&:name).sort
        end

        #---------------------------------------------------------------------#

        # @!group Specification Information

        # @return [Specification] the specification of the {Set}. If no
        #         versions requirements where passed to the set it returns the
        #         highest available version.
        #
        def spec
          @spec ||= @set.specification
        end

        # @return   [String] the list of the authors of the Pod in sentence
        #           format.
        #
        # @example  Output example
        #
        #           "Author 1, Author 2 and Author 3"
        #
        def authors
          return '' unless spec.authors
          spec.authors.keys.to_sentence
        end

        # @return [String] the homepage of the pod.
        #
        def homepage
          spec.homepage
        end

        # @return [String] a short description, expected to be 140 characters
        #         long of the Pod.
        #
        def summary
          spec.summary
        end

        # @return [String] the description of the Pod, if no description is
        #         available the summary is returned.
        #
        def description
          spec.description || spec.summary
        end

        # @return [String] A string that describes the deprecation of the pod.
        #         If the pod is deprecated in favor of another pod it will contain
        #         information about that. If the pod is not deprecated returns nil.
        #
        # @example Output example
        #
        #          "[DEPRECATED]"
        #          "[DEPRECATED in favor of NewAwesomePod]"
        #
        def deprecation_description
          if spec.deprecated?
            description = '[DEPRECATED'
            description += if spec.deprecated_in_favor_of.nil?
                             ']'
                           else
                             " in favor of #{spec.deprecated_in_favor_of}]"
                           end

            description
          end
        end

        # @return [String] the URL of the source of the Pod.
        #
        def source_url
          url_keys = [:git, :svn, :http, :hg, :path]
          key = spec.source.keys.find { |k| url_keys.include?(k) }
          key ? spec.source[key] : 'No source url'
        end

        # @return [String] the platforms supported by the Pod.
        #
        # @example
        #
        #   "iOS"
        #   "iOS - OS X"
        #
        def platform
          sorted_platforms = spec.available_platforms.sort do |a, b|
            a.to_s.downcase <=> b.to_s.downcase
          end
          sorted_platforms.join(' - ')
        end

        # @return [String] the type of the license of the Pod.
        #
        # @example
        #
        #   "MIT"
        #
        def license
          spec.license[:type] if spec.license
        end

        # @return [Array] an array containing all the subspecs of the Pod.
        #
        def subspecs
          (spec.recursive_subspecs.any? && spec.recursive_subspecs) || nil
        end

        #---------------------------------------------------------------------#

        # @!group Statistics

        # @return [Integer] the GitHub likes of the repo of the Pod.
        #
        def github_stargazers
          github_metrics['stargazers']
        end

        # @return [Integer] the GitHub forks of the repo of the Pod.
        #
        def github_forks
          github_metrics['forks']
        end

        #---------------------------------------------------------------------#

        # @!group Private Helpers

        def metrics
          @metrics ||= Metrics.pod(name) || {}
        end

        def github_metrics
          metrics['github'] || {}
        end
      end
    end
  end
end
