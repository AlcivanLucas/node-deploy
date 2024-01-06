import dayjs from "dayjs"
// import { FastifyInstance } from "fastify"
import { Request, Response } from 'express'; // Importando Request e Response do Express
import { z, AnyZodObject } from 'zod' // biblioteca para validação de dados
import { prisma } from "./lib/prisma"
import Express from "express";
// estou usando PostegreSql.

// export async function appRoutes(app: FastifyInstance) {
export function appRoutes(app: any) {
    // rota responsável por criar disciplinas
    // app.post('/disciplines', async (request) => {
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
    // app.get('/day', async (request) => {
    app.get('/day', async (request: Request, response: Response) => {
        const getDayParams = z.object({
            date: z.coerce.date()
        })

        const { date } = getDayParams.parse(request.query)

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
        })

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

        return {
            possibleDisciplines,
            completedDisciplines
        }
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
    // app.get('/summary', async () => {
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

        return summary
    })
}


// Código de erro: P2010 indica um erro do lado do cliente Prisma.
// HWD.week_day = cast(strftime('%w', D.date/1000.0, 'unixepoch') as int)