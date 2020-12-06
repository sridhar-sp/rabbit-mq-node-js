import cluster from "cluster";
import os from "os";
import logger from "./logger/logger";

if (cluster.isMaster) {
  logger.log("Master node called");
  const numOfCores = os.cpus().length;
  logger.log(`${numOfCores} available`);

  for (let i = 0; i < numOfCores; i++) {
    const worker = cluster.fork();
  }
  cluster.on("online", (worker) => {
    logger.log(`worker ${worker.id} is online`);
  });

  cluster.on("disconnect", (worker) => {
    logger.log(`worker ${worker.id} is disconnected`);
  });

  cluster.on("exit", (worker, code, signal) => {
    logger.log(
      `Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`
    );
    if (code !== 0) {
      console.log("Starting a new worker");
      cluster.fork();
    }
  });
} else {
  require("./app");
}
