import express from "express";

const app = express();
const PORT = 3000;

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Welcome ");
});

app.listen(PORT, () => {
  console.log(`Application is running at ${PORT}`);
});
