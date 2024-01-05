
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

app.listen(3333, '0.0.0.0', () => {
    console.log(`HTTP Server running on port 3333!`);
});


// app.listen({
//     port: 3333,
//     host: '0.0.0.0',
// }).then((url) => {
//     console.log(`HTTP Server running on ${url}!`)
// })