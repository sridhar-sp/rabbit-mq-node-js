import amqp, { Channel, Connection, Message, Replies } from "amqplib/callback_api";
import AMQBBase from "./amqpBase";
import logger from "../logger/logger";

class Consumer extends AMQBBase {
  public static create(url: string): Consumer {
    return new Consumer(url);
  }

  private constructor(url: string) {
    super(url);
  }
  public consume(queue: string) {
    this.assertQueue(queue, {})
      .then((_) => {
        this.channel?.consume(
          queue,
          (msg: Message | null) => {
            logger.log(`Consumer from process ${process.pid} received the message ${msg?.content}`);
          },
          { noAck: true }
        );
      })
      .catch((error) => {
        logger.log(`Error while consuming : ${error}`);
      });
  }
}

export default Consumer;
