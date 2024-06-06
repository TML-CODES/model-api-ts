import fs from "fs";
import path from "path";
import { threadId } from "worker_threads";
import moment from "moment";

const WRITE_LOGS = (process.env.WRITE_LOGS == 'true');
if(WRITE_LOGS){
    var logFilePath = path.join(__dirname, "..", "..", "log", `logs_${moment().format('YYYYMMDD')}.log`);
    if (!fs.existsSync(logFilePath)) fs.writeFileSync(logFilePath, "");
}

function redirectConsole(outputFunction, prefix) {
    return (...args) => {
        const logMessage = args
            .map((arg) =>  {
                if (arg instanceof Error) {
                    return arg.stack || arg.message;
                } else if (typeof arg === "object") {
                    return JSON.stringify(arg);
                }
                return arg;
            })
            .join(" ")
        ;
        const formattedMessage = `[${new Date().toISOString()}][${prefix}][Thread-${threadId}]${logMessage[0] != '[' ? ' ' + logMessage : logMessage}`;
        
        if(WRITE_LOGS) fs.appendFileSync(logFilePath, formattedMessage + '\n');

        outputFunction.apply(console, [formattedMessage]);
    };
}

console.log = redirectConsole(console.log, "LOG");
console.error = redirectConsole(console.error, "ERROR");
console.debug = redirectConsole(console.debug, "DEBUG");
console.warn = redirectConsole(console.warn, "WARN");

export default this;
