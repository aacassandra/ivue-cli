import chalk from "chalk";
import fs from "fs";
import xml2js from "xml2js";
import ncp from "ncp";
import path from "path";
import {promisify} from "util";
import execa from "execa";
import shell from "shelljs";
import pkg from "../json/package.json";
import Listr from "listr";
import {projectInstall} from "pkg-install";
const access = promisify(fs.access);
const copy = promisify(ncp);
import {
  createFile,
  copyDirectories,
  Waiter,
  copyFile,
  removeFile,
  renameFile,
  contentReplace,
  readFile
} from "../actions";

async function initGit(opt) {
  // await Waiter(1000);
  await copyFile(
    opt.templateDirectory + "/.gitignore",
    opt.targetDirectory + "/.gitignore"
  );
  const result = await execa("git", ["init"], {
    cwd: opt.targetDirectory
  });
  if (result.failed) {
    return Promise.reject(new Error("Failed to initialize git"));
  }
  return;
}

export async function initCordova(opt) {
  // await Waiter(3000);
  const result = await execa("cordova", ["create", opt.name], {
    cwd: opt.targetRoot
  });
  if (result.failed) {
    return Promise.reject(new Error("Failed to initialize cordova project"));
  }
  return;
}

export async function installDependencies(opt) {
  let plugins = [
    "cordova-plugin-device",
    "cordova-plugin-headercolor",
    "cordova-plugin-splashscreen",
    "cordova-plugin-statusbar",
    "cordova-sqlite-storage"
  ];
  const intsBrowser = await execa("cordova", ["platform", "add", "browser"], {
    cwd: opt.targetDirectory
  });
  if (intsBrowser.failed) {
    return Promise.reject(
      new Error("Failed to install cordova platform browser")
    );
  }

  for (let i = 0; i < plugins.length; i++) {
    try {
      await execa("cordova", ["plugin", "add", plugins[i]], {
        cwd: opt.targetDirectory
      });
    } catch (error) {
      if (error.failed) {
        return Promise.reject(new Error("Failed to install " + plugins[i]));
      }
    }
  }
}

async function createIndexHTML(opt) {
  let html =
    "<!DOCTYPE html>\r\n" +
    '<html lang="en">\r\n' +
    "<head>\r\n" +
    '  <meta http-equiv="X-UA-Compatible" content="IE=edge">\r\n' +
    '  <meta name="format-detection" content="telephone=no">\r\n' +
    '  <meta name="msapplication-tap-highlight" content="no">\r\n' +
    '  <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />\r\n' +
    '  <link rel="icon" href="<%= BASE_URL %>favicon.ico">\r\n' +
    "  <title>" +
    opt.name +
    "</title>\r\n" +
    "</head>\r\n" +
    "<body>\r\n" +
    "  <noscript>\r\n" +
    '    <strong>We"re sorry but ivue doesn"t work properly without JavaScript enabled. Please enable it to continue.</strong>\r\n' +
    "  </noscript>\r\n" +
    '  <div id="app"></div>\r\n' +
    "  <!-- built files will be auto injected -->\r\n" +
    '  <script type="text/javascript" src="cordova.js"></script>\r\n' +
    "</body>\r\n" +
    "</html>\r\n";

  await createFile(opt.name + "/public/index.html", html, false, false);
  return;
}

