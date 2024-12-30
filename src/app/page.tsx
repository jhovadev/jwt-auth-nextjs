"use client";
import { Skeleton } from "@/components/ui/skeleton";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { set, useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import Image from "next/image";
import { Suspense, useState } from "react";
import { generateTOTP } from "@oslojs/otp";
import { decodeBase32 } from "@oslojs/encoding";

const FormSchema = z.object({
	pin: z.string().min(6, {
		message: "Your one-time password must be 6 characters.",
	}),
});

const userSchema = z.object({
	username: z.string().min(3, {
		message: "Your Username must be at least 3 characters.",
	}),
});

export default function Home() {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			pin: "",
		},
	});

	const userform = useForm<z.infer<typeof userSchema>>({
		resolver: zodResolver(userSchema),
		defaultValues: {
			username: "",
		},
	});

	const { toast } = useToast();

	const [image, setImage] = useState<string>("");
	const [token, setToken] = useState<string>("");
	const [serverToken, setServerToken] = useState<string>("");
	const [secret, setSecret] = useState<string>("");

	async function onSubmitUser(data: z.infer<typeof userSchema>) {
		const response = await fetch("/api/v1/totp/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ accountName: data.username }),
		});
		const responseJson = await response.json();

		setImage(responseJson.data);
		setSecret(responseJson.secret);
		toast({
			title: "You submitted the following values:",
			description: (
				<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
					<code className="text-white">
						{JSON.stringify(responseJson, null, 2)}
					</code>
				</pre>
			),
		});
	}

	async function onSubmitToken(data: z.infer<typeof FormSchema>) {
		const totp = generateTOTP(decodeBase32(secret), 30, 6);
		setServerToken(totp);

		const response = await fetch("/api/v1/totp/verify", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				token: data.pin,
				secret: secret,
			}),
		});
		const responseJson = await response.json();
		toast({
			title: "You submitted the following values:",
			description: (
				<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
					<code className="text-white">
						{JSON.stringify(responseJson, null, 2)}
					</code>
				</pre>
			),
		});
	}

	return (
		<>
			<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12 sm:px-6 lg:px-8">
				<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
					TOTP : Authentication NextJS Example
				</h1>

				<div className="grid grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Enable 2FA Autentication</CardTitle>
							<CardDescription>Scan the QR Code</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Form {...form}>
								<form
									onSubmit={userform.handleSubmit(onSubmitUser)}
									className="space-y-4"
								>
									<FormField
										control={userform.control}
										name="username"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Username</FormLabel>
												<FormControl>
													<Input
														placeholder="shadcn"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button type="submit">Activar 2FA</Button>
								</form>
							</Form>
							<div className="flex w-full justify-center">
								{image === "" ? (
									<Skeleton className="h-[260px] w-[260px] rounded-sm" />
								) : (
									<Image
										src={image}
										alt="QR Code"
										width={260}
										height={260}
										className="rounded-sm"
										priority
									/>
								)}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Verify ur OTP</CardTitle>
							<CardDescription>
								Server OTP :
								<code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
									{serverToken}
								</code>
							</CardDescription>
						</CardHeader>
						<CardContent className="flex w-full flex-col items-center justify-center">
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmitToken)}
									className="w-2/3 space-y-6"
								>
									<FormField
										control={form.control}
										name="pin"
										render={({ field }) => (
											<FormItem>
												<FormLabel>One-Time Password</FormLabel>
												<FormControl>
													<InputOTP
														maxLength={6}
														{...field}
													>
														<InputOTPGroup>
															<InputOTPSlot index={0} />
															<InputOTPSlot index={1} />
															<InputOTPSlot index={2} />
															<InputOTPSlot index={3} />
															<InputOTPSlot index={4} />
															<InputOTPSlot index={5} />
														</InputOTPGroup>
													</InputOTP>
												</FormControl>
												<FormDescription>
													Please enter the one-time password from your
													authentication app.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button type="submit">Submit</Button>
								</form>
							</Form>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
