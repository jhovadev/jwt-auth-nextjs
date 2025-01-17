import { Skeleton } from "@/components/ui/skeleton";
import Countdown from "react-countdown";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { Key, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
/* import { useEffect, useState } from "react"; */

export default async function Page() {
	/* const [data, setData] = useState<any>(null); */

	/* useEffect(() => { */
	const data = await fetch("/api/v1/me")
		.then((res) => res.json())
		.then((data) => {
			console.log(data);
			return data;
			/* setData(data); */
		});
	/* }, []); */

	return (
		<div>
			<h1>Home</h1>
			<code>{JSON.stringify(data, null, 4)}</code>
			{data ? (
				<Card className="h-full w-full shadow-lg">
					<CardHeader>
						<CardTitle>
							<h2 className="scroll-m-20 border-b pb-2 font-semibold tracking-tight first:mt-0">
								@{data.user.username}
							</h2>
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<p className="flex gap-2 text-muted-foreground">
							<Mail />
							{data.user.email}
						</p>

						<p className="flex gap-2 text-muted-foreground">
							<Key />
							{data.user.role.name}
						</p>
					</CardContent>
					<CardFooter className="flex justify-start gap-2">
						<Button>Logout</Button>
					</CardFooter>
				</Card>
			) : (
				<Skeleton className="h-full w-full shadow-lg hover:border hover:border-accent" />
			)}
			<div className="flex flex-col gap-4 border-2 border-black p-2">
				{data &&
					data.user.sessions.map((session: any) => (
						<Countdown
							date={session.expiresAt}
							autoStart={true}
							precision={0}
							intervalDelay={0}
							renderer={({ days, hours, minutes, seconds, completed }) => {
								if (completed) {
									// Render a completed state
									return (
										<span className="font-bold text-red-500">
											Refresh Token expired
										</span>
									);
								}
								return (
									<div className="rounded-lg border-2 border-white p-4 hover:border-accent">
										<h2 className="font-bold text-green-500">
											Refresh Token Expires in:
										</h2>
										<span>
											{days}d {hours}h {minutes}m {seconds}s
										</span>
									</div>
								);
							}}
						/>
					))}
			</div>
		</div>
	);
}
