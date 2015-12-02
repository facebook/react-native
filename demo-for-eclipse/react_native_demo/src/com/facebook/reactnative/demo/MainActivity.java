package com.facebook.reactnative.demo;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.View.OnClickListener;

public class MainActivity extends Activity implements OnClickListener {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        findViewById(R.id.btn_helloworld).setOnClickListener(this);
        findViewById(R.id.btn_ui_explorer).setOnClickListener(this);
        findViewById(R.id.btn_2048).setOnClickListener(this);
        findViewById(R.id.btn_movies).setOnClickListener(this);
        findViewById(R.id.btn_private_setting).setOnClickListener(this);
        findViewById(R.id.btn_security_setting).setOnClickListener(this);
    }

    @Override
    public void onClick(View v) {
        Intent intent = null;
        switch (v.getId()) {
        case R.id.btn_helloworld:
            intent = new Intent(this, HelloWorld.class);
            startActivity(intent);
            break;
        case R.id.btn_ui_explorer:
            intent = new Intent(this, DemoUIExplorerActivity.class);
            startActivity(intent);
            break;
        case R.id.btn_2048:
            intent = new Intent(this, Demo2048Activity.class);
            startActivity(intent);
            break;
        case R.id.btn_movies:
            intent = new Intent(this, DemoMoviesActivity.class);
            startActivity(intent);
            break;
        case R.id.btn_private_setting:
            intent = new Intent(this, PrivacySettingActivity.class);
            startActivity(intent);
            break;
        case R.id.btn_security_setting:
            intent = new Intent(this, SecuritySettingActivity.class);
            startActivity(intent);
            break;
        default:
            break;
        }
    }
}
