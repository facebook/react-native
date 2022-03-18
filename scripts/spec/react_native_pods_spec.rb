require_relative "../react_native_pods"


# Inject dependencies for CocoaPods because rspec doesn't run by CocoaPods.
module Pod
  class UI
    def self.warn(message)
      Kernel::puts(message)
    end
    def self.puts(message)
    end
  end # class UI

  class Lockfile
  end # class Lockfile
end # module Pod

def pod(*args)
end

# Inject dependencies non critical functions for `use_react_native!` target
def get_react_codegen_spec(options={})
end

def generate_react_codegen_podspec!(spec)
end

def use_react_native_codegen_discovery!(options={})
end

def checkAndGenerateEmptyThirdPartyProvider!(react_native_path)
end


describe use_react_native! do
  before(:each) do
    @options = {}
    allow(LocalPodspecPatch).to receive(:pods_to_update) do |options|
      @options = options
    end
    .and_return('')

    ENV.delete("RCT_NEW_ARCH_ENABLED")
    ENV.delete("USE_CODEGEN_DISCOVERY")
  end

  context "with get_default_flags" do
    it "should return false values for old architecture" do
      flags = get_default_flags()
      use_react_native!(
        :fabric_enabled => flags[:fabric_enabled],
        :hermes_enabled => flags[:hermes_enabled],
      )
      expect(@options[:fabric_enabled]).to be false
      expect(@options[:hermes_enabled]).to be false
      expect(ENV['RCT_NEW_ARCH_ENABLED']).not_to eq('1')
      expect(ENV['USE_CODEGEN_DISCOVERY']).not_to eq('1')
    end

    it "should return true values when RCT_NEW_ARCH_ENABLED=1" do
      ENV['RCT_NEW_ARCH_ENABLED'] = '1'
      flags = get_default_flags()
      use_react_native!(
        :fabric_enabled => flags[:fabric_enabled],
        :hermes_enabled => flags[:hermes_enabled],
      )
      expect(@options[:fabric_enabled]).to be true
      expect(@options[:hermes_enabled]).to be true
      expect(ENV['RCT_NEW_ARCH_ENABLED']).to eq('1')
      expect(ENV['USE_CODEGEN_DISCOVERY']).to eq('1')
    end

    it "should return hermes_enabled=true when specified explicitly" do
      flags = get_default_flags()
      use_react_native!(
        :fabric_enabled => flags[:fabric_enabled],
        :hermes_enabled => true,
      )
      expect(@options[:fabric_enabled]).to be false
      expect(@options[:hermes_enabled]).to be true
      expect(ENV['RCT_NEW_ARCH_ENABLED']).not_to eq('1')
      expect(ENV['USE_CODEGEN_DISCOVERY']).not_to eq('1')
    end
  end

  context "new_arch_enabled tests" do
    it "should return true values when new_arch_enabled=true" do
      use_react_native!(
        :new_arch_enabled => true,
      )
      expect(@options[:fabric_enabled]).to be true
      expect(@options[:hermes_enabled]).to be true
      expect(ENV['RCT_NEW_ARCH_ENABLED']).to eq('1')
      expect(ENV['USE_CODEGEN_DISCOVERY']).to eq('1')
    end

    it "should support non-hermes in new architecture mode" do
      use_react_native!(
        :hermes_enabled => false,
        :new_arch_enabled => true,
      )
      expect(@options[:fabric_enabled]).to be true
      expect(@options[:hermes_enabled]).to be false
      expect(ENV['RCT_NEW_ARCH_ENABLED']).to eq('1')
      expect(ENV['USE_CODEGEN_DISCOVERY']).to eq('1')
    end

    it "should show a warning when new_arch_enabled=true and fabric_enabled=false" do
      expect(Pod::UI).to receive(:warn).at_least(:once)

      use_react_native!(
        :fabric_enabled => false,
        :new_arch_enabled => true,
      )
      expect(@options[:fabric_enabled]).to be true
      expect(@options[:hermes_enabled]).to be true
      expect(ENV['RCT_NEW_ARCH_ENABLED']).to eq('1')
      expect(ENV['USE_CODEGEN_DISCOVERY']).to eq('1')
    end

    it "should show a warning when new_arch_enabled=false and fabric_enabled=true" do
      expect(Pod::UI).to receive(:warn).at_least(:once)

      use_react_native!(
        :fabric_enabled => true,
        :new_arch_enabled => false,
      )
      expect(@options[:fabric_enabled]).to be false
      expect(@options[:hermes_enabled]).to be false
      expect(ENV['RCT_NEW_ARCH_ENABLED']).not_to eq('1')
      expect(ENV['USE_CODEGEN_DISCOVERY']).not_to eq('1')
    end

    it "should show a warning when new_arch_enabled=true and codegen_discovery_enabled=false" do
      expect(Pod::UI).to receive(:warn).at_least(:once)

      use_react_native!(
        :new_arch_enabled => true,
        :codegen_discovery_enabled => false,
      )
      expect(@options[:codegen_discovery_enabled]).to be true
      expect(ENV['RCT_NEW_ARCH_ENABLED']).to eq('1')
      expect(ENV['USE_CODEGEN_DISCOVERY']).to eq('1')
    end

    it "should show a warning when new_arch_enabled=false and codegen_discovery_enabled=true" do
      expect(Pod::UI).to receive(:warn).at_least(:once)

      use_react_native!(
        :new_arch_enabled => false,
        :codegen_discovery_enabled => true,
      )
      expect(@options[:codegen_discovery_enabled]).to be false
      expect(ENV['RCT_NEW_ARCH_ENABLED']).not_to eq('1')
      expect(ENV['USE_CODEGEN_DISCOVERY']).not_to eq('1')
    end


    it "should support classic codegen" do
      use_react_native!(
        :fabric_enabled => true,
        :hermes_enabled => true,
      )
      expect(@options[:fabric_enabled]).to be true
      expect(@options[:hermes_enabled]).to be true
      expect(ENV['RCT_NEW_ARCH_ENABLED']).not_to eq('1')
      expect(ENV['USE_CODEGEN_DISCOVERY']).not_to eq('1')
    end
  end

end
