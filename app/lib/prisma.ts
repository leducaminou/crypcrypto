import { PrismaClient } from "@prisma/client";




const prismaClientSengleton = () => {
    return new PrismaClient()
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSengleton>
} & typeof global;

export const prisma =  globalThis.prismaGlobal ?? prismaClientSengleton()

export default prisma

if(process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

