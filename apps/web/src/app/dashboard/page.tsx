"use client";

import { CalendarIcon, CurrencyDollarIcon, ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";

export default function DashboardPage() {
	const todayAppointmentsQuery = useQuery(trpc.appointment.getToday.queryOptions(undefined));

	const overdueVaccinationsQuery = useQuery(trpc.immunization.getOverdueVaccinations.queryOptions({}));

	const todayAppointments = todayAppointmentsQuery.data ?? [];
	const overdueVaccinations = overdueVaccinationsQuery.data ?? [];

	const stats = [
		{
			name: "Today's Appointments",
			value: todayAppointments.length,
			icon: CalendarIcon,
			color: "bg-blue-500"
		},
		{
			name: "Overdue Vaccinations",
			value: overdueVaccinations.length,
			icon: ShieldCheckIcon,
			color: "bg-red-500"
		},
		{
			name: "Total Patients",
			value: "1,234",
			icon: UserGroupIcon,
			color: "bg-green-500"
		},
		{
			name: "Monthly Revenue",
			value: "$45,231",
			icon: CurrencyDollarIcon,
			color: "bg-purple-500"
		}
	];

	return (
		<div className='space-y-6'>
			<h1 className='font-bold text-3xl tracking-tight'>Dashboard</h1>
			<p className='text-gray-600'>Welcome to your pediatric clinic dashboard</p>

			<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
				{stats.map(stat => (
					<Card key={stat.name}>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='font-medium text-sm'>{stat.name}</CardTitle>
							<stat.icon className={`h-4 w-4 ${stat.color.replace("bg-", "text-")}`} />
						</CardHeader>
						<CardContent>
							<div className='font-bold text-2xl'>{stat.value}</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Rest of your cards */}
		</div>
	);
}
