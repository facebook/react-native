require 'spec_helper'

describe Typhoeus::Config do
  let(:config) { Typhoeus::Config }

  [:block_connection, :memoize, :verbose, :cache, :user_agent, :proxy].each do |name|
    it "responds to #{name}" do
      expect(config).to respond_to(name)
    end

    it "responds to #{name}=" do
      expect(config).to respond_to("#{name}=")
    end
  end
end
