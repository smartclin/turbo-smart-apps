// app/page.tsx
"use client";

import { UserGroupIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, CalendarIcon, HeartIcon, ShieldCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";

const FEATURES = [
	{
		name: "Patient Management",
		description: "Comprehensive pediatric patient records and growth tracking",
		icon: UserGroupIcon
	},
	{
		name: "Vaccination Tracking",
		description: "Automated immunization schedules and reminder system",
		icon: ShieldCheckIcon
	},
	{
		name: "Appointment Scheduling",
		description: "Easy appointment booking and calendar management",
		icon: CalendarIcon
	},
	{
		name: "Clinical Notes",
		description: "SOAP-based clinical documentation and progress tracking",
		icon: HeartIcon
	}
];

const STATS = [
	{ label: "Patient Records", value: "10,000+" },
	{ label: "Vaccinations", value: "50,000+" },
	{ label: "Appointments", value: "100,000+" }
];

export default function HomePage() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());

	return (
		<div className='min-h-screen bg-linear-to-br from-blue-50 to-cyan-100'>
			{/* Hero Section */}
			<div className='relative overflow-hidden'>
				<div className='mx-auto max-w-7xl'>
					<div className='relative z-10 bg-transparent pb-8 sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32'>
						<main className='mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28'>
							<div className='sm:text-center lg:text-left'>
								<h1 className='font-extrabold text-4xl text-gray-900 tracking-tight sm:text-5xl md:text-6xl'>
									<span className='block xl:inline'>Welcome to</span>{" "}
									<span className='block text-blue-600 xl:inline'>Pediatric Care</span>
								</h1>
								<p className='mt-3 text-base text-gray-600 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0'>
									Comprehensive pediatric clinic management system designed to streamline patient
									care, appointments, and medical records for healthcare professionals.
								</p>

								{/* Buttons */}
								<div className='mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start'>
									<div className='rounded-md shadow'>
										<Button
											className='w-full px-8 py-3 font-medium text-base sm:w-auto'
											onClick={() => {
												window.location.href = "/dashboard";
											}}
											size='lg'
										>
											Get Started
											<ArrowRightIcon className='ml-2 h-5 w-5' />
										</Button>
									</div>
									<div className='mt-3 sm:mt-0 sm:ml-3'>
										<Button
											className='w-full px-8 py-3 font-medium text-base sm:w-auto'
											onClick={() => {
												window.location.href = "/login";
											}}
											size='lg'
											variant='outline'
										>
											Sign In
										</Button>
									</div>
								</div>

								{/* Health Status */}
								<div className='mt-8 flex items-center justify-center lg:justify-start'>
									<div className='flex items-center space-x-2 text-gray-600 text-sm'>
										<div
											className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
										/>
										<span>
											{healthCheck.isLoading
												? "Checking system status..."
												: healthCheck.data
													? "All systems operational"
													: "System maintenance"}
										</span>
									</div>
								</div>
							</div>
						</main>
					</div>
				</div>

				{/* Medical Illustration */}
				<div className='lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2'>
					<div className='flex h-56 w-full items-center justify-center bg-linear-to-r from-blue-400 to-cyan-400 sm:h-72 md:h-96 lg:h-full lg:w-full'>
						<div className='p-8 text-center text-white'>
							<HeartIcon className='mx-auto mb-4 h-24 w-24 opacity-90' />
							<h3 className='mb-2 font-bold text-2xl'>Caring for Little Ones</h3>
							<p className='text-blue-100'>Pediatric-focused healthcare management</p>
						</div>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div className='bg-white py-12'>
				<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
					<div className='lg:text-center'>
						<h2 className='font-semibold text-base text-blue-600 uppercase tracking-wide'>Features</h2>
						<p className='mt-2 font-extrabold text-3xl text-gray-900 leading-8 tracking-tight sm:text-4xl'>
							Everything you need for pediatric care
						</p>
						<p className='mt-4 max-w-2xl text-gray-500 text-xl lg:mx-auto'>
							Designed specifically for pediatric healthcare providers to deliver exceptional care.
						</p>
					</div>

					<div className='mt-10'>
						<div className='space-y-6 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 md:space-y-0'>
							{FEATURES.map(feature => (
								<div
									className='relative'
									key={feature.name}
								>
									<div className='absolute flex h-12 w-12 items-center justify-center rounded-md bg-blue-500 text-white'>
										<feature.icon
											aria-hidden='true'
											className='h-6 w-6'
										/>
									</div>
									<div className='ml-16'>
										<h3 className='font-medium text-gray-900 text-lg leading-6'>{feature.name}</h3>
										<p className='mt-2 text-base text-gray-500'>{feature.description}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Stats Section */}
			<div className='bg-blue-600'>
				<div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20'>
					<div className='mx-auto max-w-4xl text-center'>
						<h2 className='font-extrabold text-3xl text-white sm:text-4xl'>
							Trusted by pediatric professionals
						</h2>
						<p className='mt-3 text-blue-200 text-xl'>
							Streamlining pediatric healthcare management for modern practices.
						</p>
					</div>
					<dl className='mt-10 text-center sm:mx-auto sm:grid sm:max-w-3xl sm:grid-cols-3 sm:gap-8'>
						{STATS.map(stat => (
							<div
								className='flex flex-col'
								key={stat.label}
							>
								<dt className='order-2 mt-2 font-medium text-blue-200 text-lg leading-6'>
									{stat.label}
								</dt>
								<dd className='order-1 font-extrabold text-5xl text-white'>{stat.value}</dd>
							</div>
						))}
					</dl>
				</div>
			</div>

			{/* CTA Section */}
			<div className='bg-white'>
				<div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:flex lg:items-center lg:justify-between lg:px-8 lg:py-16'>
					<h2 className='font-extrabold text-3xl text-gray-900 tracking-tight sm:text-4xl'>
						<span className='block'>Ready to get started?</span>
						<span className='block text-blue-600'>Start managing your pediatric practice today.</span>
					</h2>
					<div className='mt-8 flex lg:mt-0 lg:shrink-0'>
						<div className='inline-flex rounded-md shadow'>
							<Button
								className='px-8 py-3 font-medium text-base'
								onClick={() => {
									window.location.href = "/dashboard";
								}}
								size='lg'
							>
								Get Started
							</Button>
						</div>
						<div className='ml-3 inline-flex rounded-md shadow'>
							<Button
								className='px-8 py-3 font-medium text-base'
								onClick={() => {
									window.location.href = "/login";
								}}
								size='lg'
								variant='outline'
							>
								Sign In
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<footer className='bg-gray-50'>
				<div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16'>
					<div className='xl:grid xl:grid-cols-3 xl:gap-8'>
						<div className='space-y-8 xl:col-span-1'>
							<div className='flex items-center'>
								<HeartIcon className='mr-2 h-8 w-8 text-blue-600' />
								<span className='font-bold text-gray-900 text-xl'>Pediatric Care</span>
							</div>
							<p className='text-base text-gray-500'>
								Comprehensive pediatric clinic management system for modern healthcare providers.
							</p>
						</div>
						<div className='mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0'>
							<div className='md:grid md:grid-cols-2 md:gap-8'>
								<div>
									<h3 className='font-semibold text-gray-400 text-sm uppercase tracking-wider'>
										Solutions
									</h3>
									<ul className='mt-4 space-y-4'>
										<li>
											<a
												className='text-base text-gray-500 hover:text-gray-900'
												href='/#'
											>
												Patient Management
											</a>
										</li>
										<li>
											<a
												className='text-base text-gray-500 hover:text-gray-900'
												href='/#'
											>
												Appointment Scheduling
											</a>
										</li>
										<li>
											<a
												className='text-base text-gray-500 hover:text-gray-900'
												href='/#'
											>
												Medical Records
											</a>
										</li>
									</ul>
								</div>
								<div className='mt-12 md:mt-0'>
									<h3 className='font-semibold text-gray-400 text-sm uppercase tracking-wider'>
										Support
									</h3>
									<ul className='mt-4 space-y-4'>
										<li>
											<a
												className='text-base text-gray-500 hover:text-gray-900'
												href='/#'
											>
												Help Center
											</a>
										</li>
										<li>
											<a
												className='text-base text-gray-500 hover:text-gray-900'
												href='/#'
											>
												Documentation
											</a>
										</li>
										<li>
											<a
												className='text-base text-gray-500 hover:text-gray-900'
												href='/#'
											>
												Contact Us
											</a>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
					<div className='mt-12 border-gray-200 border-t pt-8'>
						<p className='text-base text-gray-400 xl:text-center'>
							&copy; 2024 Pediatric Care Management System. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
