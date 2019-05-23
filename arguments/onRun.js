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
import {readFile, createFile} from "../actions";

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
  try {
    await execa.shell("npm run build");
  } catch (error) {
    return Promise.reject(new Error("Failed to compiling project"));
  }

  await buildFixer();
  return;
}

async function onBuild(device) {
  execa.shell("cordova run " + device);
  return;
}

async function onListr(device) {
  let file = await readFile("platforms/" + device + "/" + device + ".json");
  if (file.finded) {
    const tasks = new Listr([
      {
        title: "Project compiling",
        task: () => onCompiling()
      },
      {
        title: "Build " + device + " app",
        task: () => onBuild(device)
      }
    ]);
    await tasks.run();
    console.log("%s " + device + " app has running", chalk.green.bold("DONE"));
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

async function onServe() {
  let cmd = await shell.exec("npm run serve");
  console.log(chalk.red(cmd));
}

export async function onRunServe() {
  await onCompiling();
  onServe();
  // console.log("%s development mode has running", chalk.green.bold("DONE"));
  // return true;
}
