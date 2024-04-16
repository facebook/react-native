require File.expand_path('../spec_helper', File.dirname(__FILE__))

# The CocoaPods namespace
#
module Pod
  describe Command::GemHelper do
    before do
      UI.output = ''
    end

    after do
      mocha_teardown
    end

    it 'detects if a gem is installed' do
      Command::GemHelper.gem_installed?('bacon').should.be.true
      Command::GemHelper.gem_installed?('fake-fake-fake-gem').should.be.false
    end

    it 'detects if a specific version of a gem is installed' do
      Command::GemHelper.gem_installed?('bacon', Bacon::VERSION).should.be.true
      impossibacon = Gem::Version.new(Bacon::VERSION).bump
      Command::GemHelper.gem_installed?('bacon', impossibacon).should.be.false
    end

    it 'creates a version list that includes all versions of a single gem' do
      spec2 = Gem::NameTuple.new('cocoapods-plugins', Gem::Version.new('0.2.0'))
      spec1 = Gem::NameTuple.new('cocoapods-plugins', Gem::Version.new('0.1.0'))
      response = [{ 1 => [spec2, spec1] }, []]
      Gem::SpecFetcher.any_instance.stubs(:available_specs).returns(response)

      @cache = Command::GemIndexCache.new
      @cache.download_and_cache_specs
      versions_string =
        Command::GemHelper.versions_string('cocoapods-plugins', @cache)
      versions_string.should.include('0.2.0')
      versions_string.should.include('0.1.0')
    end
  end
end
