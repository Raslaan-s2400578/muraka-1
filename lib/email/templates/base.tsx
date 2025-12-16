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
import {
	Html,
	Head,
	Body,
	Container,
	Section,
	Text,
	Heading,
} from "@react-email/components";
import { EMAIL_CONFIG } from "../config";

interface BaseEmailProps {
	children: React.ReactNode;
	previewText: string;
}

export function BaseEmail({ children, previewText }: BaseEmailProps) {
	return (
		<Html>
			<Head />
			<Body className="bg-gray-50 font-sans">
				<div className="hidden max-h-0 overflow-hidden">{previewText}</div>
				<Container className="mx-auto my-10 max-w-2xl">
					<Section className="overflow-hidden rounded-lg bg-white shadow-sm">
						{/* Header */}
						<Section
							className="p-8 text-center"
							style={{ backgroundColor: EMAIL_CONFIG.brandColor }}>
							<Heading className="m-0 text-2xl font-bold text-white">
								Muraka Hotels
							</Heading>
						</Section>

						{/* Content */}
						<Section className="p-8">{children}</Section>

						{/* Footer */}
						<Section className="bg-gray-50 p-6 text-center">
							<Text className="mb-2 text-sm text-gray-600">
								© {new Date().getFullYear()} Muraka Hotels. All rights reserved.
							</Text>
							<Text className="m-0 text-sm text-gray-600">
								Male, Kaafu Atoll, Maldives
							</Text>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
