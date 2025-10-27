import { auth } from "@smart-apps/auth/auth";
import { headers } from "next/headers";
import { cache } from "react";

export const getServerSession = cache(async () => await auth.api.getSession({ headers: await headers() }));
