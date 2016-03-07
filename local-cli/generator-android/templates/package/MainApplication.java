package <%= package %>;

import android.app.Application;

import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.stetho.Stetho;
import com.facebook.stetho.okhttp.StethoInterceptor;

public class MainApplication extends Application {

  @Override
  public void onCreate() {
    super.onCreate();

    // Initialize Stetho for DEBUG builds
    if (BuildConfig.DEBUG) {
      Stetho.initializeWithDefaults(this);

      // Add Stetho Interceptor to OkHttp
      OkHttpClientProvider.getOkHttpClient().networkInterceptors().add(new StethoInterceptor());
    }
  }

}
