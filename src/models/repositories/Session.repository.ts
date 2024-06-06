import { session } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../modules/prisma";
import { buildSqlToPrismaClosures } from "../../utils/helpers";

class Session {
    async get<T extends Prisma.sessionFindManyArgs>(
        id: string, 
        include?: Prisma.SelectSubset<T, Prisma.sessionFindManyArgs>['include']
    ) {
        const res = await prisma.session.findFirst({ 
            where: { id }, 
            include
        });
        return res;
    }

    async create(data: session) {
        const res = await prisma.session.create({ data });
        return res;
    }
    
    async update(id: string, data: Partial<session>) {
        const res = await prisma.session.update({
            where: { id },
            data
        });

        return res;
    }

    async delete(id: string) {
        const res = await prisma.session.delete({
            where: { id }
        });

        return res;
    }

    async search<T extends Prisma.sessionFindManyArgs>(
        whereClosure?: string | Prisma.SelectSubset<T, Prisma.sessionFindManyArgs>['where'], 
        orderByClosure?: string | Prisma.SelectSubset<T, Prisma.sessionFindManyArgs>['orderBy'],
        include?: Prisma.SelectSubset<T, Prisma.sessionFindManyArgs>['include'],
        limit = 10,
        skip = 0
    ) {
        const { where, orderBy } = buildSqlToPrismaClosures(whereClosure, orderByClosure);
        const res = await prisma.session.findMany({
            where,
            orderBy,
            include,
            take: Number(limit || 10),
            skip: Number(skip || 0)
        });
        return res;
    }
}

export default new Session();