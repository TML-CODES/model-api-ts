import { users } from "@prisma/client";

export type UserData = users & {
    roleId: 'superadmin' | 'admin' | 'viewer'
};