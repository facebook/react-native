# frozen_string_literal: true

namespace :git do
  namespace :tag do
    desc "List tags from the Git repository"
    task :list do
      tags = `git tag -l`
      tags.gsub!("\r", "")
      tags = tags.split("\n").sort {|a, b| b <=> a }
      puts tags.join("\n")
    end

    desc "Create a new tag in the Git repository"
    task :create do
      changelog = File.open("CHANGELOG.md", "r") { |file| file.read }
      puts "-" * 80
      puts changelog
      puts "-" * 80
      puts

      v = ENV["VERSION"] or abort "Must supply VERSION=x.y.z"
      abort "Versions don't match #{v} vs #{PKG_VERSION}" if v != PKG_VERSION

      git_status = `git status`
      if git_status !~ /^nothing to commit/
        abort "Working directory isn't clean."
      end

      tag = "#{PKG_NAME}-#{PKG_VERSION}"
      msg = "Release #{PKG_NAME}-#{PKG_VERSION}"

      existing_tags = `git tag -l #{PKG_NAME}-*`.split('\n')
      if existing_tags.include?(tag)
        warn("Tag already exists, deleting...")
        unless system "git tag -d #{tag}"
          abort "Tag deletion failed."
        end
      end
      puts "Creating git tag '#{tag}'..."
      unless system "git tag -a -m \"#{msg}\" #{tag}"
        abort "Tag creation failed."
      end
    end
  end
end

task "gem:release" => "git:tag:create"
