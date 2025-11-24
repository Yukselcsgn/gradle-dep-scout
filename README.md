# Gradle Dep Scout 🕵️‍♂️

**Gradle Dep Scout** is a lightweight utility to scan a Java project for `import` statements and automatically suggest corresponding Gradle `implementation` lines using Maven Central. It helps developers keep dependencies consistent and ensures no imports are missing from your Gradle build files.

---

## 🚀 Features

* Scans Java source files for all `import` statements.
* Resolves imports to Maven Central artifacts.
* Generates suggested `implementation` lines for your `build.gradle`.
* Cross-platform support (Windows, Linux, macOS).
* Simple integration with existing projects.

---

## 💻 Requirements

* Java project with source files (`.java`)
* Node.js >= 16 (for resolver)
* npm (Node package manager)
* Bash or PowerShell (depending on OS)

---

## ⚡ Quick Start

### 1. Add Gradle Dep Scout to Your Project

Copy the `gradle-dep-scout/` folder into your Java project root.

```bash
cp -r gradle-dep-scout/ /path/to/your/project/
```

---

### 2. Run the Scanner

Navigate to the `scanner/` folder and run the scanner script for your platform:

**Linux / macOS:**

```bash
cd gradle-dep-scout/scanner
./scanner.sh
```

**Windows (PowerShell):**

```powershell
cd gradle-dep-scout\scanner
powershell -ExecutionPolicy Bypass -File scanner.ps1
```

The scanner generates a file `imports.txt` containing all detected Java imports.

---

### 3. Resolve Imports to Gradle Dependencies

Navigate to the `resolver/` folder:

```bash
cd ../resolver
```

If you want to use a pre-existing `resolver.js` script:

```bash
cp /mnt/data/resolver.js ./resolver.js
```

Install dependencies and run the resolver:

```bash
npm install
node resolver.js --input ../imports.txt --output ../dependencies.gradle
```

This will create a `dependencies.gradle` file containing the suggested `implementation` lines for your project.

---

## 📑 Example Output

```gradle
dependencies {
    implementation 'org.apache.commons:commons-lang3:3.12.0'
    implementation 'com.google.guava:guava:32.1.1-jre'
}
```

---

## 🔧 Tips

* Ensure `imports.txt` is up-to-date before running the resolver.
* You can merge `dependencies.gradle` with your main `build.gradle` or include it as a separate file:

```gradle
apply from: 'dependencies.gradle'
```

* For large projects, run the scanner periodically to keep dependencies synchronized.

---

## ⚙️ Advanced Usage

* Customize resolver behavior with command-line flags (`--version`, `--exclude`, etc.)
* Integrate with CI/CD pipelines to automatically validate imports and dependencies.
