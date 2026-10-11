import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { TweakitDev } from './_tweakit';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

const TITLE = 'Scroll image scale — Dojo 2026';
const DESCRIPTION =
	'A strip of images parted by a scroll-driven playhead that sweeps across and back: a third of the strip around the line lifts off it, up and down, the tiles nearest the line furthest, then the strip rests aligned while the line turns off stage.';

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	openGraph: {
		title: TITLE,
		description: DESCRIPTION,
		type: 'website',
		locale: 'en_US',
	},
	twitter: {
		card: 'summary_large_image',
		title: TITLE,
		description: DESCRIPTION,
	},
	robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html
			lang='en'
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className='flex min-h-full flex-col'>
				<TweakitDev>{children}</TweakitDev>
			</body>
		</html>
	);
}
