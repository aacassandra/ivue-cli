import fs from "fs";
import ncp from "ncp";
import {promisify} from "util";
const copy = promisify(ncp);
import execa from "execa";
import replace from "replace";
import path from "path";

export async function createFile(
  fileName,
  fileValue,
  stringify = false,
  beautify = false
) {
  return new Promise((resolve, reject) => {
    if (beautify == false) {
      fs.writeFile(
        fileName,
        stringify == false ? fileValue : JSON.stringify(fileValue),
        function(err) {
          if (err) {
            console.log(err);
            reject(true);
          } else {
            resolve(true);
          }
        }
      );
    } else {
      fs.writeFile(
        fileName,
        stringify == false ? fileValue : JSON.stringify(fileValue, null, 2),
        function(err) {
          if (err) {
            console.log(err);
            reject(true);
          } else {
            resolve(true);
          }
        }
      );
    }
  });
}

export async function copyDirectories(templateDirectory, targetDirectory) {
  return copy(templateDirectory, targetDirectory, {
    clobber: false
  });
}

export function copyFile(source, destination) {
  return new Promise((resolve, reject) => {
    fs.copyFile(source, destination, err => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

export function Waiter(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(function() {
      resolve(true);
    }, ms);
  });
}

export function renameFile(source, destination) {
  return new Promise((resolve, reject) => {
    fs.rename(source, destination, err => {
      if (err) {
        throw console.log(err);
        reject(true);
      } else {
        resolve(true);
      }
    });
  });
}

export async function removeFile(source) {
  return new Promise((resolve, reject) => {
    fs.unlink(source, err => {
      if (err) {
        console.error(err);
        reject(true);
      } else {
        resolve(true);
      }
    });
  });
}

export async function contentReplace(someFile, targetContent, replacement) {
  replace({
    regex: targetContent,
    replacement: replacement,
    paths: [someFile],
    recursive: true,
    silent: true
  });
}

export async function readFile(source, mode = "utf8") {
  return new Promise((resolve, reject) => {
    let sts = {};
    fs.readFile(source, mode, function(err, contents) {
      if (err) {
        sts = {
          finded: false,
          value: err
        };
        resolve(sts);
      } else {
        sts = {
          finded: true,
          value: contents
        };
        resolve(sts);
      }
    });
  });
}

export async function fileReplace(fileTarget, fileReplacement) {
  await removeFile(fileTarget);
  await copyFile(fileReplacement, fileTarget);
  return;
}

export async function getIvueDirectory() {
  const currentFileUrl = import.meta.url;
  const templateDir = await path.resolve(
    new URL(currentFileUrl).pathname,
    "../../"
  );
  return templateDir;
}
