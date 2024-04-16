module Pod
  class Source
    # The Aggregate manages a directory of sources repositories.
    #
    class Aggregate
      # @return [Array<Source>] The ordered list of sources.
      #
      attr_reader :sources

      # @param  [Array<Source>] repos_dirs @see Sources
      #
      def initialize(sources)
        raise "Cannot initialize an aggregate with a nil source: (#{sources})" if sources.include?(nil)
        @sources = sources
      end

      # @return [Array<String>] the names of all the pods available.
      #
      def all_pods
        sources.map(&:pods).flatten.uniq
      end

      # @return [Array<Set>] The sets for all the pods available.
      #
      # @note   Implementation detail: The sources don't cache their values
      #         because they might change in response to an update. Therefore
      #         this method to preserve performance caches the values before
      #         processing them.
      #
      def all_sets
        pods_by_source = {}
        sources.each do |source|
          pods_by_source[source] = source.pods
        end
        pods = pods_by_source.values.flatten.uniq

        pods.map do |pod|
          pod_sources = sources.select { |s| pods_by_source[s].include?(pod) }
          pod_sources = pod_sources.compact
          Specification::Set.new(pod, pod_sources)
        end
      end

      # Returns a set configured with the source which contains the highest
      # version in the aggregate.
      #
      # @param  [String] name
      #         The name of the Pod.
      #
      # @return [Set] The most representative set for the Pod with the given
      #         name. Returns nil if no representative source found containing a pod with given name.
      #
      def representative_set(name)
        representative_source = nil
        highest_version = nil
        sources.each do |source|
          source_versions = source.versions(name)
          if source_versions
            source_version = source_versions.first
            if highest_version.nil? || (highest_version < source_version)
              highest_version = source_version
              representative_source = source
            end
          end
        end
        representative_source ? Specification::Set.new(name, representative_source) : nil
      end

      public

      # @!group Search
      #-----------------------------------------------------------------------#

      # @return [Set, nil] a set for a given dependency including all the
      #         {Source} that contain the Pod. If no sources containing the
      #         Pod where found it returns nil.
      #
      # @raise  If no source including the set can be found.
      #
      # @see    Source#search
      #
      def search(dependency)
        found_sources = sources.select { |s| s.search(dependency) }
        unless found_sources.empty?
          Specification::Set.new(dependency.root_name, found_sources)
        end
      end

      # @return [Array<Set>]  the sets that contain the search term.
      #
      # @raise  If no source including the set can be found.
      #
      # @todo   Clients should raise not this method.
      #
      # @see    Source#search_by_name
      #
      def search_by_name(query, full_text_search = false)
        pods_by_source = {}
        result = []
        sources.each do |s|
          source_pods = s.search_by_name(query, full_text_search)
          pods_by_source[s] = source_pods.map(&:name)
        end

        root_spec_names = pods_by_source.values.flatten.uniq
        root_spec_names.each do |pod|
          result_sources = sources.select do |source|
            pods_by_source[source].include?(pod)
          end

          result << Specification::Set.new(pod, result_sources)
        end

        if result.empty?
          extra = ', author, summary, or description' if full_text_search
          raise Informative, 'Unable to find a pod with name' \
            "#{extra} matching `#{query}'"
        end
        result
      end

      public

      # @!group Search Index
      #-----------------------------------------------------------------------#

      # Generates from scratch the search data for given source.
      # This operation can take a considerable amount of time
      # (seconds) as it needs to evaluate the most representative podspec
      # for each Pod.
      #
      # @param  [Source] source
      #         The source from which a search index will be generated.
      #
      # @return [Hash{String=>Hash}] The search data for the source.
      #
      def generate_search_index_for_source(source)
        generate_search_index_for_sets(source.pod_sets)
      end

      # Generates from scratch the search data for changed specifications in given source.
      #
      # @param  [Source] source
      #         The source from which a search index will be generated.
      # @param  [Array<String>] spec_paths
      #         Array of file path names for corresponding changed specifications.
      #
      # @return [Hash{String=>Hash}] The search data for changed specifications.
      #
      def generate_search_index_for_changes_in_source(source, spec_paths)
        pods = source.pods_for_specification_paths(spec_paths)
        sets = pods.map do |pod|
          Specification::Set.new(pod, source)
        end
        generate_search_index_for_sets(sets)
      end

      private

      # @!group Private helpers
      #-----------------------------------------------------------------------#

      # Generates search data for given array of sets.
      def generate_search_index_for_sets(sets)
        result = {}
        sets.each do |set|
          word_list_from_set(set).each do |w|
            (result[w] ||= []).push(set.name)
          end
        end
        result
      end

      # Returns the vocabulary extracted from the most representative
      # specification of the set. Vocabulary contains words from following information:
      #
      #   - version
      #   - summary
      #   - description
      #   - authors
      #
      # @param  [Set] set
      #         The set for which the information is needed.
      #
      # @note   If the specification can't load an empty array is returned and
      #         a warning is printed.
      #
      # @note   For compatibility with non Ruby clients a strings are used
      #         instead of symbols for the keys.
      #
      # @return [Array<String>] An array of words contained by the set's search related information.
      #
      def word_list_from_set(set)
        spec = set.specification
        word_list = [set.name.dup]
        if spec.summary
          word_list += spec.summary.split
        end
        if spec.description
          word_list += spec.description.split
        end
        if spec.authors
          spec.authors.each_pair do |k, v|
            word_list += k.split if k
            word_list += v.split if v
          end
        end
        word_list.uniq
      rescue
        CoreUI.warn "Skipping `#{set.name}` because the podspec contains " \
          'errors.'
        []
      end

      #-----------------------------------------------------------------------#
    end
  end
end
