<?php


/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/documentation/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'ichtqlsn_wp81' );

/** Database username */
define( 'DB_USER', 'ichtqlsn_wp81' );

/** Database password */
define( 'DB_PASSWORD', '5n.p(9!1[f)jWXSk' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'v1hybff5bbjszqstozecgyxbwqi5fhhood72gt8343z4xv2xxvfsoqg0s1kjtdsa' );
define( 'SECURE_AUTH_KEY',  'tkclybgih8putp8wptuhhhueqzwg006tnodnvpp8dfxqtpe8m44rzatzshyknylh' );
define( 'LOGGED_IN_KEY',    'i74et9iibrkyfi9rmsxsf1bm3e0ne6zxdxo71qdd0tupsho37b7jwn5rwsvebfyv' );
define( 'NONCE_KEY',        '1iaiz3qmftjyy6vhdp6j0zeljnt81mscmklotna1rsgh8herzm3bshbvzjcborzw' );
define( 'AUTH_SALT',        'wnwaitjzproyiefugg539hmdlftclsf1u9rbyeuhv24oo038vncpsigozhwgmkyp' );
define( 'SECURE_AUTH_SALT', '6njgawq1pqcpfggqxawj0dco2ysqv2hrwxyghgbwfjmyddiiheo4esmmva8og5pk' );
define( 'LOGGED_IN_SALT',   'ydpha2yxxtddnrxtvkn5z6nehszmchnyn6emiybvqgtwus0tjz0rnanxf1jgmp0c' );
define( 'NONCE_SALT',       'gvufeux3moyfozj58op6ssskoibmxvfikcq9ztoagpdnyojavlzkpgzdpoyfegwv' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wpeu_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/documentation/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', true );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
