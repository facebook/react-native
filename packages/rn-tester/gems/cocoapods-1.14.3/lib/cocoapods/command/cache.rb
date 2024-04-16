require 'cocoapods/downloader'
require 'cocoapods/command/cache/list'
require 'cocoapods/command/cache/clean'

module Pod
  class Command
    class Cache < Command
      self.abstract_command = true
      self.summary = 'Manipulate the CocoaPods cache'

      self.description = <<-DESC
        Manipulate the download cache for pods, like printing the cache content
        or cleaning the pods cache.
      DESC

      def initialize(argv)
        @cache = Downloader::Cache.new(Config.instance.cache_root + 'Pods')
        super
      end

      private

      def pod_type(pod_cache_descriptor)
        pod_cache_descriptor[:release] ? 'Release' : 'External'
      end
    end
  end
end
