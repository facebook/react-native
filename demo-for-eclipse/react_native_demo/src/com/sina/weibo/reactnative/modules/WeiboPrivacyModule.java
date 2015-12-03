/**
 * react native module
 * author:xiaofei9
 */
package com.sina.weibo.reactnative.modules;

import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

public class WeiboPrivacyModule  extends ReactContextBaseJavaModule {
	private static final String KEY_COMMENT = "comment";
	private static final String KEY_MOBILE = "mobile";
	private static final String KEY_BINDSTATUS = "bindstatus";
	private static final String KEY_MENTION = "mention";
	private static final String KEY_CONTACT_LIST = "contact_list";
	private static final String KEY_PIC_CMT_IN = "pic_cmt_in";

	public WeiboPrivacyModule(ReactApplicationContext reactContext) {
		super(reactContext);
	}

	@Override
	public String getName() {
		return "WeiboPrivacyAndroid";
	}
	
	@ReactMethod
	public void getStates(String url, Callback result){
		JSONObject jsonData =  getJsonData();
		JSONObject p = new JSONObject();
		JSONObject m = new JSONObject();
		try {
			p = jsonData.getJSONObject("privacy");
			m = jsonData.getJSONObject("mention");
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		try {
			int comment = p.getInt(KEY_COMMENT);
			int mobile = p.getInt(KEY_MOBILE);
			int bindstatus = p.getInt(KEY_BINDSTATUS);
			int mention = m.getInt(KEY_MENTION);
			int contact_list = m.getInt(KEY_CONTACT_LIST);
			int pic_cmt_in = m.getInt(KEY_PIC_CMT_IN);
			result.invoke(comment,mobile,bindstatus,mention,contact_list,pic_cmt_in);
		} catch (JSONException e) {
			e.getStackTrace();
		}
	}
	
	private JSONObject getJsonData(){
		JSONObject jsonData = new JSONObject();
		JSONObject jsonObjectP = new JSONObject();
		JSONObject jsonObjectM = new JSONObject();
		try {
			jsonObjectP.put(KEY_COMMENT, 3);
			jsonObjectP.put(KEY_MOBILE, 1);
			jsonObjectP.put(KEY_BINDSTATUS, 1);
			jsonObjectM.put(KEY_MENTION, 0);
			jsonObjectM.put(KEY_CONTACT_LIST, 0);
			jsonObjectM.put(KEY_PIC_CMT_IN, 0);
			
			jsonData.put("privacy",jsonObjectP);
			jsonData.put("mention",jsonObjectM);
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return jsonData;
	}
	
	@ReactMethod
	public void updateState(String url,String key, Integer value){
		Log.d("ReactNativeModule","update state " + key +" with value " + value);
	}

}
