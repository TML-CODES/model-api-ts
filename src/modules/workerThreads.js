const { isMainThread } = require('node:worker_threads');
const Pool = require('worker-threads-pool');
require('./logger');

const CPUs = require('os').cpus().length;

if(isMainThread){

    const processName = 'WorkerThreads';
    const pool = new Pool({ max: CPUs });
    
    module.exports = (filePath, arrayParams)=>{
        if(isMainThread){
            console.log(`[INFO][${processName}] IS MAIN THREAD - CPUs Available: ${CPUs}`);
        
            // const worker = new Worker(filePath, { workerData: '' });
            pool.acquire(filePath, { workerData: JSON.stringify(arrayParams) }, 
                (err, worker)=>{
                    if(err) return console.error(console.error(`[ERROR][WorkerThreads]: `, err));
                    
                    console.log(
                        `[INFO][${processName}] Started worker - pool size: ${pool.size} - File Called: ${filePath} | PARAMS: ${JSON.stringify(arrayParams || [])}`
                    );
            
                    worker.on('message', (message) => {});
                    worker.on('error', (error) => {
                        console.error(processName, error)
                    });
                    worker.on('exit', (code)=>{
                        if(code !== 0) 
                            console.error(
                                processName,
                                `${filePath} => Worker stopped with exit code ${code}`
                            );
                    });
                }
            );
        }
    };
}
