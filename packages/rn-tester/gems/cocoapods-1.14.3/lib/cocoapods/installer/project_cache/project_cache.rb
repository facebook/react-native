module Pod
  class Installer
    module ProjectCache
      autoload :ProjectCacheAnalyzer,       'cocoapods/installer/project_cache/project_cache_analyzer'
      autoload :ProjectInstallationCache,   'cocoapods/installer/project_cache/project_installation_cache'
      autoload :ProjectMetadataCache,       'cocoapods/installer/project_cache/project_metadata_cache'
      autoload :ProjectCacheAnalysisResult, 'cocoapods/installer/project_cache/project_cache_analysis_result'
      autoload :ProjectCacheVersion,        'cocoapods/installer/project_cache/project_cache_version'
    end
  end
end
