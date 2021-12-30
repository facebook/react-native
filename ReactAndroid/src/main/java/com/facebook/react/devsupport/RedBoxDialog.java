/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.app.Dialog;
import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.os.AsyncTask;
import android.text.SpannedString;
import android.text.method.LinkMovementMethod;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.R;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.devsupport.RedBoxHandler.ReportCompletedListener;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.StackFrame;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import org.json.JSONObject;

/** Dialog for displaying JS errors in an eye-catching form (red box). */
/* package */ class RedBoxDialog extends Dialog implements AdapterView.OnItemClickListener {

  private final DevSupportManager mDevSupportManager;
  private final DoubleTapReloadRecognizer mDoubleTapReloadRecognizer;
  private final @Nullable RedBoxHandler mRedBoxHandler;

  private ListView mStackView;
  private Button mReloadJsButton;
  private Button mDismissButton;
  private @Nullable Button mReportButton;
  private @Nullable TextView mReportTextView;
  private @Nullable ProgressBar mLoadingIndicator;
  private @Nullable View mLineSeparator;
  private boolean isReporting = false;

  private ReportCompletedListener mReportCompletedListener =
      new ReportCompletedListener() {
        @Override
        public void onReportSuccess(final SpannedString spannedString) {
          isReporting = false;
          Assertions.assertNotNull(mReportButton).setEnabled(true);
          Assertions.assertNotNull(mLoadingIndicator).setVisibility(View.GONE);
          Assertions.assertNotNull(mReportTextView).setText(spannedString);
        }

        @Override
        public void onReportError(final SpannedString spannedString) {
          isReporting = false;
          Assertions.assertNotNull(mReportButton).setEnabled(true);
          Assertions.assertNotNull(mLoadingIndicator).setVisibility(View.GONE);
          Assertions.assertNotNull(mReportTextView).setText(spannedString);
        }
      };

  private View.OnClickListener mReportButtonOnClickListener =
      new View.OnClickListener() {
        @Override
        public void onClick(View view) {
          if (mRedBoxHandler == null || !mRedBoxHandler.isReportEnabled() || isReporting) {
            return;
          }
          isReporting = true;
          Assertions.assertNotNull(mReportTextView).setText("Reporting...");
          Assertions.assertNotNull(mReportTextView).setVisibility(View.VISIBLE);
          Assertions.assertNotNull(mLoadingIndicator).setVisibility(View.VISIBLE);
          Assertions.assertNotNull(mLineSeparator).setVisibility(View.VISIBLE);
          Assertions.assertNotNull(mReportButton).setEnabled(false);

          String title = Assertions.assertNotNull(mDevSupportManager.getLastErrorTitle());
          StackFrame[] stack = Assertions.assertNotNull(mDevSupportManager.getLastErrorStack());
          String sourceUrl = mDevSupportManager.getSourceUrl();

          mRedBoxHandler.reportRedbox(
              view.getContext(),
              title,
              stack,
              sourceUrl,
              Assertions.assertNotNull(mReportCompletedListener));
        }
      };

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
      Assertions.assertNotNull(mTitle);
      Assertions.assertNotNull(mStack);
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
        TextView title =
            convertView != null
                ? (TextView) convertView
                : (TextView)
                    LayoutInflater.from(parent.getContext())
                        .inflate(R.layout.redbox_item_title, parent, false);
        // Remove ANSI color codes from the title
        String titleSafe = (mTitle == null ? "<unknown title>" : mTitle);
        title.setText(titleSafe.replaceAll("\\x1b\\[[0-9;]*m", ""));
        return title;
      } else {
        if (convertView == null) {
          convertView =
              LayoutInflater.from(parent.getContext())
                  .inflate(R.layout.redbox_item_frame, parent, false);
          convertView.setTag(new FrameViewHolder(convertView));
        }
        StackFrame frame = mStack[position - 1];
        FrameViewHolder holder = (FrameViewHolder) convertView.getTag();
        holder.mMethodView.setText(frame.getMethod());
        holder.mFileView.setText(StackTraceHelper.formatFrameSource(frame));
        holder.mMethodView.setTextColor(frame.isCollapsed() ? 0xFFAAAAAA : Color.WHITE);
        holder.mFileView.setTextColor(frame.isCollapsed() ? 0xFF808080 : 0xFFB3B3B3);
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
            Uri.parse(mDevSupportManager.getSourceUrl())
                .buildUpon()
                .path("/open-stack-frame")
                .query(null)
                .build()
                .toString();
        OkHttpClient client = new OkHttpClient();
        for (StackFrame frame : stackFrames) {
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
              "column", frame.getColumn()));
    }
  }

  protected RedBoxDialog(
      Context context, DevSupportManager devSupportManager, @Nullable RedBoxHandler redBoxHandler) {
    super(context, R.style.Theme_Catalyst_RedBox);

    requestWindowFeature(Window.FEATURE_NO_TITLE);

    setContentView(R.layout.redbox_view);

    mDevSupportManager = devSupportManager;
    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
    mRedBoxHandler = redBoxHandler;

    mStackView = (ListView) findViewById(R.id.rn_redbox_stack);
    mStackView.setOnItemClickListener(this);

    mReloadJsButton = (Button) findViewById(R.id.rn_redbox_reload_button);
    mReloadJsButton.setOnClickListener(
        new View.OnClickListener() {
          @Override
          public void onClick(View v) {
            mDevSupportManager.handleReloadJS();
          }
        });
    mDismissButton = (Button) findViewById(R.id.rn_redbox_dismiss_button);
    mDismissButton.setOnClickListener(
        new View.OnClickListener() {
          @Override
          public void onClick(View v) {
            dismiss();
          }
        });

    if (mRedBoxHandler != null && mRedBoxHandler.isReportEnabled()) {
      mLoadingIndicator = (ProgressBar) findViewById(R.id.rn_redbox_loading_indicator);
      mLineSeparator = (View) findViewById(R.id.rn_redbox_line_separator);
      mReportTextView = (TextView) findViewById(R.id.rn_redbox_report_label);
      mReportTextView.setMovementMethod(LinkMovementMethod.getInstance());
      mReportTextView.setHighlightColor(Color.TRANSPARENT);
      mReportButton = (Button) findViewById(R.id.rn_redbox_report_button);
      mReportButton.setOnClickListener(mReportButtonOnClickListener);
    }
  }

  public void setExceptionDetails(String title, StackFrame[] stack) {
    mStackView.setAdapter(new StackAdapter(title, stack));
  }

  /** Show the report button, hide the report textview and the loading indicator. */
  public void resetReporting() {
    if (mRedBoxHandler == null || !mRedBoxHandler.isReportEnabled()) {
      return;
    }
    isReporting = false;
    Assertions.assertNotNull(mReportTextView).setVisibility(View.GONE);
    Assertions.assertNotNull(mLoadingIndicator).setVisibility(View.GONE);
    Assertions.assertNotNull(mLineSeparator).setVisibility(View.GONE);
    Assertions.assertNotNull(mReportButton).setVisibility(View.VISIBLE);
    Assertions.assertNotNull(mReportButton).setEnabled(true);
  }

  @Override
  public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
    new OpenStackFrameTask(mDevSupportManager)
        .executeOnExecutor(
            AsyncTask.THREAD_POOL_EXECUTOR, (StackFrame) mStackView.getAdapter().getItem(position));
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_MENU) {
      mDevSupportManager.showDevOptionsDialog();
      return true;
    }
    if (mDoubleTapReloadRecognizer.didDoubleTapR(keyCode, getCurrentFocus())) {
      mDevSupportManager.handleReloadJS();
    }
    return super.onKeyUp(keyCode, event);
  }
}
