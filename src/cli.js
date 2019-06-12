import arg from "arg";
import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import execa from "execa";
import shell from "shelljs";
import fs from "fs";
import pkg from "../package.json";
import isValidDomain from "is-valid-domain";
import {onCreateQuestions} from "../questions/onCreate";
import {onCreateProject, xmlFileToJs, jsToXmlFile} from "../arguments/onCreate";
import {onPlugin, onPlatform} from "../arguments/onCordova";
import {onRunQuestions} from "../questions/onRun";
import {onRunServe} from "../arguments/onRun";
import {
  readFile,
  createFile,
  contentReplace,
  getIvueDirectory,
  fileReplace
} from "../actions";
let Danger = "#852222";
let Success = "#228564";
let Info = "#327a9e";
let opt = {};

function checkProjectDirectories(modeDefault = true) {
  return new Promise(async (resolve, reject) => {
    let contents = await readFile("ionic.config.json");
    if (modeDefault == true) {
      if (contents.finded != true) {
        console.log(chalk.hex(Danger)("Outside ivue project directory"));
        console.log("    ");
      } else {
        let ivue = contents.value.search("ivue");
        let res = contents.value.substring(ivue, ivue + 4);
        if (res == "ivue") {
          console.log(chalk.hex(Success)("Inside ivue project directory"));
        } else {
          console.log(chalk.hex(Danger)("Outside ivue project directory"));
        }
        console.log("    ");
      }
      resolve(true);
    } else {
      if (!contents.finded) {
        console.log(chalk.hex(Danger)("Outside ivue project directory"));
        resolve(false);
      } else {
        let ivue = contents.value.search("ivue");
        let res = contents.value.substring(ivue, ivue + 4);
        if (res == "ivue") {
          resolve(true);
        } else {
          console.log(chalk.hex(Danger)("Outside ivue project directory"));
          resolve(false);
        }
      }
    }
  });
}

function OnHelp() {
  console.log("opt");
  console.log(
    chalk.hex(Info)("  -v, --version"),
    "............................ Output the version number"
  );
  console.log(
    chalk.hex(Info)("  -h, --help"),
    "............................... Output usage information"
  );
  console.log("    ");
  console.log("Global Commands");
  console.log(
    chalk.hex(Info)("  create <app-name> <app-domain>"),
    "........... Create a new project with app-domain for optional"
  );
  console.log(
    chalk.hex(Info)("  plugin <action> <plugin-name>"),
    "............ Manage project plugins"
  );
  console.log(
    chalk.hex(Info)("  platform <action> <os>"),
    "................... Manage project platform"
  );
  console.log(
    chalk.hex(Info)("  run <os>"),
    "................................. Run project (include prepaire & compile)"
  );
  console.log(
    chalk.hex(Info)("  build <os>"),
    "............................... Project prepare & compile"
  );
  console.log(
    chalk.hex(Info)("  prepare <os>"),
    "............................. Copy files into platform(s) for building"
  );
  console.log("    ");
  console.log("Examples");
  console.log(chalk.hex(Info)("  ivue create myApp org.apache.cordova.myApp"));
  console.log(chalk.hex(Info)("  ivue plugin add cordova-plugin-camera"));
  console.log(chalk.hex(Info)("  ivue plugin rm cordova-plugin-camera"));
  console.log(chalk.hex(Info)("  ivue platform add android"));
  console.log(chalk.hex(Info)("  ivue platform rm android"));
  console.log(chalk.hex(Info)("  ivue run android"));
  console.log(chalk.hex(Info)("  ivue run serve"));
  console.log(chalk.hex(Info)("  ivue build android"));
  return;
}

async function arg00() {
  clear();
  console.log(
    chalk.hex(Info)(
      figlet.textSync("iVue", {
        horizontalLayout: "full"
      })
    )
  );
  console.log("iVue is a CLI for ionic project with Vue framework");
  console.log("    ");
  await OnHelp();
  console.log("    ");
  await checkProjectDirectories();

  // await xmlFileToJs("config.xml", async function(err, obj) {
  //   if (err) throw err;
  //   console.log(JSON.stringify(obj, null, 2));
  // });
}

