"use client";

import {
	Disclosure,
	DisclosureButton,
	DisclosurePanel,
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Transition
} from "@headlessui/react";
import { Bars3Icon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const navigation = [
	{ name: "Dashboard", href: "/dashboard", icon: UserCircleIcon },
	{ name: "Patients", href: "/patients", icon: UserCircleIcon },
	{ name: "Appointments", href: "/appointments", icon: UserCircleIcon },
	{ name: "Immunizations", href: "/immunizations", icon: UserCircleIcon },
	{ name: "Clinical Notes", href: "/clinical-notes", icon: UserCircleIcon },
	{ name: "Finances", href: "/finances", icon: UserCircleIcon }
];

export function Sidebar() {
	const pathname = usePathname();
	const healthCheckQuery = trpc.healthCheck.queryOptions();

	// tRPC health check
	const { data, isLoading } = useQuery(healthCheckQuery);

	// Auth session
	const { data: session } = useSession();

	// Handle loading state first
	if (isLoading) {
		return (
			<div className='flex h-16 items-center justify-center bg-white shadow-sm'>
				<p className='animate-pulse text-gray-500 text-sm'>Checking server health...</p>
			</div>
		);
	}

	// Health check feedback
	if (data !== "OK") {
		return (
			<div className='flex h-16 items-center justify-center bg-red-50 shadow-sm'>
				<p className='font-medium text-red-600'>⚠️ Server not responding</p>
			</div>
		);
	}

	return (
		<Disclosure
			as='nav'
			className='bg-white shadow-sm'
		>
			<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
				<div className='flex h-16 justify-between'>
					{/* Left section */}
					<div className='flex'>
						<div className='flex shrink-0 items-center'>
							<h1 className='font-bold text-blue-600 text-xl'>Pediatric Clinic</h1>
						</div>
						<div className='hidden sm:ml-6 sm:flex sm:space-x-8'>
							{navigation.map(item => (
								<a
									className={cn(
										pathname === item.href
											? "border-blue-500 text-gray-900"
											: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
										"inline-flex items-center border-b-2 px-1 pt-1 font-medium text-sm"
									)}
									href={item.href}
									key={item.name}
								>
									<item.icon className='mr-2 h-4 w-4' />
									{item.name}
								</a>
							))}
						</div>
					</div>

					{/* Right section */}
					<div className='hidden sm:ml-6 sm:flex sm:items-center'>
						<Menu
							as='div'
							className='relative ml-3'
						>
							<div>
								<MenuButton className='flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
									<UserCircleIcon className='h-8 w-8 text-gray-400' />
								</MenuButton>
							</div>
							<Transition
								as={Fragment}
								enter='transition ease-out duration-200'
								enterFrom='transform opacity-0 scale-95'
								enterTo='transform opacity-100 scale-100'
								leave='transition ease-in duration-75'
								leaveFrom='transform opacity-100 scale-100'
								leaveTo='transform opacity-0 scale-95'
							>
								<MenuItems className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
									<MenuItem>
										{({ focus }) => (
											<a
												className={cn(
													focus && "bg-gray-100",
													"block px-4 py-2 text-gray-700 text-sm"
												)}
												href='/profile'
											>
												Your Profile
											</a>
										)}
									</MenuItem>
									<MenuItem>
										{({ focus }) => (
											<a
												className={cn(
													focus && "bg-gray-100",
													"block px-4 py-2 text-gray-700 text-sm"
												)}
												href='/settings'
											>
												Settings
											</a>
										)}
									</MenuItem>
									<MenuItem>
										{({ focus }) => (
											<button
												className={cn(
													focus && "bg-gray-100",
													"block w-full px-4 py-2 text-left text-gray-700 text-sm"
												)}
												type='button'
											>
												Sign out
											</button>
										)}
									</MenuItem>
								</MenuItems>
							</Transition>
						</Menu>
					</div>

					{/* Mobile menu button */}
					<div className='-mr-2 flex items-center sm:hidden'>
						<DisclosureButton className='inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
							<Bars3Icon
								aria-hidden='true'
								className='block h-6 w-6'
							/>
						</DisclosureButton>
					</div>
				</div>
			</div>

			{/* Mobile menu panel */}
			<DisclosurePanel className='sm:hidden'>
				<div className='space-y-1 pt-2 pb-3'>
					{navigation.map(item => (
						<DisclosureButton
							as='a'
							className={cn(
								pathname === item.href
									? "border-blue-500 bg-blue-50 text-blue-700"
									: "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800",
								"block border-l-4 py-2 pr-4 pl-3 font-medium text-base"
							)}
							href={item.href}
							key={item.name}
						>
							<item.icon className='mr-3 inline h-4 w-4' />
							{item.name}
						</DisclosureButton>
					))}
				</div>
				<div className='border-gray-200 border-t pt-4 pb-3'>
					<div className='flex items-center px-4'>
						<UserCircleIcon className='h-8 w-8 text-gray-400' />
						<aside className='ml-3'>
							<div>{session?.user?.email ?? "member"}</div>
							<div className='text-gray-500 text-sm capitalize'>{session?.user?.role ?? "visitor"}</div>
						</aside>
					</div>
				</div>
			</DisclosurePanel>
		</Disclosure>
	);
}
