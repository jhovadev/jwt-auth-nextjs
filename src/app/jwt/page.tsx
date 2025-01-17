"use client";
// Components
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
// Hooks
import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Utils
import { zodResolver } from "@hookform/resolvers/zod";
import { set, useForm } from "react-hook-form";
import { z } from "zod";
import { redirect } from "next/navigation";

const loginSchema = z.object({
	email: z
		.string({
			required_error: "Email is required",
		})
		.email({
			message: "Invalid email",
		})
		.min(3, {
			message: "Your email must be at least 3 characters.",
		}),
	password: z
		.string({
			required_error: "Password is required",
		})
		.min(3, {
			message: "Your password must be at least 3 characters.",
		}),
});

const registerSchema = z.object({
	username: z
		.string({
			required_error: "Username is required",
		})
		.min(3, {
			message: "Your username must be at least 3 characters.",
		}),
	email: z
		.string({
			required_error: "Email is required",
		})
		.email({
			message: "Invalid email",
		})
		.min(3, {
			message: "Your email must be at least 3 characters.",
		}),
	password: z
		.string({
			required_error: "Password is required",
		})
		.min(3, {
			message: "Your password must be at least 3 characters.",
		}),
});

export default function Page() {
	// Login Form
	const loginForm = useForm<z.infer<typeof loginSchema>>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "john.doe@example.com",
			password: "doe123",
		},
	});

	const registerForm = useForm<z.infer<typeof registerSchema>>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			username: "",
			email: "",
			password: "",
		},
	});

	const { toast } = useToast();

	const onSubmitUser = useCallback(
		async (data: z.infer<typeof loginSchema>) => {
			const response = await fetch("/api/v1/jwt/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: data.email, password: data.password }),
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

			return redirect("/home");
		},
		[]
	);

	return (
		<>
			<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12 sm:px-6 lg:px-8">
				<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
					JWT : Authentication NextJS Example
				</h1>

				<div className="grid grid-cols-2 gap-6">
					<Card className="w-[20rem] shadow-lg">
						<CardHeader>
							<CardTitle>Login </CardTitle>
							<CardDescription>
								Use <strong> johndoe@example.com:doe123</strong> as credentials
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Form {...loginForm}>
								<form
									onSubmit={loginForm.handleSubmit(onSubmitUser)}
									className="space-y-4"
								>
									<FormField
										control={loginForm.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														type="email"
														placeholder="shadcn@example.com"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={loginForm.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password</FormLabel>
												<FormControl>
													<Input
														type="password"
														placeholder="*********"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										className="w-full"
										type="submit"
									>
										Login
									</Button>
								</form>
							</Form>
						</CardContent>
					</Card>
					<Card className="w-[20rem] shadow-lg">
						<CardHeader>
							<CardTitle>Register</CardTitle>
							<CardDescription>Create ur account</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Form {...registerForm}>
								<form
									onSubmit={registerForm.handleSubmit(onSubmitUser)}
									className="space-y-4"
								>
									<FormField
										control={registerForm.control}
										name="username"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Username</FormLabel>
												<FormControl>
													<Input
														type="email"
														placeholder="memo"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={registerForm.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														type="email"
														placeholder="memo@example.com"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={registerForm.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password</FormLabel>
												<FormControl>
													<Input
														type="password"
														placeholder="*********"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										className="w-full"
										type="submit"
									>
										register
									</Button>
								</form>
							</Form>{" "}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
