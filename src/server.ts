import { appRoutes } from "./routes"
import express from 'express';
import cors from 'cors';
//o CORS diz quais aplicações podem acessar a nossa API

import dayjs from "dayjs"
// import { FastifyInstance } from "fastify"
import { Request, Response } from 'express'; // Importando Request e Response do Express
import { z, AnyZodObject } from 'zod' // biblioteca para validação de dados
import { prisma } from "./lib/prisma"

const app = express();

app.use(express.json());

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
// app.listen(3333, () => console.log("Server is running on port 3333"));



// Configurar headers CORS para permitir qualquer origem
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

// app.listen({
//     port: 3333,
//     host: '0.0.0.0',
// }).then((url) => {
//     console.log(`HTTP Server running on ${url}!`)
// })



// app.post("/usuarios" ,(request,response) => {
//   return response.json(request.body);
// })
app.get("/", (req, res)=>{
  return res.json("servidor rodando por enquanto corretamente... 🙏")
})

app.post('/disciplines', async (request: Request, response: Response) => {
  const createDisciplineBody = z.object({
      title: z.string(),
      weekDays: z.array(
          z.number().min(0).max(6)
      )

  })

  const { title, weekDays } = createDisciplineBody.parse(request.body)

  //zera a hr, min, seg: 00:00:00, para que a disciplina apareça no msm dia que foi criada
  const today = dayjs().startOf('day').toDate()

  await prisma.discipline.create({
      data: {
          title,
          created_at: today,
          weekDays: {
              create: weekDays.map(weekDay => {
                  return {
                      week_day: weekDay
                  }
              })
          }
      }
  })
   // Após criar a disciplina com sucesso, envie uma resposta de sucesso
   return response.status(200).json({ message: 'Discipline created successfully' });
})

// rota responsável por criar usuários
// app.post('/users', async (request) => {
app.post('/users', async (request: Request, response: Response) => {
  const createUserBody = z.object({
      name: z.string(),
      password: z.string(),
      email: z.string().email(),
  })

  const { name,email,password} = createUserBody.parse(request.body)

  //zera a hr, min, seg: 00:00:00, para que o user apareça no msm dia que foi criada
  const today = dayjs().startOf('day').toDate()

  await prisma.user.create({
      data: {
          name,
          created_at: today,
          email,
          password,
      }
  })
  await prisma.$disconnect();
  // Após criar o usuário com sucesso, envie uma resposta de sucesso
  return response.status(200).json({ message: 'User created successfully' });
})

// rota responsável deletar disciplinas *em desenvolvimento
// app.delete('/deletedisciplines', async (request) => {
app.delete('/deletedisciplines', async (request: Request, response: Response) => {
  const deleteDisciplineParams = z.object({
      id: z.string().uuid(),
  })

  const { id } = deleteDisciplineParams.parse(request.params)

  await prisma.discipline.delete({
      where: {
          id
      }
  })
})

// rota responsável por busta hábitos de um dia específico

app.get('/day', async (request: Request, response: Response) => {
  const getDayParams = z.object({
      date: z.coerce.date()
  })
  
  const { date } = getDayParams.parse(request.query)

  console.log(date)

  const parsedDate = dayjs(date).startOf('day')

  const weekDay = dayjs(parsedDate).get('day')

  const possibleDisciplines = await prisma.discipline.findMany({
      where: {
          created_at: {
              lte: date,
          },
          weekDays: {
              some: {
                  week_day: weekDay,
              }
          }
      }
  });

  // Limpar a declaração preparada após usá-la
  // Liberar a conexão com o banco de dados após usá-la
//   await prisma.$disconnect();

  const day = await prisma.day.findUnique({
      where: {
          date: parsedDate.toDate(),
      },
      include: {
          dayDisciplines: true
      }
  })

  const completedDisciplines = day?.dayDisciplines.map(dayDiscipline => {
      return dayDiscipline.discipline_id
  })

  return response.json({
    possibleDisciplines,
    completedDisciplines
}); // Enviando a resposta ao cliente
})

// completar / não-completar um hábito, muda o status
// caso queira mudar disciplinas retroativos assistir aula 03 minuto 7;00
// app.patch('/disciplines/:id/toggle', async (request) => {
app.patch('/disciplines/:id/toggle', async (request: Request, response: Response) => {

  const toggleDisciplineParams = z.object({
      id: z.string().uuid(),
  })

  const { id } = toggleDisciplineParams.parse(request.params)

  const today = dayjs().startOf('day').toDate()

  let day = await prisma.day.findUnique({
      where: {
          date: today
      }
  })

  if (!day) {
      day = await prisma.day.create({
          data: {
              date: today
          }
      })
  }

  const dayDiscipline = await prisma.dayDiscipline.findUnique({
      where: {
          day_id_discipline_id: {
              day_id: day.id,
              discipline_id: id
          }
      }
  })

  if (dayDiscipline) {
      //remover a marcação de completo
      await prisma.dayDiscipline.delete({
          where: {
              id: dayDiscipline.id,
          }
      })
  } else {
      // Completar o hábito
      await prisma.dayDiscipline.create({
          data: {
              day_id: day.id,
              discipline_id: id
          }
      })
  }


})
// rota para buscar o sumario de disciplinas do dia especifico

app.get('/summary', async (request: Request, response: Response) => {
  const summary = await prisma.$queryRaw`
      SELECT 
          D.id,
          D.date,
          (
              SELECT 
                 cast(count(*) as float)
              FROM day_disciplines DH
              WHERE DH.day_id = D.id 
          ) as completed,
          (
              SELECT
                  cast(count(*) as float)
              FROM discipline_week_days HWD
              JOIN disciplines H
                  ON H.id = HWD.discipline_id
              WHERE  
                  HWD.week_day = date_part('dow', D.date) - 1
                  AND H.created_at <= D.date
          ) as amount
      FROM days D
  `


  return response.json(summary) 
})



// sudo lsof -i :3333 mostra quais aplicações estão usando a porta 3333
//  killall -9 node : mata todos os processos do node
// ConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(PostgresError { code: "42P05", message: "prepared statement "s0" already exists", severity: "ERROR", detail: None, column: None, hint: None }), transient: false })
// npm cache clean --force
