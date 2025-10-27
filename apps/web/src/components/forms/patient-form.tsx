import type React from "react";
import { useState } from "react";
import { z } from "zod";

// --- Mock Components for Self-Contained Example ---
// In a real project, these would be imported from a UI library.
// They are mocked here to make the file runnable.
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = props => (
	<input
		{...props}
		className='w-full rounded-lg border border-gray-300 p-2 transition duration-150 focus:border-blue-500 focus:ring focus:ring-blue-200'
		name={props.id}
	/>
);

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
	children,
	className = "",
	htmlFor,
	...props
}) => (
	<label
		htmlFor={htmlFor}
		{...props}
		className={`block font-medium text-gray-700 text-sm ${className}`}
	>
		{children}
	</label>
);
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading: boolean }> = ({
	isLoading,
	children,
	...props
}) => (
	<button
		{...props}
		className={`w-full rounded-lg px-4 py-2 font-semibold text-white shadow-md transition duration-200 ${
			isLoading || props.disabled
				? "cursor-not-allowed bg-gray-400"
				: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
		}`}
		disabled={isLoading || props.disabled}
	>
		{isLoading ? "Processing..." : children}
	</button>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }> = ({
	options,
	...props
}) => (
	<select
		{...props}
		className='w-full rounded-lg border border-gray-300 bg-white p-2 transition duration-150 focus:border-blue-500 focus:ring focus:ring-blue-200'
		name={props.id}
	>
		<option
			disabled
			value=''
		>
			Select Gender
		</option>
		{options.map(option => (
			<option
				key={option}
				value={option}
			>
				{option.charAt(0).toUpperCase() + option.slice(1).replace(/-/g, " ")}
			</option>
		))}
	</select>
);
// --------------------------------------------------

// 2. Zod Schema Fixes (Removed incorrect 'required_error')
export const patientFormSchema = z.object({
	firstName: z.string().min(1, { message: "First name is required" }),
	lastName: z.string().min(1, { message: "Last name is required" }),
	dateOfBirth: z.string().min(1, { message: "Date of birth is required" }),
	contactNumber: z.string().min(1, { message: "Contact number is required" }),
	// Email is optional and can be an empty string if not provided
	email: z.email({ message: "Invalid email address" }).optional().or(z.literal("")),
	gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).refine(Boolean, {
		message: "Gender is required"
	}),

	address: z.string().min(1, { message: "Address is required" })
});

export type PatientFormData = z.infer<typeof patientFormSchema>;

// 1. Props Fix (noExplicitAny on PatientFormProps)
type PatientFormProps = {
	patient: PatientFormData | null;
	onSubmit: (data: PatientFormData) => void;
	isLoading: boolean;
	onSuccess?: () => void; // ✅ Add this line
};

// Helper type for managing local form errors
type FormErrors = {
	[key: string]: string | undefined;
};

const initialState: PatientFormData = {
	firstName: "",
	lastName: "",
	dateOfBirth: "",
	contactNumber: "",
	email: "",
	gender: "prefer-not-to-say",
	address: ""
};

