# RabbitMQ Delayed Task Execution

A sample project demonstrating how to achieve a delayed task execution using RabbitMQ deadLetterExchange and message expiration time. (No additional library is needed :)

---

## Requirements

For development, you will need Node.js, npm and RabbitMQ installed in your environement.

## Install

    $ git clone https://github.com/half-blood-prince/rabbit-mq-node-js
    $ cd rabbit-mq-node-js
    $ npm install

## Run app

Start the application server

    $ npm start

This project is configured with the 'ts-node-dev'. If you make some changes and wanted those changes apply immediately without restarting the server. Use the below command to start the application

    $ npm run dev
