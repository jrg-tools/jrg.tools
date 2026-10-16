export const load = ({ url }) => ({
	origin: url.origin,
	brand: url.hostname.endsWith('jorgechato.com') ? 'Jorge Chato' : 'JRG Tools'
});
