import { users } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { buildSqlToPrismaClosures, prisma } from "../modules/prisma";

const selectDefault = {
    id: true,
    name: true,
    email: true,
    cpf: true,
    createdAt: true,
    roleId: true  
};

class Users {
    async get(key: {id?: string, email?: string}, selectFields = {}) {
        const res = await prisma.users.findFirst({ 
            where: { ...key }, 
            select: {
                ...selectDefault, 
                ...selectFields
            }
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
    ) {
        const { where, orderBy } = buildSqlToPrismaClosures(whereClosure, orderByClosure);
        const res = await prisma.users.findMany({
            where,
            orderBy,
            select: (select) ? { ...selectDefault, ...select } : selectDefault
        });
        return res;
    }
}

export default new Users();