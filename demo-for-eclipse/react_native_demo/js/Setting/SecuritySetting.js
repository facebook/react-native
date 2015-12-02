/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('react-native');
	
var Text = require('Text');
var Image = require('Image');
var View =require('View');
var StyleSheet = require('StyleSheet');
var PageBlock = require('PageBlock');
var PageView = require('PageView');
var SwitchItem = require('SwitchItem');

var icon_security = require('image!banner_2x');
var icon_arrow = require('image!common_icon_arrow');

var SecuritySettingPage = React.createClass({

  render: function() {
	  
    return (
      <PageView title="账号安全">
      	<View style={styles.banner}>	
      		<Image source={icon_security} style={styles.base64}/>
      		<Text style={styles.nick}>SmileyFay</Text>
      		<Text style={styles.nick}>(185*****650)</Text>
      	</View>
      	<SwitchItem title="手机号">
      		<Text style={styles.description}>185*****650</Text>
      		<Image source={icon_arrow} style={styles.icon}/>
      	</SwitchItem>
  		<SwitchItem title="修改密码">
  			<Image source={icon_arrow} style={styles.icon}/>
  		</SwitchItem>
  		<SwitchItem title="证件信息"> 
  			<Text style={styles.description}>未设置</Text>
  			<Image source={icon_arrow} style={styles.icon}/>
  		</SwitchItem>
  		<SwitchItem title="安全提醒">
  			<Text style={styles.description}>未设置</Text>
  			<Image source={icon_arrow} style={styles.icon}/>
  		</SwitchItem>
  		<SwitchItem title="微盾提醒">
  			<Text style={styles.description}>未开启</Text>
  			<Image source={icon_arrow} style={styles.icon}/>
  		</SwitchItem>
  	    <View style={{marginTop:15}}>
	  		<SwitchItem title="更多安全设置" > 
	  			<Image source={icon_arrow} style={styles.icon} />
	  		</SwitchItem>
  		</View>
      </PageView>
    );
  }
});

var styles = StyleSheet.create({
  banner:{
	  height:150,
	  backgroundColor: '#4EB934',
	  flexDirection: 'column',
	  alignItems: 'center',
  },
  base64: {
    width: 62, 
    height: 70,
    marginTop:20,
  },
  icon: {
    width: 12,
    height: 12,
  },
  nick:{
	fontSize:12,
	color:'white',
	marginTop:10,
  },
  description:{
	  color: '#999999',
	  fontSize:12,
  }
});

module.exports = SecuritySettingPage;