export function PatientForm({ patient, onSubmit, isLoading }: PatientFormProps) {
	// 4. Unused variables (patientData, image, setImage) removed.
	const [formData, setFormData] = useState<PatientFormData>(patient ? patient : initialState);

	const [errors, setErrors] = useState<FormErrors>({});

	// Unified change handler with explicit type (fixes multiple 'any' issues)
	// This handles input, select, and textarea events.
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { id, value } = e.target;

		// 5. Functional update used for setFormData (Fixes noAccumulatingSpread)
		setFormData(prev => ({
			...prev,
			[id]: value
		}));

		// Clear error on change
		setErrors(prev => ({ ...prev, [id]: undefined }));
	};

	const validateForm = (data: PatientFormData): boolean => {
		const result = patientFormSchema.safeParse(data);
		if (!result.success) {
			const fieldErrors: FormErrors = {};
			for (const issue of result.error.issues) {
				// Zod issue path is an array, take the first element (field name)
				fieldErrors[issue.path[0] as keyof PatientFormData] = issue.message;
			}
			setErrors(fieldErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (validateForm(formData)) {
			onSubmit(formData);
		}
	};

	return (
		<div className='flex min-h-screen justify-center bg-gray-50 p-4'>
			<form
				className='w-full max-w-lg space-y-6 rounded-xl border border-gray-100 bg-white p-8 shadow-2xl'
				onSubmit={handleSubmit}
			>
				<h2 className='mb-4 border-b pb-3 text-center font-extrabold text-3xl text-blue-700'>
					{patient ? "Update Patient Record" : "New Patient Registration"}
				</h2>

				{/* First Name Field */}
				<div className='flex flex-col gap-1'>
					<Label htmlFor='firstName'>First Name</Label>
					<Input
						id='firstName'
						onChange={handleInputChange}
						placeholder='John'
						type='text'
						value={formData.firstName}
					/>
					<p className='h-4 text-red-600 text-xs'>{errors.firstName}</p>
				</div>

				{/* Last Name Field */}
				<div className='flex flex-col gap-1'>
					<Label htmlFor='lastName'>Last Name</Label>
					<Input
						id='lastName'
						onChange={handleInputChange}
						placeholder='Doe'
						type='text'
						value={formData.lastName}
					/>
					<p className='h-4 text-red-600 text-xs'>{errors.lastName}</p>
				</div>

				{/* Date of Birth Field */}
				<div className='flex flex-col gap-1'>
					<Label htmlFor='dateOfBirth'>Date of Birth</Label>
					<Input
						id='dateOfBirth'
						onChange={handleInputChange}
						type='date'
						value={formData.dateOfBirth}
					/>
					<p className='h-4 text-red-600 text-xs'>{errors.dateOfBirth}</p>
				</div>

				{/* Contact Number Field */}
				<div className='flex flex-col gap-1'>
					<Label htmlFor='contactNumber'>Contact Number</Label>
					<Input
						id='contactNumber'
						onChange={handleInputChange}
						placeholder='(555) 123-4567'
						type='tel'
						value={formData.contactNumber}
					/>
					<p className='h-4 text-red-600 text-xs'>{errors.contactNumber}</p>
				</div>

				{/* Email Field */}
				<div className='flex flex-col gap-1'>
					<Label htmlFor='email'>Email Address (Optional)</Label>
					<Input
						id='email'
						onChange={handleInputChange}
						placeholder='john.doe@example.com'
						type='email'
						value={formData.email}
					/>
					<p className='h-4 text-red-600 text-xs'>{errors.email}</p>
				</div>

				{/* Gender Field */}
				<div className='flex flex-col gap-1'>
					<Label htmlFor='gender'>Gender</Label>
					<Select
						id='gender'
						onChange={handleInputChange}
						options={["male", "female", "other", "prefer-not-to-say"]}
						value={formData.gender}
					/>
					<p className='h-4 text-red-600 text-xs'>{errors.gender}</p>
				</div>

				{/* Address Field - A11y Fix Applied */}
				<div className='flex flex-col gap-1'>
					{/* 3. A11y Fix: Label now has htmlFor and precedes the input control */}
					<Label htmlFor='address'>Address</Label>
					<textarea
						className='min-h-20 w-full rounded-lg border border-gray-300 p-2 transition duration-150 focus:border-blue-500 focus:ring focus:ring-blue-200'
						id='address'
						name='address'
						onChange={handleInputChange as unknown as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
						placeholder='123 Main St, Anytown, USA'
						value={formData.address}
					/>
					<p className='h-4 text-red-600 text-xs'>{errors.address}</p>
				</div>

				<Button
					isLoading={isLoading}
					type='submit'
				>
					{patient ? "Save Changes" : "Register Patient"}
				</Button>
			</form>
		</div>
	);
}

// Export the component as the default export for usage in a React application
export default PatientForm;
