require 'bundler'
require 'bundler/gem_helper'

class FfiGemHelper < Bundler::GemHelper
  attr_accessor :cross_platforms

  def install
    super

    task "release:guard_clean" => ["release:update_history"]

    task "release:update_history" do
      update_history
    end

    task "release:rubygem_push" => ["gem:native", "gem:java"]
  end

  def hfile
    "CHANGELOG.md"
  end

  def headline
    '([^\w]*)(\d+\.\d+\.\d+(?:\.\w+)?)([^\w]+)([2Y][0Y][0-9Y][0-9Y]-[0-1M][0-9M]-[0-3D][0-9D])([^\w]*|$)'
  end

  def reldate
    Time.now.strftime("%Y-%m-%d")
  end

  def update_history
    hin = File.read(hfile)
    hout = hin.sub(/#{headline}/) do
      raise "#{hfile} isn't up-to-date for version #{version}" unless $2==version.to_s
      $1 + $2 + $3 + reldate + $5
    end
    if hout != hin
      Bundler.ui.confirm "Updating #{hfile} for release."
      File.write(hfile, hout)
      Rake::FileUtilsExt.sh "git", "commit", hfile, "-m", "Update release date in #{hfile}"
    end
  end

  def tag_version
    Bundler.ui.confirm "Tag release with annotation:"
    m = File.read(hfile).match(/(?<annotation>#{headline}.*?)#{headline}/m) || raise("Unable to find release notes in #{hfile}")
    Bundler.ui.info(m[:annotation].gsub(/^/, "    "))
    IO.popen(["git", "tag", "--file=-", version_tag], "w") do |fd|
      fd.write m[:annotation]
    end
    yield if block_given?
  rescue
    Bundler.ui.error "Untagging #{version_tag} due to error."
    sh_with_code "git tag -d #{version_tag}"
    raise
  end

  def rubygem_push(path)
    cross_platforms.each do |ruby_platform|
      super(path.gsub(/\.gem\z/, "-#{ruby_platform}.gem"))
    end
    super(path.gsub(/\.gem\z/, "-java.gem"))
    super(path)
  end
end
