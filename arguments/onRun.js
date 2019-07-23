import chalk from "chalk";
import fs from "fs";
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
  readFile,
  createFile,
  copyDirectories,
  copyFile,
  fileReplace,
  getIvueDirectory,
  contentReplace
} from "../actions";

let Danger = "#852222";
let Success = "#228564";
let danger = chalk.hex(Danger);
let success = chalk.hex(Success);

async function buildFixer() {
  await execa.shell(
    "rm -rf ./www/cordova.js ./www/manifest.json ./www/cordova-js-src ./www/plugins ./www/config.xml ./www/cordova_plugins.js"
  );
  return;
}

async function onCompiling() {
  //Check if using typescript, fix typescript package
  let check_1 = await readFile("tsconfig.json");
  if (check_1.finded) {
    let fileTarget = "node_modules/typescript/lib/lib.dom.d.ts";
    let check_2 = await readFile(fileTarget);
    if (check_2.finded) {
      let string =
        "type ElementTagNameMap = HTMLElementTagNameMap & Pick<SVGElementTagNameMap, Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>>;";
      check_2 = await check_2.value.search(string);
      if (check_2 != -1) {
        let templateDir = await getIvueDirectory();
        templateDir = templateDir + "/templates/lib.dom.d.ts";
        fileReplace(fileTarget, templateDir);
      }
    }
  }

  try {
    await execa.shell("npm run build");
  } catch (error) {
    return Promise.reject(new Error("Failed to compiling project"));
  }

  await buildFixer();
  return;
}

async function onBuild(device) {
  let cmd = await execa.shell("cordova run " + device);
  console.log(cmd.stdout);
  return;
}

async function onListr(device) {
  let file = await readFile("platforms/" + device + "/" + device + ".json");
  if (file.finded) {
    const tasks = new Listr([
      {
        title: "Project compiling",
        task: () => onCompiling()
      }
    ]);
    await tasks.run();
    console.log("%s Compiling has successfully", chalk.green.bold("DONE"));
    await onBuild(device);
    return true;
  } else {
    console.log(
      danger(
        'The platform "' +
          device +
          '" does not appear to have been added to this project.'
      )
    );
  }
}

export async function onRunProject(opt) {
  if (opt.device == "android") {
    onListr(opt.device);
  } else if (opt.device == "ios") {
    onListr(opt.device);
  } else if (opt.device == "browser") {
    onListr(opt.device);
  }
}

async function onBeforeServe() {
  await copyDirectories(
    "platforms/browser/www/cordova-js-src",
    "public/cordova-js-src"
  );
  await copyDirectories("platforms/browser/www/img", "public/img");
  await copyDirectories("platforms/browser/www/plugins", "public/plugins");
  await copyFile("platforms/browser/www/config.xml", "public/config.xml");
  await copyFile(
    "platforms/browser/www/cordova_plugins.js",
    "public/cordova_plugins.js"
  );
  await copyFile("platforms/browser/www/cordova.js", "public/cordova.js");
  await copyFile("platforms/browser/www/manifest.json", "public/manifest.json");
}

async function onServe() {
  let cmd = await shell.exec("npm run dev");
  console.log(chalk.red(cmd));
}

export async function onBuildDev(device) {
  let cmd = await execa.shell("cordova build " + device);
  return;
}

export async function onRunServe() {
  const tasks = new Listr([
    {
      title: "Project compiling",
      task: () => onCompiling()
    },
    {
      title: "Project building",
      task: () => onBuildDev("browser")
    },
    {
      title: "Project Prepairing",
      task: () => onBeforeServe()
    }
  ]);
  await tasks.run();
  console.log(
    "%s Compiling and Prepairing has successfully",
    chalk.green.bold("DONE")
  );
  await onServe();
  return;
}
