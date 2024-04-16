
module Pod
  class Command
    class Spec < Command
      class Create < Spec
        self.summary = 'Create spec file stub.'

        self.description = <<-DESC
          Creates a PodSpec, in the current working dir, called `NAME.podspec'.
          If a GitHub url is passed the spec is prepopulated.
        DESC

        self.arguments = [
          CLAide::Argument.new(%w(NAME https://github.com/USER/REPO), false),
        ]

        def initialize(argv)
          @name_or_url = argv.shift_argument
          @url = argv.shift_argument
          super
        end

        def validate!
          super
          help! 'A pod name or repo URL is required.' unless @name_or_url
        end

        def run
          if repo_id_match = (@url || @name_or_url).match(%r{github.com/([^/\.]*\/[^/\.]*)\.*})
            repo_id = repo_id_match[1]
            data = github_data_for_template(repo_id)
            data[:name] = @name_or_url if @url
            UI.puts semantic_versioning_notice(repo_id, data[:name]) if data[:version] == '0.0.1'
          else
            data = default_data_for_template(@name_or_url)
          end

          spec = spec_template(data)
          (Pathname.pwd + "#{data[:name]}.podspec").open('w') { |f| f << spec }
          UI.puts "\nSpecification created at #{data[:name]}.podspec".green
        end

        private

        #--------------------------------------#

        # Templates and GitHub information retrieval for spec create
        #
        # @todo It would be nice to have a template class that accepts options
        #       and uses the default ones if not provided.
        # @todo The template is outdated.

        def default_data_for_template(name)
          {
            :name => name,
            :version => '0.0.1',
            :summary =>  "A short description of #{name}.",
            :homepage => "http://EXAMPLE/#{name}",
            :author_name => Executable.capture_command('git', %w(config --get user.name), :capture => :out).first.strip,
            :author_email => Executable.capture_command('git', %w(config --get user.email), :capture => :out).first.strip,
            :source_url => "http://EXAMPLE/#{name}.git",
            :ref_type => ':tag',
            :ref => '#{spec.version}',
          }
        end

        def github_data_for_template(repo_id)
          repo = GitHub.repo(repo_id)
          raise Informative, "Unable to fetch data for `#{repo_id}`" unless repo
          user = GitHub.user(repo['owner']['login'])
          raise Informative, "Unable to fetch data for `#{repo['owner']['login']}`" unless user
          data = {}

          data[:name]          = repo['name']
          data[:summary]       = (repo['description'] || '').gsub(/["]/, '\"')
          data[:homepage]      = (repo['homepage'] && !repo['homepage'].empty?) ? repo['homepage'] : repo['html_url']
          data[:author_name]   = user['name'] || user['login']
          data[:author_email]  = user['email'] || 'email@address.com'
          data[:source_url]    = repo['clone_url']

          data.merge suggested_ref_and_version(repo)
        end

        def suggested_ref_and_version(repo)
          tags = GitHub.tags(repo['html_url']).map { |tag| tag['name'] }
          versions_tags = {}
          tags.each do |tag|
            clean_tag = tag.gsub(/^v(er)? ?/, '')
            versions_tags[Gem::Version.new(clean_tag)] = tag if Gem::Version.correct?(clean_tag)
          end
          version = versions_tags.keys.sort.last || '0.0.1'
          data = { :version => version }
          if version == '0.0.1'
            branches        = GitHub.branches(repo['html_url'])
            master_name     = repo['master_branch'] || 'master'
            master          = branches.find { |branch| branch['name'] == master_name }
            raise Informative, "Unable to find any commits on the master branch for the repository `#{repo['html_url']}`" unless master
            data[:ref_type] = ':commit'
            data[:ref]      = master['commit']['sha']
          else
            data[:ref_type] = ':tag'
            data[:ref]      = versions_tags[version]
            data[:ref]      = '#{spec.version}' if "#{version}" == versions_tags[version]
            data[:ref]      = 'v#{spec.version}' if "v#{version}" == versions_tags[version]
          end
          data
        end

        def spec_template(data)
          <<-SPEC
#
#  Be sure to run `pod spec lint #{data[:name]}.podspec' to ensure this is a
#  valid spec and to remove all comments including this before submitting the spec.
#
#  To learn more about Podspec attributes see https://guides.cocoapods.org/syntax/podspec.html
#  To see working Podspecs in the CocoaPods repo see https://github.com/CocoaPods/Specs/
#

Pod::Spec.new do |spec|

  # ―――  Spec Metadata  ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  These will help people to find your library, and whilst it
  #  can feel like a chore to fill in it's definitely to your advantage. The
  #  summary should be tweet-length, and the description more in depth.
  #

  spec.name         = "#{data[:name]}"
  spec.version      = "#{data[:version]}"
  spec.summary      = "#{data[:summary]}"

  # This description is used to generate tags and improve search results.
  #   * Think: What does it do? Why did you write it? What is the focus?
  #   * Try to keep it short, snappy and to the point.
  #   * Write the description between the DESC delimiters below.
  #   * Finally, don't worry about the indent, CocoaPods strips it!
  spec.description  = <<-DESC
                   DESC

  spec.homepage     = "#{data[:homepage]}"
  # spec.screenshots  = "www.example.com/screenshots_1.gif", "www.example.com/screenshots_2.gif"


  # ―――  Spec License  ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  Licensing your code is important. See https://choosealicense.com for more info.
  #  CocoaPods will detect a license file if there is a named LICENSE*
  #  Popular ones are 'MIT', 'BSD' and 'Apache License, Version 2.0'.
  #

  spec.license      = "MIT (example)"
  # spec.license      = { :type => "MIT", :file => "FILE_LICENSE" }


  # ――― Author Metadata  ――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  Specify the authors of the library, with email addresses. Email addresses
  #  of the authors are extracted from the SCM log. E.g. $ git log. CocoaPods also
  #  accepts just a name if you'd rather not provide an email address.
  #
  #  Specify a social_media_url where others can refer to, for example a twitter
  #  profile URL.
  #

  spec.author             = { "#{data[:author_name]}" => "#{data[:author_email]}" }
  # Or just: spec.author    = "#{data[:author_name]}"
  # spec.authors            = { "#{data[:author_name]}" => "#{data[:author_email]}" }
  # spec.social_media_url   = "https://twitter.com/#{data[:author_name]}"

  # ――― Platform Specifics ――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  If this Pod runs only on iOS or OS X, then specify the platform and
  #  the deployment target. You can optionally include the target after the platform.
  #

  # spec.platform     = :ios
  # spec.platform     = :ios, "5.0"

  #  When using multiple platforms
  # spec.ios.deployment_target = "5.0"
  # spec.osx.deployment_target = "10.7"
  # spec.watchos.deployment_target = "2.0"
  # spec.tvos.deployment_target = "9.0"
  # spec.visionos.deployment_target = "1.0"


  # ――― Source Location ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  Specify the location from where the source should be retrieved.
  #  Supports git, hg, bzr, svn and HTTP.
  #

  spec.source       = { :git => "#{data[:source_url]}", #{data[:ref_type]} => "#{data[:ref]}" }


  # ――― Source Code ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  CocoaPods is smart about how it includes source code. For source files
  #  giving a folder will include any swift, h, m, mm, c & cpp files.
  #  For header files it will include any header in the folder.
  #  Not including the public_header_files will make all headers public.
  #

  spec.source_files  = "Classes", "Classes/**/*.{h,m}"
  spec.exclude_files = "Classes/Exclude"

  # spec.public_header_files = "Classes/**/*.h"


  # ――― Resources ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  A list of resources included with the Pod. These are copied into the
  #  target bundle with a build phase script. Anything else will be cleaned.
  #  You can preserve files from being cleaned, please don't preserve
  #  non-essential files like tests, examples and documentation.
  #

  # spec.resource  = "icon.png"
  # spec.resources = "Resources/*.png"

  # spec.preserve_paths = "FilesToSave", "MoreFilesToSave"


  # ――― Project Linking ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  Link your library with frameworks, or libraries. Libraries do not include
  #  the lib prefix of their name.
  #

  # spec.framework  = "SomeFramework"
  # spec.frameworks = "SomeFramework", "AnotherFramework"

  # spec.library   = "iconv"
  # spec.libraries = "iconv", "xml2"


  # ――― Project Settings ――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  If your library depends on compiler flags you can set them in the xcconfig hash
  #  where they will only apply to your library. If you depend on other Podspecs
  #  you can include multiple dependencies to ensure it works.

  # spec.requires_arc = true

  # spec.xcconfig = { "HEADER_SEARCH_PATHS" => "$(SDKROOT)/usr/include/libxml2" }
  # spec.dependency "JSONKit", "~> 1.4"

end
          SPEC
        end

        def semantic_versioning_notice(repo_id, repo)
          <<-EOS

#{'――― MARKDOWN TEMPLATE ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――'.reversed}

I’ve recently added [#{repo}](https://github.com/CocoaPods/Specs/tree/master/#{repo}) to the [CocoaPods](https://github.com/CocoaPods/CocoaPods) package manager repo.

CocoaPods is a tool for managing dependencies for OSX and iOS Xcode projects and provides a central repository for iOS/OSX libraries. This makes adding libraries to a project and updating them extremely easy and it will help users to resolve dependencies of the libraries they use.

However, #{repo} doesn't have any version tags. I’ve added the current HEAD as version 0.0.1, but a version tag will make dependency resolution much easier.

[Semantic version](https://semver.org) tags (instead of plain commit hashes/revisions) allow for [resolution of cross-dependencies](https://github.com/CocoaPods/Specs/wiki/Cross-dependencies-resolution-example).

In case you didn’t know this yet; you can tag the current HEAD as, for instance, version 1.0.0, like so:

```
$ git tag -a 1.0.0 -m "Tag release 1.0.0"
$ git push --tags
```

#{'――― TEMPLATE END ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――'.reversed}

#{'[!] This repo does not appear to have semantic version tags.'.yellow}

After commiting the specification, consider opening a ticket with the template displayed above:
  - link:  https://github.com/#{repo_id}/issues/new
  - title: Please add semantic version tags
          EOS
        end
      end
    end
  end
end
