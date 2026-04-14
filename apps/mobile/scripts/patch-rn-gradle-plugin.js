const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

function resolveSettingsGradlePath() {
  const packageJsonPath = require.resolve("@react-native/gradle-plugin/package.json", {
    paths: [process.cwd(), __dirname],
  });
  return path.join(path.dirname(packageJsonPath), "settings.gradle.kts");
}

function patchResolverPlugin(settingsGradlePath) {
  const source = fs.readFileSync(settingsGradlePath, "utf8");
  const replacement =
    'id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")';
  const resolverPattern =
    /id\("org\.gradle\.toolchains\.foojay-resolver-convention"\)\.version\("[^"]*"\)/;

  if (source.includes(replacement)) {
    console.log("[patch-rn-gradle-plugin] Foojay resolver is already on 1.0.0. Nothing to patch.");
    return;
  }

  if (!resolverPattern.test(source)) {
    console.log("[patch-rn-gradle-plugin] No foojay resolver plugin line found. Nothing to patch.");
    return;
  }

  const patched = source.replace(resolverPattern, replacement);

  fs.writeFileSync(settingsGradlePath, patched);
  console.log(`[patch-rn-gradle-plugin] Patched: ${settingsGradlePath}`);
}

function ensureAndroidLocalProperties() {
  const androidDir = path.join(process.cwd(), "android");
  if (!fs.existsSync(androidDir)) {
    console.log("[patch-rn-gradle-plugin] android directory not found, skipping local.properties.");
    return;
  }

  const sdkFromEnv = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  const defaultMacSdk = path.join(process.env.HOME || "", "Library", "Android", "sdk");
  const sdkDir = sdkFromEnv || (fs.existsSync(defaultMacSdk) ? defaultMacSdk : "");

  if (!sdkDir) {
    console.log("[patch-rn-gradle-plugin] No Android SDK path found, skipping local.properties.");
    return;
  }

  const localPropertiesPath = path.join(androidDir, "local.properties");
  const content = `sdk.dir=${sdkDir}\n`;
  fs.writeFileSync(localPropertiesPath, content);
  console.log(`[patch-rn-gradle-plugin] Wrote ${localPropertiesPath} -> ${sdkDir}`);
}

function resolveJava21Home() {
  const javaHomeFromEnv = process.env.JAVA_HOME || "";
  if (javaHomeFromEnv.includes("21")) {
    return javaHomeFromEnv;
  }

  try {
    const javaHome = childProcess.execSync("/usr/libexec/java_home -v 21", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return javaHome.trim();
  } catch {
    return "";
  }
}

function ensureGradleJavaHome() {
  const androidDir = path.join(process.cwd(), "android");
  if (!fs.existsSync(androidDir)) {
    return;
  }

  const javaHome21 = resolveJava21Home();
  if (!javaHome21) {
    console.log("[patch-rn-gradle-plugin] Java 21 not found, skipping org.gradle.java.home pin.");
    return;
  }

  const gradlePropertiesPath = path.join(androidDir, "gradle.properties");
  const existing = fs.existsSync(gradlePropertiesPath)
    ? fs.readFileSync(gradlePropertiesPath, "utf8")
    : "";

  const propertyLine = `org.gradle.java.home=${javaHome21}`;
  let updated;

  if (existing.includes("org.gradle.java.home=")) {
    updated = existing.replace(/^org\.gradle\.java\.home=.*$/m, propertyLine);
  } else {
    updated = existing.endsWith("\n") || existing.length === 0
      ? `${existing}${propertyLine}\n`
      : `${existing}\n${propertyLine}\n`;
  }

  fs.writeFileSync(gradlePropertiesPath, updated);
  console.log(`[patch-rn-gradle-plugin] Pinned Gradle Java home -> ${javaHome21}`);
}

function main() {
  try {
    const settingsGradlePath = resolveSettingsGradlePath();
    patchResolverPlugin(settingsGradlePath);
    ensureAndroidLocalProperties();
    ensureGradleJavaHome();
  } catch (error) {
    console.error("[patch-rn-gradle-plugin] Failed to patch @react-native/gradle-plugin:", error);
    process.exitCode = 1;
  }
}

main();
