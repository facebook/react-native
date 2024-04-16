require 'spec_helper'

describe Typhoeus::Hydra::BlockConnection do
  let(:base_url) { "localhost:3001" }
  let(:hydra) { Typhoeus::Hydra.new() }
  let(:request) { Typhoeus::Request.new(base_url, {:method => :get}) }

  describe "add" do
    context "when block_connection activated" do
      before { Typhoeus::Config.block_connection = true }
      after { Typhoeus::Config.block_connection = false }

      it "raises" do
        expect{ hydra.add(request) }.to raise_error(Typhoeus::Errors::NoStub)
      end
    end
  end
end
