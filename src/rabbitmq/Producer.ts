import { Replies, Message } from "amqplib/callback_api";

import AMQBBase from "./amqpBase";
import logger from "../logger/logger";

class Producer extends AMQBBase {
  public sendDeleayeMessageToQueueV1(queueName: string, delayInMills: number, data: string) {
    const INTERMEDIATE_EXCHANGE = "intermediate_exchange";
    const INTERMEDIATE_QUEUE = "intermediate_queue";

    const FINAL_EXCHANGE = "final_exchange";

    this.assertExchange(INTERMEDIATE_EXCHANGE, "fanout")
      .then((_) => this.assertExchange(FINAL_EXCHANGE, "fanout"))
      .then((_) =>
        this.assertQueue(INTERMEDIATE_QUEUE, {
          deadLetterExchange: FINAL_EXCHANGE,
        })
      )
      .then((_) => this.assertQueue(queueName, {}))
      .then((_) => this.bindQueue(INTERMEDIATE_QUEUE, INTERMEDIATE_EXCHANGE, ""))
      .then((_) => this.bindQueue(queueName, FINAL_EXCHANGE, ""))
      .then((_) => {
        this.channel?.sendToQueue(INTERMEDIATE_QUEUE, Buffer.from(data), {
          expiration: delayInMills,
        });
      })
      .catch((error: Error) => {
        logger.log(`Error while trying to send delayed message. Process id ${process.pid}`);
      });
  }

  public sendToQueue(queueName: string, message: string): Promise<boolean> {
    return new Promise((resolve: (success: boolean) => void, reject: (err: Error) => void) => {
      this.assertQueue(queueName, {})
        .then((queue) => {
          this.channel?.sendToQueue(queueName, Buffer.from(message), {
            expiration: 5000,
          });
          logger.log(`${message} Sent from process ${process.pid}`);
          resolve(true);
        })
        .catch((e: any) => {
          logger.log(`Error while sending message to queue ${e}`);
          resolve(false);
        });
    });
  }
}

export default Producer;