export async function createMain(opt) {
  let main;
  if (opt.typescript) {
    if (opt.vuex) {
      main =
        'import Vue from "vue";\r\n' +
        'import App from "./App.vue";\r\n' +
        'import router from "./router";\r\n' +
        'import store from "./store";\r\n' +
        'import Ionic from "@ionic/vue";\r\n' +
        'import "@ionic/core/css/ionic.bundle.css";\r\n' +
        "Vue.use(Ionic);\r\n" +
        "\r\n" +
        "Vue.config.productionTip = false;\r\n" +
        "\r\n" +
        "new Vue({\r\n" +
        "  router,\r\n" +
        "  store,\r\n" +
        "  render: h => h(App)\r\n" +
        '}).$mount("#app");\r\n';
    } else {
      main =
        'import Vue from "vue";\r\n' +
        'import App from "./App.vue";\r\n' +
        'import router from "./router";\r\n' +
        'import Ionic from "@ionic/vue";\r\n' +
        'import "@ionic/core/css/ionic.bundle.css";\r\n' +
        "Vue.use(Ionic);\r\n" +
        "\r\n" +
        "Vue.config.productionTip = false;\r\n" +
        "\r\n" +
        "new Vue({\r\n" +
        "  router,\r\n" +
        "  render: h => h(App)\r\n" +
        '}).$mount("#app");\r\n';
    }
  } else {
    if (opt.vuex) {
      main =
        'import Vue from "vue";\r\n' +
        'import App from "./App.vue";\r\n' +
        'import router from "./router";\r\n' +
        'import store from "./store";\r\n' +
        'import Ionic from "@ionic/vue";\r\n' +
        'import "@ionic/core/css/ionic.bundle.css";\r\n' +
        "Vue.use(Ionic);\r\n" +
        "\r\n" +
        "Vue.config.productionTip = false;\r\n" +
        "\r\n" +
        "new Vue({\r\n" +
        "  router,\r\n" +
        "  store,\r\n" +
        "render: function(h) {\r\n" +
        "  return h(App);\r\n" +
        "}\r\n" +
        '}).$mount("#app");\r\n';
    } else {
      main =
        'import Vue from "vue";\r\n' +
        'import App from "./App.vue";\r\n' +
        'import router from "./router";\r\n' +
        'import Ionic from "@ionic/vue";\r\n' +
        'import "@ionic/core/css/ionic.bundle.css";\r\n' +
        "Vue.use(Ionic);\r\n" +
        "\r\n" +
        "Vue.config.productionTip = false;\r\n" +
        "\r\n" +
        "new Vue({\r\n" +
        "  router,\r\n" +
        "render: function(h) {\r\n" +
        "  return h(App);\r\n" +
        "}\r\n" +
        '}).$mount("#app");\r\n';
    }
  }

  await createFile(
    opt.typescript ? opt.name + "/main.ts" : opt.name + "/main.js",
    main,
    false,
    false
  );
  return;
}

export async function createStore(opt) {
  let store;
  if (opt.vuex) {
    store =
      "import Vue from 'vue'\r\n" +
      "import Vuex from 'vuex'\r\n" +
      "\r\n" +
      "Vue.use(Vuex)\r\n" +
      "\r\n" +
      "export default new Vuex.Store({\r\n" +
      "  state: {\r\n" +
      "\r\n" +
      "  },\r\n" +
      "  mutations: {\r\n" +
      "\r\n" +
      "  },\r\n" +
      "  actions: {\r\n" +
      "\r\n" +
      "  }\r\n" +
      "})\r\n";
  }

  await createFile(
    opt.typescript ? opt.name + "/store.ts" : opt.name + "/store.js",
    store,
    false,
    false
  );
  return;
}

export async function createBabelConfJS(npm, opt) {
  let babelConfJs =
    "module.exports = {\r\n" +
    "   presets: [\r\n" +
    "    '@vue/app'\r\n" +
    "  ]\r\n" +
    "}\r\n";

  npm.devDependencies = {
    ...npm.devDependencies,
    ...pkg.babel
  };

  await createFile(opt.name + "/babel.config.js", babelConfJs, false, false);
  return;
}

