import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@smart-apps/api/routers/index";
import { createContext } from "@smart-apps/api/context";
import { NextRequest } from "next/server";

function handler(req: NextRequest) {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
	});
}
export { handler as GET, handler as POST };