async function arg01(arg1) {
  if (arg1 == "create") {
    console.log(
      chalk.hex(Danger)("ivue create <app-name> <app-domain:optional>")
    );
  } else if (arg1 == "platform") {
    console.log(
      chalk.hex(Danger)("ivue platform <action:add/rm> <os:android/ios>")
    );
  } else if (arg1 == "plugin") {
    console.log(
      chalk.hex(Danger)("ivue plugin <action:add/rm> <cordova-plugin-name>")
    );
  } else if (arg1 == "run") {
    console.log(chalk.hex(Danger)("ivue run <opt:android,ios,serve>"));
  } else if (arg1 == "build") {
    console.log(chalk.hex(Danger)("ivue build <os:android/ios>"));
  } else if (arg1 == "prepare") {
    console.log(chalk.hex(Danger)("ivue prepare <os:android/ios>"));
  } else if (arg1 == "--version" || arg1 == "-v") {
    console.log(chalk.hex(Info)("iVue CLI v" + pkg.version));
  } else if (arg1 == "--help" || arg1 == "-h") {
    OnHelp();
  } else if (arg1 == "--info" || arg1 == "-i") {
    process.stdout.write("\x1Bc");
    let vue = {
      stdout: "",
      stderr: ""
    };

    let ionic = {
      stdout: "",
      stderr: ""
    };

    try {
      let cmd = await execa.shell("vue --version");
      vue.stdout = cmd.stdout;
    } catch (err) {
      vue.stderr = err;
    }

    try {
      let cmd = await execa.shell("ionic --version");
      ionic.stdout = cmd.stdout;
    } catch (err) {
      ionic.stderr = err;
    }

    console.log(chalk.hex(Info)("iVue CLI v" + pkg.version));
    if (vue.stderr) {
      console.log(chalk.hex(Danger)("Vue not installed"));
    } else {
      console.log(chalk.hex(Info)("Vue v" + vue.stdout));
    }

    if (ionic.stderr) {
      console.log(chalk.hex(Danger)("Ionic not installed"));
    } else {
      console.log(chalk.hex(Info)("Ionic v" + ionic.stdout));
    }
    // console.log(vue);
    // console.log(ionic);
  } else {
    console.log(
      chalk.hex(Danger)("ivue command not found, please read 'ivue --help'")
    );
  }
}

async function arg02(arg1, arg2) {
  if (arg1 == "create") {
    if (arg2 != null || arg2 != undefined || arg2 != "") {
      opt = {
        ...opt,
        mode: arg1,
        name: arg2,
        targetRoot: process.cwd(),
        targetDirectory: process.cwd() + "/" + arg2
      };
      process.stdout.write("\x1Bc");
      console.log(chalk.hex(Info)("iVue CLI v" + pkg.version));
      let res = await onCreateQuestions(opt);
      // console.log(res);
      let res2 = await onCreateProject(res);
    }
  } else if (arg1 == "plugin") {
    if (arg2 == "add") {
      console.log(chalk.hex(Danger)("ivue plugin add <cordova-plugin-name>"));
    } else if (arg2 == "rm") {
      console.log(chalk.hex(Danger)("ivue plugin rm <cordova-plugin-name>"));
    } else {
      console.log(
        chalk.hex(Danger)("ivue command not found, please read 'ivue --help'")
      );
    }
  } else if (arg1 == "platform") {
    if (arg2 == "add") {
      console.log(
        chalk.hex(Danger)("ivue plugin add <os:android,ios,browser>")
      );
    } else if (arg2 == "rm") {
      console.log(chalk.hex(Danger)("ivue plugin rm <os:android,ios,browser>"));
    } else {
      console.log(
        chalk.hex(Danger)("ivue command not found, please read 'ivue --help'")
      );
    }
  } else if (arg1 == "run") {
    let check = await checkProjectDirectories(false);
    if (check != false) {
      if (arg2 == "device") {
        process.stdout.write("\x1Bc");
        console.log(chalk.hex(Info)("iVue CLI v" + pkg.version));
        let res = await onRunQuestions();
      } else if (arg2 == "dev") {
        process.stdout.write("\x1Bc");
        console.log(chalk.hex(Info)("iVue CLI v" + pkg.version));
        let res = await onRunServe();
      } else {
        console.log(
          chalk.hex(Danger)("ivue command not found, please read 'ivue --help'")
        );
      }
    }
  } else if (arg1 == "build") {
    if (arg2 == "android") {
      console.log("ivue " + arg1 + " " + arg2);
    } else if (arg2 == "ios") {
      console.log("ivue " + arg1 + " " + arg2);
    } else if (arg2 == "browser") {
      console.log("ivue " + arg1 + " " + arg2);
    } else if (arg2 == "serve") {
      console.log("ivue " + arg1 + " " + arg2);
    } else {
      console.log(
        chalk.hex(Danger)("ivue command not found, please read 'ivue --help'")
      );
    }
  } else if (arg1 == "prepare") {
    if (arg2 == "android") {
      console.log("ivue " + arg1 + " " + arg2);
    } else if (arg2 == "ios") {
      console.log("ivue " + arg1 + " " + arg2);
    } else if (arg2 == "browser") {
      console.log("ivue " + arg1 + " " + arg2);
    } else if (arg2 == "serve") {
      console.log("ivue " + arg1 + " " + arg2);
    } else {
      console.log(
        chalk.hex(Danger)("ivue command not found, please read 'ivue --help'")
      );
    }
  } else if (arg1 == "cordova") {
    if (arg2 == "resources") {
      let check = await checkProjectDirectories(false);
      if (check != false) {
        try {
          await execa.shell("ionic cordova resources");
        } catch (err) {
          if (
            err.stderr ==
            "[ERROR] No platforms detected. Please run: ionic cordova platform add\n"
          ) {
            console.log(
              chalk.hex(Danger)(
                "No platforms detected. Please run: ivue platform add'"
              )
            );
          }
        }
      }
      // console.log(check2);
    }
  } else {
    console.log(
      chalk.hex(Danger)("ivue command not found, please read 'ivue --help'")
    );
  }
}

