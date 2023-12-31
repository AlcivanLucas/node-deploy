import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const firstUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const firstUserCreationDate = new Date('2023-12-25T03:00:00.000')

const firstDisciplineId = '0730ffac-d039-4194-9571-01aa2aa0efbd'
const firstDisciplineCreationDate = new Date('2022-12-17T03:00:00.000')

const secondDisciplineId = '00880d75-a933-4fef-94ab-e05744435297'
const secondDisciplineCreationDate = new Date('2023-01-03T03:00:00.000')

const thirdDisciplineId = 'fa1a1bcf-3d87-4626-8c0d-d7fd1255ac00'
const thirdDisciplineCreationDate = new Date('2023-01-08T03:00:00.000')

async function run() {
    // await prisma.discipline.deleteMany()
    // await prisma.day.deleteMany()


    /**
     * Create disciplines
     */
    await Promise.all([

        prisma.user.create({
            data: {
                id: firstUserId,
                name: 'João',
                email: 'joao@gmail.com',
                password: '12345678',
                created_at: firstUserCreationDate,
                
            }
        }),
        prisma.discipline.create({
            data: {
                id: firstDisciplineId,
                title: 'Álgebra Linear I',
                created_at: firstDisciplineCreationDate,
                weekDays: {
                    create: [
                        { week_day: 1 },
                        { week_day: 2 },
                        { week_day: 3 },
                    ]
                }
            }
        }),

        prisma.discipline.create({
            data: {
                id: secondDisciplineId,
                title: 'Brotheragem II',
                created_at: secondDisciplineCreationDate,
                weekDays: {
                    create: [
                        { week_day: 3 },
                        { week_day: 4 },
                        { week_day: 5 },
                    ]
                }
            }
        }),

        prisma.discipline.create({
            data: {
                id: thirdDisciplineId,
                title: 'Agiotagem IV',
                created_at: thirdDisciplineCreationDate,
                weekDays: {
                    create: [
                        { week_day: 1 },
                        { week_day: 2 },
                        { week_day: 3 },
                        { week_day: 4 },
                        { week_day: 5 },
                    ]
                }
            }
        })
    ])

    await Promise.all([
        /**
         * Disciplines (Complete/Available): 1/1
         */
        prisma.day.create({
            data: {
                /** Monday */
                date: new Date('2023-01-02T03:00:00.000z'),
                dayDisciplines: {
                    create: {
                        discipline_id: firstDisciplineId,
                    }
                }
            }
        }),

        /**
         * Disciplines (Complete/Available): 1/1
         */
        prisma.day.create({
            data: {
                /** Friday */
                date: new Date('2023-01-06T03:00:00.000z'),
                dayDisciplines: {
                    create: {
                        discipline_id: firstDisciplineId,
                    }
                }
            }
        }),

        /**
         * Disciplines (Complete/Available): 2/2
         */
        prisma.day.create({
            data: {
                /** Wednesday */
                date: new Date('2023-01-04T03:00:00.000z'),
                dayDisciplines: {
                    create: [
                        { discipline_id: firstDisciplineId },
                        { discipline_id: secondDisciplineId },
                    ]
                }
            }
        }),
    ])
}

run()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })


// npx prisma db seed: povoa o db com os dados do seed.ts