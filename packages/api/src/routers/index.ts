import { protectedProcedure, publicProcedure, router } from "../index";
import { appointmentRouter } from "./appointment";
import { budgetRouter } from "./budget";
import { clinicalNoteRouter } from "./clinicNotes";
import { expenseRouter } from "./expense";
import { immunizationRouter } from "./immunization";
import { patientRouter } from "./patient";
import { todoRouter } from "./todo";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		user: ctx.user
	})),
	todo: todoRouter,
	patient: patientRouter,
	appointment: appointmentRouter,
	immunization: immunizationRouter,
	expense: expenseRouter,
	clinicalNote: clinicalNoteRouter,
	budget: budgetRouter
});
export type AppRouter = typeof appRouter;
