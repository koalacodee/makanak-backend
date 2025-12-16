import { Elysia } from "elysia";
const app = new Elysia();

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `🦊 Elysia is running at ${process.env.HOST}:${process.env.PORT}`
  );
});
