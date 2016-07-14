/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package com.facebook.react.uiapp;

import android.os.Bundle;

import com.facebook.react.ReactActivity;

public class UIExplorerActivity extends ReactActivity {
  private final String PARAM_ROUTE = "route";
  private Bundle mInitialProps = null;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Get remote param before calling super which uses it
    Bundle bundle = getIntent().getExtras();
    if (bundle != null && bundle.containsKey(PARAM_ROUTE)) {
      String routeUri = new StringBuilder("rnuiexplorer://example/")
        .append(bundle.getString(PARAM_ROUTE))
        .append("Example")
        .toString();
      mInitialProps = new Bundle();
      mInitialProps.putString("exampleFromAppetizeParams", routeUri);
    }
    super.onCreate(savedInstanceState);
  }

  @Override
  protected Bundle getLaunchOptions() {
    return mInitialProps;
  }

  @Override
  protected String getMainComponentName() {
    return "UIExplorerApp";
  }
}