export async function fillPackages(npm, opt) {
  npm.name = opt.name;
  npm.displayName = opt.name;
  npm.version = opt.version;
  npm.description = opt.description;

  if (opt.vuex) {
    npm.dependencies = {
      ...npm.dependencies,
      ...pkg.vuex
    };
  }

  if (opt.style) {
    if (opt.style == "dart-sass") {
      npm.devDependencies = {
        ...npm.devDependencies,
        ...pkg.styler.pkg.sassDart
      };
    } else if (opt.style == "node-sass") {
      npm.devDependencies = {
        ...npm.devDependencies,
        ...pkg.styler.pkg.sassNode
      };
    } else if (opt.style == "less") {
      npm.devDependencies = {
        ...npm.devDependencies,
        ...pkg.styler.pkg.less
      };
    } else if (opt.style == "stylus") {
      npm.devDependencies = {
        ...npm.devDependencies,
        ...pkg.styler.pkg.stylus
      };
    }
  }

  //TypeScript
  if (opt.typescript) {
    if (opt.style) {
      if (opt.tsDecorator) {
        npm.dependencies = {
          ...npm.dependencies,
          ...pkg.decor
        };
        if (opt.style == "dart-sass") {
          await copyDirectories(
            opt.templateDirectory + pkg.styler.url.ts.decor.sassDart,
            opt.targetDirectory + "/src"
          );
        } else if (opt.style == "node-sass") {
          await copyDirectories(
            opt.templateDirectory + pkg.styler.url.ts.decor.sassNode,
            opt.targetDirectory + "/src"
          );
        } else if (opt.style == "less") {
          await copyDirectories(
            opt.templateDirectory + pkg.styler.url.ts.decor.less,
            opt.targetDirectory + "/src"
          );
        } else if (opt.style == "stylus") {
          await copyDirectories(
            opt.templateDirectory + pkg.styler.url.ts.decor.stylus,
            opt.targetDirectory + "/src"
          );
        }
      } else {
        if (opt.style == "dart-sass") {
          await copyDirectories(
            opt.templateDirectory + pkg.styler.url.ts.undecor.sassDart,
            opt.targetDirectory + "/src"
          );
        } else if (opt.style == "node-sass") {
          await copyDirectories(
            opt.templateDirectory + pkg.styler.url.ts.undecor.sassNode,
            opt.targetDirectory + "/src"
          );
        } else if (opt.style == "less") {
          await copyDirectories(
            opt.templateDirectory + pkg.styler.url.ts.undecor.less,
            opt.targetDirectory + "/src"
          );
        } else if (opt.style == "stylus") {
          await copyDirectories(
            opt.templateDirectory + pkg.styler.url.ts.undecor.stylus,
            opt.targetDirectory + "/src"
          );
        }
      }
    } else {
      if (opt.tsDecorator) {
        npm.dependencies = {
          ...npm.dependencies,
          ...pkg.decor
        };
        await copyDirectories(
          opt.templateDirectory + pkg.styler.url.ts.decor.css,
          opt.targetDirectory + "/src"
        );
      } else {
        await copyDirectories(
          opt.templateDirectory + pkg.styler.url.ts.undecor.css,
          opt.targetDirectory + "/src"
        );
      }
    }

    if (opt.babel) {
      if (opt.tsBabel) {
        await createBabelConfJS(npm, opt);
        await createFile(
          opt.name + "/tsconfig.json",
          pkg.tsconfig.babel,
          true,
          true
        );
      } else {
        await createFile(
          opt.name + "/tsconfig.json",
          pkg.tsconfig.unbabel,
          true,
          true
        );
      }
    }

    if (opt.linter) {
      if (opt.linter == "airbnb") {
        npm.devDependencies = {
          ...npm.devDependencies,
          ...pkg.linter.ts.pkg.airbnb
        };
        copyDirectories(
          opt.templateDirectory + pkg.linter.ts.url.airbnb,
          opt.targetDirectory
        );
      } else if (opt.linter == "prettier") {
        npm.devDependencies = {
          ...npm.devDependencies,
          ...pkg.linter.ts.pkg.prettier
        };
        copyDirectories(
          opt.templateDirectory + pkg.linter.ts.url.prettier,
          opt.targetDirectory
        );
      } else if (opt.linter == "recommended") {
        npm.devDependencies = {
          ...npm.devDependencies,
          ...pkg.linter.ts.pkg.recommended
        };
        copyDirectories(
          opt.templateDirectory + pkg.linter.ts.url.recommended,
          opt.targetDirectory
        );
      } else if (opt.linter == "standard") {
        npm.devDependencies = {
          ...npm.devDependencies,
          ...pkg.linter.ts.pkg.standard
        };
        copyDirectories(
          opt.templateDirectory + pkg.linter.ts.url.standard,
          opt.targetDirectory
        );
      } else if (opt.linter == "tslint") {
        copyDirectories(
          opt.templateDirectory + pkg.linter.ts.url.tslint,
          opt.targetDirectory
        );
      }
    }
    //JavaScript
  } else {
    if (opt.style) {
      if (opt.style == "dart-sass") {
        await copyDirectories(
          opt.templateDirectory + pkg.styler.url.js.sassDart,
          opt.targetDirectory + "/src"
        );
      } else if (opt.style == "node-sass") {
        await copyDirectories(
          opt.templateDirectory + pkg.styler.url.js.sassNode,
          opt.targetDirectory + "/src"
        );
      } else if (opt.style == "less") {
        await copyDirectories(
          opt.templateDirectory + pkg.styler.url.js.less,
          opt.targetDirectory + "/src"
        );
      } else if (opt.style == "stylus") {
        await copyDirectories(
          opt.templateDirectory + pkg.styler.url.js.stylus,
          opt.targetDirectory + "/src"
        );
      }
    } else {
      await copyDirectories(
        opt.templateDirectory + pkg.styler.url.js.css,
        opt.targetDirectory + "/src"
      );
    }

    if (opt.babel) {
      await createBabelConfJS(npm, opt);
    }

    if (opt.linter) {
      if (opt.linter == "airbnb") {
        npm.devDependencies = {
          ...npm.devDependencies,
          ...pkg.linter.js.pkg.airbnb
        };
        copyDirectories(
          opt.templateDirectory + pkg.linter.js.url.airbnb,
          opt.targetDirectory
        );
      } else if (opt.linter == "prettier") {
        npm.devDependencies = {
          ...npm.devDependencies,
          ...pkg.linter.js.pkg.prettier
        };
        copyDirectories(
          opt.templateDirectory + pkg.linter.js.url.prettier,
          opt.targetDirectory
        );
      } else if (opt.linter == "recommended") {
        npm.devDependencies = {
          ...npm.devDependencies,
          ...pkg.linter.js.pkg.recommended
        };
        copyDirectories(
          opt.templateDirectory + pkg.linter.js.url.recommended,
          opt.targetDirectory
        );
      } else if (opt.linter == "standard") {
        npm.devDependencies = {
          ...npm.devDependencies,
          ...pkg.linter.js.pkg.standard
        };
        copyDirectories(
          opt.templateDirectory + pkg.linter.js.url.standard,
          opt.targetDirectory
        );
      }
    }
  }

  await createIndexHTML(opt);
  await createMain(opt);
  await createStore(opt);
  await contentReplace(
    opt.name + "/config.xml",
    "<name>HelloCordova</name>",
    "<name>" + opt.name + "</name>"
  );

  await contentReplace(
    opt.name + "/config.xml",
    'id="io.cordova.hellocordova"',
    'id="' + opt.domain + '"'
  );

  await contentReplace(
    opt.name + "/config.xml",
    'version="1.0.0"',
    'version="' + opt.version + '"'
  );

  await contentReplace(
    opt.name + "/config.xml",
    "A sample Apache Cordova application that responds to the deviceready event.",
    opt.description
  );
  await renameFile(
    opt.typescript ? opt.name + "/main.ts" : opt.name + "/main.js",
    opt.typescript ? opt.name + "/src/main.ts" : opt.name + "/src/main.js"
  );
  await renameFile(
    opt.typescript ? opt.name + "/store.ts" : opt.name + "/store.js",
    opt.typescript ? opt.name + "/src/store.ts" : opt.name + "/src/store.js"
  );
  return npm;
}

