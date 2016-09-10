class ReactWebViewBridge {
  Context mContext;

  RecatWebViewBridge(Context c) {
    mContext = c;
  }

  @JavascriptInterface
  public void postMessage(message) {
    mContext.postMessage(message);
  }
}
