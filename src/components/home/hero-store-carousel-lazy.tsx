"use client";

import dynamic from "next/dynamic";

type HeroStoreCarouselLazyProps = {
	stores: {
		id: string;
		name: string;
		description: string | null;
		city: string | null;
		coverImageUrl: string | null;
	}[];
};

const HeroStoreCarousel = dynamic(
	() => import("@/components/home/hero-store-carousel"),
	{
		ssr: false,
		loading: () => (
			<div className="h-[420px] w-full max-w-[420px] rounded-[1.75rem] border border-white/10 bg-white/10" />
		),
	}
);

export default function HeroStoreCarouselLazy({
	stores,
}: HeroStoreCarouselLazyProps) {
	return <HeroStoreCarousel stores={stores} />;
}