/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import android.app.Dialog;
import android.content.Context;
import android.net.Uri;
import android.os.AsyncTask;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.TextView;

import com.facebook.common.logging.FLog;
import com.facebook.react.R;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.devsupport.StackTraceHelper.StackFrame;

import com.squareup.okhttp.MediaType;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.RequestBody;
import org.json.JSONObject;

/**
 * Dialog for displaying JS errors in an eye-catching form (red box).
 */
/* package */ class RedBoxDialog extends Dialog implements AdapterView.OnItemClickListener {

  private final DevSupportManager mDevSupportManager;

  private ListView mStackView;
  private Button mReloadJs;
  private int mCookie = 0;

  private static class StackAdapter extends BaseAdapter {
    private static final int VIEW_TYPE_COUNT = 2;
    private static final int VIEW_TYPE_TITLE = 0;
    private static final int VIEW_TYPE_STACKFRAME = 1;

    private final String mTitle;
    private final StackFrame[] mStack;

    private static class FrameViewHolder {
      private final TextView mMethodView;
      private final TextView mFileView;

      private FrameViewHolder(View v) {
        mMethodView = (TextView) v.findViewById(R.id.rn_frame_method);
        mFileView = (TextView) v.findViewById(R.id.rn_frame_file);
      }
    }

    public StackAdapter(String title, StackFrame[] stack) {
      mTitle = title;
      mStack = stack;
    }

    @Override
    public boolean areAllItemsEnabled() {
      return false;
    }

    @Override
    public boolean isEnabled(int position) {
      return position > 0;
    }

    @Override
    public int getCount() {
      return mStack.length + 1;
    }

    @Override
    public Object getItem(int position) {
      return position == 0 ? mTitle : mStack[position - 1];
    }

    @Override
    public long getItemId(int position) {
      return position;
    }

    @Override
    public int getViewTypeCount() {
      return VIEW_TYPE_COUNT;
    }

    @Override
    public int getItemViewType(int position) {
      return position == 0 ? VIEW_TYPE_TITLE : VIEW_TYPE_STACKFRAME;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
      if (position == 0) {
        TextView title = convertView != null
            ? (TextView) convertView
            : (TextView) LayoutInflater.from(parent.getContext())
                .inflate(R.layout.redbox_item_title, parent, false);
        title.setText(mTitle);
        return title;
      } else {
        if (convertView == null) {
          convertView = LayoutInflater.from(parent.getContext())
              .inflate(R.layout.redbox_item_frame, parent, false);
          convertView.setTag(new FrameViewHolder(convertView));
        }
        StackFrame frame = mStack[position - 1];
        FrameViewHolder holder = (FrameViewHolder) convertView.getTag();
        holder.mMethodView.setText(frame.getMethod());
        holder.mFileView.setText(frame.getFileName() + ":" + frame.getLine());
        return convertView;
      }
    }
  }

  private static class OpenStackFrameTask extends AsyncTask<StackFrame, Void, Void> {
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    private final DevSupportManager mDevSupportManager;

    private OpenStackFrameTask(DevSupportManager devSupportManager) {
      mDevSupportManager = devSupportManager;
    }

    @Override
    protected Void doInBackground(StackFrame... stackFrames) {
      try {
        String openStackFrameUrl =
            Uri.parse(mDevSupportManager.getSourceUrl()).buildUpon()
                .path("/open-stack-frame")
                .query(null)
                .build()
                .toString();
        OkHttpClient client = new OkHttpClient();
        for (StackFrame frame: stackFrames) {
          String payload = stackFrameToJson(frame).toString();
          RequestBody body = RequestBody.create(JSON, payload);
          Request request = new Request.Builder().url(openStackFrameUrl).post(body).build();
          client.newCall(request).execute();
        }
      } catch (Exception e) {
        FLog.e(ReactConstants.TAG, "Could not open stack frame", e);
      }
      return null;
    }

    private static JSONObject stackFrameToJson(StackFrame frame) {
      return new JSONObject(
          MapBuilder.of(
              "file", frame.getFile(),
              "methodName", frame.getMethod(),
              "lineNumber", frame.getLine(),
              "column", frame.getColumn()
          ));
    }
  }

  protected RedBoxDialog(Context context, DevSupportManager devSupportManager) {
    super(context, R.style.Theme_Catalyst_RedBox);

    requestWindowFeature(Window.FEATURE_NO_TITLE);

    setContentView(R.layout.redbox_view);

    mDevSupportManager = devSupportManager;

    mStackView = (ListView) findViewById(R.id.rn_redbox_stack);
    mStackView.setOnItemClickListener(this);
    mReloadJs = (Button) findViewById(R.id.rn_redbox_reloadjs);
    mReloadJs.setOnClickListener(new View.OnClickListener() {
      @Override
      public void onClick(View v) {
        mDevSupportManager.handleReloadJS();
      }
    });
  }

  public void setExceptionDetails(String title, StackFrame[] stack) {
    mStackView.setAdapter(new StackAdapter(title, stack));
  }

  public void setErrorCookie(int cookie) {
    mCookie = cookie;
  }

  public int getErrorCookie() {
    return mCookie;
  }

  @Override
  public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
    new OpenStackFrameTask(mDevSupportManager).executeOnExecutor(
        AsyncTask.THREAD_POOL_EXECUTOR,
        (StackFrame) mStackView.getAdapter().getItem(position));
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_MENU) {
      mDevSupportManager.showDevOptionsDialog();
      return true;
    }

    return super.onKeyUp(keyCode, event);
  }
}
