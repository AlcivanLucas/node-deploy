import Fastify from "fastify"
import cors from "@fastify/cors"
import { appRoutes } from "./routes"
//o CORS diz quais aplicações podem acessar a nossa API
const app = Fastify()

app.register(cors, {
    origin: true,
})


app.register(appRoutes)


app.listen({
    port: 3333,
    host: '0.0.0.0',
}).then((url) => {
    console.log(`HTTP Server running on ${url}!`)
})