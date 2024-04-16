require 'spec_helper'

describe Typhoeus do
  before(:each) do
    Typhoeus.configure { |config| config.verbose = false; config.block_connection = false }
  end

  describe ".configure" do
    it "yields config" do
      Typhoeus.configure do |config|
        expect(config).to be_a(Typhoeus::Config)
      end
    end

    it "sets values config" do
      Typhoeus::Config.verbose = true
      expect(Typhoeus::Config.verbose).to be_truthy
    end
  end

  describe ".stub" do
    let(:base_url) { "www.example.com" }

    shared_examples "lazy response construction" do
      it "calls the block to construct a response when a request matches the stub" do
        expected_response = Typhoeus::Response.new
        Typhoeus.stub(base_url) do |request|
          expected_response
        end

        response = Typhoeus.get(base_url)

        expect(response).to be(expected_response)
      end
    end

    context "when no similar expectation exists" do
      include_examples "lazy response construction"

      it "returns expectation" do
        expect(Typhoeus.stub(base_url)).to be_a(Typhoeus::Expectation)
      end

      it "adds expectation" do
        Typhoeus.stub(:get, "")
        expect(Typhoeus::Expectation.all.size).to eq(1)
      end
    end

    context "when similar expectation exists" do
      include_examples "lazy response construction"

      let(:expectation) { Typhoeus::Expectation.new(base_url) }
      before { Typhoeus::Expectation.all << expectation }

      it "returns expectation" do
        expect(Typhoeus.stub(base_url)).to be_a(Typhoeus::Expectation)
      end

      it "doesn't add expectation" do
        Typhoeus.stub(base_url)
        expect(Typhoeus::Expectation.all.size).to eq(1)
      end
    end
  end

  describe ".before" do
    it "adds callback" do
      Typhoeus.before { true }
      expect(Typhoeus.before.size).to eq(1)
    end
  end

  describe ".with_connection" do
    it "executes block with block connection is false" do
      Typhoeus.with_connection { expect(Typhoeus::Config.block_connection).to be(false) }
    end

    it "sets block connection back to previous value" do
      Typhoeus::Config.block_connection = true
      Typhoeus.with_connection {}
      expect(Typhoeus::Config.block_connection).to be(true)
    end

    it "returns result of block" do
      expect(Typhoeus.with_connection { "123" }).to eq("123")
    end
  end

  [:get, :post, :put, :delete, :head, :patch, :options].each do |name|
    describe ".#{name}" do
      let(:response) { Typhoeus::Request.method(name).call("http://localhost:3001") }

      it "returns ok" do
        expect(response.return_code).to eq(:ok)
      end

      unless name == :head
        it "makes #{name.to_s.upcase} requests" do
          expect(response.response_body).to include("\"REQUEST_METHOD\":\"#{name.to_s.upcase}\"")
        end
      end
    end
  end
end
