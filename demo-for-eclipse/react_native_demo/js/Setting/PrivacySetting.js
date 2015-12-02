/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('React');
	
var SwitchAndroid = require('SwitchAndroid');
var Text = require('Text');
var StyleSheet = require('StyleSheet');
var PageBlock = require('PageBlock');
var PageView = require('PageView');
var SwitchItem = require('SwitchItem');

var PrivacySettingPage = React.createClass({

  getInitialState : function() {
    return {
      trueSwitchIsOn: true,
      falseSwitchIsOn: false,
      colorTrueSwitchIsOn: true,
    };
  },

  render: function() {
    return (
      <PageView title="隐私设置">
        <PageBlock title="通讯录">
        	<SwitchItem title="允许给我推荐通讯录好友">
	          <SwitchAndroid
	            onValueChange={(value) => this.setState({trueSwitchIsOn: value})}
	            value={this.state.trueSwitchIsOn} />
	        </SwitchItem>
	        
	        <SwitchItem title="允许通过此手机号搜到我">
	          <SwitchAndroid
	            onValueChange={(value) => this.setState({falseSwitchIsOn: value})}
	            value={this.state.falseSwitchIsOn} />
	        </SwitchItem>
          </PageBlock>
        <PageBlock title="哪些人可以评论我的微博" description='关闭后，你的通讯录好友将不能通过通讯录找到你'>
        	<SwitchItem title="所有人"/>
        	<SwitchItem title="我关注的人"/>
        	<SwitchItem title="我的粉丝"/>
        </PageBlock>
        <PageBlock title="">
	        <SwitchItem title="允许评论带图">
		        <SwitchAndroid
		          onValueChange={(value) => this.setState({colorTrueSwitchIsOn: value})}
		          value={this.state.colorTrueSwitchIsOn} />
	        </SwitchItem>
        </PageBlock>
        <PageBlock title="我可以收到哪些人的@提醒" description='关闭后，其他人将不能在你的微博下发布带图片的评论'>
	        <SwitchItem title="所有人"/>
	    	<SwitchItem title="我关注的人"/>
        </PageBlock>
      </PageView>
    );
  }
});

module.exports = PrivacySettingPage;
