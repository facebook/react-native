require 'cocoapods-core/source/acceptor'
require 'cocoapods-core/source/aggregate'
require 'cocoapods-core/source/health_reporter'
require 'cocoapods-core/source/manager'
require 'cocoapods-core/source/metadata'

module Pod
  # The Source class is responsible to manage a collection of podspecs.
  #
  # The backing store of the podspecs collection is an implementation detail
  # abstracted from the rest of CocoaPods.
  #
  # The default implementation uses a git repo as a backing store, where the
  # podspecs are namespaced as:
  #
  #     "#{SPEC_NAME}/#{VERSION}/#{SPEC_NAME}.podspec"
  #
  class Source
    # The default branch in which the specs are stored
    DEFAULT_SPECS_BRANCH = 'master'.freeze

    # @return [Pod::Source::Metadata] The metadata for this source.
    #
    attr_reader :metadata

    # @param  [Pathname, String] repo @see #repo.
    #
    def initialize(repo)
      @repo = Pathname(repo).expand_path
      @versions_by_name = {}
      refresh_metadata
    end

    # @return [String] The name of the source.
    #
    def name
      repo.basename.to_s
    end

    # @return [String] The URL of the source.
    #
    # @note In the past we had used `git ls-remote --get-url`, but this could
    #       lead to an issue when finding a source based on its URL when `git`
    #       is configured to rewrite URLs with the `url.<base>.insteadOf`
    #       option. See https://github.com/CocoaPods/CocoaPods/issues/2724.
    #
    def url
      @url ||= begin
        remote = repo_git(%w(config --get remote.origin.url))
        if !remote.empty?
          remote
        elsif (repo + '.git').exist?
          "file://#{repo}/.git"
        end
      end
    end

    # @return [String] The type of the source.
    #
    def type
      git? ? 'git' : 'file system'
    end

    alias_method :to_s, :name

    # @return [Integer] compares a source with another one for sorting
    #         purposes.
    #
    # @note   Source are compared by the alphabetical order of their name, and
    #         this convention should be used in any case where sources need to
    #         be disambiguated.
    #
    def <=>(other)
      name <=> other.name
    end

    # @return [String] A description suitable for debugging.
    #
    def inspect
      "#<#{self.class} name:#{name} type:#{type}>"
    end

    # @!group Paths
    #-------------------------------------------------------------------------#

    # @return [Pathname] The path where the source is stored.
    #
    attr_reader :repo

    # @return [Pathname] The directory where the specs are stored.
    #
    # @note   In previous versions of CocoaPods they used to be stored in
    #         the root of the repo. This lead to issues, especially with
    #         the GitHub interface and now they are stored in a dedicated
    #         folder.
    #
    def specs_dir
      @specs_dir ||= begin
        specs_sub_dir = repo + 'Specs'
        if specs_sub_dir.exist?
          specs_sub_dir
        elsif repo.exist?
          repo
        end
      end
    end

    # @param  [String] name The name of the pod.
    #
    # @return [Pathname] The path at which the specs for the given pod are
    #         stored.
    #
    def pod_path(name)
      specs_dir.join(*metadata.path_fragment(name))
    end

    # @return [Pathname] The path at which source metadata is stored.
    #
    def metadata_path
      repo + 'CocoaPods-version.yml'
    end

    public

    # @!group Querying the source
    #-------------------------------------------------------------------------#

    # @return [Array<String>] the list of the name of all the Pods.
    #
    #
    def pods
      unless specs_dir
        raise Informative, "Unable to find a source named: `#{name}`"
      end
      glob = specs_dir.join('*/' * metadata.prefix_lengths.size, '*')
      Pathname.glob(glob).reduce([]) do |pods, entry|
        pods << entry.basename.to_s if entry.directory?
        pods
      end.sort
    end

    # Returns pod names for given array of specification paths.
    #
    # @param  [Array<String>] spec_paths
    #         Array of file path names for specifications. Path strings should be relative to the source path.
    #
    # @return [Array<String>] the list of the name of Pods corresponding to specification paths.
    #
    def pods_for_specification_paths(spec_paths)
      spec_paths.map do |path|
        absolute_path = repo + path
        relative_path = absolute_path.relative_path_from(specs_dir)
        # The first file name returned by 'each_filename' is the pod name
        relative_path.each_filename.first
      end
    end

    # @return [Array<Version>] all the available versions for the Pod, sorted
    #         from highest to lowest.
    #
    # @param  [String] name
    #         the name of the Pod.
    #
    def versions(name)
      return nil unless specs_dir
      raise ArgumentError, 'No name' unless name
      pod_dir = pod_path(name)
      return unless pod_dir.exist?
      @versions_by_name[name] ||= pod_dir.children.map do |v|
        next nil unless v.directory?
        basename = v.basename.to_s
        next unless basename[0, 1] != '.'
        begin
          Version.new(basename)
        rescue ArgumentError
          raise Informative, 'An unexpected version directory ' \
           "`#{basename}` was encountered for the " \
           "`#{pod_dir}` Pod in the `#{name}` repository."
        end
      end.compact.sort.reverse
    end

    # @return [Specification] the specification for a given version of Pod.
    #
    # @param  @see specification_path
    #
    def specification(name, version)
      Specification.from_file(specification_path(name, version))
    end

    # Returns the path of the specification with the given name and version.
    #
    # @param  [String] name
    #         the name of the Pod.
    #
    # @param  [Version,String] version
    #         the version for the specification.
    #
    # @return [Pathname] The path of the specification.
    #
    def specification_path(name, version)
      raise ArgumentError, 'No name' unless name
      raise ArgumentError, 'No version' unless version
      path = pod_path(name) + version.to_s
      specification_path = path + "#{name}.podspec.json"
      unless specification_path.exist?
        specification_path = path + "#{name}.podspec"
      end
      unless specification_path.exist?
        raise StandardError, "Unable to find the specification #{name} " \
          "(#{version}) in the #{self.name} source."
      end
      specification_path
    end

    # @return [Array<Specification>] all the specifications contained by the
    #         source.
    #
    def all_specs
      glob = specs_dir.join('*/' * metadata.prefix_lengths.size, '*', '*', '*.podspec{.json,}')
      specs = Pathname.glob(glob).map do |path|
        begin
          Specification.from_file(path)
        rescue
          CoreUI.warn "Skipping `#{path.relative_path_from(repo)}` because the " \
                      'podspec contains errors.'
          next
        end
      end
      specs.compact
    end

    # Returns the set for the Pod with the given name.
    #
    # @param  [String] pod_name
    #         The name of the Pod.
    #
    # @return [Sets] the set.
    #
    def set(pod_name)
      Specification::Set.new(pod_name, self)
    end

    # @return [Array<Sets>] the sets of all the Pods.
    #
    def pod_sets
      pods.map { |pod_name| set(pod_name) }
    end

    public

    # @!group Searching the source
    #-------------------------------------------------------------------------#

    # @return [Set] a set for a given dependency. The set is identified by the
    #               name of the dependency and takes into account subspecs.
    #
    # @note   This method is optimized for fast lookups by name, i.e. it does
    #         *not* require iterating through {#pod_sets}
    #
    # @todo   Rename to #load_set
    #
    def search(query)
      unless specs_dir
        raise Informative, "Unable to find a source named: `#{name}`"
      end
      if query.is_a?(Dependency)
        query = query.root_name
      end

      if (versions = @versions_by_name[query]) && !versions.empty?
        set = set(query)
        return set if set.specification_name == query
      end

      found = []
      Pathname.glob(pod_path(query)) do |path|
        next unless Dir.foreach(path).any? { |child| child != '.' && child != '..' }
        found << path.basename.to_s
      end

      if [query] == found
        set = set(query)
        set if set.specification_name == query
      end
    end

    # @return [Array<Set>] The list of the sets that contain the search term.
    #
    # @param  [String] query
    #         the search term. Can be a regular expression.
    #
    # @param  [Boolean] full_text_search
    #         whether the search should be limited to the name of the Pod or
    #         should include also the author, the summary, and the description.
    #
    # @note   full text search requires to load the specification for each pod,
    #         hence is considerably slower.
    #
    # @todo   Rename to #search
    #
    def search_by_name(query, full_text_search = false)
      regexp_query = /#{query}/i
      if full_text_search
        pod_sets.reject do |set|
          texts = []
          begin
            s = set.specification
            texts << s.name
            texts += s.authors.keys
            texts << s.summary
            texts << s.description
          rescue
            CoreUI.warn "Skipping `#{set.name}` because the podspec " \
              'contains errors.'
          end
          texts.grep(regexp_query).empty?
        end
      else
        names = pods.grep(regexp_query)
        names.map { |pod_name| set(pod_name) }
      end
    end

    # Returns the set of the Pod whose name fuzzily matches the given query.
    #
    # @param  [String] query
    #         The query to search for.
    #
    # @return [Set] The name of the Pod.
    # @return [Nil] If no Pod with a suitable name was found.
    #
    def fuzzy_search(query)
      require 'fuzzy_match'
      pod_name = FuzzyMatch.new(pods).find(query)
      if pod_name
        search(pod_name)
      end
    end

    # @!group Updating the source
    #-------------------------------------------------------------------------#

    # Updates the local clone of the source repo.
    #
    # @param  [Boolean] show_output
    #
    # @return  [Array<String>] changed_spec_paths
    #          Returns the list of changed spec paths.
    #
    def update(show_output)
      return [] if unchanged_github_repo?
      prev_commit_hash = git_commit_hash
      update_git_repo(show_output)
      @versions_by_name.clear
      refresh_metadata
      if version = metadata.last_compatible_version(Version.new(CORE_VERSION))
        tag = "v#{version}"
        CoreUI.warn "Using the `#{tag}` tag of the `#{name}` source because " \
          "it is the last version compatible with CocoaPods #{CORE_VERSION}."
        repo_git(['checkout', tag])
      end
      diff_until_commit_hash(prev_commit_hash)
    end

    def updateable?
      git?
    end

    def git?
      repo.join('.git').exist? && !repo_git(%w(rev-parse HEAD)).empty?
    end

    def indexable?
      true
    end

    def verify_compatibility!
      return if metadata.compatible?(CORE_VERSION)

      version_msg = if metadata.minimum_cocoapods_version == metadata.maximum_cocoapods_version
                      metadata.minimum_cocoapods_version
                    else
                      "#{metadata.minimum_cocoapods_version} - #{metadata.maximum_cocoapods_version}"
                    end
      raise Informative, "The `#{name}` repo requires " \
        "CocoaPods #{version_msg} (currently using #{CORE_VERSION})\n" \
        'Update CocoaPods, or checkout the appropriate tag in the repo.'
    end

    public

    # @!group Representations
    #-------------------------------------------------------------------------#

    # @return [Hash{String=>{String=>Specification}}] the static representation
    #         of all the specifications grouped first by name and then by
    #         version.
    #
    def to_hash
      hash = {}
      all_specs.each do |spec|
        hash[spec.name] ||= {}
        hash[spec.name][spec.version.version] = spec.to_hash
      end
      hash
    end

    # @return [String] the YAML encoded {to_hash} representation.
    #
    def to_yaml
      require 'yaml'
      to_hash.to_yaml
    end

    private

    # @group Private Helpers
    #-------------------------------------------------------------------------#

    # Loads the specification for the given Pod gracefully.
    #
    # @param  [String] name
    #         the name of the Pod.
    #
    # @return [Specification] The specification for the last version of the
    #         Pod.
    # @return [Nil] If the spec could not be loaded.
    #
    def load_spec_gracefully(name)
      versions = versions(name)
      version = versions.sort.last if versions
      specification(name, version) if version
    rescue Informative
      Pod::CoreUI.warn "Skipping `#{name}` because the podspec " \
        'contains errors.'
      nil
    end

    def refresh_metadata
      @metadata = Metadata.from_file(metadata_path)
    end

    def git_commit_hash
      repo_git(%w(rev-parse HEAD))
    end

    def update_git_repo(show_output = false)
      repo_git(['checkout', git_tracking_branch])
      output = repo_git(%w(pull --ff-only), :include_error => true)
      CoreUI.puts output if show_output
    end

    def git_tracking_branch
      path = repo.join('.git', 'cocoapods_branch')
      path.file? ? path.read.strip : DEFAULT_SPECS_BRANCH
    end

    def diff_until_commit_hash(commit_hash)
      repo_git(%W(diff --name-only #{commit_hash}..HEAD)).split("\n")
    end

    def repo_git(args, include_error: false)
      command = "env -u GIT_CONFIG git -C \"#{repo}\" " << args.join(' ')
      command << ' 2>&1' if include_error
      (`#{command}` || '').strip
    end

    def unchanged_github_repo?
      return unless url =~ /github.com/
      !GitHub.modified_since_commit(url, git_commit_hash)
    end

    #-------------------------------------------------------------------------#
  end
end
