import amqp, {
  Channel,
  Connection,
  Message,
  Replies,
} from "amqplib/callback_api";
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

  public assetQueue(
    queue: string,
    channel: Channel
  ): Promise<Replies.AssertQueue> {
    return new Promise(
      (
        resolve: (assertQueue: Replies.AssertQueue) => void,
        reject: (err: Error) => void
      ) => {
        channel.assertQueue(
          queue,
          {},
          (err: any, assertQueue: Replies.AssertQueue) => {
            if (err) {
              reject(new Error(err));
              return;
            }
            resolve(assertQueue);
          }
        );
      }
    );
  }

  public consumeFromQueue(queue: string): Promise<boolean> {
    return new Promise(
      (resolve: (success: boolean) => void, reject: (err: Error) => void) => {
        this.createChannel()
          .then((channel) => {
            channel.assertQueue(
              queue,
              {},
              (err: any, assertQueue: Replies.AssertQueue) => {
                if (err) {
                  throw new Error(err);
                }
                channel.consume(
                  queue,
                  (msg: Message | null) => {
                    logger.log(`Consumed the message ${msg?.content}`);
                  },
                  { noAck: true }
                );
              }
            );
          })
          .catch((e: any) => {
            logger.log(`Error while sending message to queue ${e}`);
            resolve(false);
          });
      }
    );
  }
}

export default Producer;
