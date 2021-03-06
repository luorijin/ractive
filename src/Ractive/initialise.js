import { logIfDebug, warnIfDebug, warnOnceIfDebug } from 'utils/log';
import { getElement } from 'utils/dom';
import config from './config/config';
import Fragment from 'src/view/Fragment';
import Hook from 'src/events/Hook';
import HookQueue from 'src/events/HookQueue';
import Ractive from '../Ractive';
import subscribe from './helpers/subscribe';
import { hasOwn, keys } from 'utils/object';

const configHook = new Hook( 'config' );
const initHook = new HookQueue( 'init' );

export default function initialise ( ractive, userOptions, options ) {
	keys( ractive.viewmodel.computations ).forEach( key => {
		const computation = ractive.viewmodel.computations[ key ];

		if ( hasOwn( ractive.viewmodel.value, key ) ) {
			computation.set( ractive.viewmodel.value[ key ] );
		}
	});

	// init config from Parent and options
	config.init( ractive.constructor, ractive, userOptions );

	configHook.fire( ractive );

	initHook.begin( ractive );

	const fragment = ractive.fragment = createFragment( ractive, options );
	if ( fragment ) fragment.bind( ractive.viewmodel );

	initHook.end( ractive );

	// general config done, set up observers
	subscribe( ractive, userOptions, 'observe' );

	if ( fragment ) {
		// render automatically ( if `el` is specified )
		const el = getElement( ractive.el || ractive.target );
		if ( el ) {
			const promise = ractive.render( el, ractive.append );

			if ( Ractive.DEBUG_PROMISES ) {
				promise.catch( err => {
					warnOnceIfDebug( 'Promise debugging is enabled, to help solve errors that happen asynchronously. Some browsers will log unhandled promise rejections, in which case you can safely disable promise debugging:\n  Ractive.DEBUG_PROMISES = false;' );
					warnIfDebug( 'An error happened during rendering', { ractive });
					logIfDebug( err );

					throw err;
				});
			}
		}
	}
}

export function createFragment ( ractive, options = {} ) {
	if ( ractive.template ) {
		const cssIds = [].concat( ractive.constructor._cssIds || [], options.cssIds || [] );

		return new Fragment({
			owner: ractive,
			template: ractive.template,
			cssIds
		});
	}
}