async function arg03(arg1, arg2, arg3) {
  if (arg1 == "create") {
    if (arg2 != null || arg2 != undefined || arg2 != "") {
      if (arg3 != null || arg3 != undefined || arg3 != "") {
        let appDomainChecking = isValidDomain(arg3);
        if (appDomainChecking == true) {
          console.log("ivue " + arg1 + " " + arg2 + " " + arg3);
        } else {
          console.log(chalk.hex(Danger)("ivue <app-domain> is invalid"));
        }
      }
    }
  } else if (arg1 == "plugin") {
    if (arg2 == "add") {
      await onPlugin(arg2, arg3);
    } else if (arg2 == "rm") {
      await onPlugin(arg2, arg3);
    }
  } else if (arg1 == "platform") {
    if (arg2 == "add") {
      if (arg3 == "android") {
        await onPlatform(arg2, arg3);
      } else if (arg3 == "ios") {
        await onPlatform(arg2, arg3);
      } else if (arg3 == "browser") {
        await onPlatform(arg2, arg3);
      }
    } else if (arg2 == "rm") {
      if (arg3 == "android") {
        await onPlatform(arg2, arg3);
      } else if (arg3 == "ios") {
        await onPlatform(arg2, arg3);
      } else if (arg3 == "browser") {
        await onPlatform(arg2, arg3);
      }
    }
  } else {
    console.log(
      chalk.hex(Danger)("ivue commands is invalid, please read 'ivue --help'")
    );
  }
}

function arg04(arg1, arg2, arg3, arg4) {
  if (arg1 == "create") {
    console.log(
      chalk.hex(Danger)(
        "ivue create argument is invalid, please read 'ivue --help'"
      )
    );
  } else if (arg1 == "plugin") {
    console.log(
      chalk.hex(Danger)(
        "ivue plugin argument is invalid, please read 'ivue --help'"
      )
    );
  } else if (arg1 == "platform") {
    console.log(
      chalk.hex(Danger)(
        "ivue platform argument is invalid, please read 'ivue --help'"
      )
    );
  } else {
    console.log(
      chalk.hex(Danger)("ivue commands is invalid, please read 'ivue --help'")
    );
  }
}

function argumentsController(rawArgs) {
  let args = rawArgs.slice(2);
  let length = args.length;
  if (length == 0) {
    arg00();
  } else if (length == 1) {
    arg01(args[0]);
  } else if (length == 2) {
    arg02(args[0], args[1]);
  } else if (length == 3) {
    arg03(args[0], args[1], args[2]);
  } else if (length == 4) {
    arg04(args[0], args[1], args[2], args[3]);
  }
}

export function cli(args) {
  argumentsController(args);
}
