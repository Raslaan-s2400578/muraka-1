/**
 * Hotel Management System - Muraka
 *
 * @student Aminath Yaula Yaarid - S2400576
 * @student Hawwa Saha Nasih - S2400566
 * @student Milyaaf Abdul Sattar - S2300565
 * @student Mohamed Raslaan Najeeb - S2400578
 *
 * Module: UFCF8S-30-2 Advanced Software Development
 * Institution: UWE Bristol
 */

import * as React from "react";
import { Heading, Text, Link, Section } from "@react-email/components";
import { BaseEmail } from "./base";
import { EMAIL_CONFIG } from "../config";

interface WelcomeEmailProps {
	name: string;
	email: string;
}

export function WelcomeEmail({ name, email }: WelcomeEmailProps) {
	return (
		<BaseEmail previewText={`Welcome to Muraka Hotels, ${name}!`}>
			<Heading className="mb-4 text-2xl font-bold text-gray-900">
				Welcome to Muraka Hotels, {name}!
			</Heading>

			<Text className="mb-4 text-base leading-6 text-gray-700">
				Thank you for creating an account with us. We're excited to help you find your
				perfect stay in the beautiful Maldives.
			</Text>

			<Section className="mb-6 rounded-lg bg-gray-50 p-5">
				<Text className="m-0 text-sm text-gray-600">
					Your account email: <span className="font-bold text-gray-900">{email}</span>
				</Text>
			</Section>

			<Section className="mb-6 text-center">
				<Link
					href={`${EMAIL_CONFIG.appUrl}/dashboard`}
					className="inline-block rounded-md px-6 py-3 font-bold text-white no-underline"
					style={{ backgroundColor: EMAIL_CONFIG.brandColor }}>
					Go to Dashboard
				</Link>
			</Section>

			<Text className="text-sm text-gray-600">
				You can now browse our hotels and make bookings at any of our locations across the
				Maldives.
			</Text>

			<Text className="mt-6 text-sm text-gray-500">
				If you didn't create this account, please ignore this email or contact our support
				team.
			</Text>
		</BaseEmail>
	);
}
