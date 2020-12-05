import express from "express";
import Producer from "./rabbitmq/Producer";
import Consumer from "./rabbitmq/Consumer";
import config from "./config/config";

const app = express();
const PORT = 3000;

const producer = new Producer(config.RABBIT_MQ_HOST, config.RABBIT_MQ_PORT);
const consumerOne = new Consumer(
  config.RABBIT_MQ_HOST,
  config.RABBIT_MQ_PORT,
  "Consumer One"
);
const consumerTwo = new Consumer(
  config.RABBIT_MQ_HOST,
  config.RABBIT_MQ_PORT,
  "Consumer Two"
);
const consumerThree = new Consumer(
  config.RABBIT_MQ_HOST,
  config.RABBIT_MQ_PORT,
  "Consumer Three"
);

consumerOne.consumeFromQueue("first_queu");
consumerTwo.consumeFromQueue("first_queu");
consumerThree.consumeFromQueue("first_queu");

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Welcome ");
});

app.get(
  "/send/:message",
  async (req: express.Request, res: express.Response) => {
    const message: string = req.params.message;
    const status = await producer.sendToQueue("first_queu", message);
    res.send(`Message sent status success = ${status}`);
  }
);

app.listen(PORT, () => {
  console.log(`Application is running at ${PORT}`);
});
