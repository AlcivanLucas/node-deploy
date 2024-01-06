
import { appRoutes } from "./routes"
import express from 'express';
import cors from 'cors';

const app = express();

//o CORS diz quais aplicações podem acessar a nossa API
// const app = Fastify()
// import Fastify from "fastify"
// import cors from "@fastify/cors"

// app.register(cors, {
//     origin: true,
// })

app.use(cors());

// app.register(appRoutes)

// Registra as rotas
appRoutes(app);



const start = (): void => {
    try {
        app.listen(3333, '0.0.0.0', () => {
            console.log(`HTTP Server running on port 3333!`);
        });
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  };
  start();




// app.listen({
//     port: 3333,
//     host: '0.0.0.0',
// }).then((url) => {
//     console.log(`HTTP Server running on ${url}!`)
// })

// sudo lsof -i :3333 mostra quais aplicações estão usando a porta 3333