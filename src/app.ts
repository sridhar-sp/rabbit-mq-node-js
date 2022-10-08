import express from "express";
import Producer from "./rabbitmq/Producer";
import Consumer from "./rabbitmq/Consumer";
import config from "./config/config";
import logger from "./logger/logger";
import swaggerMiddleware from "./swagger/swagger";

const app = express();
const PORT = config.PORT;

const producer = Producer.create(config.RABBIT_MQ_URL!!);

app.use("/api-docs", swaggerMiddleware.ui, swaggerMiddleware.doc);
app.use("/api-docs.json", (req: express.Request, res: express.Response) => {
  res.send(swaggerMiddleware.swaggerSpecification);
});
app.get("/", (req: express.Request, res: express.Response) => {
  res.send(`Welcome, Application is running at ${PORT} at process ${process.pid}\n`);
});

/**
 * @swagger
 * /sendDelayedMessage/{queueName}/{message}/{timeInMillis}:
 *   get:
 *     description: Send a message
 *     parameters:
 *      - in : path
 *        name : queueName
 *        schema :
 *          type : string
 *        required : true
 *        description : Queue to receive the delayed message
 *      - in : path
 *        name : message
 *        schema :
 *          type: string
 *        required: true
 *        description : Message
 *      - in : path
 *        name : timeInMillis
 *        schema :
 *          type : integer
 *        required: true
 *        description : Delay in milli seconds
 *     responses:
 *       200:
 *         description: Message sent status succes {status_bool}
 */
app.get(
  "/sendDelayedMessage/:queueName/:message/:timeInMillis",
  async (req: express.Request, res: express.Response) => {
    const queueName: string = req.params.queueName;
    const message: string = req.params.message;
    const timeInMillis: number = parseInt(req.params.timeInMillis);
    producer.sendDelayedMessageToQueue(queueName, timeInMillis, message);
    res.send(`Initiated the delayed nessage, this request handled in process ${process.pid}\n`);
  }
);

/**
 * @swagger
 * /setupConsumer/{consumerName}/{queueName}:
 *   get:
 *     description: Setup a consumer to consume messages from a specified queue
 *     parameters:
 *      - in : path
 *        name : consumerName
 *        schema :
 *          type: string
 *        required: true
 *        description : Consumer name
 *      - in : path
 *        name : queueName
 *        schema :
 *          type : string
 *        required : true
 *        description : Queue to consume messages from
 *     responses:
 *       200:
 *         description: Message sent status succes {status_bool}
 */
app.get("/setupConsumer/:consumerName/:queueName", async (req: express.Request, res: express.Response) => {
  const consumerName: string = req.params.consumerName;
  const queueName: string = req.params.queueName;
  const consumer: Consumer = Consumer.create(config.RABBIT_MQ_URL!!);
  consumer.consume(queueName, (payload) => {
    logger.log(`Consumer from process ${process.pid} received the message ${payload} at at ${new Date().toTimeString()}`);
  });

  Consumer.create(config.RABBIT_MQ_URL!!).consume(queueName, (payload) => {
    logger.log(`Consumer from process ${process.pid} received the message ${payload}`);
  });

  res.send(`Consumer setup initiated, this request handled in process ${process.pid} \n`);
});

app.listen(PORT, () => {
  console.log(`Application is running at ${PORT} at process ${process.pid} \n`);
});

logger.log("Application instance created");
