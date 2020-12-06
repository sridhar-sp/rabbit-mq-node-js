import amqp, {
  Channel,
  Connection,
  Options,
  Replies,
  Message,
} from "amqplib/callback_api";
import e from "express";
import logger from "../logger/logger";
class Producer {
  private host: String;
  private port: number;
  private channel: Channel | null;
  private connection: Connection | null;

  constructor(host: String, port: number) {
    this.host = host;
    this.port = port;
    this.channel = null;
    this.connection = null;
  }

  private getConnection(): Promise<Connection> {
    return new Promise(
      (
        resolve: (connection: Connection) => void,
        reject: (err: Error) => void
      ) => {
        if (this.connection) {
          resolve(this.connection);
          return;
        }
        const url = `amqp://${this.host}:${this.port}`;
        amqp.connect(url, (err: any, connection: Connection) => {
          if (err) {
            logger.error(err);
            reject(err);
            return;
          }
          resolve(connection);
        });
      }
    );
  }

  private createChannel(): Promise<Channel> {
    return new Promise(
      async (
        resolve: (channel: Channel) => void,
        reject: (error: Error) => void
      ) => {
        if (this.channel) {
          resolve(this.channel);
          return;
        }
        let connection: Connection;
        try {
          connection = await this.getConnection();
        } catch (e: any) {
          reject(Error("Could not get the rabbit mq connection object"));
          return;
        }

        connection.createChannel((err: any, channel: Channel) => {
          if (err) {
            logger.log(err);
            reject(err);
            return;
          }
          resolve(channel);
        });
      }
    );
  }

  public assertExchange(
    channel: Channel,
    exchange: string,
    type: string,
    options?: Options.AssertExchange
  ): Promise<RepliesReturn<Replies.AssertExchange>> {
    return new Promise(
      (
        resolve: (reply: RepliesReturn<Replies.AssertExchange>) => void,
        reject: (err: Error) => void
      ) => {
        channel.assertExchange(
          exchange,
          type,
          options,
          (err: any, assertedExchange: Replies.AssertExchange) => {
            if (err) {
              reject(new Error(err));
              return;
            }
            resolve(new RepliesReturn(channel, assertedExchange));
          }
        );
      }
    );
  }

  public assertQueue(
    channel: Channel,
    queue?: string,
    options?: Options.AssertQueue
  ): Promise<RepliesReturn<Replies.AssertQueue>> {
    return new Promise(
      (
        resolve: (reply: RepliesReturn<Replies.AssertQueue>) => void,
        reject: (err: Error) => void
      ) => {
        channel.assertQueue(
          queue,
          options,
          (err: any, assertedQueue: Replies.AssertQueue) => {
            if (err) {
              reject(new Error(err));
              return;
            }
            resolve(new RepliesReturn(channel, assertedQueue));
          }
        );
      }
    );
  }

  public bindQueue(
    channel: Channel,
    queue: string,
    source: string,
    pattern: string,
    args?: any
  ): Promise<RepliesReturn<Replies.Empty>> {
    return new Promise(
      (resolve: (reply: any) => void, reject: (error: Error) => void) => {
        channel.bindQueue(
          queue,
          source,
          pattern,
          args,
          (err: any, ok: Replies.Empty) => {
            if (err) {
              reject(new Error(err));
              return;
            }
            resolve(new RepliesReturn(channel, ok));
          }
        );
      }
    );
  }

  public sendDeleayeMessageToQueueV1(
    queue: string,
    delayInMills: number,
    data: string
  ) {
    this.createChannel()
      .then((channel) =>
        this.assertExchange(channel, "intermediate_exchange", "fanout")
      )
      .then((reply: RepliesReturn<Replies.AssertExchange>) =>
        this.assertExchange(reply.channel, "final_exchange", "fanout")
      )
      .then((reply: RepliesReturn<Replies.AssertExchange>) =>
        this.assertQueue(reply.channel, "intermediate_queue", {
          deadLetterExchange: "final_exchange",
        })
      )
      .then((reply: RepliesReturn<Replies.AssertQueue>) =>
        this.assertQueue(reply.channel, "final_queue", {})
      )
      .then((reply: RepliesReturn<Replies.AssertQueue>) =>
        this.bindQueue(
          reply.channel,
          "intermediate_queue",
          "intermediate_exchange",
          ""
        )
      )
      .then((reply: RepliesReturn<Replies.Empty>) =>
        this.bindQueue(reply.channel, "final_queue", "final_exchange", "")
      )
      .then((reply: RepliesReturn<Replies.Empty>) => {
        reply.channel.sendToQueue("intermediate_queue", Buffer.from(data), {
          expiration: delayInMills,
        });

        reply.channel.consume("final_queue", (msg: Message | null) => {
          logger.log(
            `Consumer from process ${process.pid} received the message ${msg?.content} in final_queue`
          );
        });
      })
      .catch((error: Error) => {
        logger.log(
          `Error while trying to send delayed message. Process id ${process.pid}`
        );
      });
  }

  public sendDeleayeMessageToQueue(
    queue: string,
    delayInMills: number,
    data: string
  ) {
    this.createChannel().then((channel) => {
      channel.assertQueue(
        "intermediate_queue_1",
        { deadLetterExchange: queue, messageTtl: delayInMills },
        (err: any, intermediateQueue: Replies.AssertQueue) => {
          if (err) {
            throw new Error(err);
          }
          channel.sendToQueue("intermediate_queue_1", Buffer.from(data));
          logger.log(
            `Delayed message:${data} \nSent from process ${
              process.pid
            } at ${new Date().getUTCMilliseconds()}`
          );
        }
      );
    });
  }

  public sendToQueue(queue: string, message: string): Promise<boolean> {
    return new Promise(
      (resolve: (success: boolean) => void, reject: (err: Error) => void) => {
        this.createChannel()
          .then((channel: Channel) => {
            try {
              channel.assertQueue(
                queue,
                {},
                (err: any, ok: Replies.AssertQueue) => {
                  if (err) {
                    throw new Error(err);
                  }
                  channel.sendToQueue(queue, Buffer.from(message), {
                    expiration: 5000,
                  });
                  logger.log(`${message} Sent from process ${process.pid}`);
                  resolve(true);
                }
              );
            } catch (e: any) {
              logger.log(`Error while sending message to queue ${e}`);
              resolve(false);
            }
          })
          .catch((e: any) => {
            logger.log(`Error while sending message to queue ${e}`);
            resolve(false);
          });
      }
    );
  }

  public close() {
    this.connection?.close;
  }
}

export default Producer;

class RepliesReturn<T> {
  channel: Channel;
  reply: T;

  constructor(channel: Channel, reply: T) {
    this.channel = channel;
    this.reply = reply;
  }
}
