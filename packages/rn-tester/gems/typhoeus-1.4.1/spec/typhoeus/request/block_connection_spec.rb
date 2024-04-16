require 'spec_helper'

describe Typhoeus::Request::BlockConnection do
  let(:base_url) { "localhost:3001" }
  let(:request) { Typhoeus::Request.new(base_url, {:method => :get}) }

  describe "run" do
    context "when blocked" do
      before { request.block_connection = true }

      it "raises" do
        expect{ request.run }.to raise_error(Typhoeus::Errors::NoStub)
      end
    end

    context "when not blocked" do
      before { request.block_connection = false }

      it "doesn't raise" do
        expect{ request.run }.to_not raise_error
      end
    end
  end

  describe "#blocked?" do
    context "when local block_connection" do
      context "when true" do
        before { request.block_connection = true }

        it "returns true" do
          expect(request.blocked?).to be_truthy
        end
      end

      context "when false" do
        before { request.block_connection = false }

        it "returns false" do
          expect(request.blocked?).to be_falsey
        end
      end
    end

    context "when global block_connection" do
      context "when true" do
        before { Typhoeus::Config.block_connection = true }
        after { Typhoeus::Config.block_connection = false }

        it "returns true" do
          expect(request.blocked?).to be_truthy
        end
      end

      context "when false" do
        before { Typhoeus::Config.block_connection = false }

        it "returns false" do
          expect(request.blocked?).to be_falsey
        end
      end
    end

    context "when global and local block_connection" do
      before do
        Typhoeus::Config.block_connection = true
        request.block_connection = false
      end
      after { Typhoeus::Config.block_connection = false }

      it "takes local" do
        expect(request.blocked?).to be_falsey
      end
    end
  end
end
