package com.facebook.react;

import com.android.build.gradle.AppPlugin;
import com.android.build.gradle.LibraryPlugin;
import com.android.build.gradle.internal.variant.BaseVariantData;
import com.android.builder.core.VariantType;
import com.google.common.collect.Lists;

import org.gradle.api.Action;
import org.gradle.api.GradleException;
import org.gradle.api.Plugin;
import org.gradle.api.Project;

import java.util.Iterator;
import java.util.List;

/**
 * Main entry point for our plugin. When applied to a project, this registers the {@code react}
 * gradle extension used for configuration and the {@code packageDebugJS} and
 * {@code packageReleaseJS} tasks. These are set up to run after {@code mergeDebugAssets} and
 * {@code mergeReleaseAssets} and before {@code processDebugResources} and
 * {@code processReleaseResources} respectively. If any of these tasks are not found the plugin will
 * crash (UnknownTaskException), as it was probably applied to a non-standard Android project, or it
 * was applied incorrectly.
 */
public class ReactGradlePlugin implements Plugin<Project> {
  static final String sAndroidApplicationPluginName = "com.android.application";
  static final String sAndroidLibraryPluginName = "com.android.library";

  @Override
  public void apply(Project project) {
    project.getExtensions().create("react", ReactGradleExtension.class, project);

    project.afterEvaluate(
        new Action<Project>() {
          @Override
          public void execute(Project project) {

            final List<BaseVariantData> variantList = Lists.newArrayList();
            if (project.getPlugins().hasPlugin(sAndroidApplicationPluginName)) {
              AppPlugin plugin = (AppPlugin) project.getPlugins().getPlugin(sAndroidApplicationPluginName);
              plugin.getVariantManager().getVariantDataList().stream().filter(variantData -> VariantType.DEFAULT == variantData.getType() || VariantType.LIBRARY == variantData.getType()).forEach(variantData -> {
                variantList.add(variantData);
              });
            } else if (project.getPlugins().hasPlugin(sAndroidLibraryPluginName)) {
              LibraryPlugin plugin = (LibraryPlugin) project.getPlugins().getPlugin(sAndroidLibraryPluginName);
              plugin.getVariantManager().getVariantDataList().stream().filter(variantData -> VariantType.DEFAULT == variantData.getType() || VariantType.LIBRARY == variantData.getType()).forEach(variantData -> {
                variantList.add(variantData);
              });
            } else {
              throw new GradleException("The 'android' or 'android-library' plugin is required.");
            }

            Iterator<BaseVariantData> iterator = variantList.iterator();
            while (iterator.hasNext()) {
              BaseVariantData variantData = iterator.next();

              String variantName = capitalize(variantData.getName());
              String taskName = String.format("package%sJS", variantName);
              Class<? extends AbstractPackageJsTask> clazz = variantData.getVariantConfiguration().getBuildType().isDebuggable() ? PackageDebugJsTask.class : PackageReleaseJsTask.class;

              AbstractPackageJsTask packageJsTask = project.getTasks().create(taskName, clazz);

              packageJsTask.dependsOn(String.format("merge%sAssets", variantName));
              project.getTasks().getByName(String.format("process%sResources", variantName)).dependsOn(packageJsTask);
            }
          }
        });
  }

  private String capitalize(final String name) {
    return Character.toUpperCase(name.charAt(0)) + name.substring(1);
  }
}
