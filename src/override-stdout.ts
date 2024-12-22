//@ts-nocheck
import * as fs from "fs";
import * as path from "path";

// Function to get the current date as a string in YYYY-MM-DD format
function getDateString(): string {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

// Create dated log files for stdout and stderr
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const dateString = getDateString();
const stdoutLogFile = fs.createWriteStream(
  path.join(logDir, `stdout-${dateString}.log`),
  { flags: "a" },
);
const stderrLogFile = fs.createWriteStream(
  path.join(logDir, `stderr-${dateString}.log`),
  { flags: "a" },
);

// Override process.stdout.write to log to both the console and the stdout log file
const originalStdoutWrite = process.stdout.write;
process.stdout.write = (message: string) => {
  originalStdoutWrite.call(process.stdout, message); // Write to the console
  stdoutLogFile.write(message); // Write to the stdout log file
};

// Override process.stderr.write to log to both the console and the stderr log file
const originalStderrWrite = process.stderr.write;
process.stderr.write = (message: string) => {
  originalStderrWrite.call(process.stderr, message); // Write to the console
  stderrLogFile.write(message); // Write to the stderr log file
};

// Example usage
console.log("This is a standard log message.");
console.error("This is an error message.");
