// This file is for cli generation of the auth database schema required by better-auth

import { initAuth } from "./index";

export const auth = initAuth({
	baseDomain: "localhost",
	baseUrl: "http://localhost:3000",
	secret: "secret",
	trustedOrigins: ["http://localhost:3000"]
});
