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

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.uiapp.R;

import java.util.Arrays;
import java.util.List;
import javax.annotation.Nullable;

public class UIExplorerActivity extends ReactActivity {
  @Override
  protected String getMainComponentName() {
      return "UIExplorerApp";
  }

  @Override
  protected @Nullable String getBundleAssetName() {
    return "UIExplorerApp.android.bundle";
  };

  @Override
  protected String getJSMainModuleName() {
    return "Examples/UIExplorer/UIExplorerApp.android";
  }

  @Override
  protected boolean getUseDeveloperSupport() {
      return true;
  }

  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
      new MainReactPackage()
    );
  }
}
