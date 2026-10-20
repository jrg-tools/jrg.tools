export const load = ({ url, data }) => ({
	...data,
	origin: url.origin,
	brand: url.hostname.endsWith('jorgechato.com') ? 'Jorge Chato' : 'JRG Tools'
});
