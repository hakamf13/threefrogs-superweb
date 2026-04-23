import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();

	return [
		{
			url: "https://threefrogs-superweb.vercel.app",
			lastModified: now,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: "https://threefrogs-superweb.vercel.app/stores",
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: "https://threefrogs-superweb.vercel.app/reserve",
			lastModified: now,
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: "https://threefrogs-superweb.vercel.app/login",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: "https://threefrogs-superweb.vercel.app/register",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.5,
		},
	];
}