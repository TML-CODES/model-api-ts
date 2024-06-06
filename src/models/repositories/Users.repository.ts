import { users } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../modules/prisma";
import { buildSqlToPrismaClosures } from "../../utils/helpers";

const selectDefault = {
    id: true,
    name: true,
    email: true,
    cpf: true,
    createdAt: true,
    roleId: true  
};

class Users {
    async get<T extends Prisma.usersFindManyArgs>(
        key: {id?: string, email?: string}, 
        select?: Prisma.SelectSubset<T, Prisma.usersFindManyArgs>['select']
    ) {
        const res = await prisma.users.findFirst({ 
            where: { ...key }, 
            select: select || selectDefault
        });
        return res;
    }

    async create(data: users) {
        const res = await prisma.users.create({ data });
        return res;
    }
    
    async update(id: string, data: users) {
        const res = await prisma.users.update({
            where: { id },
            data
        });

        return res;
    }

    async updateAll(data: { isAcceptedNewVersionTerm: boolean }) {
        const res = await prisma.users.updateMany({
            data
        });

        return res;
    }

    async delete(id: string) {
        const res = await prisma.users.delete({
            where: { id }
        });

        return res;
    }

    async search<T extends Prisma.usersFindManyArgs>(
        whereClosure?: string | Prisma.SelectSubset<T, Prisma.usersFindManyArgs>['where'], 
        orderByClosure?: string | Prisma.SelectSubset<T, Prisma.usersFindManyArgs>['orderBy'],
        select?: Prisma.SelectSubset<T, Prisma.usersFindManyArgs>['select'],
        limit = 10,
        skip = 0
    ) {
        const { where, orderBy } = buildSqlToPrismaClosures(whereClosure, orderByClosure);
        const res = await prisma.users.findMany({
            where,
            orderBy,
            select: (select) ? { ...selectDefault, ...select } : selectDefault,
            take: Number(limit || 10),
            skip: Number(skip || 0)
        });
        return res;
    }
}

export default new Users();