import Image from 'next/image';

/** The picture inside a tile, a cover fill. Decorative, so the alt is empty. */
export function TileImage({ src, sizes }: { src: string; sizes: string }) {
	return (
		<Image
			src={src}
			alt=''
			fill
			sizes={sizes}
			loading='eager'
			className='object-cover'
		/>
	);
}
