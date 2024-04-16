# encoding: UTF-8
require File.expand_path(File.join(File.dirname(__FILE__), 'spec_helper'))
require 'securerandom'

describe 'Account client' do
  before(:all) do
    client_1 = Algolia::Client.new({
                                       :application_id => ENV['ALGOLIA_APPLICATION_ID_1'],
                                       :api_key => ENV['ALGOLIA_ADMIN_KEY_1']
                                   })

    @index_1 = client_1.init_index(index_name('account_client_1'))

    client_2 = Algolia::Client.new({
                                       :application_id => ENV['ALGOLIA_APPLICATION_ID_1'],
                                       :api_key => ENV['ALGOLIA_ADMIN_KEY_1']
                                   })

    @index_2 = client_2.init_index(index_name('account_client_2'))

    client_3 = Algolia::Client.new({
                                       :application_id => ENV['ALGOLIA_APPLICATION_ID_2'],
                                       :api_key => ENV['ALGOLIA_ADMIN_KEY_2']
                                   })

    @index_3 = client_3.init_index(index_name('account_client_3'))

    @index_1.delete_index rescue 'not fatal'
    @index_2.delete_index rescue 'not fatal'
    @index_3.delete_index rescue 'not fatal'
  end

  after(:all) do
    @index_1.delete_index rescue 'not fatal'
    @index_2.delete_index rescue 'not fatal'
    @index_3.delete_index rescue 'not fatal'
  end

  it 'should not allow operations in the same application' do
    expect {
      Algolia::AccountClient.copy_index!(@index_1, @index_2)
    }.to raise_exception(
             Algolia::AlgoliaError,
             'The indexes are in the same application. Use Algolia::Client.copy_index instead.'
         )
  end

  it 'should perform a cross app copy index and assert that destination must not exist' do

    @index_1.save_objects!(1.upto(1500).map { |i| { :objectID => i, :i => i } })

    @index_1.batch_rules! ([
        {
            :objectID => 'one',
            :condition => {:pattern => 'test', :anchoring => 'contains'},
            :consequence => {:params => {:query => 'this is better'}}
        }
    ])

    @index_1.batch_synonyms! ([
        {:objectID => 'one', :type => 'synonym', :synonyms => ['San Francisco', 'SF']}
    ])

    @index_1.set_settings! ({:searchableAttributes => ['objectID']})

    Algolia::AccountClient.copy_index!(@index_1, @index_3)

    res = @index_3.search('')
    res['nbHits'].should eq(1500)

    res = @index_3.search_rules('')['hits']
    res.size.should eq(1)
    res[0]['objectID'].should eq('one')

    res = @index_3.search_synonyms('')['hits']
    res.size.should eq(1)
    res[0]['objectID'].should eq('one')

    @index_3.get_settings['searchableAttributes'].should eq(['objectID'])

    expect {
      Algolia::AccountClient.copy_index!(@index_1, @index_3)
    }.to raise_exception(
             Algolia::AlgoliaError,
             'Destination index already exists. Please delete it before copying index across applications.'
         )
  end
end

