"use client";

import { PlusIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import type { AppRouter } from "@smart-apps/api/routers/index";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { format } from "date-fns";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/utils/trpc";

// ✅ Infer types from your backend
type ImmunizationListOutput = inferRouterOutputs<AppRouter>["immunization"]["list"];

export default function ImmunizationsPage() {
	const [page] = useState(1);

	// ✅ Correct usage of queryOptions()
	const {
		data: immunizations,
		isLoading: immunizationLoading,
		error: immunizationError
	} = useQuery(trpc.immunization.list.queryOptions({ page, limit: 10 }));

	const {
		data: overdueVaccinations,
		isLoading: overdueLoading,
		error: overdueError
	} = useQuery(trpc.immunization.getOverdueVaccinations.queryOptions({}));

	const {
		data: vaccineCoverage,
		isLoading: coverageLoading,
		error: coverageError
	} = useQuery(trpc.immunization.getVaccineCoverage.queryOptions({}));

	const getStatusVariant = (status: string) => {
		switch (status) {
			case "administered":
				return "default";
			case "scheduled":
				return "secondary";
			case "overdue":
				return "destructive";
			case "contraindicated":
				return "outline";
			default:
				return "outline";
		}
	};

	if (immunizationLoading || overdueLoading || coverageLoading) return <p>Loading immunization data...</p>;

	if (immunizationError || overdueError || coverageError)
		return <p className='text-red-500'>Error loading immunization data.</p>;

	// ✅ Type hint for the mapping to remove implicit 'any'
	const immunizationList = immunizations?.data as ImmunizationListOutput["data"];

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='font-bold text-3xl tracking-tight'>Immunizations</h1>
					<p className='text-gray-600'>Manage patient vaccination records</p>
				</div>
				<Button>
					<PlusIcon className='mr-2 h-4 w-4' />
					Record Vaccination
				</Button>
			</div>

			{/* Dashboard Stats */}
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				<Card className='border-red-200 bg-red-50'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='font-medium text-red-800 text-sm'>Overdue Vaccinations</CardTitle>
						<ShieldCheckIcon className='h-4 w-4 text-red-600' />
					</CardHeader>
					<CardContent>
						<div className='font-bold text-2xl text-red-900'>{overdueVaccinations?.length ?? 0}</div>
						<p className='text-red-600 text-xs'>Vaccinations past due date</p>
					</CardContent>
				</Card>

				{vaccineCoverage?.slice(0, 2).map(vaccine => (
					<Card key={vaccine.vaccineName}>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='font-medium text-sm'>{vaccine.vaccineName}</CardTitle>
							<ShieldCheckIcon className='h-4 w-4 text-green-600' />
						</CardHeader>
						<CardContent>
							<div className='font-bold text-2xl'>{vaccine.count}</div>
							<p className='text-gray-600 text-xs'>Administered</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Immunization Table */}
			<Card>
				<CardHeader>
					<CardTitle>Vaccination Records</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Patient</TableHead>
								<TableHead>Vaccine</TableHead>
								<TableHead>Administered</TableHead>
								<TableHead>Next Due</TableHead>
								<TableHead>Dose</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{immunizationList?.map(({ immunization, patient }) => (
								<TableRow key={immunization.id}>
									<TableCell>
										{patient.firstName} {patient.lastName}
									</TableCell>
									<TableCell className='font-medium'>{immunization.vaccineName}</TableCell>
									<TableCell>
										{format(new Date(immunization.administrationDate), "MMM d, yyyy")}
									</TableCell>
									<TableCell>
										{immunization.nextDueDate ? (
											format(new Date(immunization.nextDueDate), "MMM d, yyyy")
										) : (
											<span className='text-gray-400'>-</span>
										)}
									</TableCell>
									<TableCell>
										{immunization.doseNumber}/{immunization.totalDoses}
									</TableCell>
									<TableCell>
										<Badge variant={getStatusVariant(immunization.status)}>
											{immunization.status}
										</Badge>
									</TableCell>
									<TableCell>
										<Button
											size='sm'
											variant='outline'
										>
											Edit
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