export async function projectPrepairing(opt) {
  let npm;
  // await Waiter(2500);
  if (opt.typescript != undefined) {
    npm = pkg.ts;
    let action = await fillPackages(npm, opt);
    npm = action;
  } else {
    npm = pkg.js;
    let action = await fillPackages(npm, opt);
    npm = action;
  }

  await removeFile(opt.targetDirectory + "/package.json");
  await createFile(opt.name + "/package.json", npm, true, true);
  return;
}

export async function copyProjectFiles(opt) {
  let templateMode;
  if (opt.typescript != undefined) {
    templateMode = "vue-ts-router";
  } else {
    templateMode = "vue-js-router";
  }

  // await Waiter(4000);
  copyDirectories(
    opt.templateDirectory + "/" + templateMode,
    opt.targetDirectory
  );
  return;
}

export async function xmlFileToJs(filename, cb) {
  let xmlStr = await readFile(filename);
  xml2js.parseString(xmlStr.value, {}, cb);
}

export async function jsToXmlFile(filename, obj) {
  var builder = new xml2js.Builder();
  var xml = builder.buildObject(obj);
  createFile(filename, xml, false, false);
}

export async function publicPrepaire(opt) {
  await xmlFileToJs(opt.name + "/config.xml", async function(err, obj) {
    if (err) throw err;
    let splash = [
      {
        $: {
          name: "SplashMaintainAspectRatio",
          value: "true"
        }
      },
      {
        $: {
          name: "SplashShowOnlyFirstTime",

          value: "false"
        }
      },
      {
        $: {
          name: "FadeSplashScreenDuration",
          value: "500"
        }
      },
      {
        $: {
          name: "SplashScreenDelay",
          value: "6000"
        }
      },
      {
        $: {
          name: "ShowSplashScreenSpinner",
          value: "false"
        }
      },
      {
        $: {
          name: "AutoHideSplashScreen",
          value: "false"
        }
      },
      {
        $: {
          name: "FadeSplashScreen",
          value: "true"
        }
      },
      {
        $: {
          name: "ShowSplashScreen",
          value: "true"
        }
      }
    ];

    let platform = [
      {
        $: {
          name: "browser"
        },
        preference: {
          $: {
            name: "SplashScreen",
            value: "img/logo.png"
          }
        }
      },
      {
        $: {
          name: "ios"
        },
        preference: {
          $: {
            name: "SplashScreen",
            value: "screen"
          }
        }
      },
      {
        $: {
          name: "android"
        },
        preference: {
          $: {
            name: "SplashScreen",
            value: "screen"
          }
        }
      }
    ];

    obj.widget = {
      ...obj.widget,
      preference: splash
    };

    let browserFilled = false;
    for (let i = 0; i < platform.length; i++) {
      for (let u = 0; u < obj.widget.platform.length; u++) {
        if (obj.widget.platform[u].$.name == platform[i].$.name) {
          if (!obj.widget.platform[u].preference) {
            obj.widget.platform[u] = {
              ...obj.widget.platform[u],
              preference: platform[i].preference
            };
          }
        } else if (platform[i].$.name == "browser") {
          if (browserFilled == false) {
            obj.widget.platform.push(platform[i]);
            browserFilled = true;
          }
        }
      }
    }

    await removeFile(opt.targetDirectory + "/config.xml");
    await jsToXmlFile(opt.targetDirectory + "/config.xml", obj);
  });
  await shell.exec("cordova build browser");
  await copyDirectories(
    opt.targetDirectory + "/platforms/browser/www/cordova-js-src",
    opt.targetDirectory + "/public/cordova-js-src"
  );

  await copyDirectories(
    opt.targetDirectory + "/platforms/browser/www/img",
    opt.targetDirectory + "/public/img"
  );

  await copyDirectories(
    opt.targetDirectory + "/platforms/browser/www/plugins",
    opt.targetDirectory + "/public/plugins"
  );

  await copyFile(
    opt.targetDirectory + "/platforms/browser/www/config.xml",
    opt.targetDirectory + "/public/config.xml"
  );

  await copyFile(
    opt.targetDirectory + "/platforms/browser/www/cordova_plugins.js",
    opt.targetDirectory + "/public/cordova_plugins.js"
  );

  await copyFile(
    opt.targetDirectory + "/platforms/browser/www/cordova.js",
    opt.targetDirectory + "/public/cordova.js"
  );

  await copyFile(
    opt.targetDirectory + "/platforms/browser/www/manifest.json",
    opt.targetDirectory + "/public/manifest.json"
  );

  return;
}

export async function onCreateProject(opt) {
  const currentFileUrl = import.meta.url;
  const templateDir = path.resolve(
    new URL(currentFileUrl).pathname,
    "../../templates"
  );
  opt = {
    ...opt,
    templateDirectory: templateDir
  };
  //
  try {
    await access(templateDir, fs.constants.R_OK);
  } catch (err) {
    console.error("%s Invalid template name", chalk.red.bold("ERROR"));
    process.exit(1);
  }

  const tasks = new Listr([
    {
      title: "Creating cordova project",
      task: () => initCordova(opt)
    },
    {
      title: "Creating project files",
      task: () => copyProjectFiles(opt)
    },
    {
      title: "Setup project files",
      task: () => projectPrepairing(opt)
    },
    {
      title: "Initialize git",
      task: () => initGit(opt)
    },
    {
      title: "Install dependencies",
      task: () =>
        projectInstall({
          cwd: opt.targetDirectory
        })
    },
    {
      title: "Add cordova dependencies",
      task: () => installDependencies(opt)
    },
    {
      title: "Setup folder public",
      task: () => publicPrepaire(opt)
    }
  ]);

  await tasks.run();
  console.log("%s Project ready", chalk.green.bold("DONE"));
  return true;
}
