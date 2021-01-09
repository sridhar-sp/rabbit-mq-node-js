const dotenv = require("dotenv");

export default {
  RABBIT_MQ_URL: process.env.RABBIT_MQ_URL,
  APP_NAME: "RabbitMQ Delayed Task Execution",
  VERSION: "1.0.0",
};
