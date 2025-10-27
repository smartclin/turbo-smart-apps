"use client";

import { CalendarIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";

export default function AppointmentsPage() {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

	// ✅ Proper use of tRPC with TanStack Query
	const todayAppointmentsQuery = trpc.appointment.getToday.queryOptions();
	const { data: todayAppointments, isLoading: loadingToday } = useQuery(todayAppointmentsQuery);

	const upcomingVaccinationsQuery = trpc.appointment.getUpcomingVaccinations.queryOptions({
		days: 7
	});
	const { data: upcomingVaccinations, isLoading: loadingUpcoming } = useQuery(upcomingVaccinationsQuery);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "scheduled":
				return "bg-blue-100 text-blue-800";
			case "in-progress":
				return "bg-yellow-100 text-yellow-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='font-bold text-3xl tracking-tight'>Appointments</h1>
					<p className='text-gray-600'>Manage patient appointments and schedule</p>
				</div>
				<Button>
					<PlusIcon className='mr-2 h-4 w-4' />
					New Appointment
				</Button>
			</div>

			{/* Calendar + Today’s Schedule */}
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				{/* Calendar */}
				<Card className='lg:col-span-2'>
					<CardHeader>
						<CardTitle>Appointment Calendar</CardTitle>
					</CardHeader>
					<CardContent>
						<Calendar
							className='rounded-md border'
							mode='single'
							onSelect={setSelectedDate}
							selected={selectedDate}
						/>
					</CardContent>
				</Card>

				{/* Today’s Schedule */}
				<Card>
					<CardHeader>
						<CardTitle>Today's Schedule</CardTitle>
					</CardHeader>
					<CardContent>
						{loadingToday ? (
							<p className='text-center text-gray-500'>Loading appointments...</p>
						) : (
							<div className='space-y-4'>
								{todayAppointments?.map(({ appointment, patient }) => (
									<div
										className='space-y-2 rounded-lg border p-4'
										key={appointment.id}
									>
										<div className='flex items-start justify-between'>
											<div>
												<p className='font-semibold'>
													{patient.firstName} {patient.lastName}
												</p>
												<p className='text-gray-600 text-sm'>
													{format(new Date(appointment.date), "h:mm a")}
												</p>
											</div>
											<Badge className={getStatusColor(appointment.status)}>
												{appointment.status}
											</Badge>
										</div>
										<p className='text-gray-600 text-sm'>
											{appointment.type} • {appointment.reason}
										</p>
										<div className='flex gap-2'>
											<Button
												size='sm'
												variant='outline'
											>
												Start
											</Button>
											<Button
												size='sm'
												variant='outline'
											>
												Reschedule
											</Button>
										</div>
									</div>
								))}
								{!todayAppointments?.length && (
									<p className='py-4 text-center text-gray-500'>No appointments today</p>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Upcoming Vaccinations */}
			<Card>
				<CardHeader>
					<CardTitle>Upcoming Vaccinations (Next 7 Days)</CardTitle>
				</CardHeader>
				<CardContent>
					{loadingUpcoming ? (
						<p className='text-center text-gray-500'>Loading...</p>
					) : (
						<div className='space-y-4'>
							{upcomingVaccinations?.map(({ appointment, patient }) => (
								<div
									className='flex items-center justify-between border-b pb-4 last:border-0 last:pb-0'
									key={appointment.id}
								>
									<div className='flex items-center space-x-4'>
										<CalendarIcon className='h-5 w-5 text-blue-500' />
										<div>
											<p className='font-medium'>
												{patient.firstName} {patient.lastName}
											</p>
											<p className='text-gray-600 text-sm'>
												{format(new Date(appointment.date), "MMM d, yyyy 'at' h:mm a")}
											</p>
										</div>
									</div>
									<Badge variant='secondary'>Vaccination</Badge>
								</div>
							))}
							{!upcomingVaccinations?.length && (
								<p className='py-4 text-center text-gray-500'>No upcoming vaccinations</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
