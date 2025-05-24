import { useEffect } from "react";

const Ads = () => {
	useEffect(() => {
		try {
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch (e) {
			console.error("Adsense error", e);
		}
	}, []);

	return (
		<div className='w-full h-full flex items-center justify-center bg-white p-4'>
			<ins
				className='adsbygoogle block'
				style={{ display: "block", width: "100%", height: "100%" }}
				data-ad-client='ca-pub-8765001812789687'
				data-ad-slot='9850854102'
				data-ad-format='auto'
				data-full-width-responsive='true'></ins>
		</div>
	);
};

export default Ads;
