"use client";

import { EllipsisVerticalIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { PatientForm, type PatientFormData } from "@/components/forms/patient-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/utils/trpc";

export default function PatientsPage() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// ✅ useMemo prevents re-creating the options object on every render
	const queryOptions = useMemo(
		() =>
			trpc.patient.list.queryOptions({
				page,
				limit: 10,
				search
			}),
		[page, search]
	);

	const { data: patientsData, isLoading } = useQuery(queryOptions);

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='font-bold text-3xl tracking-tight'>Patients</h1>
					<p className='text-gray-600'>Manage your pediatric patients</p>
				</div>

				<Dialog
					onOpenChange={setIsDialogOpen}
					open={isDialogOpen}
				>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className='mr-2 h-4 w-4' />
							Add Patient
						</Button>
					</DialogTrigger>
					<DialogContent className='max-w-4xl'>
						<DialogHeader>
							<DialogTitle>Add New Patient</DialogTitle>
						</DialogHeader>
						<PatientForm
							isLoading={false}
							onSubmit={function (_data: PatientFormData): void {
								throw new Error("Function not implemented.");
							}}
							onSuccess={() => setIsDialogOpen(false)}
							patient={null}
						/>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Patient List</CardTitle>
					<div className='relative'>
						<MagnifyingGlassIcon className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400' />
						<Input
							className='pl-10'
							onChange={e => setSearch(e.target.value)}
							placeholder='Search patients...'
							value={search}
						/>
					</div>
				</CardHeader>

				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Medical Record</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Date of Birth</TableHead>
								<TableHead>Gender</TableHead>
								<TableHead>Blood Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className='w-[100px]'>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										className='py-4 text-center'
										colSpan={7}
									>
										Loading...
									</TableCell>
								</TableRow>
							) : !patientsData?.data?.length ? (
								<TableRow>
									<TableCell
										className='py-4 text-center'
										colSpan={7}
									>
										No patients found
									</TableCell>
								</TableRow>
							) : (
								patientsData.data.map(patient => (
									<TableRow key={patient.id}>
										<TableCell className='font-mono'>{patient.medicalRecordNumber}</TableCell>
										<TableCell>
											{patient.firstName} {patient.lastName}
										</TableCell>
										<TableCell>{new Date(patient.dateOfBirth).toLocaleDateString()}</TableCell>
										<TableCell>
											<Badge variant='outline'>{patient.gender}</Badge>
										</TableCell>
										<TableCell>
											{patient.bloodType && (
												<Badge variant='secondary'>{patient.bloodType}</Badge>
											)}
										</TableCell>
										<TableCell>
											<Badge variant={patient.isActive ? "default" : "secondary"}>
												{patient.isActive ? "Active" : "Inactive"}
											</Badge>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														size='sm'
														variant='ghost'
													>
														<EllipsisVerticalIcon className='h-4 w-4' />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end'>
													<DropdownMenuItem>View Details</DropdownMenuItem>
													<DropdownMenuItem>Edit</DropdownMenuItem>
													<DropdownMenuItem className='text-red-600'>Delete</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>

					{/* Pagination */}
					{patientsData && patientsData.pagination.pages > 1 && (
						<div className='mt-4 flex items-center justify-between'>
							<div className='text-gray-700 text-sm'>
								Showing {patientsData.data.length} of {patientsData.pagination.total} patients
							</div>
							<div className='flex gap-2'>
								<Button
									disabled={page === 1}
									onClick={() => setPage(p => p - 1)}
									variant='outline'
								>
									Previous
								</Button>
								<Button
									disabled={page >= patientsData.pagination.pages}
									onClick={() => setPage(p => p + 1)}
									variant='outline'
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
