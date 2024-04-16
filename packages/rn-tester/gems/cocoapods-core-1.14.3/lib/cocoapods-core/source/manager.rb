require 'public_suffix'

module Pod
  class Source
    class Manager
      # @return [Pathname] The directory that contains the source repo
      #         directories.
      #
      attr_reader :repos_dir

      def initialize(repos_dir)
        @repos_dir = Pathname(repos_dir).expand_path
      end

      # @return [Array<Pathname>] The source repo directories.
      #
      def source_repos
        return [] unless repos_dir.exist?
        repos_dir.children.select(&:directory?).sort_by { |d| d.basename.to_s.downcase }
      end

      # @return [Source::Aggregate] The aggregate of all the sources with the
      #         known Pods.
      #
      def aggregate
        aggregate_with_repos(source_repos)
      end

      # @return [Source::Aggregate] The aggregate of the sources from repos.
      #
      # @param  [Dependency] dependency
      #         The dependency for which to find or build the appropriate.
      #         aggregate. If the dependency specifies a source podspec repo
      #         then only that source will be used, otherwise all sources
      #         will be used.
      #
      def aggregate_for_dependency(dependency)
        return aggregate if dependency.podspec_repo.nil?

        source = source_with_url(dependency.podspec_repo) || source_with_name(dependency.podspec_repo)
        return aggregate if source.nil?

        aggregate_with_repos([source.repo])
      end

      # @return [Array<Source>] The list of the sources with the given names.
      #
      # @param  [Array<#to_s>] names
      #         The names of the sources.
      #
      def sources(names)
        dirs = names.map { |name| source_dir(name) }
        dirs.map { |repo| source_from_path(repo) }
      end

      # @return [Array<Source>] The list of all the sources known to this
      #         installation of CocoaPods.
      #
      def all
        aggregate.sources
      end

      # @return [Array<Source>] The list of all the non-indexable sources known to this
      #         installation of CocoaPods.
      #
      def all_non_indexable
        aggregate.sources.reject(&:indexable?)
      end

      # @return [Array<Source>] The CocoaPods Master Repo source.
      #
      def master
        sources([Pod::TrunkSource::TRUNK_REPO_NAME]).select { |s| s.repo.directory? }
      end

      # @!group Master repo

      # @return [Pathname] The path of the master repo.
      #
      def master_repo_dir
        source_dir(Pod::TrunkSource::TRUNK_REPO_NAME)
      end

      # @return [Boolean] Checks if the master repo is usable.
      #
      # @note   Note this is used to automatically setup the master repo if
      #         needed.
      #
      def master_repo_functional?
        return false unless master_repo = master.first
        master_repo.metadata.compatible?(CORE_VERSION)
      end

      # Search the appropriate sources to match the set for the given dependency.
      #
      # @return [Set, nil] a set for a given dependency including all the
      #         {Source} that contain the Pod. If no sources containing the
      #         Pod where found it returns nil.
      #
      # @raise  If no source can be found that includes the dependency.
      #
      def search(dependency)
        aggregate_for_dependency(dependency).search(dependency)
      end

      # Search all the sources with the given search term.
      #
      # @param  [String] query
      #         The search term.
      #
      # @param  [Boolean] full_text_search
      #         Whether the search should be limited to the name of the Pod or
      #         should include also the author, the summary, and the
      #         description.
      #
      # @raise  If no source including the set can be found.
      #
      # @return [Array<Set>]  The sets that contain the search term.
      #
      def search_by_name(query, full_text_search = false)
        query_word_regexps = query.split.map { |word| /#{word}/i }
        if full_text_search
          query_word_results_hash = {}
          updated_search_index.each_value do |word_spec_hash|
            word_spec_hash.each_pair do |word, spec_names|
              query_word_regexps.each do |query_word_regexp|
                set = (query_word_results_hash[query_word_regexp] ||= Set.new)
                set.merge(spec_names) if word =~ query_word_regexp
              end
            end
          end
          found_set_names = query_word_results_hash.values.reduce(:&)
          found_set_names ||= []

          sets_from_non_indexable = all_non_indexable.map { |s| s.search_by_name(query, true) }.flatten

          found_set_names += sets_from_non_indexable.map(&:name).flatten.uniq

          sets = found_set_names.map do |name|
            aggregate.representative_set(name)
          end

          # Remove nil values because representative_set return nil if no pod is found in any of the sources.
          sets.compact!
        else
          sets = aggregate.search_by_name(query, false)
        end
        if sets.empty?
          extra = ', author, summary, or description' if full_text_search
          raise Informative, "Unable to find a pod with name#{extra} " \
            "matching `#{query}`"
        end
        sorted_sets(sets, query_word_regexps)
      end

      # Returns given set array by sorting it in-place.
      #
      # @param  [Array<Set>] sets
      #         Array of sets to be sorted.
      #
      # @param  [Array<Regexp>] query_word_regexps
      #         Array of regexp objects for user query.
      #
      # @return [Array<Set>]  Given sets parameter itself after sorting it in-place.
      #
      def sorted_sets(sets, query_word_regexps)
        sets.sort_by! do |set|
          pre_match_length = nil
          found_query_index = nil
          found_query_count = 0
          query_word_regexps.each_with_index do |q, idx|
            if (m = set.name.match(/#{q}/i))
              pre_match_length ||= m.pre_match.length
              found_query_index ||= idx
              found_query_count += 1
            end
          end
          pre_match_length ||= 1000
          found_query_index ||= 1000
          [-found_query_count, pre_match_length, found_query_index, set.name.downcase]
        end
        sets
      end

      # Returns the search data. If a saved search data exists, retrieves it from file and returns it.
      # Else, creates the search data from scratch, saves it to file system, and returns it.
      # Search data is grouped by source repos. For each source, it contains a hash where keys are words
      # and values are the pod names containing corresponding word.
      #
      # For each source, list of unique words are generated from the following spec information.
      #   - version
      #   - summary
      #   - description
      #   - authors
      #
      # @return [Hash{String => Hash{String => Array<String>}}] The up to date search data.
      #
      def updated_search_index
        index = stored_search_index || {}
        indexable_sources.each do |source|
          source_name = source.name
          unless index[source_name]
            CoreUI.print "Creating search index for spec repo '#{source_name}'.."
            index[source_name] = aggregate.generate_search_index_for_source(source)
            CoreUI.puts ' Done!'
          end
        end
        save_search_index(index)
        index
      end

      # Updates the stored search index if there are changes in spec repos while updating them.
      # Update is performed incrementally. Only the changed pods' search data is re-generated and updated.
      # @param  [Hash{Source => Array<String>}] changed_spec_paths
      #                  A hash containing changed specification paths for each source.
      #
      def update_search_index_if_needed(changed_spec_paths)
        search_index = stored_search_index
        return unless search_index
        changed_spec_paths.each_pair do |source, spec_paths|
          next unless source.indexable?
          index_for_source = search_index[source.name]
          next unless index_for_source && !spec_paths.empty?
          updated_pods = source.pods_for_specification_paths(spec_paths)

          new_index = aggregate.generate_search_index_for_changes_in_source(source, spec_paths)
          # First traverse search_index and update existing words
          # Remove traversed words from new_index after adding to search_index,
          # so that only non existing words will remain in new_index after enumeration completes.
          index_for_source.each_pair do |word, _|
            if new_index[word]
              index_for_source[word] |= new_index[word]
              new_index.delete(word)
            else
              index_for_source[word] -= updated_pods
            end
          end

          # Now add non existing words remained in new_index to search_index
          index_for_source.merge!(new_index)
        end
        save_search_index(search_index)
      end

      # Updates search index for changed pods in background
      # @param  [Hash{Source => Array<String>}] changed_spec_paths
      #                  A hash containing changed specification paths for each source.
      #
      def update_search_index_if_needed_in_background(changed_spec_paths)
        if Gem.win_platform?
          update_search_index_if_needed(changed_spec_paths)
          return
        end
        Process.fork do
          Process.daemon
          update_search_index_if_needed(changed_spec_paths)
          exit
        end
      end

      # Returns the search data stored in the file system.
      # If existing data in the file system is not valid, returns nil.
      #
      def stored_search_index
        @updated_search_index ||= begin
          if search_index_path.exist?
            require 'json'
            begin
              index = JSON.parse(search_index_path.read)
              unless index # JSON.parse("null") => nil
                search_index_path.delete
                return nil
              end

              index if index.is_a?(Hash) # TODO: should we also check if hash has correct hierarchy?
            rescue JSON::ParserError
              search_index_path.delete
              nil
            end
          end
        end
      end

      # Stores given search data in the file system.
      # @param [Hash] index
      #        Index to be saved in file system
      #
      def save_search_index(index)
        require 'json'
        @updated_search_index = index
        search_index_path.open('w') do |io|
          io.write(@updated_search_index.to_json)
        end
      end

      # Allows to clear the search index.
      #
      attr_writer :updated_search_index

      # @return [Pathname] The path where the search index should be stored.
      #
      attr_accessor :search_index_path

      private

      # @return [Source] The Source at a given path.
      #
      # @param [Pathname] path
      #        The local file path to one podspec repo.
      #
      def source_from_path(path)
        @sources_by_path ||= Hash.new do |hash, key|
          hash[key] = case
                      when key.basename.to_s == Pod::TrunkSource::TRUNK_REPO_NAME
                        TrunkSource.new(key)
                      when (key + '.url').exist?
                        CDNSource.new(key)
                      else
                        Source.new(key)
                      end
        end
        @sources_by_path[path]
      end

      # @return [Source::Aggregate] The aggregate of the sources from repos.
      #
      # @param  [Array<Pathname>] repos
      #         The local file paths to one or more podspec repo caches.
      #
      def aggregate_with_repos(repos)
        sources = repos.map { |path| source_from_path(path) }
        @aggregates_by_repos ||= {}
        @aggregates_by_repos[repos] ||= Source::Aggregate.new(sources)
      end

      # @return [Source] The source with the given name.
      #
      # @param  [String] name
      #         The name of the source.
      #
      def source_with_name(name)
        source = sources([name]).first
        return nil unless source.repo.exist?
        source
      end

      # @return [Source] The updateable source with the given name. If no updateable source
      #         with given name is found it raises.
      #
      # @param  [String] name
      #         The name of the source.
      #
      def updateable_source_named(name)
        specified_source = source_with_name(name)
        unless specified_source
          raise Informative, "Unable to find the `#{name}` repo."
        end
        unless specified_source.updateable?
          raise Informative, "The `#{name}` repo is not a updateable repo."
        end
        specified_source
      end

      # @return [Source] The list of the updateable sources.
      #
      def updateable_sources
        all.select(&:updateable?)
      end

      # @return [Source] The list of the indexable sources.
      #
      def indexable_sources
        all.select(&:indexable?)
      end

      # @return [Pathname] The path of the source with the given name.
      #
      # @param  [String] name
      #         The name of the source.
      #
      def source_dir(name)
        repos_dir + name
      end

      # @return [Source] The source whose {Source#url} is equal to `url`.
      #
      # @param  [String] url
      #         The URL of the source.
      #
      def source_with_url(url)
        url = canonic_url(url)
        url = 'https://github.com/cocoapods/specs' if url =~ %r{github.com[:/]+cocoapods/specs}
        all.find do |source|
          source.url && canonic_url(source.url) == url
        end
      end

      def canonic_url(url)
        url.downcase.gsub(/\.git$/, '').gsub(%r{\/$}, '')
      end

      # Returns a suitable repository name for `url`.
      #
      # @example A GitHub.com URL
      #
      #          name_for_url('https://github.com/Artsy/Specs.git')
      #            # "artsy"
      #          name_for_url('https://github.com/Artsy/Specs.git')
      #            # "artsy-1"
      #
      # @example A non-Github.com URL
      #
      #          name_for_url('https://sourceforge.org/Artsy/Specs.git')
      #            # sourceforge-artsy
      #
      # @example A file URL
      #
      #           name_for_url('file:///Artsy/Specs.git')
      #             # artsy
      #
      # @param  [#to_s] url
      #         The URL of the source.
      #
      # @return [String] A suitable repository name for `url`.
      #
      def name_for_url(url)
        base_from_host_and_path = lambda do |host, path|
          if host && !host.empty?
            domain = PublicSuffix.parse(host) rescue nil
            base = [domain&.sld || host]
            base = [] if base == %w(github)
          else
            base = []
          end

          path = path.gsub(/.git$/, '').gsub(%r{^/}, '').split('/')
          path.pop if path.last == 'specs'

          (base + path).join('-')
        end

        valid_url = lambda do |url|
          url =~ URI.regexp && (URI(url) rescue false)
        end

        valid_scp_url = lambda do |url|
          valid_url['scp://' + url]
        end

        url = url.to_s.downcase

        case url
        when %r{https://#{Regexp.quote(trunk_repo_hostname)}}i
          # Main CDN repo
          base = Pod::TrunkSource::TRUNK_REPO_NAME
        when valid_url
          # HTTPS URL or something similar
          url = valid_url[url]
          base = base_from_host_and_path[url.host, url.path]
        when valid_scp_url
          # SCP-style URLs for private git repos
          url = valid_scp_url[url]
          base = base_from_host_and_path[url.host, url.path]
        when %r{(?:git|ssh|https?|[a-z0-9_-]+@([-\w.]+)):(\/\/)?(.*?)(\.git)?(\/?|\#[-\d\w._]+?)$}i
          # Additional SCP-style URLs for private git repos
          host, _, path = Regexp.last_match.captures
          base = base_from_host_and_path[host, path]
        else
          # This is nearly impossible, with all the previous cases
          raise Informative, "Couldn't determine repo name for URL: #{url}"
        end

        name = base
        (1..).each do |i|
          break unless source_dir(name).exist?
          name = "#{base}-#{i}"
        end
        name
      end

      # Returns hostname for for `trunk` URL.
      #
      def trunk_repo_hostname
        URI.parse(TrunkSource::TRUNK_REPO_URL).host.downcase.freeze
      end
    end
  end
end
