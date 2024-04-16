module Pod
  class TrunkSource < CDNSource
    # On-disk master repo name
    TRUNK_REPO_NAME = 'trunk'.freeze

    # Remote CDN repo URL
    TRUNK_REPO_URL = 'https://cdn.cocoapods.org/'.freeze

    def url
      @url ||= TRUNK_REPO_URL
      super
    end
  end
end
