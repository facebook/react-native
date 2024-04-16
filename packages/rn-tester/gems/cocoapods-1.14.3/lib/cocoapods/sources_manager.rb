require 'cocoapods-core/source'
require 'cocoapods/open-uri'
require 'netrc'
require 'set'
require 'rest'
require 'yaml'

module Pod
  class Source
    class Manager
      # Returns the source whose {Source#url} is equal to `url`, adding the repo
      # in a manner similarly to `pod repo add` if it is not found.
      #
      # @raise  If no source with the given `url` could be created,
      #
      # @return [Source] The source whose {Source#url} is equal to `url`,
      #
      # @param  [String] url
      #         The URL of the source.
      #
      def find_or_create_source_with_url(url)
        source_with_url(url) || create_source_with_url(url)
      end

      # Adds the source whose {Source#url} is equal to `url`,
      # in a manner similarly to `pod repo add` if it is not found.
      #
      # @raise  If no source with the given `url` could be created,
      #
      # @return [Source] The source whose {Source#url} is equal to `url`,
      #
      # @param  [String] url
      #         The URL of the source.
      #
      def create_source_with_url(url)
        name = name_for_url(url)
        is_cdn = cdn_url?(url)

        # Hack to ensure that `repo add` output is shown.
        previous_title_level = UI.title_level
        UI.title_level = 0

        begin
          if is_cdn
            Command::Repo::AddCDN.parse([name, url]).run
          else
            Command::Repo::Add.parse([name, url]).run
          end
        rescue Informative => e
          message = "Unable to add a source with url `#{url}` " \
            "named `#{name}`.\n"
          message << "(#{e})\n" if Config.instance.verbose?
          message << 'You can try adding it manually in ' \
            "`#{Config.instance.repos_dir}` or via `pod repo add`."
          raise Informative, message
        ensure
          UI.title_level = previous_title_level
        end
        source = source_with_url(url)

        raise "Unable to create a source with URL #{url}" unless source

        source
      end

      # Determines whether `url` is a CocoaPods CDN URL.
      #
      # @return [Boolean] whether `url` is a CocoaPods CDN URL,
      #
      # @param  [String] url
      #         The URL of the source.
      #
      def cdn_url?(url)
        return false unless url =~ %r{^https?:\/\/}

        uri_options = {}

        netrc_info = Netrc.read
        uri = URI.parse(url)
        return false unless uri.userinfo.nil?

        netrc_host = uri.host
        credentials = netrc_info[netrc_host]
        uri_options[:http_basic_authentication] = credentials if credentials

        response = OpenURI.open_uri(url.chomp('/') + '/CocoaPods-version.yml', uri_options)
        response_hash = YAML.load(response.read) # rubocop:disable Security/YAMLLoad
        response_hash.is_a?(Hash) && !Source::Metadata.new(response_hash).latest_cocoapods_version.nil?
      rescue Psych::SyntaxError, ::OpenURI::HTTPError, SocketError
        return false
      rescue => e
        raise Informative, "Couldn't determine repo type for URL: `#{url}`: #{e}"
      end

      # Returns the source whose {Source#name} or {Source#url} is equal to the
      # given `name_or_url`.
      #
      # @return [Source] The source whose {Source#name} or {Source#url} is equal to the
      #                  given `name_or_url`.
      #
      # @param  [String] name_or_url
      #                  The name or the URL of the source.
      #
      def source_with_name_or_url(name_or_url)
        all.find { |s| s.name == name_or_url } ||
          find_or_create_source_with_url(name_or_url)
      end

      # @return [Pathname] The path where the search index should be stored.
      #
      def search_index_path
        @search_index_path ||= Config.instance.search_index_file
      end

      # @!group Updating Sources

      # Updates the local clone of the spec-repo with the given name or of all
      # the git repos if the name is omitted.
      #
      # @param  [String] source_name
      #
      # @param  [Boolean] show_output
      #
      # @return [void]
      #
      def update(source_name = nil, show_output = false)
        if source_name
          sources = [updateable_source_named(source_name)]
        else
          sources = updateable_sources
        end

        changed_spec_paths = {}

        # Do not perform an update if the repos dir has not been setup yet.
        return unless repos_dir.exist?

        # Create the Spec_Lock file if needed and lock it so that concurrent
        # repo updates do not cause each other to fail
        File.open("#{repos_dir}/Spec_Lock", File::CREAT) do |f|
          f.flock(File::LOCK_EX)
          sources.each do |source|
            UI.section "Updating spec repo `#{source.name}`" do
              changed_source_paths = source.update(show_output)
              changed_spec_paths[source] = changed_source_paths if changed_source_paths.count > 0
              source.verify_compatibility!
            end
          end
        end
        # Perform search index update operation in background.
        update_search_index_if_needed_in_background(changed_spec_paths)
      end

      # Adds the provided source to the list of sources
      #
      # @param [Source] source the source to add
      #
      def add_source(source)
        all << source unless all.any? { |s| s.url == source || s.name == source.name }
      end
    end

    extend Executable
    executable :git

    def repo_git(args, include_error: false)
      Executable.capture_command('git', ['-C', repo] + args,
                                 :capture => include_error ? :merge : :out,
                                 :env => {
                                   'GIT_CONFIG' => nil,
                                   'GIT_DIR' => nil,
                                   'GIT_WORK_TREE' => nil,
                                 }
                                ).
        first.strip
    end

    def update_git_repo(show_output = false)
      Config.instance.with_changes(:verbose => show_output) do
        args = %W(-C #{repo} fetch origin)
        args.push('--progress') if show_output
        git!(args)
        current_branch = git!(%W(-C #{repo} rev-parse --abbrev-ref HEAD)).strip
        git!(%W(-C #{repo} reset --hard origin/#{current_branch}))
      end
    rescue
      raise Informative, 'CocoaPods was not able to update the ' \
        "`#{name}` repo. If this is an unexpected issue " \
        'and persists you can inspect it running ' \
        '`pod repo update --verbose`'
    end
  end

  class TrunkSource
    def verify_compatibility!
      super
      latest_cocoapods_version = metadata.latest_cocoapods_version && Gem::Version.create(metadata.latest_cocoapods_version)
      return unless Config.instance.new_version_message? &&
        latest_cocoapods_version &&
        latest_cocoapods_version > Gem::Version.new(Pod::VERSION)

      rc = latest_cocoapods_version.prerelease?
      install_message = !Pathname(__FILE__).dirname.writable? ? 'sudo ' : ''
      install_message << 'gem install cocoapods'
      install_message << ' --pre' if rc
      message = [
        '',
        "CocoaPods #{latest_cocoapods_version} is available.".green,
        "To update use: `#{install_message}`".green,
        ("[!] This is a test version we'd love you to try.".yellow if rc),
        '',
        'For more information, see https://blog.cocoapods.org ' \
        'and the CHANGELOG for this version at ' \
        "https://github.com/CocoaPods/CocoaPods/releases/tag/#{latest_cocoapods_version}".green,
        '',
        '',
      ].compact.join("\n")
      UI.puts(message)
    end
  end
end
